<script lang="ts">
	const features = [
		{
			number: '01',
			title: 'Promise cache',
			description:
				'Stores the Promise itself. Compose with await, get predictable concurrent behavior.'
		},
		{
			number: '02',
			title: 'Hierarchical keys',
			description:
				'Precise invalidation by exact key or broad invalidation by prefix. Familiar model.'
		},
		{
			number: '03',
			title: 'AbortSignal',
			description:
				'Cancellation support passed directly to your query function. Aligned with fetch.'
		}
	] as const;
</script>

<section class="features">
	{#each features as feature, index (feature.title)}
		<div class="feature" style={`animation-delay: ${index * 80}ms`}>
			<span class="num">{feature.number}</span>
			<h3>{feature.title}</h3>
			<p>{feature.description}</p>
		</div>
	{/each}
</section>

<style>
	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.feature {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.3rem;
		transition: border-color 200ms;
		animation: fadeUp 450ms ease both;
	}

	.feature:hover {
		border-color: var(--border-hover);
	}

	.num {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--accent);
		font-weight: 500;
	}

	.feature h3 {
		margin: 0.45rem 0 0.3rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.feature p {
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.55;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@media (max-width: 768px) {
		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
