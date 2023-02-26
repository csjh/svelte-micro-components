import type { SvelteComponent } from "svelte";
import { SvelteComponentTyped, text, type ComponentConstructorOptions, insert_hydration, detach, noop, insert } from "svelte/internal";

type Props = "name";

export default function micro_component</*const*/T extends Props>(strings: TemplateStringsArray, ...propNames: T[]) {
    const template = document.createElement("template");
    template.innerHTML = strings.map((s, i) => s + (propNames[i] ? `<template-${propNames[i]} />` : "")).join("");
    const node = template.content.firstChild!;

    function initialize(cmt: SvelteComponent, props: Record<T, any>) {
        cmt.$values = new Map<T, Text>();

        cmt.$$ = {
            on_mount: [],
            after_update: [],
            fragment: {
                c: () => {
                    console.log("creating")
                    cmt.$template = (node.cloneNode(true) as HTMLElement);
                    for (const propName of propNames) {
                        cmt.$values.set(propName, text(props[propName]));
                    }
                },
                m: (target, anchor) => {
                    console.log(target, cmt.$template, anchor)
                    // @ts-expect-error we know c is defined
                    if (!cmt.$template) cmt.$$.fragment.c();
                    insert(target, cmt.$template, anchor);
                    for (const propName of propNames) {
                        cmt.$template.querySelector(`template-${propName}`).replaceWith(cmt.$values.get(propName)!);
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
        }
    }

    return class extends SvelteComponentTyped<Record<T, any>> {
        $template!: HTMLElement;
        $values!: Map<T, Text>;

        constructor(options: ComponentConstructorOptions) {
            super(options);
            initialize(this, options.props ?? {});
        }
    }
}
