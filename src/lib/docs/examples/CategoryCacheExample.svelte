<script lang="ts">
	import ExampleCard from './ExampleCard.svelte';
	import { exampleQueryClient } from './example-query-client.ts';

	type Product = { id: number; title: string; price: number };

	const categories = ['smartphones', 'laptops', 'fragrances', 'groceries', 'furniture'] as const;
	let category = $state<(typeof categories)[number]>('smartphones');

	const categoryQuery = exampleQueryClient.createQuery(() => ({
		queryKey: ['category', category],
		queryFn: ({
			signal
		}: {
			signal?: AbortSignal;
			queryKey: readonly [string, (typeof categories)[number]];
		}) =>
			fetch(`https://dummyjson.com/products/category/${category}?limit=5`, { signal }).then(
				(r) => r.json() as Promise<{ products: Product[] }>
			)
	}));

	const categoryCode = String.raw`const categories = ['smartphones', 'laptops', 'fragrances', 'groceries'];
let category = $state('smartphones');

const categoryQuery = queryClient.createQuery(() => ({
  queryKey: ['category', category],
  queryFn: ({ signal }) =>
    fetch('/api/products/category/' + category, { signal })
      .then((r) => r.json())
}));

// switching category reuses cached data when not stale
category = 'laptops'; // instant if already fetched within staleTime

// prefix-invalidate all category queries to force refetch
queryClient.invalidateQueries(['category']);`;

	const invalidateCategories = () => exampleQueryClient.invalidateQueries(['category']);
</script>

{#snippet summary()}
	<p class="summary-text">
		Switch tabs. Cached categories load instantly within <code>staleTime</code>.
	</p>
{/snippet}

<ExampleCard title="Cache + Stale Time" code={categoryCode} {summary}>
	<div class="tabs">
		{#each categories as currentCategory (currentCategory)}
			<button
				class="tab"
				class:active={category === currentCategory}
				onclick={() => (category = currentCategory)}>{currentCategory}</button
			>
		{/each}
	</div>

	<ul class="results" data-loading={categoryQuery.pending}>
		{#each (await categoryQuery).products.slice(0, 5) as product (product.id)}
			<li>
				<strong>{product.title}</strong>
				<span class="mono">${product.price}</span>
			</li>
		{/each}
	</ul>

	<div class="actions">
		<button class="action ghost" onclick={invalidateCategories}>Invalidate all categories</button>
	</div>
</ExampleCard>

<style>
	.summary-text {
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.5;
		margin: 0;
	}

	.summary-text code {
		font-family: var(--font-mono);
		padding: 0.12rem 0.32rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.82em;
		color: #c9cdd6;
	}

	.tabs {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.tab {
		appearance: none;
		padding: 0.4rem 0.7rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 7px;
		color: var(--text-2);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 450;
		cursor: pointer;
		transition:
			border-color 150ms,
			color 150ms,
			background 150ms;
	}

	.tab:hover {
		border-color: var(--border-hover);
		color: var(--text);
	}

	.tab.active {
		background: var(--accent-dim);
		border-color: rgba(255, 106, 61, 0.22);
		color: var(--accent);
	}

	.results {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.35rem;
		transition: opacity 180ms ease;
	}

	.results[data-loading='true'] {
		opacity: 0.4;
	}

	.results li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 0.85rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.88rem;
	}

	.results li strong {
		color: var(--text);
		font-weight: 500;
	}

	.mono {
		color: var(--text-2);
		font-family: var(--font-mono);
		font-size: 0.82rem;
	}

	.actions {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-top: 0.2rem;
	}

	.action {
		appearance: none;
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 7px;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 150ms,
			color 150ms,
			background 150ms;
	}

	.action.ghost {
		background: transparent;
		color: var(--text-2);
	}

	.action.ghost:hover {
		border-color: var(--border-hover);
		color: var(--text);
		background: var(--surface-2);
	}

	@media (max-width: 640px) {
		.tabs {
			overflow-x: auto;
			flex-wrap: nowrap;
			scrollbar-width: none;
		}

		.tabs::-webkit-scrollbar {
			display: none;
		}

		.tab {
			flex-shrink: 0;
		}

		.actions {
			flex-direction: column;
		}

		.action {
			width: 100%;
			text-align: center;
		}
	}
</style>
