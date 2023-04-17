import {
	type ComponentConstructorOptions,
	text,
	detach,
	noop,
	insert,
	create_ssr_component,
	escape,
	element,
	destroy_component,
	children,
	attr,
    is_empty,
	listen,
	run_all,
	safe_not_equal,
	action_destroyer,
	init,
	update_slot_base,
	get_all_dirty_from_scope,
	transition_in,
	transition_out,
	SvelteComponent,
	type SvelteComponentTyped,
	create_component,
	mount_component
} from 'svelte/internal';
import type {
	ValidateProps,
	NonProp,
	OnDirective,
	UseDirective,
	Action,
	MicroComponent,
	Prop,
	Slot,
	InlineComponent
} from './types';
import { BROWSER } from 'esm-env-robust';
import type { ActionReturn } from 'svelte/action';
import type { Fragment } from 'svelte/types/runtime/internal/types';

const SLOT = Symbol();
export type SLOT = typeof SLOT;
const ON = Symbol();
export type ON = typeof ON;
const USE = Symbol();
export type USE = typeof USE;
const COMPONENT = Symbol();
export type COMPONENT = typeof COMPONENT;

const isNonProp = (value: unknown): value is NonProp =>
	[SLOT, ON, USE, COMPONENT].includes((value as NonProp)[0]);

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
): OnDirective<T, Alias> | OnDirective<T, T> {
	return [ON, eventName, alias ?? eventName] as OnDirective<T, Alias>;
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
	return [USE, action, parameterPropName] as UseDirective<ParameterPropName, SuppliedAction>;
}

// maybe make `slot` available as a value and function?
// so you can do `slot` instead of `slot()` for the common case
export function slot(): Slot<'default'>;
export function slot<T extends string>(name: T): Slot<T>;
export function slot<T extends string>(name?: T): Slot<T> {
	return [SLOT, name ?? 'default'] as Slot<T>;
}

// prop=${"something"} is what it's exposed as?
// component`<${Component} prop=${"something"} />`
export function component<
	ComponentProps extends Record<string, unknown>,
	ComponentEvents extends Record<string, unknown>,
	ComponentSlots extends Record<string, unknown>
>(
	{ raw: strings }: TemplateStringsArray,
	Component: typeof SvelteComponentTyped<ComponentProps, ComponentEvents, ComponentSlots>,
	...props: string[]
): InlineComponent<typeof Component> {
	const map = Object.fromEntries(
		props.map((prop, i) => [strings[i + 1].split('=')[0].trim(), prop])
	) as Record<keyof ComponentProps, string>;

	return [COMPONENT, Component, map];
}

function getProps(comp: InlineComponent, props: Record<string, unknown>) {
	let keys = Object.values(comp[2]);
	return Object.fromEntries(Object.entries(props).filter((x) => x[0] in keys));
}

