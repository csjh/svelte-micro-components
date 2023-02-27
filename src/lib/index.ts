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
	element
} from 'svelte/internal';
import { BROWSER } from 'esm-env';

export default function micro_component<T extends string>(
	strings: TemplateStringsArray,
	...propNames: T[]
): typeof SvelteComponentTyped<Record<T, string>> {
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

	function initialize(
		cmt: SvelteComponentTyped<Record<T, string>> & { $$values: Record<T, Text>; $$nodes: Node[] },
		props: Record<T, string>
	) {
		cmt.$$ = {
			on_mount: [],
			after_update: [],
			// @ts-expect-error other fields shouldn't matter
			fragment: {
				c: () => {
					cmt.$$nodes = Array.from((node.cloneNode(true) as HTMLElement).children).reverse();
					for (const propName of propNames) {
						cmt.$$values[propName] = text(props[propName]);
					}
				},
				m: (target, anchor) => {
					// @ts-expect-error we know c is defined
					// TODO: also side note no clue why this is needed should look into it
					if (!cmt.$$template) cmt.$$.fragment.c();

					for (const propName of propNames) {
						cmt.$$nodes[0]!.parentNode!.querySelector(`template-${propName}`)!.replaceWith(
							cmt.$$values[propName]
						);
					}

					cmt.$$nodes.forEach((node) => insert(target, node, anchor));
				},
				l: noop,
				p: noop,
				i: noop,
				o: noop,
				d: (detaching) => {
					if (detaching) cmt.$$nodes.forEach(detach);
				}
			}
		};

		cmt.$$set = (props) => {
			for (const propName of propNames) {
				cmt.$$values[propName].data = props[propName];
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
