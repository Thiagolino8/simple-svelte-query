<script lang="ts">
	import CategoryCacheExample from './CategoryCacheExample.svelte';
	import PrefetchExample from './PrefetchExample.svelte';
	import ReactiveSearchExample from './ReactiveSearchExample.svelte';
</script>

<div class="page">
	<header class="page-header">
		<h1>Examples</h1>
		<p>Interactive demos with source. Toggle between live and code views.</p>
	</header>

	<ReactiveSearchExample />
	<CategoryCacheExample />
	<PrefetchExample />
</div>

<style>
	.page {
		display: grid;
		gap: 1.5rem;
	}

	.page-header {
		margin-bottom: 0.25rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.page-header p {
		color: var(--text-2);
		margin-top: 0.3rem;
		line-height: 1.6;
	}
</style>
