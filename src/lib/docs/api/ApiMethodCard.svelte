<script lang="ts">
	import type { Snippet } from 'svelte';
	import CodeBlock from '$lib/CodeBlock.svelte';

	type Props = {
		title: string;
		code?: string;
		lang?: string;
		children: Snippet;
	};

	let { title, code, lang = 'typescript', children }: Props = $props();
</script>

<article class="method">
	<h2><code>{title}</code></h2>
	<div class="content">
		{@render children()}
	</div>
	{#if code}
		<div class="code">
			<CodeBlock {code} {lang} />
		</div>
	{/if}
</article>

<style>
	.method {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.method:last-child {
		border-bottom: none;
	}

	.method h2 {
		font-size: 1.12rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin-bottom: 0.5rem;
	}

	.method h2 code {
		font-family: var(--font-mono);
		font-size: 0.95em;
		background: none;
		border: none;
		padding: 0;
		color: var(--text);
	}

	.code {
		margin-top: 0.75rem;
	}
</style>
