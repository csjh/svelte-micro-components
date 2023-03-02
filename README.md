# `svelte-micro-components`

`svelte-micro-components` is a JavaScript library for creating small Svelte components that don't deserve their own file.

It currently only supports string props in markup and attributes, but the aim is to support most directives.

## Usage

```svelte
<script>
	import m from 'svelte-micro-components';
	const Greeting = m`<h1>Hello ${'name'}!</h1>`;

	let name = '';
</script>

<Greeting {name} />
<input class={name} bind:value={name} />
```

- Micro component props are typesafe, so trying `<Greeting propThatIsntName="world" />` will throw an error.
- They also support SSR, so you can use them easily in your SvelteKit app.
- Also note that for attributes, you have to do `class={`your-class ${propClass}`}` instead of `class="your-class {propClass}"`, and that there can't be spaces padding the equals sign.