export default function micro_component<Props extends readonly Prop[]>(
	{ raw: strings }: TemplateStringsArray,
	...propNames: ValidateProps<Props>
): typeof MicroComponent<Props> {
	const convert = (fn: (propName: Prop, previousString: string) => string) =>
		strings.map((s, i) => (propNames[i] ? fn(propNames[i], s) : s)).join('');

	if (!BROWSER) {
		return create_ssr_component(
			(
				$$result: unknown,
				$$props: Record<string, string>,
				$$bindings: unknown,
				slots: Record<string, (props: Record<string, unknown>) => string>
			) => {
				function classify(propName: Prop, previousString: string) {
					if (isNonProp(propName)) {
						if (propName[0] === SLOT) {
							return previousString + slots[propName[1]]?.({}) ?? '';
						} else if (propName[0] === COMPONENT) {
							return (
								previousString +
								// @ts-expect-error silly little SSR types
								propName[1].$$render($$result, getProps(propName, $$props), {}, {})
							);
						}
						return previousString;
					}
					if (previousString.at(-1) === '=') {
						return previousString.slice(0, previousString.lastIndexOf(' ') + 1);
					}
					return previousString + escape($$props[propName]);
				}

				return convert(classify);
			}
		) as any;
	}

	type Attributes = Set<string>;
	type Texts = Set<string>;
	type Events = Set<OnDirective>;
	type Actions = Set<UseDirective>;
	type Components = Set<InlineComponent>;
	type ComponentProps = Set<string>;
	const categorized: {
		a: Attributes;
		t: Texts;
		e: Events;
		c: Actions;
		o: Components;
		p: ComponentProps;
	} = { a: new Set(), t: new Set(), e: new Set(), c: new Set(), o: new Set(), p: new Set() };
	propNames.forEach((propName, i) => {
		if (isNonProp(propName)) {
			if (propName[0] === ON) {
				categorized.e.add(propName);
			} else if (propName[0] === USE) {
				categorized.c.add(propName);
			} else if (propName[0] === COMPONENT) {
				categorized.o.add(propName);
				Object.values(propName[2]).forEach(categorized.p.add);
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

	const classes = {} as Record<string, string>;
	function classify(propName: Prop, previousString: string) {
		if (isNonProp(propName)) {
			if (propName[0] === ON) {
				return previousString + ` data-event-${propName[2]} `;
			} else if (propName[0] === USE) {
				return previousString + ` data-action-${propName[1].name} `;
			} else if (propName[0] === SLOT) {
				return previousString + `<slot-${propName[1]}></slot-${propName[1]}>`;
			} else if (propName[0] === COMPONENT) {
				return previousString + `<component-${propName[1].name}></component-${propName[1].name}>`;
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

	type PropValues = Record<string, string> & {
		$$scope: { dirty: number; ctx: unknown[] };
		$$slots: Record<string, [(ctx: unknown) => Fragment]>;
	};
	type Context = [
		(this: HTMLElement, e: Event, alias: string) => void, // bubbler
		PropValues, // props
		Record<string, Attr | Text>, // values
		Record<string, ActionReturn['update']>, // actions
		Record<string, [(ctx: unknown) => Fragment]>, // slots
		{ dirty: number; ctx: unknown[] }, // scope
		Record<string, unknown> // component prop changes
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

		const components: [InlineComponent, InstanceType<typeof SvelteComponentTyped>][] = Array.from(
			categorized.o
		).map((propName) => [propName, new (propName[1] as any)({ props: getProps(propName, props) })]);

		return {
			c() {
				nodes = children(node.cloneNode(true) as HTMLElement);
				slots.forEach((slot) => slot[1].c());
				components.forEach(([, component]) => create_component(component.$$.fragment));
			},
			m(target: Node, anchor: Node | undefined) {
				// for hydration; should figure out a better way to do this
				// also i think this messes up hydration for most cases lol
				// should try to at least claim the top level nodes
				if (!nodes) {
					// @ts-expect-error c is defined right above
					this.c();
				}

				const parent = nodes[0].parentNode as ParentNode;
				for (const propName of categorized.t) {
					(parent.querySelector(`text-${propName}`) as Element).replaceWith(values[propName]);
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
				for (const component of categorized.o) {
					const placeholder = parent.querySelector(`component-${component[1].name}`) as Element;
					mount_component(
						component[1],
						placeholder.parentElement as HTMLElement,
						placeholder,
						false
					);
					detach(placeholder);
				}
				if (!mounted) {
					for (const event of categorized.e) {
						const el = parent.querySelector(`[data-event-${event[2]}]`) as Element;
						attr(el, `data-event-${event[2]}`);
						dispose.push(
							listen(el, event[1], function (this: HTMLElement, e: Event) {
								bubbler.call(this, e, event[2]);
							})
						);
					}
					for (const action of categorized.c) {
						const el = parent.querySelector(`[data-action-${action[1].name}]`) as HTMLElement;
						attr(el, `data-action-${action[1].name}`);
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
			// are these even possible :(
			l: noop, // reclaims the elements (instead of creating)
			h: noop, // hydrates the elements (adds attributes, event listeners, actions)
			// @ts-expect-error my context better
			p(ctx: Context) {
				const $$scope = ctx[5];
				const $$component_changes = ctx[6];
				for (const [component, instance] of components) {
					let props = getProps(component, $$component_changes);
					if (!is_empty(props)) {
						instance.$set(props);
                        Object.keys(props).forEach((key) => delete $$component_changes[key]);
					}
				}
				slots.forEach(([_, slot, definition]) => {
					// @ts-expect-error stop your whining
					if (slot.p) {
						update_slot_base(
							slot,
							definition,
							null,
							$$scope,
							!current ? get_all_dirty_from_scope($$scope) : $$scope.dirty,
							null
						);
					}
				});
			},
			i(local) {
				if (current) return;
				slots.forEach((slot) => transition_in(slot[1], local));
				// @ts-expect-error stop your whining
				components.forEach((component) => transition_in(component[1].$$.fragment, local));
				current = true;
			},
			o(local) {
				slots.forEach((slot) => transition_out(slot[1], local));
				// @ts-expect-error stop your whining
				components.forEach((component) => transition_out(component[1].$$.fragment, local));
				current = false;
			},
			d(detaching) {
				// i feel like this is wrong, if it is maybe do something recursive if needed
				if (detaching) nodes.forEach(detach);
				slots.forEach((slot) => slot[1].d(detaching));
				components.forEach((component) => destroy_component(component[1], detaching));
				mounted = false;
				run_all(dispose);
			}
		} satisfies Partial<Fragment>;
	}

	function instance(
		component: MicroComponent<Props>,
		props: PropValues,
		invalidate: (idx: number, p: unknown) => void
	): Context {
		const values: Record<string, Attr | Text> = {};
		const actions: Record<string, Exclude<ActionReturn['update'], undefined>> = {};
		const { $$slots = {}, $$scope } = props;
		const $$component_changes: Record<string, unknown> = {};

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
				if (prop in categorized.p) $$component_changes[prop] = props[prop];
			}
		};

		return [
			function (this: HTMLElement, e: Event, alias: string) {
				const callbacks = component.$$.callbacks[alias];
				if (callbacks) {
					// @ts-ignore
					callbacks.slice().forEach((fn) => fn(e));
				}
			},
			props,
			values,
			actions,
			$$slots,
			$$scope,
			$$component_changes
		];
	}

	return class extends SvelteComponent {
		constructor(options: ComponentConstructorOptions) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal, {}, undefined);
		}
	} as unknown as typeof MicroComponent<Props>;
}
