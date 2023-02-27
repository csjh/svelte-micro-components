# `svelte-micro-components`

`svelte-micro-components` is a JavaScript library for creating small Svelte components that don't deserve their own file.

It currently only supports string props in markup, but the aim is to support in attributes and maybe event handlers as well.

## Usage

```svelte
<script>
	import m from 'svelte-micro-components';
	const Greeting = m`<h1>Hello ${'name'}!</h1>`;

	let name = '';
</script>

<Greeting {name} />
<input bind:value={name} />
```

- Micro component props are typesafe, so trying `<Greeting propThatIsntName="world" />` will throw an error.
- They also support SSR, so you can use them easily in your SvelteKit app.
