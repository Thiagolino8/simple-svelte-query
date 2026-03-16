export const createQueryExample = String.raw`<script lang="ts">
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

export const fetchQueryExample = String.raw`const user = await queryClient.fetchQuery({
  queryKey: ['user', userId],
  queryFn: ({ signal, queryKey: [, id] }) => fetchUser(id, signal)
});`;

export const ensureQueryExample = String.raw`const postsPromise = queryClient.ensureQuery({
  queryKey: ['posts', userId],
  queryFn: ({ signal, queryKey: [, id] }) => fetchPosts(id, signal)
});`;

export const setQueryExample = String.raw`queryClient.setQuery(['user', userId], {
  id: userId,
  name: 'Optimistic value'
});`;

export const getQueryExample = String.raw`const cached = await queryClient.getQuery<{ id: string; name: string }>([
  'user',
  userId
]);`;

export const invalidateExample = String.raw`queryClient.invalidateQuery(['user', userId]);
queryClient.invalidateQueries(['users']);
queryClient.invalidateQueries();`;

export const clearExample = String.raw`queryClient.clear();`;

export const queryOptionsExample = String.raw`const userQuery = queryOptions({
  queryKey: ['user', userId] as const,
  queryFn: ({ queryKey: [, id], signal }) => fetchUser(id, signal)
});

const user = await queryClient.fetchQuery(userQuery);`;

export const removeQueryExample = String.raw`queryClient.removeQuery(['user', userId]);`;
