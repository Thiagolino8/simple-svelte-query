<script lang="ts">
	import { QueryClient } from '../../lib/index.ts';

	const queryClient = new QueryClient(1000 * 20);

	let view1 = $state<'live' | 'code'>('live');
	let view2 = $state<'live' | 'code'>('live');
	let view3 = $state<'live' | 'code'>('live');

	// --- Example 1: Reactive Search ---
	let search = $state('phone');

	const productsQuery = queryClient.createQuery(() => ({
		queryKey: ['products', search],
		queryFn: ({ signal, queryKey }) =>
			fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(queryKey[1])}`, {
				signal
			}).then(
				(res) => res.json() as Promise<{ products: { id: number; title: string; price: number }[] }>
			)
	}));

	const searchCode = `let search = $state('phone');

const productsQuery = queryClient.createQuery(() => ({
  queryKey: ['products', search],
  queryFn: ({ signal }) =>
    fetch('/api/products?q=' + encodeURIComponent(search), { signal })
      .then((r) => r.json())
}));

// in template — direct await, no wrapper hooks
{#each (await productsQuery).products as product}
  <li>{product.title}</li>
{/each}

// exact: invalidates ['products', 'phone'] only
queryClient.invalidateQuery(['products', search]);

// prefix: invalidates every ['products', ...] entry
queryClient.invalidateQueries(['products']);`;

	// --- Example 2: Category Switching + Cache ---
	const categories = ['smartphones', 'laptops', 'fragrances', 'groceries', 'furniture'] as const;
	let category = $state<string>('smartphones');

	const categoryQuery = queryClient.createQuery(() => ({
		queryKey: ['category', category],
		queryFn: ({ signal }) =>
			fetch(`https://dummyjson.com/products/category/${category}?limit=5`, { signal }).then(
				(r) => r.json() as Promise<{ products: { id: number; title: string; price: number }[] }>
			)
	}));

	const categoryCode = `const categories = ['smartphones', 'laptops', 'fragrances', 'groceries'];
let category = $state('smartphones');

const categoryQuery = queryClient.createQuery(() => ({
  queryKey: ['category', category],
  queryFn: ({ signal }) =>
    fetch('/api/products/category/' + category, { signal })
      .then((r) => r.json())
}));

// switching \`category\` reuses cached data when not stale
category = 'laptops'; // instant if already fetched within staleTime

// prefix-invalidate all category queries to force refetch
queryClient.invalidateQueries(['category']);`;

	// --- Example 3: Prefetch on Hover ---
	let selectedUserId = $state(1);

	type User = { id: number; firstName: string; lastName: string; email: string; age: number };

	const userQuery = queryClient.createQuery(() => ({
		queryKey: ['user', selectedUserId],
		queryFn: ({ signal }) =>
			fetch(`https://dummyjson.com/users/${selectedUserId}?select=firstName,lastName,email,age`, {
				signal
			}).then((r) => r.json() as Promise<User>)
	}));

	const prefetchUser = (id: number) =>
		queryClient.fetchQuery({
			queryKey: ['user', id],
			queryFn: ({ signal }) =>
				fetch(`https://dummyjson.com/users/${id}?select=firstName,lastName,email,age`, {
					signal
				}).then((r) => r.json() as Promise<User>)
		});

	const prefetchCode = `let selectedId = $state(1);

const userQuery = queryClient.createQuery(() => ({
  queryKey: ['user', selectedId],
  queryFn: ({ signal }) =>
    fetch('/api/users/' + selectedId, { signal })
      .then((r) => r.json())
}));

// fetchQuery populates the same cache that createQuery reads from
const prefetch = (id: number) =>
  queryClient.fetchQuery({
    queryKey: ['user', id],
    queryFn: ({ signal }) =>
      fetch('/api/users/' + id, { signal })
        .then((r) => r.json())
  });

// hover: prefetch(3) → cache warm
// click: selectedId = 3 → createQuery finds cache hit → instant`;
</script>

