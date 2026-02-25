import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import type { Action } from 'svelte/action';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

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
