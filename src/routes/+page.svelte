<script lang="ts">
	import OverviewFeatureGrid from '$lib/docs/overview/OverviewFeatureGrid.svelte';
	import OverviewHero from '$lib/docs/overview/OverviewHero.svelte';
	import OverviewLinks from '$lib/docs/overview/OverviewLinks.svelte';
	import OverviewQuickStart from '$lib/docs/overview/OverviewQuickStart.svelte';
</script>

<svelte:head>
	<title>simple-svelte-query</title>
	<meta name="description" content="Promise-first query cache for Svelte 5" />
</svelte:head>

<OverviewHero />
<OverviewFeatureGrid />
<OverviewQuickStart />
<OverviewLinks />
