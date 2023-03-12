<script lang="ts">
	import 'mvp.css';
	import m, { on, use } from '$lib';
	import type { Action } from 'svelte/action';

	const clickHandler = (e: MouseEvent) => {
		navigator.clipboard.writeText('npm install svelte-micro-components');
	};

	const gradient: Action<HTMLElement, [number, number, number]> = (node, val = [0, 0, 0]) => {
		const hexify = (val: number) =>
			Math.round(val % 255)
				.toString(16)
				.padStart(2, '0');
		node.style.color = `#${hexify(val[0])}${hexify(val[1])}${hexify(val[2])}`;
		return {
			update(parameter) {
				node.style.color = `#${hexify(parameter[0])}${hexify(parameter[1])}${hexify(parameter[2])}`;
			}
		};
	};

	const Header = m`
        <header>
            <h1>Svelte Micro Components</h1>
            <p style=${'style'}>${'header'}</p>
            <code ${on`${'click'}`}>npm install svelte-micro-components</code>
            <p ${use`${gradient}=${'gradient'}`}>Disco</p>
        </header>
    `;

	let rgb: [number, number, number] = [0, 0, 0];
	setInterval(() => (rgb = [Math.random() * 255, Math.random() * 255, Math.random() * 255]), 100);

	let header = "For components that aren't worth their own file";
	const headers = [
		"For components that aren't worth their own file",
		'A micro library for micro components',
		'Small, high performance components for Svelte'
	];
	setInterval(() => {
		header = headers[Math.floor(Math.random() * headers.length)];
	}, 2000);
</script>

<Header style={'font-style: italic'} {header} gradient={rgb} on:click={clickHandler} />

<main>
	<hr />
	<section />
</main>
