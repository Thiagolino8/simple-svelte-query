<script lang="ts">
	import { highlightCode } from './highlight.ts';

	let { code, lang = 'typescript' } = $props<{ code: string; lang?: string }>();
</script>

<pre><code use:highlightCode={{ code, lang }} class={`hljs language-${lang}`}>{code}</code></pre>
