# API Reference

## Public exports

- `QueryClient`
- `Query`
- `queryOptions`

## Query

- `new Query(options)`
- `query.key`: hashed cache key
- `query.isStale(lastUpdated)`
- `query.fetch(queryKey, signal?)`

## QueryClient

- `new QueryClient(options?)`
- `createQuery(() => options)`
- `fetchQuery(options)`
- `ensureQuery(options)`
- `setQuery(queryKey, value)`
- `getQuery(queryKey)`
- `removeQuery(query)`
- `invalidateQuery(queryKey)`
- `invalidateQueries(prefix?)`
- `clear()`

## Helpers

- `queryOptions(options)`: identity helper that preserves literal `queryKey` types.

## Notes

- `queryKey` is hierarchical; cache key hashing defaults to `JSON.stringify` and can be customized with `options.hashKey`.
- `createQuery` returns a `PromiseLike<T>` with `queryKey` and `pending`.
- `createQuery` can be consumed with `{#await query}` or direct `await query` when Svelte async mode is enabled.
- cache stores promises directly.
- invalidation can be exact (`invalidateQuery`) or by prefix (`invalidateQueries`).
- if you customize `hashKey`, prefix invalidation only works when the hash preserves prefixes.
- `options.persist` is optional; when set, `persister` is required with `get/set/del/clear`.
- `setQuery` accepts either a value or a `Promise`.
- `dehydrate(queryKey, value)` can return `undefined` to skip persistence.
- `staleTime` and `hashKey` configured in `new QueryClient(...)` become static defaults for new `Query` instances.
