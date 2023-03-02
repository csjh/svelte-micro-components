<script lang="ts">
	import 'mvp.css';
	import m from '$lib';

	const Header = m`
    <header>
        <h1>Svelte Micro Components</h1>
        <p>For components who aren't worth their own file</p>
        <code>npm install svelte-micro-components</code>
        <p class=${'myClass'}>${'random'}</p>
    </header>
    `;

	let random = Math.random().toString();
	setInterval(() => (random = Math.random().toString()), 100);

	let myClass = Math.random().toString();
	setInterval(() => (myClass = Math.random().toString()), 100);
</script>

<Header {random} myClass={`123 and ${myClass}`} />
<main>
	<hr />
	<section />
</main>
