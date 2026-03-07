<script lang="ts">
	import CodeBlock from '$lib/CodeBlock.svelte';

	const createQueryExample = String.raw`<script lang="ts">
const productsQuery = queryClient.createQuery(() => ({
  queryKey: ['products', filters],
  queryFn: ({ signal, queryKey: [, currentFilters] }) => fetchProducts(currentFilters, signal)
}));
${'</' + 'script>'}

<ul style:opacity={productsQuery.pending ? 0.4 : 1}>
  {#each (await productsQuery).items as item (item.name)}
    <li>{item.name}</li>
  {/each}
</ul>`;

	const fetchQueryExample = String.raw`const user = await queryClient.fetchQuery({
  queryKey: ['user', userId],
  queryFn: ({ signal, queryKey: [, id] }) => fetchUser(id, signal)
});`;

	const ensureQueryExample = String.raw`const postsPromise = queryClient.ensureQuery({
  queryKey: ['posts', userId],
  queryFn: ({ signal, queryKey: [, id] }) => fetchPosts(id, signal)
});`;

	const setQueryExample = String.raw`queryClient.setQuery(['user', userId], {
  id: userId,
  name: 'Optimistic value'
});`;

	const getQueryExample = String.raw`const cached = await queryClient.getQuery<{ id: string; name: string }>([
  'user',
  userId
]);`;

	const invalidateExample = String.raw`queryClient.invalidateQuery(['user', userId]);
queryClient.invalidateQueries(['users']);
queryClient.invalidateQueries();`;

	const clearExample = String.raw`queryClient.clear();`;

	const queryExample = String.raw`const query = new Query({
  queryKey: ['user', userId] as const,
  queryFn: ({ signal, queryKey: [, id] }) => fetchUser(id, signal)
});

query.key; // hashed cache key
await query.fetch(['user', userId] as const);`;

	const queryOptionsExample = String.raw`const userQuery = queryOptions({
  queryKey: ['user', userId] as const,
  queryFn: ({ queryKey: [, id], signal }) => fetchUser(id, signal)
});

const user = await queryClient.fetchQuery(userQuery);`;

	const removeQueryExample = String.raw`const query = new Query({
  queryKey: ['user', userId],
  queryFn: ({ signal }) => fetchUser(userId, signal)
});

queryClient.removeQuery(query);`;
</script>

<svelte:head>
	<title>simple-svelte-query | API</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<h1>API Reference</h1>
		<p>Primary class: <code>QueryClient</code></p>
		<p>
			Use <code>&#123;#await&#125;</code> with queries everywhere, or direct <code>await</code>
			when Svelte async mode is enabled.
		</p>
	</header>

	<div class="card methods">
		<article class="method">
			<h2><code>new Query(options)</code></h2>
			<ul>
				<li><code>key</code>: hashed cache key</li>
				<li>
					<code>fetch(queryKey, signal?)</code>: runs the query function with
					<code>{`{ signal, queryKey }`}</code>
				</li>
				<li>
					<code>isStale(lastUpdated)</code>: compares an entry timestamp against
					<code>staleTime</code>
				</li>
			</ul>
			<CodeBlock code={queryExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>new QueryClient(options?)</code></h2>
			<ul>
				<li><code>staleTime</code>: default stale time in milliseconds</li>
				<li><code>hashKey</code>: optional key hasher (default <code>JSON.stringify</code>)</li>
				<li>
					<code>persist</code>: optional; requires a <code>persister</code> with
					<code>get/set/del/clear</code>
				</li>
				<li>
					<code>persist.hydrate</code>: optional function that receives persisted value and returns
					a Promise
				</li>
				<li>
					<code>persist.dehydrate</code>: optional function receiving
					<code>queryKey</code> and resolved query value; returning
					<code>undefined</code> skips save
				</li>
				<li>
					<code>staleTime</code> and <code>hashKey</code> become static defaults for new queries
				</li>
				<li>
					custom <code>hashKey</code> should preserve prefixes if you want
					<code>invalidateQueries</code>
				</li>
			</ul>
		</article>

		<article class="method">
			<h2><code>createQuery(() => options)</code></h2>
			<ul>
				<li>
					Creates a reactive query returning a <code>PromiseLike&lt;T&gt;</code> with
					<code>queryKey</code> and <code>pending</code>
				</li>
				<li>Tracks key changes from reactive state and updates cache automatically</li>
				<li>Uses <code>hydratable</code> internally for SSR and hydration reuse</li>
			</ul>
			<CodeBlock code={createQueryExample} lang="svelte" />
		</article>

		<article class="method">
			<h2><code>fetchQuery(options)</code></h2>
			<ul>
				<li>Fetches data and populates cache</li>
				<li>Refetches only when stale or missing</li>
			</ul>
			<CodeBlock code={fetchQueryExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>ensureQuery(options)</code></h2>
			<ul>
				<li>Ensures a cache entry exists without checking staleness</li>
			</ul>
			<CodeBlock code={ensureQueryExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>setQuery(queryKey, value)</code></h2>
			<ul>
				<li>Seeds cache with either a plain value or a Promise</li>
			</ul>
			<CodeBlock code={setQueryExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>getQuery(queryKey)</code></h2>
			<ul>
				<li>Returns the cached Promise, or <code>undefined</code> if not present</li>
			</ul>
			<CodeBlock code={getQueryExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>removeQuery(query)</code></h2>
			<ul>
				<li>Removes a single cache entry using a constructed <code>Query</code> instance</li>
			</ul>
			<CodeBlock code={removeQueryExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>invalidateQuery(queryKey)</code></h2>
			<ul>
				<li>Exact invalidation by key</li>
			</ul>
			<h2><code>invalidateQueries(prefix?)</code></h2>
			<ul>
				<li>Prefix-based invalidation; omit argument to invalidate everything</li>
			</ul>
			<CodeBlock code={invalidateExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>clear()</code></h2>
			<ul>
				<li>Clears the entire in-memory query cache</li>
			</ul>
			<CodeBlock code={clearExample} lang="typescript" />
		</article>

		<article class="method">
			<h2><code>queryOptions(options)</code></h2>
			<ul>
				<li>
					Preserves literal <code>queryKey</code> types and propagates them into
					<code>queryFn</code>
				</li>
			</ul>
			<CodeBlock code={queryOptionsExample} lang="typescript" />
		</article>
	</div>
</div>

<style>
	.methods {
		padding: 0;
	}

	.method {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.method:last-child {
		border-bottom: none;
	}

	.method h2 {
		margin-bottom: 0.5rem;
	}

	.method h2 code {
		font-size: 0.95em;
		background: none;
		border: none;
		padding: 0;
		color: var(--text);
	}

	.method ul {
		padding-left: 1.2rem;
		margin-bottom: 0;
	}

	.method :global(pre) {
		margin-top: 0.75rem;
	}
</style>
