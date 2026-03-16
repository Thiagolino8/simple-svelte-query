<script lang="ts">
	import { resolve } from '$app/paths';
	import InstallTabs from '$lib/InstallTabs.svelte';
</script>

<div class="hero">
	<div class="hero-glow"></div>
	<span class="badge">Svelte 5</span>
	<h1>simple-svelte-query</h1>
	<p class="subtitle">
		A query cache that stores <strong>Promises</strong>, not snapshots.
		<br />
		Native <code>await</code> flows, zero boilerplate.
	</p>
	<div class="hero-panels">
		<section class="install-panel">
			<div class="panel-copy">
				<span class="panel-label">Install</span>
				<p>Pick your package manager and copy the command.</p>
			</div>
			<div class="install-tabs-wrap">
				<InstallTabs packageName="simple-svelte-query" />
			</div>
		</section>

		<section class="docs-panel">
			<div class="panel-copy">
				<span class="panel-label">Documentation</span>
				<p>Go straight to the API reference and examples.</p>
			</div>
			<a class="cta" href={resolve('/api')}>Read the docs <span class="arrow">→</span></a>
		</section>
	</div>
</div>

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

	.hero-panels {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 0.9fr);
		align-items: stretch;
		gap: 1rem;
		width: min(100%, 52rem);
		margin: 0 auto;
	}

	.install-panel,
	.docs-panel {
		display: grid;
		gap: 0.8rem;
		padding: 1rem;
		background: linear-gradient(180deg, rgba(16, 16, 20, 0.92), rgba(10, 10, 13, 0.92));
		border: 1px solid var(--border);
		border-radius: 16px;
		text-align: left;
	}

	.docs-panel {
		align-content: space-between;
	}

	.panel-copy {
		display: grid;
		gap: 0.3rem;
	}

	.panel-label {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.panel-copy p {
		margin: 0;
		color: var(--text-2);
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.8rem 1rem;
		background: var(--accent);
		color: #fff;
		font-size: 0.86rem;
		font-weight: 550;
		border-radius: 12px;
		text-decoration: none;
		transition:
			background 150ms,
			transform 150ms;
	}

	.cta:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.arrow {
		transition: transform 150ms;
		display: inline-block;
	}

	.cta:hover .arrow {
		transform: translateX(2px);
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

		.hero-panels {
			grid-template-columns: 1fr;
		}

		.install-tabs-wrap,
		.docs-panel,
		.cta {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 2rem;
		}

		.hero {
			padding-top: 2.4rem;
		}
	}
</style>
