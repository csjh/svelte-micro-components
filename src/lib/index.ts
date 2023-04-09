import {
	type ComponentConstructorOptions,
	SvelteComponent,
	text,
	detach,
	noop,
	insert,
	create_ssr_component,
	escape,
	element,
	children,
	attr,
	bubble,
	listen,
	run_all,
	safe_not_equal,
	action_destroyer,
	init
} from 'svelte/internal';
import type {
	EventNames,
	NonProp,
	OnDirective,
	UseDirective,
	Action,
	Prop,
	MicroComponent
} from './types';
import { BROWSER } from 'esm-env';
import type { ActionReturn } from 'svelte/action';
import type { Fragment } from 'svelte/types/runtime/internal/types';

const isNonProp = (value: unknown): value is NonProp => Array.isArray(value);

// on:eventname
// on`${eventName}` or on`${eventname}=${bubbleUpName}`
export function on<T extends EventNames>(_: TemplateStringsArray, eventName: T): OnDirective<T, T>;
export function on<T extends EventNames, Alias extends string>(
	_: TemplateStringsArray,
	eventName: T,
	alias: Alias
): OnDirective<T, Alias>;
export function on<T extends EventNames, Alias extends string>(
	_: TemplateStringsArray,
	eventName: T,
	alias?: Alias
) {
	return ['on', eventName, alias ?? eventName];
}

// use:action={params}
// use`${action}=${"nameOfParamsProps"}` | <Component nameOfParamsProps={} />
export function use<
	SuppliedAction extends Action,
	ParameterPropName extends string | undefined = undefined
>(
	_: TemplateStringsArray,
	action: SuppliedAction,
	parameterPropName?: ParameterPropName
): UseDirective<ParameterPropName, SuppliedAction> {
	return ['use', action, parameterPropName] as UseDirective<ParameterPropName, SuppliedAction>;
}

export function slot<T extends string>(name: T): { v: T } {
	return { v: name };
}
slot.v = 'default';

export default function micro_component<Props extends readonly Prop[]>(
	{ raw: strings }: TemplateStringsArray,
	...propNames: Props
): MicroComponent<Props> {
	type T = Prop;
	type StringProps = Extract<T, string>;

	const convert = (fn: (propName: T, previousString: string) => string) =>
		strings.map((s, i) => (propNames[i] ? fn(propNames[i], s) : s)).join('');

	if (!BROWSER) {
		return create_ssr_component((_: unknown, $$props: Record<StringProps, string>) => {
			return convert((propName, previousString) =>
				isNonProp(propName)
					? previousString
					: previousString.at(-1) === '='
					? previousString.slice(0, previousString.lastIndexOf(' ') + 1)
					: previousString + escape($$props[propName])
			);
		}) as any;
	}

	type Attributes = Set<StringProps>;
	type Texts = Set<StringProps>;
	type Events = Set<OnDirective>;
	type Actions = Set<UseDirective<string | undefined>>;
	const categorized: {
		a: Attributes;
		t: Texts;
		e: Events;
		c: Actions;
	} = { a: new Set(), t: new Set(), e: new Set(), c: new Set() };
	propNames.forEach((propName, i) => {
		if (isNonProp(propName)) {
			if (propName[0] === 'on') {
				categorized.e.add(propName);
			} else if (propName[0] === 'use') {
				categorized.c.add(propName);
			} else {
				throw new Error('Unknown directive');
			}
		} else {
			if (strings[i].at(-1) === '=') {
				// attributes are on the receiving end of an equal
				categorized.a.add(propName);
			} else {
				categorized.t.add(propName);
			}
		}
	});

	const classes = {} as Record<StringProps, string>;
	function classify(propName: T, previousString: string) {
		if (isNonProp(propName)) {
			if (propName[0] === 'on') {
				return previousString + ` data-${propName[1]}-${propName[2]} `;
			} else if (propName[0] === 'use') {
				return previousString + ` data-action-${propName[1].name} `;
			} else {
				throw new Error('Unknown directive');
			}
		}
		if (previousString.at(-1) !== '=') {
			// if isn't an attribute assignment, it's a text node
			return previousString + `<template-${propName} />`;
		}
		const start = previousString.lastIndexOf(' '); // find the start of the attribute
		classes[propName] = previousString.slice(start + 1, -1); // store the attribute name
		return previousString.slice(0, start) + ` data-${propName} `;
	}

	const template = element('template');
	template.innerHTML = convert(classify);
	const node = template.content;

	type Context = [
		(this: HTMLElement, e: Event) => void,
		Record<StringProps, string>,
		Record<StringProps, Attr | Text>,
		Record<string, ActionReturn['update']>
	];

	function create_fragment(ctx: Context) {
		const [bubbler, props, values, actions] = ctx;

		let nodes: ChildNode[];
		const dispose: (() => void)[] = [];
		let mounted = false;

		return {
			c() {
				nodes = children(node.cloneNode(true) as HTMLElement);
			},
			m(target: Node, anchor: Node | undefined) {
				// for hydration; should figure out a better way to do this
				if (!nodes) {
					this.c!();
				}

				const parent = nodes[0].parentNode!;
				for (const propName of categorized.t) {
					parent.querySelector(`template-${propName}`)!.replaceWith(values[propName]);
				}
				for (const propName of categorized.a) {
					const el = parent.querySelector(`[data-${propName}]`)!;
					attr(el, `data-${propName}`);
					el.setAttributeNode(values[propName] as Attr);
				}
				if (!mounted) {
					for (const event of categorized.e) {
						const el = parent.querySelector(`[data-${event[1]}-${event[2]}]`)!;
						dispose.push(listen(el, event[1], bubbler));
					}
					for (const action of categorized.c) {
						const el = parent.querySelector(`[data-action-${action[1].name}]`) as HTMLElement;
						const action_result = action[1](el, props[action[2] as string]);
						if (action_result?.update)
							actions[(action as UseDirective<string>)[2]] = action_result.update;
						dispose.push(action_destroyer(action_result?.destroy));
					}
					mounted = true;
				}

				// note: can insert all with Template.content, but then can't access nodes after insertion
				nodes.forEach((node) => insert(target, node, anchor));
			},
			l: noop,
			p: noop,
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) nodes.forEach(detach);
				mounted = false;
				run_all(dispose);
			}
		} satisfies Partial<Fragment>;
	}

	function instance(component: SvelteComponent, props: Record<StringProps, string>): Context {
		const values: Record<StringProps, Attr | Text> = {};
		const actions: Record<string, ActionReturn['update']> = {};

		for (const propName of categorized.t) {
			values[propName] = text(props[propName]);
		}
		for (const propName of categorized.a) {
			const attr = document.createAttribute(classes[propName]);
			attr.value = props[propName];
			values[propName] = attr;
		}

		component.$$set = (props: Record<StringProps, string>) => {
			for (const prop in props) {
				if (prop in values) values[prop].nodeValue = props[prop];
				if (prop in actions) actions[prop]!(props[prop]);
			}
		};

		return [
			function (this: HTMLElement, e: Event) {
				bubble.call(this, component, e);
			},
			props,
			values,
			actions
		];
	}

	return class extends SvelteComponent {
		constructor(options: ComponentConstructorOptions) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal, {}, undefined);
		}
	} as any;
}