<svelte:head>
	<title>simple-svelte-query | Examples</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<h1>Examples</h1>
		<p>Interactive demos with source. Toggle between live and code views.</p>
	</header>

	<!-- Example 1: Reactive Search -->
	<section class="card example">
		<div class="example-header">
			<div>
				<h2>Reactive Search</h2>
				<p>
					<code>createQuery</code> with reactive keys — exact vs prefix invalidation.
				</p>
			</div>
			<div class="toggle">
				<button class:active={view1 === 'live'} onclick={() => (view1 = 'live')}>Live</button>
				<button class:active={view1 === 'code'} onclick={() => (view1 = 'code')}>Code</button>
			</div>
		</div>

		{#if view1 === 'live'}
			<div class="demo">
				<label class="field">
					<span>Search product</span>
					<input type="text" bind:value={search} placeholder="phone, laptop, watch..." />
				</label>

				<ul class="results" data-loading={String(!!$effect.pending())}>
					{#each (await productsQuery).products.slice(0, 6) as product (product.id)}
						<li>
							<strong>{product.title}</strong>
							<span class="mono">${product.price}</span>
						</li>
					{/each}
				</ul>

				<div class="actions">
					<button
						class="action ghost"
						onclick={() => queryClient.invalidateQuery(['products', search])}
						>Invalidate exact key</button
					>
					<button class="action ghost" onclick={() => queryClient.invalidateQueries(['products'])}
						>Invalidate all products/*</button
					>
				</div>
			</div>
		{:else}
			<pre><code>{searchCode}</code></pre>
		{/if}
	</section>

	<!-- Example 2: Category Cache -->
	<section class="card example">
		<div class="example-header">
			<div>
				<h2>Cache + Stale Time</h2>
				<p>
					Switch tabs — cached categories load instantly within <code>staleTime</code>.
				</p>
			</div>
			<div class="toggle">
				<button class:active={view2 === 'live'} onclick={() => (view2 = 'live')}>Live</button>
				<button class:active={view2 === 'code'} onclick={() => (view2 = 'code')}>Code</button>
			</div>
		</div>

		{#if view2 === 'live'}
			<div class="demo">
				<div class="tabs">
					{#each categories as cat (cat)}
						<button class="tab" class:active={category === cat} onclick={() => (category = cat)}
							>{cat}</button
						>
					{/each}
				</div>

				<ul class="results" data-loading={String(!!$effect.pending())}>
					{#each (await categoryQuery).products.slice(0, 5) as product (product.id)}
						<li>
							<strong>{product.title}</strong>
							<span class="mono">${product.price}</span>
						</li>
					{/each}
				</ul>

				<div class="actions">
					<button class="action ghost" onclick={() => queryClient.invalidateQueries(['category'])}
						>Invalidate all categories</button
					>
				</div>
			</div>
		{:else}
			<pre><code>{categoryCode}</code></pre>
		{/if}
	</section>

	<!-- Example 3: Prefetch on Hover -->
	<section class="card example">
		<div class="example-header">
			<div>
				<h2>Prefetch on Hover</h2>
				<p>
					<code>fetchQuery</code> warms cache on hover — click loads instantly.
				</p>
			</div>
			<div class="toggle">
				<button class:active={view3 === 'live'} onclick={() => (view3 = 'live')}>Live</button>
				<button class:active={view3 === 'code'} onclick={() => (view3 = 'code')}>Code</button>
			</div>
		</div>

		{#if view3 === 'live'}
			<div class="demo">
				<div class="tabs">
					{#each Array.from({ length: 5 }, (_, i) => i + 1) as userId (userId)}
						<button
							class="tab"
							class:active={selectedUserId === userId}
							onmouseenter={() => prefetchUser(userId)}
							onclick={() => (selectedUserId = userId)}>User {userId}</button
						>
					{/each}
				</div>

				{#each [await userQuery] as user (user.id)}
					<div class="user-detail" data-loading={String(!!$effect.pending())}>
						<strong>{user.firstName} {user.lastName}</strong>
						<span>{user.email} · {user.age} years old</span>
					</div>
				{/each}

				<p class="hint">Hover a tab first, then click — compare with clicking without hovering.</p>
			</div>
		{:else}
			<pre><code>{prefetchCode}</code></pre>
		{/if}
	</section>
</div>

<style>
	.example-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.example-header h2 {
		margin-bottom: 0.2rem;
	}

	.example-header p {
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.5;
		margin: 0;
	}

	/* Toggle (Live / Code) */
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

	/* Demo content */
	.demo {
		display: grid;
		gap: 0.6rem;
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

	/* Results list */
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

	/* Action buttons */
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

	/* Tabs */
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

	/* User detail card */
	.user-detail {
		padding: 1rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: opacity 180ms ease;
	}

	.user-detail[data-loading='true'] {
		opacity: 0.4;
	}

	.user-detail strong {
		display: block;
		font-size: 1rem;
		margin-bottom: 0.2rem;
	}

	.user-detail span {
		color: var(--text-2);
		font-size: 0.86rem;
	}

	.hint {
		color: var(--text-3);
		font-size: 0.8rem;
		font-style: italic;
		margin: 0;
	}

	.example pre {
		margin: 0;
	}

	@media (max-width: 640px) {
		.example-header {
			flex-direction: column;
			gap: 0.6rem;
		}

		.actions {
			flex-direction: column;
		}

		.action {
			width: 100%;
			text-align: center;
		}

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

		.results li {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.2rem;
		}
	}
</style>
