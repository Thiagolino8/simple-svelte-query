<script lang="ts">
	import { untrack } from 'svelte';
	import type { QueryClient } from './query.svelte.ts';

	let {
		client,
		queryKey,
		queryFn
	}: {
		client: QueryClient;
		queryKey: readonly unknown[];
		queryFn: (ctx: { signal?: AbortSignal; queryKey: readonly unknown[] }) => Promise<unknown>;
	} = $props();

	const query = untrack(() => client).createQuery(() => ({ queryKey, queryFn }));
</script>

<span data-testid="query-key">{JSON.stringify(query.queryKey)}</span>

{#await query}
	<span data-testid="status">loading</span>
{:then data}
	<span data-testid="status">success</span>
	<span data-testid="data">{JSON.stringify(data)}</span>
{:catch err}
	<span data-testid="status">error</span>
	<span data-testid="error">{err?.message}</span>
{/await}
