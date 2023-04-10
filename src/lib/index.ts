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
	init,
	update_slot_base,
	get_all_dirty_from_scope,
	get_slot_changes,
	transition_in,
	transition_out
} from 'svelte/internal';
import type {
	ValidateProps,
	NonProp,
	OnDirective,
	UseDirective,
	Action,
	Prop,
	MicroComponent,
	Slot
} from './types';
import { BROWSER } from 'esm-env';
import type { ActionReturn } from 'svelte/action';
import type { Fragment } from 'svelte/types/runtime/internal/types';

const isNonProp = (value: unknown): value is NonProp =>
	['slot', 'on', 'use'].includes((value as string[])[0]);

// on:eventname
// on`${eventName}` or on`${eventname}=${bubbleUpName}`
export function on<T extends string>(_: TemplateStringsArray, eventName: T): OnDirective<T, T>;
export function on<T extends string, Alias extends string>(
	_: TemplateStringsArray,
	eventName: T,
	alias: Alias
): OnDirective<T, Alias>;
export function on<T extends string, Alias extends string>(
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

// maybe make `slot` available as a value and function?
// so you can do `slot` instead of `slot()` for the common case
export function slot(): Slot<'default'>;
export function slot<T extends string>(name: T): Slot<T>;
export function slot<T extends string>(name?: T): Slot<T> {
	return ['slot', name ?? 'default'] as Slot<T>;
}

export default function micro_component<Props extends readonly Prop[]>(
	{ raw: strings }: TemplateStringsArray,
	...propNames: ValidateProps<Props>
): MicroComponent<Props> {
	type T = Prop;
	type StringProps = Extract<T, string>;

	const convert = (fn: (propName: T, previousString: string) => string) =>
		strings.map((s, i) => (propNames[i] ? fn(propNames[i], s) : s)).join('');

	if (!BROWSER) {
		return create_ssr_component(
			(
				$$result: unknown,
				$$props: Record<StringProps, string>,
				$$bindings: unknown,
				slots: Record<string, (props: Record<string, unknown>) => string>
			) => {
				return convert((propName, previousString) =>
					isNonProp(propName)
						? propName[0] === 'slot'
							? previousString + slots[propName[1]]?.({}) ?? ''
							: previousString
						: previousString.at(-1) === '='
						? previousString.slice(0, previousString.lastIndexOf(' ') + 1)
						: previousString + escape($$props[propName])
				);
			}
		) as any;
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
				return previousString + ` data-event-${propName[1]}-${propName[2]} `;
			} else if (propName[0] === 'use') {
				return previousString + ` data-action-${propName[1].name} `;
			} else if (propName[0] === 'slot') {
				return previousString + `<slot-${propName[1]}></slot-${propName[1]}>`;
			}
		}
		// TODO: this will break if person writes 2*2=${something} or similar
		if (previousString.at(-1) !== '=') {
			// if isn't an attribute assignment, it's a text node
			return previousString + `<text-${propName}></text-${propName}>`;
		}
		const start = previousString.lastIndexOf(' '); // find the start of the attribute
		classes[propName] = previousString.slice(start + 1, -1); // store the attribute name
		return previousString.slice(0, start) + ` data-attribute-${propName} `;
	}

	const template = element('template');
	template.innerHTML = convert(classify);
	const node = template.content;

	type PropValues = Record<StringProps, string> & {
		$$scope: { dirty: number; ctx: unknown[] };
		$$slots: Record<string, [(ctx: unknown) => Fragment]>;
	};
	type Context = [
		(this: HTMLElement, e: Event) => void, // bubbler
		PropValues, // props
		Record<StringProps, Attr | Text>, // values
		Record<string, ActionReturn['update']>, // actions
		Record<string, [(ctx: unknown) => Fragment]>, // slots
		{ dirty: number; ctx: unknown[] } // scope
	];

	function create_fragment(ctx: Context) {
		const [bubbler, props, values, actions] = ctx;
		const { $$scope, $$slots = {} } = props;

		let nodes: ChildNode[];
		const dispose: (() => void)[] = [];
		let mounted = false;
		let current: boolean;

		const slots = Object.entries($$slots).map(
			([name, slot]) => [name, slot[0]($$scope.ctx), slot] as const
		); // reduced create_slot

		return {
			c() {
				nodes = children(node.cloneNode(true) as HTMLElement);
				slots.forEach((slot) => slot[1].c());
			},
			m(target: Node, anchor: Node | undefined) {
				// for hydration; should figure out a better way to do this
				if (!nodes) {
					// @ts-expect-error c is defined right above
					this.c();
				}

				const parent = nodes[0].parentNode as ParentNode;
				for (const propName of categorized.t) {
					parent.querySelector(`text-${propName}`)!.replaceWith(values[propName]);
				}
				for (const propName of categorized.a) {
					const el = parent.querySelector(`[data-attribute-${propName}]`) as Element;
					attr(el, `data-attribute-${propName}`);
					el.setAttributeNode(values[propName] as Attr);
				}
				for (const slot of slots) {
					const placeholder = parent.querySelector(`slot-${slot[0]}`) as Element;
					slot[1].m(placeholder.parentElement as HTMLElement, placeholder);
					detach(placeholder);
				}
				if (!mounted) {
					for (const event of categorized.e) {
						const el = parent.querySelector(`[data-event-${event[1]}-${event[2]}]`) as Element;
						attr(el, `data-event-${event[1]}-${event[2]}`);
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

				current = true;
			},
			l: noop,
			p(ctx, [dirty]) {
				const $$scope = ctx[5];
				slots.forEach(([_, slot, definition]) => {
					if (slot.p) {
						console.log(_, slot.p);
						update_slot_base(
							slot,
							definition,
							null,
							$$scope,
							!current
								? get_all_dirty_from_scope($$scope)
								: get_slot_changes(definition, $$scope, dirty, null),
							null
						);
					}
				});
			},
			i(local) {
				if (current) return;
				slots.forEach((slot) => transition_in(slot[1], local));
				current = true;
			},
			o(local) {
				slots.forEach((slot) => transition_out(slot[1], local));
				current = false;
			},
			d(detaching) {
				// i feel like this is wrong, if it is maybe do something recursive if needed
				if (detaching) nodes.forEach(detach);
				slots.forEach((slot) => slot[1].d(detaching));
				mounted = false;
				run_all(dispose);
			}
		} satisfies Partial<Fragment>;
	}

	function instance(
		component: SvelteComponent,
		props: PropValues,
		invalidate: (idx: number, p: unknown) => void
	): Context {
		const values: Record<StringProps, Attr | Text> = {};
		const actions: Record<string, Exclude<ActionReturn['update'], undefined>> = {};
		const { $$slots = {}, $$scope } = props;

		for (const propName of categorized.t) {
			values[propName] = text(props[propName]);
		}
		for (const propName of categorized.a) {
			const attr = document.createAttribute(classes[propName]);
			attr.value = props[propName];
			values[propName] = attr;
		}

		component.$$set = (props: PropValues) => {
			if ('$$scope' in props) invalidate(5, props.$$scope);
			for (const prop in props) {
				if (prop in values) values[prop].nodeValue = props[prop];
				if (prop in actions) actions[prop](props[prop]);
			}
		};

		return [
			function (this: HTMLElement, e: Event) {
				bubble.call(this, component, e);
			},
			props,
			values,
			actions,
			$$slots,
			$$scope
		];
	}

	return class extends SvelteComponent {
		constructor(options: ComponentConstructorOptions) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal, {}, undefined);
		}
	} as any;
}
