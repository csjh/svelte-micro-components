import type { SvelteComponentTyped } from 'svelte';
import {
	type ComponentConstructorOptions,
	SvelteComponent,
	text,
	detach,
	noop,
	insert,
	create_ssr_component,
	escape
} from 'svelte/internal';
import { BROWSER } from 'esm-env';

export default function micro_component<T extends string>(
	strings: TemplateStringsArray,
	...propNames: T[]
): typeof SvelteComponentTyped<Record<T, any>> {
	const convert = (fn: (propName: T) => string) =>
		strings.map((s, i) => s + (propNames[i] ? fn(propNames[i]) : '')).join('');

	if (!BROWSER) {
		return create_ssr_component((_: unknown, $$props: Record<T, any>) => {
			return convert((propName: T) => escape($$props[propName]));
		}) as any;
	}

	const template = document.createElement('template');
	template.innerHTML = convert((propName) => `<template-${propName} />`);
	const node = template.content.firstChild!;

	function initialize(cmt: SvelteComponentTyped, props: Record<T, any>) {
		cmt.$values = new Map<T, Text>();

		cmt.$$ = {
			on_mount: [],
			after_update: [],
			fragment: {
				c: () => {
					cmt.$template = node.cloneNode(true) as HTMLElement;
					for (const propName of propNames) {
						cmt.$values.set(propName, text(props[propName]));
					}
				},
				m: (target, anchor) => {
					// @ts-expect-error we know c is defined
                    // TODO: also side note no clue why this is needed should look into it
					if (!cmt.$template) cmt.$$.fragment.c();
					insert(target, cmt.$template, anchor);
					for (const propName of propNames) {
						cmt.$template
							.querySelector(`template-${propName}`)
							.replaceWith(cmt.$values.get(propName));
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
				cmt.$values.get(propName).data = props[propName];
			}
		};
	}

	return class extends SvelteComponent {
		$template!: HTMLElement;
		$values!: Map<T, Text>;

		constructor({ props = {} }: ComponentConstructorOptions) {
			super();
			initialize(this as any, props);
		}
	} as any;
}
