<script lang="ts">
	import { resolve } from '$app/paths';

	const quickExample = `import { QueryClient } from 'simple-svelte-query';

const queryClient = new QueryClient();
let search = $state('phone');

const productsQuery = queryClient.createQuery(() => ({
  queryKey: ['products', search],
  queryFn: ({ signal }) =>
    fetch('/api/products?q=' + search, { signal })
      .then((r) => r.json())
}));

const products = await productsQuery;`;
</script>

<svelte:head>
	<title>simple-svelte-query</title>
	<meta name="description" content="Promise-first query cache for Svelte 5" />
</svelte:head>

<div class="hero">
	<div class="hero-glow"></div>
	<span class="badge">Svelte 5</span>
	<h1>simple-svelte-query</h1>
	<p class="subtitle">
		A query cache that stores <strong>Promises</strong>, not snapshots.
		<br />
		Native <code>await</code> flows, zero boilerplate.
	</p>
	<div class="actions">
		<div class="install">
			<span class="prompt">$</span>
			<code>bun add simple-svelte-query</code>
		</div>
		<a class="cta" href={resolve('/api')}>Read the docs <span class="arrow">→</span></a>
	</div>
</div>

<section class="features">
	<div class="feature">
		<span class="num">01</span>
		<h3>Promise cache</h3>
		<p>
			Stores the Promise itself. Compose with <code>await</code>, get predictable concurrent
			behavior.
		</p>
	</div>
	<div class="feature">
		<span class="num">02</span>
		<h3>Hierarchical keys</h3>
		<p>Precise invalidation by exact key or broad invalidation by prefix. Familiar model.</p>
	</div>
	<div class="feature">
		<span class="num">03</span>
		<h3>AbortSignal</h3>
		<p>Cancellation support passed directly to your query function. Aligned with fetch.</p>
	</div>
</section>

<section class="example-section">
	<h2>Quick start</h2>
	<pre><code>{quickExample}</code></pre>
</section>

<section class="links-section">
	<h2>Links</h2>
	<div class="links-grid">
		<a href="https://www.npmjs.com/package/simple-svelte-query" target="_blank" rel="noreferrer"
			>npm package</a
		>
		<a href="https://github.com/thiagolino8" target="_blank" rel="noreferrer">GitHub</a>
		<a
			href="https://www.linkedin.com/in/thiago-lino-gomes-5812581bb"
			target="_blank"
			rel="noreferrer">LinkedIn</a
		>
		<a href="https://x.com/Thiagolinog" target="_blank" rel="noreferrer">X</a>
		<a href="https://bsky.app/profile/thiagolino8.bsky.social" target="_blank" rel="noreferrer"
			>Bluesky</a
		>
	</div>
</section>

<style>
	.hero {
		position: relative;
		text-align: center;
		padding: 4.5rem 0 3.5rem;
	}

	.hero-glow {
		position: absolute;
		top: -80px;
		left: 50%;
		transform: translateX(-50%);
		width: 700px;
		height: 350px;
		background: radial-gradient(ellipse, rgba(255, 106, 61, 0.06) 0%, transparent 70%);
		pointer-events: none;
	}

	.badge {
		display: inline-block;
		font-size: 0.76rem;
		font-weight: 500;
		padding: 0.2rem 0.55rem;
		border-radius: 99px;
		background: var(--accent-dim);
		color: var(--accent);
		border: 1px solid rgba(255, 106, 61, 0.18);
		margin-bottom: 1.2rem;
	}

	h1 {
		font-size: 3.2rem;
		font-weight: 700;
		letter-spacing: -0.045em;
		line-height: 1.1;
		background: linear-gradient(135deg, #fff 25%, var(--accent) 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		max-width: 460px;
		margin: 1rem auto 1.8rem;
		color: var(--text-2);
		font-size: 1.06rem;
		line-height: 1.65;
	}

	.subtitle strong {
		color: var(--text);
		font-weight: 550;
	}

	.subtitle code {
		padding: 0.1rem 0.3rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.85em;
		color: #c9cdd6;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.install {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1rem;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.84rem;
	}

	.install code {
		color: #b8bcc6;
	}

	.prompt {
		color: var(--accent);
		user-select: none;
		font-family: var(--font-mono);
	}

	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.55rem 1rem;
		background: var(--accent);
		color: #fff;
		font-size: 0.86rem;
		font-weight: 550;
		border-radius: 8px;
		text-decoration: none;
		transition: background 150ms;
	}

	.cta:hover {
		background: var(--accent-hover);
	}

	.arrow {
		transition: transform 150ms;
		display: inline-block;
	}

	.cta:hover .arrow {
		transform: translateX(2px);
	}

	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.feature {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.3rem;
		transition: border-color 200ms;
		animation: fadeUp 450ms ease both;
	}

	.feature:nth-child(2) {
		animation-delay: 80ms;
	}

	.feature:nth-child(3) {
		animation-delay: 160ms;
	}

	.feature:hover {
		border-color: var(--border-hover);
	}

	.num {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--accent);
		font-weight: 500;
	}

	.feature h3 {
		margin: 0.45rem 0 0.3rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.feature p {
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.55;
	}

	.feature p code {
		padding: 0.08rem 0.25rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.85em;
		color: #c9cdd6;
	}

	.example-section {
		margin-top: 2rem;
	}

	.example-section h2 {
		font-size: 1.15rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		letter-spacing: -0.01em;
	}

	.links-section {
		margin-top: 1.2rem;
	}

	.links-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.links-grid a {
		display: inline-flex;
		text-decoration: none;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-2);
		font-size: 0.82rem;
		transition:
			border-color 150ms,
			color 150ms;
	}

	.links-grid a:hover {
		border-color: var(--border-hover);
		color: var(--text);
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 3rem 0 2.5rem;
		}

		h1 {
			font-size: 2.4rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 2rem;
		}

		.actions {
			flex-direction: column;
		}

		.install,
		.cta {
			width: 100%;
			justify-content: center;
		}
	}
</style>
