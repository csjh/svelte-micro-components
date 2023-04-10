import type { DOMAttributes } from 'svelte/elements';
import type { Action } from 'svelte/action';
import type { SvelteComponentTyped } from 'svelte';

export type NonProp = OnDirective | UseDirective<string | undefined> | Slot;
export type Prop = string | NonProp;
export type ValidateProps<T extends readonly Prop[]> = {
    [K in keyof T]: T[K] extends OnDirective<any, infer Alias> ? OnDirective<EventNames | AllowUnion<T[number]>, Alias> : T[K];
}

// USE DIRECTIVE TYPES
export { Action };
export type UseDirective<
	PropName extends string | undefined,
	UserAction extends Action = Action
> = ['use', UserAction, PropName];

type KeyValuePairToObject<T extends UseDirective<string>> = {
	[K in Exclude<T[2], undefined>]: Parameters<T[1]>[1];
};

type ExtractUseProps<T extends readonly Prop[]> = Extract<
	T[number],
	UseDirective<string>
> extends never
	? Record<string, never>
	: KeyValuePairToObject<Extract<T[number], UseDirective<string>>>;

type ExtractUseEvents<T extends readonly Prop[]> = Extract<T[number], UseDirective<any>> extends never
	? Record<string, never>
	: Extract<T[number], UseDirective<any>> extends UseDirective<any, Action<any, any, infer U>>
        ? Extract<keyof U, `on:${string}`> extends `on:${infer Q}`
            ? { [K in Q]: U[`on:${K}`] }
            : never
	: Record<string, never>;

// REGULAR PROP TYPES
type ExtractProps<T extends readonly Prop[]> = Extract<T[number], string> extends never
	? Record<string, never>
	: { [K in Extract<T[number], string>]: {} };

// SLOT TYPES
export type Slot<T extends string = string> = ['slot', T];

type ExtractSlots<T extends readonly Prop[]> = Extract<T[number], Slot> extends never
	? {}
	: { [K in Extract<T[number], Slot>[1]]: {} };

// ON DIRECTIVE TYPES
export type OnDirective<T extends string = string, Alias extends string = string> = [
	'on',
	T,
	Alias
];

type NeverUndefined<T> = T extends undefined | null ? never : T;

type Events = DOMAttributes<HTMLElement>;
type StripOnPrefix<T extends string> = T extends `on:${infer U}` ? U : T;
type EventNames = StripOnPrefix<keyof Events>;

type ExtractEvents<T extends readonly Prop[]> = {
	[K in Extract<T[number], OnDirective<EventNames>>[2]]: Parameters<
		NeverUndefined<Events[`on:${Extract<T[number], OnDirective<EventNames>>[1]}`]>
	>[0];
};

type GetEvents<T extends Record<string, any>> = Extract<keyof T, `on:${string}`> extends `on:${infer U}`? U : never;
type AllowUnion<T> = T extends UseDirective<any, Action<any, any, infer Attributes>> ? GetEvents<Attributes> : never;

// utility type
type CheckIfBothRecordStringNever<T1, T2, Fallback> = T1 extends Record<string, never>
	? T2 extends Record<string, never>
		? Fallback
		: { [K in keyof T2]: T2[K] }
	: T2 extends Record<string, never>
	? { [K in keyof T1]: T1[K] }
	: { [K in keyof T1 | keyof T2]: K extends keyof T1 ? T1[K] : K extends keyof T2 ? T2[K] : never };

// unholy type declaration, should fix
export type MicroComponent<T extends readonly Prop[]> = typeof SvelteComponentTyped<
	CheckIfBothRecordStringNever<ExtractProps<T>, ExtractUseProps<T>, Record<string, never>>,
	CheckIfBothRecordStringNever<ExtractEvents<T>, ExtractUseEvents<T>, Record<never, never>>,
	ExtractSlots<T>
> &
	SvelteComponentTyped<
		CheckIfBothRecordStringNever<ExtractUseProps<T>, ExtractProps<T>, Record<string, never>>,
		CheckIfBothRecordStringNever<ExtractEvents<T>, ExtractUseEvents<T>, Record<never, never>>,
		ExtractSlots<T>
	>;
