<script lang="ts">
	import { untrack } from 'svelte';
	import type { QueryClient } from './query.svelte.ts';
	import { queryOptions } from './query.svelte.ts';

	let {
		client,
		queryFn,
		nextQueryFn = queryFn
	}: {
		client: QueryClient;
		queryFn: (ctx: { signal?: AbortSignal; queryKey: readonly unknown[] }) => Promise<unknown>;
		nextQueryFn?: (ctx: { signal?: AbortSignal; queryKey: readonly unknown[] }) => Promise<unknown>;
	} = $props();

	let id = $state(1);
	let staleTime = $state(1000 * 60);
	const initialTrackedQueryFn = ({
		signal,
		queryKey
	}: {
		signal?: AbortSignal;
		queryKey: readonly unknown[];
	}) => queryFn({ signal, queryKey });
	const nextTrackedQueryFn = ({
		signal,
		queryKey
	}: {
		signal?: AbortSignal;
		queryKey: readonly unknown[];
	}) => nextQueryFn({ signal, queryKey });
	let trackedQueryFn = $state.raw(initialTrackedQueryFn);
	const options = $derived(
		queryOptions({
			queryKey: ['tracked', id],
			staleTime,
			queryFn: trackedQueryFn
		})
	);

	const query = untrack(() => client).createQuery(() => options);
</script>

<button data-testid="set-stale-time-zero" onclick={() => (staleTime = 0)}>set stale time</button>
<button data-testid="set-next-query-fn" onclick={() => (trackedQueryFn = nextTrackedQueryFn)}>
	set query fn
</button>
<button data-testid="increment-query-key" onclick={() => (id += 1)}>next query key</button>
<button data-testid="decrement-query-key" onclick={() => (id -= 1)}>previous query key</button>

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
