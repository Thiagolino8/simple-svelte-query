# API Reference

## Public exports

- `QueryClient`
- `Query`
- `queryOptions`

## QueryClient

- `new QueryClient(defaultStaleTime?)`
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

- `queryKey` is hierarchical and serialized with `JSON.stringify`.
- cache stores promises directly.
- invalidation can be exact (`invalidateQuery`) or by prefix (`invalidateQueries`).
