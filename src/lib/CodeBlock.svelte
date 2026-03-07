<script lang="ts">
	import { browser } from '$app/environment';
	import type { hl } from './highlight.js';
	import { hl as highlightCode } from './highlight.js';
	import { prerenderCodeBlock } from './prerenderCodeBlock.remote.ts';

	let { code, lang = 'typescript' }: Parameters<typeof hl>[0] = $props();

	const renderCodeBlock = (props: Parameters<typeof hl>[0]) =>
		browser ? highlightCode(props) : prerenderCodeBlock(props);
</script>

<pre><code class={`hljs language-${lang}`}>{@html await renderCodeBlock({ code, lang })}</code></pre>

<style>
	pre {
		overflow-x: auto;
		padding: 1rem 1.2rem;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: 10px;
		transition: border-color 200ms;
	}

	pre:hover {
		border-color: var(--border-hover);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: #abb2bf;
	}

	code :global(.hljs-keyword),
	code :global(.hljs-selector-tag) {
		color: #c678dd;
	}

	code :global(.hljs-tag),
	code :global(.hljs-name) {
		color: #e5c07b;
	}

	code :global(.hljs-string),
	code :global(.hljs-template-tag) {
		color: #98c379;
	}

	code :global(.hljs-number),
	code :global(.hljs-literal) {
		color: #d19a66;
	}

	code :global(.hljs-comment) {
		color: #5c6370;
		font-style: italic;
	}

	code :global(.hljs-title),
	code :global(.hljs-title.function_) {
		color: #61afef;
	}

	code :global(.hljs-built_in) {
		color: #e5c07b;
	}

	code :global(.hljs-property),
	code :global(.hljs-attr) {
		color: #e06c75;
	}

	code :global(.hljs-variable) {
		color: #e06c75;
	}

	code :global(.hljs-params) {
		color: #abb2bf;
	}

	code :global(.hljs-regexp) {
		color: #56b6c2;
	}

	code :global(.hljs-meta) {
		color: #61afef;
	}

	@media (max-width: 640px) {
		pre {
			padding: 0.8rem;
			font-size: 0.82rem;
		}
	}
</style>
