<script lang="ts">
	import ExampleCard from './ExampleCard.svelte';
	import { exampleQueryClient } from './example-query-client.ts';

	type User = { id: number; firstName: string; lastName: string; email: string; age: number };

	const userIds = Array.from({ length: 5 }, (_, index) => index + 1);
	let selectedUserId = $state(1);

	const userQuery = exampleQueryClient.createQuery(() => ({
		queryKey: ['user', selectedUserId],
		queryFn: ({ signal }: { signal?: AbortSignal; queryKey: readonly [string, number] }) =>
			fetch(`https://dummyjson.com/users/${selectedUserId}?select=firstName,lastName,email,age`, {
				signal
			}).then((r) => r.json() as Promise<User>)
	}));

	const prefetchCode = String.raw`let selectedId = $state(1);

const userQuery = queryClient.createQuery(() => ({
  queryKey: ['user', selectedId],
  queryFn: ({ signal }) =>
    fetch('/api/users/' + selectedId, { signal })
      .then((r) => r.json())
}));

// fetchQuery populates the same cache that createQuery reads from
const prefetch = (id: number) =>
  queryClient.fetchQuery({
    queryKey: ['user', id],
    queryFn: ({ signal }) =>
      fetch('/api/users/' + id, { signal })
        .then((r) => r.json())
  });

// hover: prefetch(3) -> cache warm
// click: selectedId = 3 -> createQuery finds cache hit -> instant`;

	const prefetchUser = (id: number) =>
		exampleQueryClient.fetchQuery({
			queryKey: ['user', id],
			queryFn: ({ signal }: { signal?: AbortSignal; queryKey: readonly [string, number] }) =>
				fetch(`https://dummyjson.com/users/${id}?select=firstName,lastName,email,age`, {
					signal
				}).then((r) => r.json() as Promise<User>)
		});
</script>

{#snippet summary()}
	<p class="summary-text"><code>fetchQuery</code> warms cache on hover. Click loads instantly.</p>
{/snippet}

<ExampleCard title="Prefetch on Hover" code={prefetchCode} {summary}>
	<div class="tabs">
		{#each userIds as userId (userId)}
			<button
				class="tab"
				class:active={selectedUserId === userId}
				onmouseenter={() => prefetchUser(userId)}
				onclick={() => (selectedUserId = userId)}>User {userId}</button
			>
		{/each}
	</div>

	{#each [await userQuery] as user (user.id)}
		<div class="user-detail" data-loading={userQuery.pending}>
			<strong>{user.firstName} {user.lastName}</strong>
			<span>{user.email} · {user.age} years old</span>
		</div>
	{/each}

	<p class="hint">Hover a tab first, then click. Compare with clicking without hovering.</p>
</ExampleCard>

<style>
	.summary-text {
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.5;
		margin: 0;
	}

	.summary-text code {
		font-family: var(--font-mono);
		padding: 0.12rem 0.32rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.82em;
		color: #c9cdd6;
	}

	.tabs {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.tab {
		appearance: none;
		padding: 0.4rem 0.7rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 7px;
		color: var(--text-2);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 450;
		cursor: pointer;
		transition:
			border-color 150ms,
			color 150ms,
			background 150ms;
	}

	.tab:hover {
		border-color: var(--border-hover);
		color: var(--text);
	}

	.tab.active {
		background: var(--accent-dim);
		border-color: rgba(255, 106, 61, 0.22);
		color: var(--accent);
	}

	.user-detail {
		padding: 1rem;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: opacity 180ms ease;
	}

	.user-detail[data-loading='true'] {
		opacity: 0.4;
	}

	.user-detail strong {
		display: block;
		font-size: 1rem;
		margin-bottom: 0.2rem;
	}

	.user-detail span {
		color: var(--text-2);
		font-size: 0.86rem;
	}

	.hint {
		color: var(--text-3);
		font-size: 0.8rem;
		font-style: italic;
		margin: 0;
	}

	@media (max-width: 640px) {
		.tabs {
			overflow-x: auto;
			flex-wrap: nowrap;
			scrollbar-width: none;
		}

		.tabs::-webkit-scrollbar {
			display: none;
		}

		.tab {
			flex-shrink: 0;
		}
	}
</style>
