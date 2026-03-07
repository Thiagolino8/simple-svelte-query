<script lang="ts">
	import ApiMethodCard from './ApiMethodCard.svelte';
	import {
		clearExample,
		createQueryExample,
		ensureQueryExample,
		fetchQueryExample,
		getQueryExample,
		invalidateExample,
		queryExample,
		queryOptionsExample,
		removeQueryExample,
		setQueryExample
	} from './api-snippets.ts';
</script>

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
		<ApiMethodCard title="new Query(options)" code={queryExample}>
			<ul class="method-list">
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
		</ApiMethodCard>

		<ApiMethodCard title="new QueryClient(options?)">
			<ul class="method-list">
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
		</ApiMethodCard>

		<ApiMethodCard title="createQuery(() => options)" code={createQueryExample} lang="svelte">
			<ul class="method-list">
				<li>
					Creates a reactive query returning a <code>PromiseLike&lt;T&gt;</code> with
					<code>queryKey</code> and <code>pending</code>
				</li>
				<li>Tracks key changes from reactive state and updates cache automatically</li>
				<li>Uses <code>hydratable</code> internally for SSR and hydration reuse</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="fetchQuery(options)" code={fetchQueryExample}>
			<ul class="method-list">
				<li>Fetches data and populates cache</li>
				<li>Refetches only when stale or missing</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="ensureQuery(options)" code={ensureQueryExample}>
			<ul class="method-list">
				<li>Ensures a cache entry exists without checking staleness</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="setQuery(queryKey, value)" code={setQueryExample}>
			<ul class="method-list">
				<li>Seeds cache with either a plain value or a Promise</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="getQuery(queryKey)" code={getQueryExample}>
			<ul class="method-list">
				<li>Returns the cached Promise, or <code>undefined</code> if not present</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="removeQuery(query)" code={removeQueryExample}>
			<ul class="method-list">
				<li>Removes a single cache entry using a constructed <code>Query</code> instance</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="invalidateQuery(queryKey)" code={invalidateExample}>
			<ul class="method-list">
				<li>Exact invalidation by key</li>
				<li>
					<code>invalidateQueries(prefix?)</code>: prefix-based invalidation; omit argument to
					invalidate everything
				</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="clear()" code={clearExample}>
			<ul class="method-list">
				<li>Clears the entire in-memory query cache</li>
			</ul>
		</ApiMethodCard>

		<ApiMethodCard title="queryOptions(options)" code={queryOptionsExample}>
			<ul class="method-list">
				<li>
					Preserves literal <code>queryKey</code> types and propagates them into
					<code>queryFn</code>
				</li>
			</ul>
		</ApiMethodCard>
	</div>
</div>

<style>
	.page {
		display: grid;
		gap: 1.5rem;
	}

	.page-header {
		margin-bottom: 0.25rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.page-header p {
		color: var(--text-2);
		margin-top: 0.3rem;
		line-height: 1.6;
	}

	.page-header code,
	.method-list code {
		font-family: var(--font-mono);
		padding: 0.12rem 0.32rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.82em;
		color: #c9cdd6;
	}

	.methods {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 0;
	}

	.method-list {
		padding-left: 1.2rem;
		margin-bottom: 0;
	}

	.method-list li {
		color: var(--text-2);
		line-height: 1.65;
	}

	.method-list li + li {
		margin-top: 0.25rem;
	}

	@media (max-width: 640px) {
		.methods {
			border-radius: 12px;
		}
	}
</style>
