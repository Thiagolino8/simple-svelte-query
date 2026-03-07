<script lang="ts">
	import type { ComparisonRow } from './comparison-data.ts';

	type Props = {
		title: string;
		rows: ComparisonRow[];
	};

	let { title, rows }: Props = $props();
</script>

<div class="card">
	<h2>{title}</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Aspect</th>
					<th>TanStack Query</th>
					<th>simple-svelte-query</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.aspect)}
					<tr>
						<td class="aspect">{row.aspect}</td>
						<td>{row.tanstack}</td>
						<td class="ours">{row.thisLib}</td>
						<td class="note">{row.note}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.5rem;
	}

	.card h2 {
		font-size: 1.12rem;
		font-weight: 600;
		margin-bottom: 1rem;
		letter-spacing: -0.01em;
	}

	.table-wrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 720px;
	}

	th {
		text-transform: uppercase;
		font-size: 0.7rem;
		letter-spacing: 0.07em;
		color: var(--text-3);
		font-weight: 500;
		padding: 0.6rem 0.85rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	td {
		padding: 0.8rem 0.85rem;
		border-bottom: 1px solid var(--border);
		color: var(--text-2);
		font-size: 0.88rem;
		line-height: 1.5;
		vertical-align: top;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.aspect {
		color: var(--text);
		font-weight: 550;
		white-space: nowrap;
	}

	.ours {
		color: var(--accent);
	}

	.note {
		font-style: italic;
		color: var(--text-3);
		font-size: 0.84rem;
	}

	@media (max-width: 640px) {
		.card {
			padding: 1.2rem;
			border-radius: 12px;
		}
	}
</style>
