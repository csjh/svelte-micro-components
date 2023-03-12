import { describe, it, expect } from 'vitest';
import m, { use } from '$lib';
import type { Action } from 'svelte/action';

describe('types testing', () => {
	it('should not allow undeclared props', () => {
		const Component = m`<div class=${'hello'} />`;
		type Props = (typeof Component)['$$prop_def'];

		// should be fine with hello
		let props: Props = { hello: 'bye' };
		// @ts-expect-error shouldn't allow any props other than hello
		props = { foo: 'bar' };
		// @ts-expect-error even if hello is declared
		props = { hello: 'bye', foo: 'bar' };
		// @ts-expect-error should want props to be declared
		props = {};

		const NoPropsComponent = m`<div />`;
		type NoProps = (typeof NoPropsComponent)['$$prop_def'];

		// shouldn't need any props
		let noProps: NoProps = {};
		// @ts-expect-error should not allow any props
		noProps = { foo: 'bar' };
	});
	it('should work with action props', () => {
		const action: Action<HTMLElement, { foo: string }> = (node, params) => {
			return {
				update: (params) => {}
			};
		};

		const Component = m`<div ${use`${action}=${'prop'}`} />`;
		type Props = (typeof Component)['$$prop_def'];

		// should be fine with prop
		let props: Props = { prop: { foo: 'bar' } };
		// @ts-expect-error shouldn't allow any props other than prop
		props = { foo: 'bar' };

		const emptyAction: Action<HTMLElement> = (node) => {};

		const NoPropsComponent = m`<div ${use`${emptyAction}`} />`;
		type NoProps = (typeof NoPropsComponent)['$$prop_def'];

		// shouldn't need any props
		let noProps: NoProps = {};
		// @ts-expect-error should not allow any props
		noProps = { foo: 'bar' };
	});
});
