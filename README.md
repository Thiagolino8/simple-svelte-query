# simple-svelte-query

Query/cache library for Svelte 5 inspired by TanStack Query, with one intentional architectural decision:

- similarity: hierarchical keys, stale time, invalidation by key/prefix
- difference: it caches the `Promise` itself, not only the resolved value

This reduces boilerplate in flows that use native Svelte `await`, while keeping async semantics explicit.

## Installation

```sh
bun add simple-svelte-query
```

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

<ul>
	{#each (await productsQuery).items as item}
		<li>{item.name}</li>
	{/each}
</ul>
```

## API

### `new QueryClient(defaultStaleTime?)`

- defines the global default `staleTime` (ms)

### `createQuery(() => options)`

- creates a reactive query
- returns a `PromiseLike<T>` object with `queryKey`
- uses `hydratable` internally for SSR/hydration

### `fetchQuery(options)`

- fetches and populates cache
- respects `staleTime` (refetch only when stale)

### `ensureQuery(options)`

- ensures a cache entry without checking staleness

### `setQuery(queryKey, value)`

- injects a synchronous value into cache, wrapped with `Promise.resolve(value)`

### `getQuery(queryKey)`

- returns the cached `Promise` (or `undefined`)

### `invalidateQuery(queryKey)`

- exact invalidation by key

### `invalidateQueries(prefix?)`

- prefix-based invalidation; with no args invalidates everything

### `clear()`

- clears all cached queries

## Code examples

### `createQuery` (reactive)

```ts
const productsQuery = queryClient.createQuery(() => ({
	queryKey: ['products', filters],
	queryFn: ({ signal }) => fetchProducts(filters, signal)
}));

const products = await productsQuery;
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

{#each (await productsQuery).items as item}
	<div>{item.name}</div>
{/each}
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
