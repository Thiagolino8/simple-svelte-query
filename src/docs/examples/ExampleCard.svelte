<script lang="ts">
	import type { Snippet } from 'svelte';
	import CodeBlock from '$lib/CodeBlock.svelte';

	type ViewMode = 'live' | 'code';

	type Props = {
		title: string;
		code: string;
		codeLang?: string;
		summary: Snippet;
		children: Snippet;
	};

	let { title, code, codeLang = 'typescript', summary, children }: Props = $props();
	let view = $state<ViewMode>('live');
</script>

<section class="card example">
	<div class="example-header">
		<div class="summary">
			<h2>{title}</h2>
			{@render summary()}
		</div>
		<div class="toggle">
			<button class:active={view === 'live'} onclick={() => (view = 'live')}>Live</button>
			<button class:active={view === 'code'} onclick={() => (view = 'code')}>Code</button>
		</div>
	</div>

	{#if view === 'live'}
		<div class="demo">
			{@render children()}
		</div>
	{:else}
		<div class="code">
			<CodeBlock {code} lang={codeLang} />
		</div>
	{/if}
</section>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.5rem;
	}

	.example-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.example-header h2 {
		font-size: 1.12rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin-bottom: 0.2rem;
	}

	.toggle {
		display: flex;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 7px;
		padding: 3px;
		gap: 2px;
		flex-shrink: 0;
	}

	.toggle button {
		appearance: none;
		border: none;
		background: transparent;
		padding: 0.25rem 0.55rem;
		font-family: var(--font-sans);
		font-size: 0.76rem;
		font-weight: 500;
		color: var(--text-3);
		border-radius: 5px;
		cursor: pointer;
		transition:
			color 150ms,
			background 150ms;
	}

	.toggle button:hover {
		color: var(--text-2);
	}

	.toggle button.active {
		background: var(--surface-2);
		color: var(--text);
	}

	.demo {
		display: grid;
		gap: 0.6rem;
	}

	.code {
		margin: 0;
	}

	@media (max-width: 640px) {
		.card {
			padding: 1.2rem;
			border-radius: 12px;
		}

		.example-header {
			flex-direction: column;
			gap: 0.6rem;
		}
	}
</style>
