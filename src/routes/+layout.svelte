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
			{#each links as { href, label }}
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

	:global(:root) {
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

	:global(.page) {
		display: grid;
		gap: 1.5rem;
	}

	:global(.page-header) {
		margin-bottom: 0.25rem;
	}

	:global(.page-header h1) {
		font-size: 1.5rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	:global(.page-header p) {
		color: var(--text-2);
		margin-top: 0.3rem;
		line-height: 1.6;
	}

	:global(.card) {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.5rem;
	}

	:global(.card h2) {
		font-size: 1.12rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		letter-spacing: -0.01em;
	}

	:global(.card p),
	:global(.card li) {
		color: var(--text-2);
		line-height: 1.65;
	}

	:global(.card ul) {
		padding-left: 1.2rem;
	}

	:global(.card li + li) {
		margin-top: 0.25rem;
	}

	:global(pre) {
		overflow-x: auto;
		padding: 1rem 1.2rem;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 10px;
		transition: border-color 200ms;
	}

	:global(pre:hover) {
		border-color: var(--border-hover);
	}

	:global(code) {
		font-family: var(--font-mono);
		font-size: 0.82rem;
	}

	:global(p code),
	:global(li code) {
		padding: 0.12rem 0.32rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.82em;
		color: #c9cdd6;
	}

	:global(pre code) {
		color: #abb2bf;
	}

	:global(.hljs-keyword),
	:global(.hljs-selector-tag) {
		color: #c678dd;
	}

	:global(.hljs-string),
	:global(.hljs-template-tag) {
		color: #98c379;
	}

	:global(.hljs-number),
	:global(.hljs-literal) {
		color: #d19a66;
	}

	:global(.hljs-comment) {
		color: #5c6370;
		font-style: italic;
	}

	:global(.hljs-title),
	:global(.hljs-title.function_) {
		color: #61afef;
	}

	:global(.hljs-built_in) {
		color: #e5c07b;
	}

	:global(.hljs-property),
	:global(.hljs-attr) {
		color: #e06c75;
	}

	:global(.hljs-variable) {
		color: #e06c75;
	}

	:global(.hljs-params) {
		color: #abb2bf;
	}

	:global(.hljs-regexp) {
		color: #56b6c2;
	}

	:global(.hljs-meta) {
		color: #61afef;
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

		:global(.card) {
			padding: 1.2rem;
			border-radius: 12px;
		}

		:global(pre) {
			padding: 0.8rem;
			font-size: 0.82rem;
		}
	}
</style>
