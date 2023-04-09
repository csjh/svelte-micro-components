import type { DOMAttributes } from 'svelte/elements';
import type { Action } from 'svelte/action';
import type { SvelteComponentTyped } from 'svelte';

export type Events = DOMAttributes<HTMLElement>;
export { Action };

type StripOnPrefix<T extends string> = T extends `on:${infer U}` ? U : T;
export type EventNames = StripOnPrefix<keyof Events>;

export type OnDirective<T extends EventNames = EventNames, Alias extends string = string> = [
	'on',
	T,
	Alias
];
export type UseDirective<
	PropName extends string | undefined,
	UserAction extends Action = Action
> = ['use', UserAction, PropName];
export type Slot = readonly ["slot", string];
export type NonProp = OnDirective | UseDirective<string | undefined> | Slot;

export type Prop = string | NonProp;

type KeyValuePairToObject<T extends UseDirective<string>> = {
	[K in Exclude<T[2], undefined>]: Parameters<T[1]>[1];
};

type ExtractUseProps<T extends readonly Prop[]> = Extract<
	T[number],
	UseDirective<string>
> extends never
	? Record<string, never>
	: KeyValuePairToObject<Extract<T[number], UseDirective<string>>>;

type ExtractProps<T extends readonly Prop[]> = Extract<T[number], string> extends never
	? Record<string, never>
	: { [K in Extract<T[number], string>]: string };

type UndefinedDefault<T, K> = T extends undefined | null ? K : T;
type ExtractEvents<T extends readonly Prop[]> = {
	[K in Extract<T[number], OnDirective>[2]]: Parameters<
		UndefinedDefault<Events[`on:${Extract<T[number], OnDirective>[1]}`], () => void>
	>[0];
};

// all the ugly { [k in keyof] } stuff is just identity types basically i just do it to make the final type look nicer
type CheckIfBothRecordStringNever<T1, T2> = T1 extends Record<string, never>
	? T2 extends Record<string, never>
		? Record<string, never>
		: { [K in keyof T2]: T2[K] }
	: T2 extends Record<string, never>
	? { [K in keyof T1]: T1[K] }
	: { [K in keyof T1 | keyof T2]: K extends keyof T1 ? T1[K] : K extends keyof T2 ? T2[K] : never };

// unholy type declaration, should fix
export type MicroComponent<T extends readonly Prop[]> = typeof SvelteComponentTyped<
	CheckIfBothRecordStringNever<ExtractProps<T>, ExtractUseProps<T>>,
	ExtractEvents<T>
> &
	SvelteComponentTyped<
		CheckIfBothRecordStringNever<ExtractUseProps<T>, ExtractProps<T>>,
		ExtractEvents<T>
	>;
