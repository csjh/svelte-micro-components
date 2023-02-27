import type { SvelteComponentTyped } from 'svelte';
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
    blank_object
} from 'svelte/internal';
import { BROWSER } from 'esm-env';

// unholy type declaration, should fix
type Microcomponent<T extends string> = typeof SvelteComponentTyped<Record<T, string>> &
	SvelteComponentTyped<Record<T, string>> & { $$values: Record<T, Text>; $$nodes: Node[] };

export default function micro_component<T extends string>(
	{ raw: strings }: TemplateStringsArray,
	...propNames: T[]
): Microcomponent<T> {
	const convert = (fn: (propName: T) => string) =>
		strings.map((s, i) => s + (propNames[i] ? fn(propNames[i]) : '')).join('');

	if (!BROWSER) {
		return create_ssr_component((_: unknown, $$props: Record<T, string>) => {
			return convert((propName: T) => escape($$props[propName]));
		}) as any;
	}

	const template = element('template');
	template.innerHTML = convert((propName) => `<template-${propName} />`);
	const node = template.content;

	function initialize(component: Microcomponent<T>, props: Record<T, string>) {
		component.$$ = {
			on_mount: [],
            before_update: [],
			after_update: [],
            on_destroy: [],
            callbacks: blank_object(),
			// @ts-expect-error other fields shouldn't matter
			fragment: {
				c: () => {
					component.$$nodes = Array.from((node.cloneNode(true) as HTMLElement).children);
					for (const propName of propNames) {
						component.$$values[propName] = text(props[propName]);
					}
				},
				m: (target, anchor) => {
					// @ts-expect-error we know c is defined
					// TODO: also side note no clue why this is needed should look into it
					if (!component.$$template) component.$$.fragment.c();

					for (const propName of propNames) {
						component.$$nodes[0]!.parentNode!.querySelector(`template-${propName}`)!.replaceWith(
							component.$$values[propName]
						);
					}

                    // note: can insert all with Template.content, but then can't access nodes after insertion
					component.$$nodes.forEach((node) => insert(target, node, anchor));
				},
				l: noop,
				p: noop,
				i: noop,
				o: noop,
				d: (detaching) => {
					if (detaching) component.$$nodes.forEach(detach);
				}
			}
		};

		component.$$set = (props) => {
			for (const propName of propNames) {
				component.$$values[propName].data = props[propName];
			}
		};
	}

	return class extends SvelteComponent {
		$$nodes: Node[] = [];
		$$values = {} as unknown as Record<T, Text>;

		constructor({ props = {} }: ComponentConstructorOptions) {
			super();
			initialize(this as any, props);
		}
	} as any;
}
