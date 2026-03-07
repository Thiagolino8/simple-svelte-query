import { describe, expect, it } from 'vitest';
import { hl } from './highlight.ts';

describe('hl', () => {
	it('highlights Svelte markup and directives when lang is svelte', () => {
		const code = String.raw`<script lang="ts">
const items = $state([{ id: 1, name: 'Phone' }]);
</script>

<ul style:opacity={items.length ? 1 : 0.4}>
  {#each items as item}
    <li>{item.name}</li>
  {/each}
</ul>`;

		const output = hl({ code, lang: 'svelte' });

		expect(output).toContain('hljs-tag');
		expect(output).toContain('hljs-attr');
		expect(output).toContain('hljs-keyword');
		expect(output).toContain('hljs-property');
		expect(output).toContain('#each');
	});
});
