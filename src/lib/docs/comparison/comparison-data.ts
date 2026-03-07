export type ComparisonRow = {
	aspect: string;
	tanstack: string;
	thisLib: string;
	note: string;
};

export const similarities: ComparisonRow[] = [
	{
		aspect: 'Invalidation',
		tanstack: 'Hierarchical query keys (exact + prefix)',
		thisLib: 'Same model (exact key or prefix)',
		note: 'Familiar pattern'
	},
	{
		aspect: 'Stale time',
		tanstack: 'Configurable per query',
		thisLib: 'Configurable per query',
		note: 'Same semantics'
	},
	{
		aspect: 'Cancellation',
		tanstack: 'AbortSignal via observers / lifecycle',
		thisLib: 'AbortSignal passed directly to queryFn',
		note: 'Aligned with fetch API'
	}
];

export const differences: ComparisonRow[] = [
	{
		aspect: 'Cache unit',
		tanstack: 'Resolved values + status flags (data, error, isFetching…)',
		thisLib: 'The Promise itself',
		note: 'Native async semantics, direct await composition'
	},
	{
		aspect: 'Component API',
		tanstack: 'useQuery hook returns a state object',
		thisLib: 'createQuery returns a PromiseLike. Use await directly.',
		note: 'No wrapper, less boilerplate'
	},
	{
		aspect: 'Mutations',
		tanstack: 'Full useMutation API with onMutate, onSuccess, onError, onSettled',
		thisLib: 'No mutation API. Use setQuery for optimistic updates, invalidate after.',
		note: 'Intentionally omitted; standard fetch + invalidate is enough'
	},
	{
		aspect: 'Key hashing',
		tanstack: 'Object keys in the array are sorted deterministically. { b, a } equals { a, b }',
		thisLib: "Keys are JSON.stringify'd as-is. No object key sorting.",
		note: '{ b: 1, a: 2 } and { a: 2, b: 1 } are different here'
	},
	{
		aspect: 'Garbage collection',
		tanstack: 'gcTime removes unused entries automatically',
		thisLib: 'No automatic GC. Use clear() or invalidate manually.',
		note: 'Smaller API surface, manual control'
	},
	{
		aspect: 'Devtools',
		tanstack: 'Official devtools panel',
		thisLib: 'None',
		note: 'Inspect cache via getQuery or $inspect'
	},
	{
		aspect: 'SSR / Hydration',
		tanstack: 'Dehydrate / hydrate API',
		thisLib: "Uses Svelte's hydratable() built-in",
		note: 'Zero config, native SvelteKit support'
	}
];
