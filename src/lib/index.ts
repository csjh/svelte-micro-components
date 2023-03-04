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
	children,
    attr,
    bubble,
    listen,
    run_all
} from 'svelte/internal';
import type { Events, Directive, OnDirective, UseDirective, Action, Prop, Microcomponent } from "./types";
import { BROWSER } from 'esm-env';

const isDirective = (value: unknown): value is Directive => Array.isArray(value);

// on:eventname
// on`${eventName}` or on`${eventname}=${}`
export function on<T extends keyof Events>(_: TemplateStringsArray, eventName: T, alias?: string): OnDirective<T> {
    return ["on", eventName, alias ?? eventName];
}

export default function micro_component<T extends string>(
export default function micro_component<Props extends readonly Prop[]>(
	{ raw: strings }: TemplateStringsArray,
	...propNames: Props
): Microcomponent<Props[number]> {
    type T = Prop;
    type StringProps = Extract<T, string>;

	const convert = (fn: (propName: T, previousString: string) => string) =>
		strings.map((s, i) => (propNames[i] ? fn(propNames[i], s) : s)).join('');

	if (!BROWSER) {
		return create_ssr_component((_: unknown, $$props: Record<StringProps, string>) => {
			return convert((propName, previousString) =>
                isDirective(propName)? previousString :
				previousString.at(-1) === '='
					? previousString.slice(0, previousString.lastIndexOf(' ') + 1)
					: previousString + escape($$props[propName])
			);
		}) as any;
	}

	const categorized: { attr: Set<StringProps>; text: Set<StringProps>; events: Set<OnDirective> } = { attr: new Set(), text: new Set(), events: new Set() };
	propNames.forEach((propName, i) => {
        if (isDirective(propName)) {
            if (propName[0] === 'on') {
                categorized.events.add(propName);
            }
        } else {
            if (strings[i].at(-1) === '=') {
                categorized.attr.add(propName);
            } else {
                categorized.text.add(propName);
            }
        }
	});

	const classes = {} as Record<StringProps, string>;
	function classify(propName: T, previousString: string) {
        if (isDirective(propName)) {
            return previousString + ` data-${propName[1]}-${propName[2]} `;
        } else {
            if (previousString.at(-1) !== '=') return previousString + `<template-${propName} />`;
            const start = previousString.lastIndexOf(' ');
            classes[propName] = previousString.slice(start + 1, -1);
            return previousString.slice(0, start) + ` data-${propName} `;
        }
	}

	const template = element('template');
	template.innerHTML = convert(classify);
	const node = template.content;

	function initialize(component: Microcomponent<T>, props: Record<StringProps, string>) {
		const values: Record<StringProps, Attr | Text> = blank_object();

		let nodes: ChildNode[];
        let dispose: (() => void)[] = [];
        let mounted = false;

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
						values[propName] = text(props[propName]);
					}
					for (const propName of categorized.attr) {
						const attr = document.createAttribute(classes[propName]);
						attr.value = props[propName];
						values[propName] = attr;
					}
				},
				m: (target, anchor) => {
					// @ts-expect-error we know c is defined
					// TODO: also side note no clue why this is needed should look into it
                    // maybe because of hydration?
					if (!component.$$template) component.$$.fragment.c();

					const parent = nodes[0]!.parentNode!;
					for (const propName of categorized.text) {
						parent.querySelector(`template-${propName}`)!.replaceWith(values[propName]);
					}
					for (const propName of categorized.attr) {
						const el = parent.querySelector(`[data-${propName}]`)!;
						attr(el, `data-${propName}`);
						el.setAttributeNode(values[propName] as Attr);
					}
                    if (!mounted) {
                        for (const event of categorized.events) {
                            const el = parent.querySelector(`[data-${event[1]}-${event[2]}]`)!;
                            dispose.push(listen(el, event[1], function(this: HTMLElement, e: Event) { 
                                bubble.call(this, component, e);
                            }));
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
				d: (detaching) => {
					if (detaching) nodes.forEach(detach);
                    mounted = false;
                    run_all(dispose);
				}
			}
		};

		component.$$set = (props: Record<StringProps, string>) => {
			for (const prop in props) {
				values[prop].nodeValue = props[prop];
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
