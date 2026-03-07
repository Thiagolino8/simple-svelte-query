<script lang="ts">
	import CodeBlock from '$lib/CodeBlock.svelte';

	const quickExample = String.raw`<script lang="ts">
import { QueryClient } from 'simple-svelte-query';

const queryClient = new QueryClient();
let search = $state('phone');

const productsQuery = queryClient.createQuery(() => ({
  queryKey: ['products', search],
  queryFn: ({ signal }) =>
    fetch('/api/products?q=' + search, { signal })
      .then((r) => r.json())
}));
${'</' + 'script>'}

<ul style:opacity={productsQuery.pending ? 0.4 : 1}>
  {#each (await productsQuery).items as item (item.name)}
    <li>{item.name}</li>
  {/each}
</ul>`;
</script>

<section class="example-section">
	<h2>Quick start</h2>
	<CodeBlock code={quickExample} lang="svelte" />
</section>

<style>
	.example-section {
		margin-top: 2rem;
	}

	.example-section h2 {
		font-size: 1.15rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		letter-spacing: -0.01em;
	}
</style>
