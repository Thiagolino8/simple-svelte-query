<script lang="ts">
	type PackageManager = {
		id: 'bun' | 'npm' | 'pnpm' | 'yarn';
		label: string;
		command: string;
	};

	let { packageName }: { packageName: string } = $props();

	const options = $derived.by((): PackageManager[] => [
		{ id: 'bun', label: 'bun', command: `bun add ${packageName}` },
		{ id: 'npm', label: 'npm', command: `npm install ${packageName}` },
		{ id: 'pnpm', label: 'pnpm', command: `pnpm add ${packageName}` },
		{ id: 'yarn', label: 'yarn', command: `yarn add ${packageName}` }
	]);

	let selectedId = $state<PackageManager['id']>('bun');
	let copyState = $state<'idle' | 'copied' | 'error'>('idle');
	let copyResetTimer = 0;

	const selectedOption = $derived.by(
		() => options.find((option) => option.id === selectedId) ?? options[0]
	);

	function selectOption(id: PackageManager['id']) {
		selectedId = id;
		copyState = 'idle';
	}

	async function copyCommand() {
		const command = selectedOption.command;

		try {
			if (!navigator.clipboard?.writeText) {
				throw new Error('Clipboard API unavailable');
			}

			await navigator.clipboard.writeText(command);
			copyState = 'copied';
		} catch {
			copyState = 'error';
		}

		clearTimeout(copyResetTimer);
		copyResetTimer = window.setTimeout(() => {
			copyState = 'idle';
		}, 1800);
	}
</script>

<div class="install-tabs">
	<div class="tab-list" aria-label="Package managers">
		{#each options as option (option.id)}
			<button
				type="button"
				class:selected={option.id === selectedId}
				aria-pressed={option.id === selectedId}
				onclick={() => selectOption(option.id)}
			>
				{option.label}
			</button>
		{/each}
	</div>

	<div class="install-command">
		<div class="command-line">
			<span class="prompt">$</span>
			<code>{selectedOption.command}</code>
		</div>
		<button type="button" class="copy-button" onclick={copyCommand}>
			{copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}
		</button>
	</div>
</div>

<style>
	.install-tabs {
		display: grid;
		gap: 0.65rem;
		width: min(100%, 34rem);
		min-width: 0;
	}

	.tab-list {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.35rem;
		background: rgba(12, 12, 14, 0.82);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.tab-list button {
		border: 0;
		background: transparent;
		color: var(--text-2);
		padding: 0.42rem 0.72rem;
		border-radius: 8px;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		text-transform: lowercase;
		cursor: pointer;
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	.tab-list button:hover {
		color: var(--text);
	}

	.tab-list button.selected {
		background: var(--accent);
		color: #fff;
	}

	.install-command {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0.6rem 0.55rem 1rem;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.command-line {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.prompt {
		color: var(--accent);
		user-select: none;
		font-family: var(--font-mono);
		flex-shrink: 0;
	}

	code {
		color: #b8bcc6;
		overflow-x: auto;
		white-space: nowrap;
		scrollbar-width: none;
	}

	code::-webkit-scrollbar {
		display: none;
	}

	.copy-button {
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: var(--surface-2);
		color: var(--text);
		padding: 0.48rem 0.82rem;
		border-radius: 8px;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
		transition:
			border-color 150ms ease,
			background 150ms ease;
	}

	.copy-button:hover {
		background: #202027;
		border-color: var(--border-hover);
	}

	.tab-list button:focus-visible,
	.copy-button:focus-visible {
		outline: 2px solid rgba(255, 106, 61, 0.45);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.install-tabs {
			min-width: 100%;
		}

		.install-command {
			flex-direction: column;
			align-items: stretch;
			padding: 0.8rem;
		}

		.copy-button {
			width: 100%;
		}
	}
</style>
