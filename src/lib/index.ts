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
	const node = template.content.firstChild!;

	function initialize(cmt: SvelteComponentTyped<Record<T, string>> & { $$values: Record<T, Text>, $$template: HTMLElement }, props: Record<T, string>) {
		cmt.$$ = {
			on_mount: [],
			after_update: [],
			// @ts-expect-error other fields shouldn't matter
			fragment: {
				c: () => {
					cmt.$$template = node.cloneNode(true) as HTMLElement;
					for (const propName of propNames) {
						cmt.$$values[propName] = text(props[propName]);
					}
				},
				m: (target, anchor) => {
					// @ts-expect-error we know c is defined
					// TODO: also side note no clue why this is needed should look into it
					if (!cmt.$template) cmt.$$.fragment.c();
					insert(target, cmt.$template, anchor);
					for (const propName of propNames) {
						cmt.$$template
							.querySelector(`template-${propName}`)!
							.replaceWith(cmt.$$values[propName]);
					}
				},
				l: noop,
				p: noop,
				i: noop,
				o: noop,
				d: (detaching) => {
					if (detaching) detach(cmt.$template);
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
		$$template!: HTMLElement;
		$$values = {} as unknown as Record<T, Text>;

		constructor({ props = {} }: ComponentConstructorOptions) {
			super();
			initialize(this as any, props);
		}
	} as any;
}
