<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	const { children } = $props();

	const links = [
		{ href: '/', label: 'Overview' },
		{ href: '/api', label: 'API' },
		{ href: '/examples', label: 'Examples' },
		{ href: '/comparison', label: 'Comparison' }
	] as const;
</script>

<header>
	<div class="header-inner">
		<a class="logo" href={resolve('/')}>
			<span class="mark">ssq</span>
			<span class="wordmark">simple-svelte-query</span>
		</a>
		<nav>
			{#each links as { href, label } (href)}
				<a class:active={page.url.pathname === href} href={resolve(href)}>{label}</a>
			{/each}
		</nav>
	</div>
</header>

<main>
	{@render children()}
</main>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
	}

	:root {
		--bg: #09090b;
		--surface: #111114;
		--surface-2: #19191d;
		--border: #222228;
		--border-hover: #32323a;
		--text: #e4e4e7;
		--text-2: #87878f;
		--text-3: #55555e;
		--accent: #ff6a3d;
		--accent-hover: #ff8255;
		--accent-dim: rgba(255, 106, 61, 0.08);
		--code-bg: #0c0c0e;
		--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace;
		--max-w: 920px;
	}

	:global(html) {
		scroll-behavior: smooth;
	}

	:global(::selection) {
		background: rgba(255, 106, 61, 0.25);
	}

	:global(body) {
		font-family: var(--font-sans);
		background: var(--bg);
		color: var(--text);
		line-height: 1.6;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 50;
		border-top: 2px solid var(--accent);
		background: rgba(9, 9, 11, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--border);
	}

	.header-inner {
		max-width: var(--max-w);
		margin: 0 auto;
		padding: 0 1.5rem;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: var(--text);
		font-weight: 600;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.mark {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 500;
		padding: 0.18rem 0.42rem;
		background: var(--accent-dim);
		color: var(--accent);
		border-radius: 5px;
		border: 1px solid rgba(255, 106, 61, 0.18);
		letter-spacing: 0.02em;
	}

	nav {
		display: flex;
		gap: 0.2rem;
	}

	nav a {
		text-decoration: none;
		color: var(--text-2);
		font-size: 0.86rem;
		font-weight: 450;
		padding: 0.38rem 0.68rem;
		border-radius: 6px;
		transition:
			color 150ms,
			background 150ms;
	}

	nav a:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	nav a.active {
		color: var(--accent);
		background: var(--accent-dim);
	}

	main {
		max-width: var(--max-w);
		margin: 0 auto;
		padding: 2.5rem 1.5rem 5rem;
	}

	@media (max-width: 640px) {
		.header-inner {
			padding: 0 1rem;
			height: 50px;
		}

		.wordmark {
			display: none;
		}

		nav {
			overflow-x: auto;
			scrollbar-width: none;
		}

		nav::-webkit-scrollbar {
			display: none;
		}

		nav a {
			white-space: nowrap;
			flex-shrink: 0;
			font-size: 0.84rem;
			padding: 0.35rem 0.55rem;
		}

		main {
			padding: 1.5rem 1rem 3rem;
		}
	}
</style>
