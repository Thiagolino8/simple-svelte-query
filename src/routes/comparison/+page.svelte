<script lang="ts">
	const similarities = [
		{
			aspect: 'Invalidation',
			tanstack: 'Hierarchical query keys (exact + prefix)',
			thisLib: 'Same model (exact key or prefix)',
			note: 'Familiar pattern'
		},
		{
			aspect: 'Stale time',
			tanstack: 'Configurable per query',
			thisLib: 'Configurable per query',
			note: 'Same semantics'
		},
		{
			aspect: 'Cancellation',
			tanstack: 'AbortSignal via observers / lifecycle',
			thisLib: 'AbortSignal passed directly to queryFn',
			note: 'Aligned with fetch API'
		}
	];

	const differences = [
		{
			aspect: 'Cache unit',
			tanstack: 'Resolved values + status flags (data, error, isFetching…)',
			thisLib: 'The Promise itself',
			note: 'Native async semantics, direct await composition'
		},
		{
			aspect: 'Component API',
			tanstack: 'useQuery hook returns a state object',
			thisLib: 'createQuery returns a PromiseLike — use await directly',
			note: 'No wrapper, less boilerplate'
		},
		{
			aspect: 'Mutations',
			tanstack: 'Full useMutation API with onMutate, onSuccess, onError, onSettled',
			thisLib: 'No mutation API — use setQuery for optimistic updates, invalidate after',
			note: 'Intentionally omitted; standard fetch + invalidate is enough'
		},
		{
			aspect: 'Key hashing',
			tanstack: 'Object keys in the array are sorted deterministically — { b, a } equals { a, b }',
			thisLib: "Keys are JSON.stringify'd as-is — no object key sorting",
			note: '{ b: 1, a: 2 } ≠ { a: 2, b: 1 } here; keep object shape consistent or use primitives'
		},
		{
			aspect: 'Garbage collection',
			tanstack: 'gcTime removes unused entries automatically',
			thisLib: 'No automatic GC — use clear() or invalidate manually',
			note: 'Smaller API surface, manual control'
		},
		{
			aspect: 'Devtools',
			tanstack: 'Official devtools panel',
			thisLib: 'None',
			note: 'Inspect cache via getQuery / $inspect'
		},
		{
			aspect: 'SSR / Hydration',
			tanstack: 'Dehydrate / hydrate API',
			thisLib: "Uses Svelte's hydratable() built-in",
			note: 'Zero config, native SvelteKit support'
		}
	];
</script>

<svelte:head>
	<title>simple-svelte-query | TanStack Comparison</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<h1>TanStack Query Comparison</h1>
		<p>
			The similarities are intentional for familiarity. The differences reflect a deliberate
			trade-off: smaller API, Svelte-native async, manual control where TanStack automates.
		</p>
	</header>

	<div class="card">
		<h2>Similarities</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Aspect</th>
						<th>TanStack Query</th>
						<th>simple-svelte-query</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each similarities as row (row.aspect)}
						<tr>
							<td class="aspect">{row.aspect}</td>
							<td>{row.tanstack}</td>
							<td class="ours">{row.thisLib}</td>
							<td class="note">{row.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="card">
		<h2>Differences</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Aspect</th>
						<th>TanStack Query</th>
						<th>simple-svelte-query</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each differences as row (row.aspect)}
						<tr>
							<td class="aspect">{row.aspect}</td>
							<td>{row.tanstack}</td>
							<td class="ours">{row.thisLib}</td>
							<td class="note">{row.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 720px;
	}

	th {
		text-transform: uppercase;
		font-size: 0.7rem;
		letter-spacing: 0.07em;
		color: var(--text-3);
		font-weight: 500;
		padding: 0.6rem 0.85rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	td {
		padding: 0.8rem 0.85rem;
		border-bottom: 1px solid var(--border);
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.5;
		vertical-align: top;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.aspect {
		color: var(--text);
		font-weight: 550;
		white-space: nowrap;
	}

	.card h2 {
		margin-bottom: 1rem;
	}

	.ours {
		color: var(--accent);
	}

	.note {
		font-style: italic;
		color: var(--text-3);
		font-size: 0.84rem;
	}
</style>
