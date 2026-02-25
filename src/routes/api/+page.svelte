<script lang="ts">
	import { hl } from '../../lib/highlight.ts';

	const createQueryExample = String.raw`const productsQuery = queryClient.createQuery(() => ({
  queryKey: ['products', filters],
  queryFn: ({ signal }) => fetchProducts(filters, signal)
}));

const products = await productsQuery;`;

	const fetchQueryExample = String.raw`const user = await queryClient.fetchQuery({
  queryKey: ['user', userId],
  queryFn: ({ signal }) => fetchUser(userId, signal)
});`;

	const ensureQueryExample = String.raw`const postsPromise = queryClient.ensureQuery({
  queryKey: ['posts', userId],
  queryFn: ({ signal }) => fetchPosts(userId, signal)
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
</script>

<svelte:head>
	<title>simple-svelte-query | API</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<h1>API Reference</h1>
		<p>Primary class: <code>QueryClient</code></p>
	</header>

	<div class="card methods">
		<article class="method">
			<h2><code>new QueryClient(defaultStaleTime?)</code></h2>
			<ul>
				<li>Sets the global default stale time in milliseconds</li>
				<li>Used by newly created queries when no per-query staleTime is provided</li>
			</ul>
		</article>

		<article class="method">
			<h2><code>createQuery(() => options)</code></h2>
			<ul>
				<li>
					Creates a reactive query returning a <code>PromiseLike&lt;T&gt;</code> with
					<code>queryKey</code>
				</li>
				<li>Tracks key changes from reactive state and updates cache automatically</li>
			</ul>
			<pre><code>{@html hl(createQueryExample)}</code></pre>
		</article>

		<article class="method">
			<h2><code>fetchQuery(options)</code></h2>
			<ul>
				<li>Fetches data and populates cache</li>
				<li>Refetches only when stale or missing</li>
			</ul>
			<pre><code>{@html hl(fetchQueryExample)}</code></pre>
		</article>

		<article class="method">
			<h2><code>ensureQuery(options)</code></h2>
			<ul>
				<li>Ensures a cache entry exists without checking staleness</li>
			</ul>
			<pre><code>{@html hl(ensureQueryExample)}</code></pre>
		</article>

		<article class="method">
			<h2><code>setQuery(queryKey, value)</code></h2>
			<ul>
				<li>Seeds cache with a synchronous value wrapped as a resolved Promise</li>
			</ul>
			<pre><code>{@html hl(setQueryExample)}</code></pre>
		</article>

		<article class="method">
			<h2><code>getQuery(queryKey)</code></h2>
			<ul>
				<li>Returns the cached Promise, or <code>undefined</code> if not present</li>
			</ul>
			<pre><code>{@html hl(getQueryExample)}</code></pre>
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
			<pre><code>{@html hl(invalidateExample)}</code></pre>
		</article>

		<article class="method">
			<h2><code>clear()</code></h2>
			<ul>
				<li>Clears the entire in-memory query cache</li>
			</ul>
			<pre><code>{@html hl(clearExample)}</code></pre>
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

	.method pre {
		margin-top: 0.75rem;
	}
</style>
