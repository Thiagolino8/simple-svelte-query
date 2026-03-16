<script lang="ts">
	const links = [
		{
			href: 'https://www.npmjs.com/package/simple-svelte-query',
			label: 'npm package',
			icon: 'https://cdn.simpleicons.org/npm/CB3837'
		},
		{
			href: 'https://github.com/Thiagolino8/simple-svelte-query',
			label: 'GitHub',
			icon: 'https://cdn.simpleicons.org/github/ffffff'
		},
		{
			href: 'https://www.linkedin.com/in/thiago-lino-gomes-5812581bb',
			label: 'LinkedIn',
			icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg'
		},
		{
			href: 'https://x.com/Thiagolinog',
			label: 'X',
			icon: 'https://cdn.simpleicons.org/x/ffffff'
		},
		{
			href: 'https://bsky.app/profile/thiagolino8.bsky.social',
			label: 'Bluesky',
			icon: 'https://cdn.simpleicons.org/bluesky/0285FF'
		}
	] as const;
</script>

<section class="links-section">
	<h2>Links</h2>
	<div class="links-grid">
		{#each links as link (link.label)}
			<a href={link.href} target="_blank" rel="external noreferrer">
				<img class="icon" src={link.icon} alt="" />
				{link.label}
			</a>
		{/each}
	</div>
</section>

<style>
	.links-section {
		margin-top: 1.2rem;
	}

	.links-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.links-grid a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		text-decoration: none;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-2);
		font-size: 0.82rem;
		transition:
			border-color 150ms,
			color 150ms;
	}

	.links-grid a:hover {
		border-color: var(--border-hover);
		color: var(--text);
	}

	.icon {
		width: 0.95rem;
		height: 0.95rem;
		flex-shrink: 0;
	}
</style>
