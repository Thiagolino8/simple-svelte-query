<script lang="ts">
	import ExampleCard from './ExampleCard.svelte';
	import { exampleQueryClient } from './example-query-client.ts';

	type Product = { id: number; title: string; price: number };

	let search = $state('phone');

	const productsQuery = exampleQueryClient.createQuery(() => ({
		queryKey: ['products', search],
		queryFn: ({
			signal,
			queryKey
		}: {
			signal?: AbortSignal;
			queryKey: readonly [string, string];
		}) =>
			fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(queryKey[1])}`, {
				signal
			}).then((res) => res.json() as Promise<{ products: Product[] }>)
	}));

	const searchCode = String.raw`<script lang="ts">
let search = $state('phone');

const productsQuery = queryClient.createQuery(() => ({
  queryKey: ['products', search],
  queryFn: ({ signal }) =>
    fetch('/api/products?q=' + encodeURIComponent(search), { signal })
      .then((r) => r.json())
}));

const invalidateExact = () => queryClient.invalidateQuery(['products', search]);
const invalidateAll = () => queryClient.invalidateQueries(['products']);
${'</' + 'script>'}

<ul class="results" style:opacity={productsQuery.pending ? 0.4 : 1}>
  {#each (await productsQuery).products as product (product.id)}
    <li>{product.title}</li>
  {/each}
</ul>

<button onclick={invalidateExact}>Invalidate exact key</button>
<button onclick={invalidateAll}>Invalidate all products/*</button>`;

	const invalidateExact = () => exampleQueryClient.invalidateQuery(['products', search]);
	const invalidateAll = () => exampleQueryClient.invalidateQueries(['products']);
</script>

{#snippet summary()}
	<p class="summary-text">
		<code>createQuery</code> with reactive keys; the code example shows how to surface
		<code>pending</code> in the UI.
	</p>
{/snippet}

<ExampleCard title="Reactive Search" code={searchCode} codeLang="svelte" {summary}>
	<label class="field">
		<span>Search product</span>
		<input type="text" bind:value={search} placeholder="phone, laptop, watch..." />
	</label>

	<ul class="results" data-loading={productsQuery.pending}>
		{#each (await productsQuery).products.slice(0, 6) as product (product.id)}
			<li>
				<strong>{product.title}</strong>
				<span class="mono">${product.price}</span>
			</li>
		{/each}
	</ul>

	<div class="actions">
		<button class="action ghost" onclick={invalidateExact}>Invalidate exact key</button>
		<button class="action ghost" onclick={invalidateAll}>Invalidate all products/*</button>
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

	.field {
		display: grid;
		gap: 0.3rem;
		color: var(--text-2);
		font-size: 0.86rem;
	}

	input {
		width: 100%;
		padding: 0.6rem 0.85rem;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		outline: none;
		transition: border-color 150ms;
	}

	input:focus {
		border-color: var(--accent);
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
		.actions {
			flex-direction: column;
		}

		.action {
			width: 100%;
			text-align: center;
		}
	}
</style>
