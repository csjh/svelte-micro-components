import type {
	AnimationEventHandler,
	ClipboardEventHandler,
	CompositionEventHandler,
	DragEventHandler,
	EventHandler,
	FocusEventHandler,
	FormEventHandler,
	KeyboardEventHandler,
	MessageEventHandler,
	MouseEventHandler,
	PointerEventHandler,
	TouchEventHandler,
	TransitionEventHandler,
	UIEventHandler,
	WheelEventHandler
} from 'svelte/elements';
import type { Action } from 'svelte/action';
import type { SvelteComponentTyped } from 'svelte';

export { Action };
export type OnDirective<T extends keyof Events = keyof Events> = ['on', T, string];
export type UseDirective<
	PropName extends string | undefined,
	UserAction extends Action = Action
> = ['use', UserAction, PropName];
type BindDirective = ['bind', string, unknown?];
export type Directive = OnDirective | UseDirective<string | undefined>;

export type Prop = string | Directive;

type KeyValuePairToObject<T extends UseDirective<string>> = {
	[K in Exclude<T[2], undefined>]: Parameters<T[1]>[1];
};

type ExtractUseProps<T extends readonly Prop[]> = Extract<
	T[number],
	UseDirective<string>
> extends never
	? Record<string, never>
	: KeyValuePairToObject<Extract<T[number], UseDirective<string>>>;

type Q = [UseDirective<string, Action<HTMLElement, any, Record<never, any>>>];
type A = Q[number];
type AA = A[2];
type QQ = Exclude<A[2], undefined>;
type Boo = KeyValuePairToObject<A>;

type ExtractProps<T extends readonly Prop[]> = Extract<T[number], string> extends never
	? Record<string, never>
	: { [K in Extract<T[number], string>]: string };

