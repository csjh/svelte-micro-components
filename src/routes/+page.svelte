<script lang="ts">
	import '../mvp.css';
	import m, { on } from '$lib';
	import { onMount } from 'svelte';

	const clickHandler = () => {
		navigator.clipboard.writeText('npm install svelte-micro-components');
	};

	const Header = m`
		<header>
			<h1>Svelte Micro Components</h1>
			<p style=${'style'}>${'header'}</p>
			<code ${on`${'click'}`}>npm install svelte-micro-components</code>
		</header>
	`;

	// @ts-ignore
	onMount(() => hljs.highlightAll());
</script>

<Header
	style={'font-style: italic'}
	header="A micro library for micro components"
	on:click={clickHandler}
/>

<main>
	<section style="text-align: center">
		<header>
			<h3>Basic text interpolation:</h3>
			<a href="https://svelte.dev/repl/5c837032b30e4322857d2ba9820baccb?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script lang="ts"&gt;
	import m from 'svelte-micro-components';

	const Greeting = m`&lt;h1&gt;Hello $&lcub;'name'&rcub;&lt;/h1&gt;`;
&lt;/script&gt;

&lt;Greeting name="world" /&gt;</code
			></pre>
	</section>

	<section>
		<header>
			<h3>Dynamic attributes:</h3>
			<a href="https://svelte.dev/repl/13e16447f48045f89af04b10a58a0974?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script lang="ts"&gt;
	import m from 'svelte-micro-components';

	const src = 'https://svelte.dev/tutorial/image.gif';
	const name = 'Rick Astley';

	const Image = m`&lt;img src=$&lcub;'src'&rcub; alt=$&lcub;'alt'&rcub;&gt;`;
&lt;/script&gt;

&lt;Image &lcub;src&rcub; alt="&lcub;name&rcub; dancing" /&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Nested Components:</h3>
			<a href="https://svelte.dev/repl/2d104d50e8af4ce29178fa2136e8d6eb?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script lang="ts"&gt;
	import m, &lcub; component &rcub; from 'svelte-micro-components';
    import Nested from './Nested.svelte';

	const Wrapper = m`&lt;div class="wrapper"&gt;$&lcub;component`&lt;$&lcub;Nested&rcub; /&gt;`&rcub;&lt;/div&gt;`;
&lt;/script&gt;

&lt;Wrapper /&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>DOM Events:</h3>
			<a href="https://svelte.dev/repl/90aae0da3ab349efbc25a9ed7910559e?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script lang="ts"&gt;
	let pos = &lcub; x: 0, y: 0 &rcub;;

	function handleMousemove(event: MouseEvent) &lcub;
		pos.x = event.clientX;
		pos.y = event.clientY;
	&rcub;

	import m, &lcub; on &rcub; from 'svelte-micro-components';

	const Tracker = m`
		&lt;div $&lcub;on`$&lcub;'mousemove'&rcub;`&rcub;&gt;
			The mouse position is $&lcub;'x'&rcub; x $&lcub;'y'&rcub;
		&lt;/div&gt;
	`;
&lt;/script&gt;

&lt;Tracker x=&lcub;pos.x&rcub; y=&lcub;pos.y&rcub; on:mousemove=&lcub;handleMousemove&rcub; /&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Event forwarding:</h3>
			<a href="https://svelte.dev/repl/8c29f13eff8e4d70b98ee8dd5db0c411?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script lang="ts"&gt;
	let pos = &lcub; x: 0, y: 0 &rcub;;

	function handleMousemove(event: MouseEvent) &lcub;
		pos.x = event.clientX;
		pos.y = event.clientY;
	&rcub;

	import m, &lcub; on &rcub; from 'svelte-micro-components';

	const Tracker = m`
		&lt;div $&lcub;on`$&lcub;'mousemove'&rcub;=$&lcub;'moved'&rcub;`&rcub;&gt;
			The mouse position is $&lcub;'x'&rcub; x $&lcub;'y'&rcub;
		&lt;/div&gt;
	`;
&lt;/script&gt;

&lt;Tracker x=&lcub;pos.x&rcub; y=&lcub;pos.y&rcub; on:moved=&lcub;handleMousemove&rcub; /&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Basic action:</h3>
			<a href="https://svelte.dev/repl/39570d0aa2e7433893d25bba2a524b09?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script context="module" lang="ts"&gt;
	import type &lcub; Action &rcub; from 'svelte/action';

	const changeColor: Action&lt;HTMLElement, string&gt; = (node, param = 'red') =&gt; &lcub;
		node.style.color = param;

		return &lcub;
			update(parameter) &lcub;
				node.style.color = parameter;
			&rcub;
		&rcub;;
	&rcub;;
&lt;/script&gt;

