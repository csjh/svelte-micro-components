/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import { describe, it } from 'vitest';
import m, { on, use } from '$lib';
import type { Action } from 'svelte/action';

describe('types testing', () => {
	it('should not allow undeclared props', () => {
		const Component = m`<div class=${'hello'} />`;
		type Props = InstanceType<typeof Component>['$$prop_def'];

		let props: Props;
		// should be fine with hello
		props = { hello: 'bye' };
		// @ts-expect-error shouldn't allow any props other than hello
		props = { foo: 'bar' };
		// @ts-expect-error even if hello is declared
		props = { hello: 'bye', foo: 'bar' };
		// @ts-expect-error should want props to be declared
		props = {};

		const NoPropsComponent = m`<div />`;
		type NoProps = InstanceType<typeof NoPropsComponent>['$$prop_def'];

		let noProps: NoProps;
		// shouldn't need any props
		noProps = {};
		// @ts-expect-error should not allow any props
		noProps = { foo: 'bar' };
	});
	it('should work with action props', () => {
		const action: Action<HTMLElement, { foo: string }> = () => {};

		const Component = m`<div ${use`${action}=${'prop'}`} />`;
		type Props = InstanceType<typeof Component>['$$prop_def'];

		let props: Props;
		// should be fine with prop
		props = { prop: { foo: 'bar' } };
		// @ts-expect-error shouldn't allow any props other than prop
		props = { foo: 'bar' };

		const emptyAction: Action<HTMLElement> = () => {};

		const NoPropsComponent = m`<div ${use`${emptyAction}`} />`;
		type NoProps = InstanceType<typeof NoPropsComponent>['$$prop_def'];

		let noProps: NoProps;
		// shouldn't need any props
		noProps = {};
		// @ts-expect-error should not allow any props
		noProps = { foo: 'bar' };

		const BothPropsComponent = m`<div ${use`${action}=${'prop'}`} ${use`${emptyAction}`}>${'hello'}</div>`;
		type BothProps = InstanceType<typeof BothPropsComponent>['$$prop_def'];

		let bothProps: BothProps;
		// should be fine with prop and hello
		bothProps = { prop: { foo: 'bar' }, hello: 'world' };
		// @ts-expect-error shouldn't allow one of them missing
		bothProps = { hello: 'world' };
		// @ts-expect-error same as above
		bothProps = { prop: { foo: 'bar' } };
		// @ts-expect-error shouldn't allow any props other than prop and hello
		bothProps = { foo: 'bar' };
		// @ts-expect-error same as above
		bothProps = { prop: { foo: 'bar' }, hello: 'world', foo: 'bar' };
		// @ts-expect-error shouldn't allow empty
		bothProps = {};
	});
	it('should allow events', () => {
		const Empty = m`<div />`;

		const $non: InstanceType<typeof Empty>['$on'] = (type, callback) => () => {};

		// @ts-expect-error shouldn't allow any events
		$non('click', (e) => {});

		const Component = m`<div ${on`${'click'}`} />`;
		const $on: InstanceType<typeof Component>['$on'] = (type, callback) => () => {};

		// should be fine with click with empty event
		$on('click', (e) => {});
		$on('click', () => {});
		// @ts-expect-error shouldn't allow any events other than click
		$on('foo', (e) => {});
		// @ts-expect-error especially not boom
		$on('boom', (e) => {});

		const MultipleComponent = m`<div ${on`${'click'}`} ${on`${'mouseover'}`} />`;
		const $onMultiple: InstanceType<typeof MultipleComponent>['$on'] = (type, callback) => () => {};

		// should be fine with click and mouseover with empty event
		$onMultiple('click', (e) => {});
		$onMultiple('click', () => {});
		$onMultiple('mouseover', (e) => {});
		$onMultiple('mouseover', () => {});
		// @ts-expect-error shouldn't allow any events other than click and mouseover
		$onMultiple('foo', (e) => {});
		// @ts-expect-error especially not boom
		$onMultiple('boom', (e) => {});
	});
	it('should allow events forwarded events', () => {
		const Component = m`<div ${on`${'click'}=${'boom'}`} />`;
		const $on: InstanceType<typeof Component>['$on'] = (type, callback) => () => {};

		// should be fine with boom with empty event
		$on('boom', (e) => {});
		$on('boom', () => {});
		// @ts-expect-error shouldn't allow any events other than boom
		$on('foo', (e) => {});
		// @ts-expect-error especially not click
		$on('click', (e) => {});

		const MultipleComponent = m`<div ${on`${'click'}=${'boom'}`} ${on`${'mouseover'}=${'shoom'}`} />`;
		const $onMultiple: InstanceType<typeof MultipleComponent>['$on'] = (type, callback) => () => {};

		// should be fine with boom and shoom with empty event
		$onMultiple('boom', (e) => {});
		$onMultiple('boom', () => {});
		$onMultiple('shoom', (e) => {});
		$onMultiple('shoom', () => {});
		// @ts-expect-error shouldn't allow any events other than boom and shoom
		$onMultiple('foo', (e) => {});
		// @ts-expect-error especially not click
		$onMultiple('click', (e) => {});
	});
});
