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
	blank_object,
	children
} from 'svelte/internal';
import { BROWSER } from 'esm-env';

// unholy type declaration, should fix
type Microcomponent<T extends string> = typeof SvelteComponentTyped<Record<T, string>> &
	SvelteComponentTyped<Record<T, string>>;

export default function micro_component<T extends string>(
	{ raw: strings }: TemplateStringsArray,
	...propNames: T[]
): Microcomponent<T> {
	const convert = (fn: (propName: T, previousString: string) => string) =>
		strings.map((s, i) => (propNames[i] ? fn(propNames[i], s) : s)).join('');

	if (!BROWSER) {
		return create_ssr_component((_: unknown, $$props: Record<T, string>) => {
			return convert((propName, previousString) =>
				previousString.at(-1) === '='
					? previousString.slice(0, previousString.lastIndexOf(' ') + 1)
					: previousString + escape($$props[propName])
			);
		}) as any;
	}

	const categorized: { attr: Set<T>; text: Set<T> } = { attr: new Set(), text: new Set() };
	propNames.forEach((propName, i) => {
		if (strings[i].at(-1) === '=') {
			categorized.attr.add(propName);
		} else {
			categorized.text.add(propName);
		}
	});

	const classes = {} as Record<T, string>;
	function classify(propName: T, previousString: string) {
		if (previousString.at(-1) !== '=') return previousString + `<template-${propName} />`;
		const start = previousString.lastIndexOf(' ');
		classes[propName] = previousString.slice(start + 1, -1);
		return previousString.slice(0, start) + ` data-${propName} `;
	}

	const template = element('template');
	template.innerHTML = convert(classify);
	const node = template.content;

	function initialize(component: Microcomponent<T>, props: Record<T, string>) {
		const values: {
			attr: Record<T, Attr>;
			text: Record<T, Text>;
		} = { attr: blank_object(), text: blank_object() };

		let nodes: ChildNode[];

		component.$$ = {
			on_mount: [],
			before_update: [],
			after_update: [],
			on_destroy: [],
			callbacks: blank_object(),
			// @ts-expect-error other fields shouldn't matter
			fragment: {
				c: () => {
					nodes = children(node.cloneNode(true) as HTMLElement);
					for (const propName of categorized.text) {
						values.text[propName] = text(props[propName]);
					}
					for (const propName of categorized.attr) {
						const attr = document.createAttribute(classes[propName]);
						attr.value = props[propName];
						values.attr[propName] = attr;
					}
				},
				m: (target, anchor) => {
					// @ts-expect-error we know c is defined
					// TODO: also side note no clue why this is needed should look into it
					if (!component.$$template) component.$$.fragment.c();

					const parent = nodes[0]!.parentNode!;
					for (const propName of categorized.text) {
						parent.querySelector(`template-${propName}`)!.replaceWith(values.text[propName]);
					}
					for (const propName of categorized.attr) {
						const el = parent.querySelector(`[data-${propName}]`)!;
						el.removeAttribute(`data-${propName}`);
						el.setAttributeNode(values.attr[propName]);
					}

					// note: can insert all with Template.content, but then can't access nodes after insertion
					nodes.forEach((node) => insert(target, node, anchor));
				},
				l: noop,
				p: noop,
				i: noop,
				o: noop,
				d: (detaching) => {
					if (detaching) nodes.forEach(detach);
				}
			}
		};

		component.$$set = (props: Record<T, string>) => {
			for (const prop in props) {
				if (categorized.attr.has(prop)) values.attr[prop].nodeValue = props[prop];
				else if (categorized.text.has(prop)) values.text[prop].data = props[prop];
			}
		};
	}

	return class extends SvelteComponent {
		constructor({ props = {} }: ComponentConstructorOptions) {
			super();
			initialize(this as any, props);
		}
	} as any;
}
