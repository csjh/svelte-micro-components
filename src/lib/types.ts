import type { DOMAttributes } from 'svelte/elements';
import type { Action } from 'svelte/action';
import type { SvelteComponentTyped } from 'svelte';
import type { SLOT, ON, USE, COMPONENT } from '$lib';

export type NonProp = OnDirective | UseDirective | Slot | InlineComponent;
export type Prop = string | NonProp;
export type ValidateProps<T extends readonly Prop[]> = {
	[K in keyof T]: T[K] extends OnDirective<string, infer Alias>
		? OnDirective<EventNames | AllowUnion<T[number]>, Alias>
		: T[K] extends string
		? string extends T[K]
			? never
			: T[K]
		: T[K];
};

// USE DIRECTIVE TYPES
export { Action };
export type UseDirective<
	PropName extends string | undefined = string | undefined,
	UserAction extends Action = Action
> = [USE, UserAction, PropName];

type KeyValuePairToObject<T extends UseDirective<string>> = {
	[K in Exclude<T[2], undefined>]: Parameters<T[1]>[1];
};

type ExtractUseProps<T extends readonly Prop[]> = Extract<
	T[number],
	UseDirective<string>
> extends never
	? Record<string, never>
	: KeyValuePairToObject<Extract<T[number], UseDirective<string>>>;

type ExtractUseEvents<T extends readonly Prop[]> = Extract<
	T[number],
	UseDirective<string | undefined>
> extends never
	? Record<never, never>
	: Extract<T[number], UseDirective> extends UseDirective<
			string | undefined,
			Action<Element, infer _, infer Attributes>
	  >
	? Attributes extends Record<string, never>
		? Record<string, never>
		: Extract<keyof Attributes, `on:${string}`> extends `on:${infer Q}`
		? { [K in Q]: Attributes[`on:${K}`] }
		: Record<string, never>
	: Record<string, never>;

// REGULAR PROP TYPES
type ExtractProps<T extends readonly Prop[]> = Extract<T[number], string> extends never
	? Record<string, never>
	: { [K in Extract<T[number], string>]: {} };

// SLOT TYPES
export type Slot<T extends string = string> = [SLOT, T];

type ExtractSlots<T extends readonly Prop[]> = Extract<T[number], Slot> extends never
	? {}
	: { [K in Extract<T[number], Slot>[1]]: {} };

// ON DIRECTIVE TYPES
export type OnDirective<T extends string = string, Alias extends string = string> = [ON, T, Alias];

type NeverUndefined<T> = T extends undefined | null ? never : T;

type Events = DOMAttributes<HTMLElement>;
type StripOnPrefix<T extends string> = T extends `on:${infer U}` ? U : T;
type EventNames = StripOnPrefix<keyof Events>;

type ExtractEvents<T extends readonly Prop[]> = {
	[K in Extract<T[number], OnDirective<EventNames>>[2]]: Parameters<
		NeverUndefined<Events[`on:${Extract<T[number], OnDirective<EventNames>>[1]}`]>
	>[0];
};

type GetEvents<T extends Record<string, unknown>> = Extract<
	keyof T,
	`on:${string}`
> extends `on:${infer U}`
	? U
	: never;
type AllowUnion<T> = T extends UseDirective<
	string | undefined,
	Action<Element, infer _, infer Attributes>
>
	? Attributes extends Record<string, never>
		? never
		: GetEvents<Attributes>
	: never;

// COMPONENT directive-ish types
export type InlineComponent<
	Component extends typeof SvelteComponentTyped<
		Record<string, unknown>,
		Record<string, unknown>,
		Record<string, unknown>
	> = typeof SvelteComponentTyped<
		Record<string, unknown>,
		Record<string, unknown>,
		Record<string, unknown>
	>
> = [COMPONENT, Component, Record<keyof InstanceType<Component>['$$prop_def'], string>];

// utility type
type CheckIfBothRecordStringNever<T1, T2, Fallback> = T1 extends Record<string, never>
	? T2 extends Record<string, never>
		? Fallback
		: { [K in keyof T2]: T2[K] }
	: T2 extends Record<string, never>
	? { [K in keyof T1]: T1[K] }
	: { [K in keyof T1 | keyof T2]: K extends keyof T1 ? T1[K] : K extends keyof T2 ? T2[K] : never };

export declare class MicroComponent<T extends readonly Prop[]> extends SvelteComponentTyped<
	CheckIfBothRecordStringNever<ExtractProps<T>, ExtractUseProps<T>, Record<string, never>>,
	CheckIfBothRecordStringNever<ExtractEvents<T>, ExtractUseEvents<T>, Record<never, never>>,
	ExtractSlots<T>
> {}
