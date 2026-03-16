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
<span data-testid="pending">{String(query.pending)}</span>

<svelte:boundary>
	<span data-testid="status">success</span>
	<span data-testid="data">{JSON.stringify(await query)}</span>

	{#snippet pending()}
		<span data-testid="status">loading</span>
	{/snippet}

	{#snippet failed(error)}
		<span data-testid="status">error</span>
		<span data-testid="error">{error instanceof Error ? error.message : String(error)}</span>
	{/snippet}
</svelte:boundary>
