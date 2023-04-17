# `svelte-micro-components`

`svelte-micro-components` is a JavaScript library for creating small Svelte components that don't deserve their own file.

Currently supports:

- Text props (e.g. `<h1>Hello ${'name'}!</h1>`)
- Attribute props (`<input class={name} />`)
  - Note: not `class="your-class {propClass}"`
- Event forwarding (optionally under an alias)
  - `` <button ${on`${'click'}`} /> ``
  - `` <button ${on`${'click'}=${'otherClick'}`} /> ``
- Slots
  - Default: `<div class="wrapper">${slot()}</div>`
  - Named: `<div class="wrapper">${slot('slotName')}</div>`
- Actions, including:
  - with events: `` <div ${use`${outclick}`} /> `` (the component will emit a fully typed `outclick` event when the user clicks outside of the element)
  - with props: `` <div ${use`${longclick}=${'duration'}`} /> ``
- Nested components
  - `` <div class="wrapper">${component`<${Nested} />`}</div> ``
  - with props: `` <div class="wrapper">${component`<${Nested} prop=${'nested_prop'} />`}</div> `` (`Nested` will be passed the prop `nested_prop`)
  - events are not currently supported

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

## Examples

Basic text interpolation:
Link to REPL:
[REPL](https://svelte.dev/repl/5c837032b30e4322857d2ba9820baccb?version=3.58.0)
```svelte
<script lang="ts">
	import m from 'svelte-micro-components';

	const Greeting = m`<h1>Hello ${'name'}</h1>`;
</script>

<Greeting name="world" />
```

Dynamic attributes:
[REPL](https://svelte.dev/repl/13e16447f48045f89af04b10a58a0974?version=3.58.0)
```svelte
<script lang="ts">
	import m from 'svelte-micro-components';

	const src = 'https://svelte.dev/tutorial/image.gif';
	const name = 'Rick Astley';

	const Image = m`<img src=${'src'} alt=${'alt'}>`;
</script>

<Image {src} alt="{name} dancing" />
```

Nested components:
[REPL](https://svelte.dev/repl/2d104d50e8af4ce29178fa2136e8d6eb?version=3.58.0)
```svelte
<script lang="ts">
	import m, { component } from 'svelte-micro-components';
	import Nested from './Nested.svelte';

	const Wrapper = m`<div class="wrapper">${component`<${Nested} />`}</div>`;
</script>

<Wrapper />
```

DOM events:
[REPL](https://svelte.dev/repl/90aae0da3ab349efbc25a9ed7910559e?version=3.58.0)
```svelte
<script lang="ts">
	let pos = { x: 0, y: 0 };

	function handleMousemove(event: MouseEvent) {
		pos.x = event.clientX;
		pos.y = event.clientY;
	}

	import m, { on } from 'svelte-micro-components';

	const Tracker = m`
		<div ${on`${'mousemove'}`}>
			The mouse position is ${'x'} x ${'y'}
		</div>
	`;
</script>

<Tracker x={pos.x} y={pos.y} on:mousemove={handleMousemove} />
```

Event forwarding:
[REPL](https://svelte.dev/repl/8c29f13eff8e4d70b98ee8dd5db0c411?version=3.58.0)
```svelte
<script lang="ts">
	let pos = { x: 0, y: 0 };

	function handleMousemove(event: MouseEvent) {
		pos.x = event.clientX;
		pos.y = event.clientY;
	}

	import m, { on } from 'svelte-micro-components';

	const Tracker = m`
		<div ${on`${'mousemove'}=${'moved'}`}>
			The mouse position is ${'x'} x ${'y'}
		</div>
	`;
</script>

<Tracker x={pos.x} y={pos.y} on:moved={handleMousemove} />
```

Basic action:
[REPL](https://svelte.dev/repl/39570d0aa2e7433893d25bba2a524b09?version=3.58.0)
```svelte
<script context="module" lang="ts">
	import type { Action } from 'svelte/action';

	const changeColor: Action<HTMLElement, string> = (node, param = 'red') => {
		node.style.color = param;

		return {
			update(parameter) {
				node.style.color = parameter;
			}
		};
	};
</script>

<script lang="ts">
	import m, { on, use } from 'svelte-micro-components';

	const Box = m`
		<div ${use`${changeColor}=${'color'}`} ${on`${'click'}`}>
			I start off as red, but when you click me I turn green.
		</div>
	`;

	let color = 'rgb(255, 0, 0)';
</script>

<Box on:click={() => (color = 'rgb(0, 255, 0)')} {color} />
```

Parameterized action (longpress from [this official example](https://svelte.dev/examples/adding-parameters-to-actions)):
[REPL](https://svelte.dev/repl/05bbcba99418486692a7979b3d88e206?version=3.58.0)
```svelte
<script context="module" lang="ts">
	import type { Action } from 'svelte/action';

	declare const longpress: Action<
		HTMLElement,
		number,
		{ 'on:longpress': (e: CustomEvent) => void }
	>;
</script>

<script lang="ts">
	import m, { on, use } from 'svelte-micro-components';

	let pressed = false;
	let duration = 2000;

	const Button = m`
        <button
            ${use`${longpress}=${'duration'}`}
            ${on`${'longpress'}`}
            ${on`${'mouseenter'}`}
        >
            press and hold
        </button>
    `;

	const Message = m`<p>congratulations, you pressed and held for ${'duration'}ms</p>`;
</script>

<label>
	<input type="range" bind:value={duration} max={2000} step={100} />
	{duration}ms
</label>

<Button {duration} on:longpress={() => (pressed = true)} on:mouseenter={() => (pressed = false)} />

{#if pressed}
	<Message {duration} />
{/if}
```

Complex action:
[REPL](https://svelte.dev/repl/38ee0361bb904d448414959077829f0a?version=3.58.0)
```svelte
<script lang="ts" context="module">
	import type { Action } from 'svelte/action';
	declare const pannable: Action<
		HTMLElement,
		null,
		{
			'on:panstart': CustomEvent<{ x: number; y: number }>;
			'on:panmove': CustomEvent<{ x: number; y: number; dx: number; dy: number }>;
			'on:panend': CustomEvent<{ x: number; y: number }>;
		}
	>;
</script>

<script lang="ts">
	import { spring } from 'svelte/motion';

	const coords = spring({ x: 0, y: 0 }, { stiffness: 0.2, damping: 0.4 });

	function handlePanStart() {
		coords.stiffness = coords.damping = 1;
	}

	function handlePanMove(event: CustomEvent<{ x: number; y: number; dx: number; dy: number }>) {
		coords.update(($coords) => ({
			x: $coords.x + event.detail.dx,
			y: $coords.y + event.detail.dy
		}));
	}

	function handlePanEnd() {
		coords.stiffness = 0.2;
		coords.damping = 0.4;
		coords.set({ x: 0, y: 0 });
	}

	import m, { on, use } from 'svelte-micro-components';

	const Box = m`
		<div class="box"
			${use`${pannable}`}
			${on`${'panstart'}`}
			${on`${'panmove'}`}
			${on`${'panend'}`}
			style=${'style'}
		></div>
	`;
</script>

<Box
	on:panstart={handlePanStart}
	on:panmove={handlePanMove}
	on:panend={handlePanEnd}
	style="transform:
		translate({$coords.x}px,{$coords.y}px)
		rotate({$coords.x * 0.2}deg)"
/>
```

Slots:
[REPL](https://svelte.dev/repl/848b525661094ac7b45e6a5f3d1206a5?version=3.58.0)
```svelte
<script>
	import m, { slot } from 'svelte-micro-components';

	const Box = m`
		<div class="box">
			${slot()}
		</div>
	`;
</script>

<Box>
	<h2>Hello!</h2>
	<p>This is a box. It can contain anything.</p>
</Box>
```

Named slots:
[REPL](https://svelte.dev/repl/b18dfb2c26c641c8b861b61a28fce7a4?version=3.58.0)
```svelte
<script>
	import m, { slot } from 'svelte-micro-components';

	const ContactCard = m`
        <article class="contact-card">
            <h2>
                ${slot('name')}
            </h2>

            <div class="address">
                ${slot('address')}
            </div>

            <div class="email">
                ${slot('email')}
            </div>
        </article>
    `;
</script>

<ContactCard>
	<span slot="name"> P. Sherman </span>

	<span slot="address">
		42 Wallaby Way<br />
		Sydney
	</span>
</ContactCard>
```

Modal:
[REPL](https://svelte.dev/repl/4cb5fb9f668e423cb770e700b9109ef9?version=3.58.0)
```svelte
<script>
    let showModal = false;
    
    function dialogShow(node) {
        return {
            update(showModal) {
                if (showModal) node.showModal();
                else node.close();
            }
        }
    }
    
    import m, { slot, on, use } from "svelte-micro-components";
    
    const Modal = m`
        <dialog
            ${on`${"close"}`}
            ${on`${"click"}`}
            ${use`${dialogShow}=${"showmodal"}`}
        >
            <div ${on`${"click"}=${'divClick'}`}>
                ${slot("header")}
                <hr />
                ${slot()}
                <hr />
                <!-- svelte-ignore a11y-autofocus -->
                <button autofocus ${on`${"click"}`}>close modal</button>
            </div>
        </dialog>
    `;
    
    function hide() { showModal = false }
    function show() { showModal = true }
    function stopPropagation(e) { e.stopPropagation(); }
</script>

<button on:click={show}>
    show modal
</button>

<Modal on:close={hide} on:click={hide} on:divClick={stopPropagation} showmodal={showModal}>
    <h2 slot="header">
        modal
        <small><em>adjective</em> mod·al \ˈmō-dəl\</small>
    </h2>

    <ol class="definition-list">
        <li>of or relating to modality in logic</li>
        <li>
            containing provisions as to the mode of procedure or the manner of taking effect —used of a contract or legacy
        </li>
        <li>of or relating to a musical mode</li>
        <li>of or relating to structure as opposed to substance</li>
        <li>of, relating to, or constituting a grammatical form or category characteristically indicating predication</li>
        <li>of or relating to a statistical mode</li>
    </ol>

    <a href="https://www.merriam-webster.com/dictionary/modal">merriam-webster.com</a>
</Modal>
```