&lt;script lang="ts"&gt;
	import m, &lcub; on, use &rcub; from 'svelte-micro-components';

	const Box = m`
		&lt;div $&lcub;use`$&lcub;changeColor&rcub;=$&lcub;'color'&rcub;`&rcub; $&lcub;on`$&lcub;'click'&rcub;`&rcub;&gt;
			I start off as red, but when you click me I turn green.
		&lt;/div&gt;
	`;

	let color = 'rgb(255, 0, 0)';
&lt;/script&gt;

&lt;Box on:click=&lcub;() =&gt; (color = 'rgb(0, 255, 0)')&rcub; &lcub;color&rcub; /&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Parameterized action:</h3>
			<a href="https://svelte.dev/repl/05bbcba99418486692a7979b3d88e206?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script context="module" lang="ts"&gt;
	import type &lcub; Action &rcub; from 'svelte/action';

	declare const longpress: Action&lt;
		HTMLElement,
		number,
		&lcub; 'on:longpress': (e: CustomEvent) =&gt; void &rcub;
	&gt;;
&lt;/script&gt;

&lt;script lang="ts"&gt;
	import m, &lcub; on, use &rcub; from 'svelte-micro-components';

	let pressed = false;
	let duration = 2000;

	const Button = m`&lt;button
		$&lcub;use`$&lcub;longpress&rcub;=$&lcub;'duration'&rcub;`&rcub;
		$&lcub;on`$&lcub;'longpress'&rcub;`&rcub;
		$&lcub;on`$&lcub;'mouseenter'&rcub;`&rcub;
	&gt;
		press and hold
	&lt;/button&gt;`;

	const Message = m`&lt;p&gt;
		congratulations, you pressed and held for $&lcub;'duration'&rcub;ms
	&lt;/p&gt;`;
&lt;/script&gt;

&lt;label&gt;
	&lt;input type="range" bind:value=&lcub;duration&rcub; max=&lcub;2000&rcub; step=&lcub;100&rcub; /&gt;
	&lcub;duration&rcub;ms
&lt;/label&gt;

&lt;Button &lcub;duration&rcub; on:longpress=&lcub;() =&gt; (pressed = true)&rcub; on:mouseenter=&lcub;() =&gt; (pressed = false)&rcub; /&gt;

&lcub;#if pressed&rcub;
	&lt;Message &lcub;duration&rcub; /&gt;
&lcub;/if&rcub;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Complex action:</h3>
			<a href="https://svelte.dev/repl/38ee0361bb904d448414959077829f0a?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script lang="ts" context="module"&gt;
	import type &lcub; Action &rcub; from 'svelte/action';
	declare const pannable: Action&lt;
		HTMLElement,
		null,
		&lcub;
			'on:panstart': CustomEvent&lt;&lcub; x: number; y: number &rcub;&gt;;
			'on:panmove': CustomEvent&lt;&lcub; x: number; y: number; dx: number; dy: number &rcub;&gt;;
			'on:panend': CustomEvent&lt;&lcub; x: number; y: number &rcub;&gt;;
		&rcub;
	&gt;;
&lt;/script&gt;

&lt;script lang="ts"&gt;
	import &lcub; spring &rcub; from 'svelte/motion';

	const coords = spring(&lcub; x: 0, y: 0 &rcub;, &lcub; stiffness: 0.2, damping: 0.4 &rcub;);

	function handlePanStart() &lcub;
		coords.stiffness = coords.damping = 1;
	&rcub;

	function handlePanMove(event: CustomEvent&lt;&lcub; x: number; y: number; dx: number; dy: number &rcub;&gt;) &lcub;
		coords.update(($coords) =&gt; (&lcub;
			x: $coords.x + event.detail.dx,
			y: $coords.y + event.detail.dy
		&rcub;));
	&rcub;

	function handlePanEnd() &lcub;
		coords.stiffness = 0.2;
		coords.damping = 0.4;
		coords.set(&lcub; x: 0, y: 0 &rcub;);
	&rcub;

	import m, &lcub; on, use &rcub; from 'svelte-micro-components';

	const Box = m`
		&lt;div class="box"
			$&lcub;use`$&lcub;pannable&rcub;`&rcub;
			$&lcub;on`$&lcub;'panstart'&rcub;`&rcub;
			$&lcub;on`$&lcub;'panmove'&rcub;`&rcub;
			$&lcub;on`$&lcub;'panend'&rcub;`&rcub;
			style=$&lcub;'style'&rcub;
		&gt;&lt;/div&gt;
	`;
&lt;/script&gt;

&lt;Box
	on:panstart=&lcub;handlePanStart&rcub;
	on:panmove=&lcub;handlePanMove&rcub;
	on:panend=&lcub;handlePanEnd&rcub;
	style="transform:
		translate(&lcub;$coords.x&rcub;px,&lcub;$coords.y&rcub;px)
		rotate(&lcub;$coords.x * 0.2&rcub;deg)"