type ExtractEvents<T extends readonly Prop[]> = {
	[K in Extract<T[number], OnDirective>[1]]: Parameters<Events[K]>[0];
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

export interface Events {
	// Clipboard Events
	copy: ClipboardEventHandler<HTMLElement>;
	cut: ClipboardEventHandler<HTMLElement>;
	paste: ClipboardEventHandler<HTMLElement>;

	// Composition Events
	compositionend: CompositionEventHandler<HTMLElement>;
	compositionstart: CompositionEventHandler<HTMLElement>;
	compositionupdate: CompositionEventHandler<HTMLElement>;

	// Focus Events
	focus: FocusEventHandler<HTMLElement>;
	focusin: FocusEventHandler<HTMLElement>;
	focusout: FocusEventHandler<HTMLElement>;
	blur: FocusEventHandler<HTMLElement>;

	// Form Events
	change: FormEventHandler<HTMLElement>;
	beforeinput: EventHandler<InputEvent, HTMLElement>;
	input: FormEventHandler<HTMLElement>;
	reset: FormEventHandler<HTMLElement>;
	submit: EventHandler<Event & { readonly submitter: HTMLElement | null }, HTMLElement>; // TODO make this SubmitEvent once we require TS>=4.4
	invalid: EventHandler<Event, HTMLElement>;
	formdata: EventHandler<Event & { readonly formData: FormData }, HTMLElement>; // TODO make this FormDataEvent once we require TS>=4.4

	// Image Events
	load: EventHandler;
	error: EventHandler; // also a Media Event

	// Detail Events
	toggle: EventHandler<Event, HTMLElement>;

	// Keyboard Events
	keydown: KeyboardEventHandler<HTMLElement>;
	keypress: KeyboardEventHandler<HTMLElement>;
	keyup: KeyboardEventHandler<HTMLElement>;

	// Media Events
	abort: EventHandler<Event, HTMLElement>;
	canplay: EventHandler<Event, HTMLElement>;
	canplaythrough: EventHandler<Event, HTMLElement>;
	cuechange: EventHandler<Event, HTMLElement>;
	durationchange: EventHandler<Event, HTMLElement>;
	emptied: EventHandler<Event, HTMLElement>;
	encrypted: EventHandler<Event, HTMLElement>;
	ended: EventHandler<Event, HTMLElement>;
	loadeddata: EventHandler<Event, HTMLElement>;
	loadedmetadata: EventHandler<Event, HTMLElement>;
	loadstart: EventHandler<Event, HTMLElement>;
	pause: EventHandler<Event, HTMLElement>;
	play: EventHandler<Event, HTMLElement>;
	playing: EventHandler<Event, HTMLElement>;
	progress: EventHandler<Event, HTMLElement>;
	ratechange: EventHandler<Event, HTMLElement>;
	seeked: EventHandler<Event, HTMLElement>;
	seeking: EventHandler<Event, HTMLElement>;
	stalled: EventHandler<Event, HTMLElement>;
	suspend: EventHandler<Event, HTMLElement>;
	timeupdate: EventHandler<Event, HTMLElement>;
	volumechange: EventHandler<Event, HTMLElement>;
	waiting: EventHandler<Event, HTMLElement>;

	// MouseEvents
	auxclick: MouseEventHandler<HTMLElement>;
	click: MouseEventHandler<HTMLElement>;
	contextmenu: MouseEventHandler<HTMLElement>;
	dblclick: MouseEventHandler<HTMLElement>;
	drag: DragEventHandler<HTMLElement>;
	dragend: DragEventHandler<HTMLElement>;
	dragenter: DragEventHandler<HTMLElement>;
	dragexit: DragEventHandler<HTMLElement>;
	dragleave: DragEventHandler<HTMLElement>;
	dragover: DragEventHandler<HTMLElement>;
	dragstart: DragEventHandler<HTMLElement>;
	drop: DragEventHandler<HTMLElement>;
	mousedown: MouseEventHandler<HTMLElement>;
	mouseenter: MouseEventHandler<HTMLElement>;
	mouseleave: MouseEventHandler<HTMLElement>;
	mousemove: MouseEventHandler<HTMLElement>;
	mouseout: MouseEventHandler<HTMLElement>;
	mouseover: MouseEventHandler<HTMLElement>;
	mouseup: MouseEventHandler<HTMLElement>;

	// Selection Events
	select: EventHandler<Event, HTMLElement>;
	selectionchange: EventHandler<Event, HTMLElement>;
	selectstart: EventHandler<Event, HTMLElement>;

	// Touch Events
	touchcancel: TouchEventHandler<HTMLElement>;
	touchend: TouchEventHandler<HTMLElement>;
	touchmove: TouchEventHandler<HTMLElement>;
	touchstart: TouchEventHandler<HTMLElement>;

	// Pointer Events
	gotpointercapture: PointerEventHandler<HTMLElement>;
	pointercancel: PointerEventHandler<HTMLElement>;
	pointerdown: PointerEventHandler<HTMLElement>;
	pointerenter: PointerEventHandler<HTMLElement>;
	pointerleave: PointerEventHandler<HTMLElement>;
	pointermove: PointerEventHandler<HTMLElement>;
	pointerout: PointerEventHandler<HTMLElement>;
	pointerover: PointerEventHandler<HTMLElement>;
	pointerup: PointerEventHandler<HTMLElement>;
	lostpointercapture: PointerEventHandler<HTMLElement>;

	// UI Events
	scroll: UIEventHandler<HTMLElement>;
	resize: UIEventHandler<HTMLElement>;

	// Wheel Events
	wheel: WheelEventHandler<HTMLElement>;

	// Animation Events
	animationstart: AnimationEventHandler<HTMLElement>;
	animationend: AnimationEventHandler<HTMLElement>;
	animationiteration: AnimationEventHandler<HTMLElement>;

	// Transition Events
	transitionstart: TransitionEventHandler<HTMLElement>;
	transitionrun: TransitionEventHandler<HTMLElement>;
	transitionend: TransitionEventHandler<HTMLElement>;
	transitioncancel: TransitionEventHandler<HTMLElement>;

	// Svelte Transition Events
	outrostart: EventHandler<CustomEvent<null>, HTMLElement>;
	outroend: EventHandler<CustomEvent<null>, HTMLElement>;
	introstart: EventHandler<CustomEvent<null>, HTMLElement>;
	introend: EventHandler<CustomEvent<null>, HTMLElement>;

	// Message Events
	message: MessageEventHandler<HTMLElement>;
	messageerror: MessageEventHandler<HTMLElement>;

	// Global Events
	cancel: EventHandler<Event, HTMLElement>;
	close: EventHandler<Event, HTMLElement>;
	fullscreenchange: EventHandler<Event, HTMLElement>;
	fullscreenerror: EventHandler<Event, HTMLElement>;
}
