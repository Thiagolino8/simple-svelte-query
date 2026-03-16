<script lang="ts">
	import ComparisonTable from './ComparisonTable.svelte';
	import { differences, similarities } from './comparison-data.ts';
</script>

<div class="page">
	<header class="page-header">
		<h1>TanStack Query Comparison</h1>
		<p>
			The similarities are intentional for familiarity. The differences reflect a deliberate
			trade-off: smaller API, Svelte-native async, manual control where TanStack automates.
		</p>
	</header>

	<ComparisonTable title="Similarities" rows={similarities} />
	<ComparisonTable title="Differences" rows={differences} />
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
