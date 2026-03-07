import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import type { LanguageFn } from 'highlight.js';
import type { Action } from 'svelte/action';

const svelte: LanguageFn = (api) => ({
	subLanguage: 'xml',
	contains: [
		api.COMMENT('<!--', '-->', { relevance: 10 }),
		{
			begin: /^(\s*)(<script(?:\s+[^>]*?)?>)/gm,
			end: /^(\s*)(<\/script>)/gm,
			subLanguage: 'typescript',
			excludeBegin: true,
			excludeEnd: true,
			contains: [{ begin: /^(\s*)(\$:)/gm, end: /(\s*)$/gm, className: 'keyword' }]
		},
		{
			begin: /^(\s*)(<style.*>)/gm,
			end: /^(\s*)(<\/style>)/gm,
			subLanguage: 'css',
			excludeBegin: true,
			excludeEnd: true
		},
		{
			begin: /\{/gm,
			end: /\}/gm,
			subLanguage: 'typescript',
			contains: [
				{ begin: /[\{]/, end: /[\}]/, skip: true },
				{
					begin: /([#:\/@])(if|else|each|await|then|catch|debug|html)/gm,
					className: 'keyword',
					relevance: 10
				}
			]
		}
	]
});

hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('svelte', svelte);

export const hl = (code: string, lang = 'typescript') =>
	hljs.highlight(code, { language: lang }).value;

export const highlightCode: Action<HTMLElement, { code: string; lang?: string }> = (node, params) => {
	const apply = ({ code, lang = 'typescript' }: { code: string; lang?: string }) => {
		node.className = `hljs language-${lang}`;

		try {
			node.innerHTML = hl(code, lang);
		} catch {
			node.textContent = code;
		}
	};

	apply(params);

	return {
		update(nextParams) {
			apply(nextParams);
		}
	};
};