/&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Slots:</h3>
			<a href="https://svelte.dev/repl/848b525661094ac7b45e6a5f3d1206a5?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script&gt;
	import m, &lcub; slot &rcub; from 'svelte-micro-components';

	const Box = m`
		&lt;div class="box"&gt;
			$&lcub;slot()&rcub;
		&lt;/div&gt;
	`;
&lt;/script&gt;

&lt;Box&gt;
	&lt;h2&gt;Hello!&lt;/h2&gt;
	&lt;p&gt;This is a box. It can contain anything.&lt;/p&gt;
&lt;/Box&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Named slots:</h3>
			<a href="https://svelte.dev/repl/b18dfb2c26c641c8b861b61a28fce7a4?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script&gt;
	import m, &lcub; slot &rcub; from 'svelte-micro-components';

	const ContactCard = m`
		&lt;article class="contact-card"&gt;
			&lt;h2&gt;
				$&lcub;slot('name')&rcub;
			&lt;/h2&gt;

			&lt;div class="address"&gt;
				$&lcub;slot('address')&rcub;
			&lt;/div&gt;

			&lt;div class="email"&gt;
				$&lcub;slot('email')&rcub;
			&lt;/div&gt;
		&lt;/article&gt;
	`;
&lt;/script&gt;

&lt;ContactCard&gt;
	&lt;span slot="name"&gt; P. Sherman &lt;/span&gt;

	&lt;span slot="address"&gt;
		42 Wallaby Way&lt;br /&gt;
		Sydney
	&lt;/span&gt;
&lt;/ContactCard&gt;
</code></pre>
	</section>
	<section>
		<header>
			<h3>Modal:</h3>
			<a href="https://svelte.dev/repl/4cb5fb9f668e423cb770e700b9109ef9?version=3.58.0">REPL</a>
		</header>

		<pre><code class="language-html"
				>&lt;script&gt;
    let showModal = false;
    
    function dialogShow(node) &lcub;
        return &lcub;
            update(showModal) &lcub;
                if (showModal) node.showModal();
                else node.close();
            &rcub;
        &rcub;
    &rcub;
    
    import m, &lcub; slot, on, use &rcub; from "svelte-micro-components";
    
    const Modal = m`
        &lt;dialog
            $&lcub;on`$&lcub;"close"&rcub;`&rcub;
            $&lcub;on`$&lcub;"click"&rcub;`&rcub;
            $&lcub;use`$&lcub;dialogShow&rcub;=$&lcub;"showmodal"&rcub;`&rcub;
        &gt;
            &lt;div $&lcub;on`$&lcub;"click"&rcub;=$&lcub;'divClick'&rcub;`&rcub;&gt;
                $&lcub;slot("header")&rcub;
                &lt;hr /&gt;
                $&lcub;slot()&rcub;
                &lt;hr /&gt;
                &lt;!-- svelte-ignore a11y-autofocus --&gt;
                &lt;button autofocus $&lcub;on`$&lcub;"click"&rcub;`&rcub;&gt;close modal&lt;/button&gt;
            &lt;/div&gt;
        &lt;/dialog&gt;
    `;
    
    function hide() &lcub; showModal = false &rcub;
    function show() &lcub; showModal = true &rcub;
    function stopPropagation(e) &lcub; e.stopPropagation(); &rcub;
&lt;/script&gt;

&lt;button on:click=&lcub;show&rcub;&gt;
    show modal
&lt;/button&gt;

&lt;Modal on:close=&lcub;hide&rcub; on:click=&lcub;hide&rcub; on:divClick=&lcub;stopPropagation&rcub; showmodal=&lcub;showModal&rcub;&gt;
    &lt;h2 slot="header"&gt;
        modal
        &lt;small&gt;&lt;em&gt;adjective&lt;/em&gt; mod·al \ˈmō-dəl\&lt;/small&gt;
    &lt;/h2&gt;

    &lt;ol class="definition-list"&gt;
        &lt;li&gt;of or relating to modality in logic&lt;/li&gt;
        &lt;li&gt;
            containing provisions as to the mode of procedure or the manner of taking effect —used of a contract or legacy
        &lt;/li&gt;
        &lt;li&gt;of or relating to a musical mode&lt;/li&gt;
        &lt;li&gt;of or relating to structure as opposed to substance&lt;/li&gt;
        &lt;li&gt;of, relating to, or constituting a grammatical form or category characteristically indicating predication&lt;/li&gt;
        &lt;li&gt;of or relating to a statistical mode&lt;/li&gt;
    &lt;/ol&gt;

    &lt;a href="https://www.merriam-webster.com/dictionary/modal"&gt;merriam-webster.com&lt;/a&gt;
&lt;/Modal&gt;</code
			></pre>
	</section>
</main>
