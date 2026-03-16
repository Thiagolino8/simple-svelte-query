# simple-svelte-query

Query/cache library for Svelte 5 inspired by TanStack Query, with one intentional architectural decision:

- similarity: hierarchical keys, stale time, invalidation by key/prefix
- difference: it caches the `Promise` itself, not only the resolved value

This reduces boilerplate in flows that use native Svelte `await`, while keeping async semantics explicit.

## Installation

```sh
bun add simple-svelte-query
npm install simple-svelte-query
pnpm add simple-svelte-query
yarn add simple-svelte-query
```

## Requirements

- Svelte 5
- For direct `await` expressions in `<script>`/markup, enable `compilerOptions.experimental.async = true`
- Without async mode, consume queries with `{#await query}` instead

## Quick start

```ts
import { QueryClient } from 'simple-svelte-query';

const queryClient = new QueryClient();
```

```svelte
<script lang="ts">
	import { QueryClient } from 'simple-svelte-query';

	const queryClient = new QueryClient();
	let search = $state('phone');

	const productsQuery = queryClient.createQuery(() => ({
		queryKey: ['products', search],
		queryFn: ({ signal }) =>
			fetch(`/api/products?q=${encodeURIComponent(search)}`, { signal }).then((r) => r.json())
	}));
</script>

<ul style:opacity={productsQuery.pending ? 0.4 : 1}>
	{#each (await productsQuery).items as item}
		<li>{item.name}</li>
	{/each}
</ul>
```

## API

Detailed reference: `docs/API.md`.

### Public exports

- `QueryClient`
- `queryOptions`

### `new QueryClient(options?)`

- `options.staleTime?`: defines the default `staleTime` (ms)
- `options.hashKey?`: function to hash `queryKey` into internal string key (default `JSON.stringify`)
- `options.persist?`: optional persistence config
- `options.persist.persister`: required when `persist` exists; must implement `get`, `set`, `del`, `clear`
- `options.persist.hydrate?`: `(value) => Promise<value>` transformation before using persisted values
- `options.persist.dehydrate?`: `(queryKey, value) => persistedValue | undefined`; when it returns `undefined`, nothing is saved
- expected shape:

```ts
new QueryClient({
	persist: {
		persister,
		hydrate,
		dehydrate
	}
});
```

- `staleTime` and `hashKey` are instance defaults scoped to that `QueryClient`

### `createQuery(() => options)`

- creates a reactive query
- returns a `PromiseLike<T>` object with `queryKey` and `pending`
- uses `hydratable` internally for SSR/hydration
- works with `{#await query}` everywhere, or with direct `await query` when Svelte async mode is enabled

### `fetchQuery(options)`

- fetches and populates cache
- respects `staleTime` (refetch only when stale)

### `ensureQuery(options)`

- ensures a cache entry without checking staleness

### `setQuery(queryKey, value)`

- injects a value or `Promise` into cache, wrapped with `Promise.resolve(value)`

### `removeQuery(queryKey)`

- removes one cache entry using the original `queryKey`
- works with custom `hashKey`, because the client computes the internal cache key for you

### `getQuery(queryKey)`

- returns the cached `Promise` (or `undefined`)

### `invalidateQuery(queryKey)`

- exact invalidation by key

### `invalidateQueries(prefix?)`

- prefix-based invalidation; with no args invalidates everything
- works with custom `hashKey` because prefixes are tracked per cached entry

### `clear()`

- clears all cached queries

### `queryOptions(options)`

- identity helper to preserve `queryKey` literal types and propagate them to `queryFn`

## Code examples

### `createQuery` (reactive)

```ts
const productsQuery = queryClient.createQuery(() => ({
	queryKey: ['products', filters],
	queryFn: ({ signal }) => fetchProducts(filters, signal)
}));

// useful for dimming stale data while the next key settles
const style = productsQuery.pending ? 0.4 : 1;

const products = await productsQuery;
```

### `queryOptions` (typed options helper)

```ts
const userQueryOptions = queryOptions({
	queryKey: ['user', userId] as const,
	queryFn: ({ queryKey: [, id], signal }) =>
		fetch(`/api/users/${id}`, { signal }).then((r) => r.json())
});

const user = await queryClient.fetchQuery(userQueryOptions);
```

### `fetchQuery` (imperative)

```ts
const user = await queryClient.fetchQuery({
	queryKey: ['user', userId],
	queryFn: ({ signal }) => fetch(`/api/users/${userId}`, { signal }).then((r) => r.json())
});
```

### `ensureQuery` (does not revalidate staleness)

```ts
const postsPromise = queryClient.ensureQuery({
	queryKey: ['posts', userId],
	queryFn: ({ signal }) => fetch(`/api/posts?user=${userId}`, { signal }).then((r) => r.json())
});

const posts = await postsPromise;
```

### `setQuery` + `getQuery` (seed/optimistic cache)

```ts
queryClient.setQuery(['user', userId], { id: userId, name: 'Optimistic name' });
queryClient.setQuery(['user', userId], Promise.resolve({ id: userId, name: 'From promise' }));

const cachedUser = await queryClient.getQuery<{ id: string; name: string }>(['user', userId]);
```

### `clear` (drop all cached queries)

```ts
queryClient.clear();
```

### Invalidation by exact key and by prefix

```ts
queryClient.invalidateQuery(['user', userId]); // exact
queryClient.invalidateQueries(['users']); // all keys starting with ['users', ...]
queryClient.invalidateQueries(); // all
```

### `createQuery` with reactive key switching

```svelte
<script lang="ts">
	import { QueryClient } from 'simple-svelte-query';

	const queryClient = new QueryClient();
	let category = $state('smartphones');

	const productsQuery = queryClient.createQuery(() => ({
		queryKey: ['products', category],
		queryFn: ({ signal }) =>
			fetch(`/api/products?category=${category}`, { signal }).then((r) => r.json())
	}));
</script>

<button onclick={() => (category = 'laptops')}>Switch category</button>

<div style:opacity={productsQuery.pending ? 0.4 : 1}>
	{#each (await productsQuery).items as item}
		<div>{item.name}</div>
	{/each}
</div>
```

## Similarities and differences vs TanStack Query

### Similarities

- hierarchical `queryKey` model
- precise and batch invalidation
- `staleTime`
- cancellation support via `AbortSignal`

### Intentional differences

- no `useQuery`, no large state object (`isFetching`, `status`, etc)
- direct consumption through `await` in component/script
- promise-first cache, useful for async composition and predictable concurrent behavior

## Scripts

```sh
bun run dev
bun run check
bun run lint
bun run test
bun run build
```

## Publishing

```sh
bun run prepack
npm publish
```

## Links

- X: https://x.com/Thiagolinog
- Bluesky: https://bsky.app/profile/thiagolino8.bsky.social
- LinkedIn: https://www.linkedin.com/in/thiago-lino-gomes-5812581bb
- GitHub: https://github.com/Thiagolino8/simple-svelte-query
- npm package: https://www.npmjs.com/package/simple-svelte-query

## License

MIT
