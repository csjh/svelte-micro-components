<script lang="ts">
	import 'mvp.css';
	import m, { on, use } from '$lib';
    import type { Action } from 'svelte/action';

    const colorNode: Action<HTMLDivElement, string> = (node, color = "blue") => {
        node.style.color = color;

        return {
            update(newColor) {
                node.style.color = newColor;
            },
            destroy() {
                node.style.color = "";
            }
        }
    }

	const Header = m`
        <header>
            <h1>Svelte Micro Components</h1>
            <p>For components who aren't worth their own file</p>
            <code ${use`${colorNode}=${"myColor"}`} ${on`${'click'}`}>${'random'} svelte-micro-components</code>
            <p></p>
        </header>
    `;

	let random = Math.random().toString();
	setInterval(() => (random = Math.random().toString()), 100);

	let myClass = Math.random().toString();
	setInterval(() => (myClass = Math.random().toString()), 100);

    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white", "gray"];
    let myColor = colors[Math.floor(Math.random() * colors.length)];
    setInterval(() => (myColor = colors[Math.floor(Math.random() * colors.length)]), 100);
</script>

<Header {random} on:click={(e) => console.log(e)} {myColor} />

<main>
	<hr />
	<section />
</main>
