import { prerender } from '$app/server';
import { hl } from './highlight.ts';

export const prerenderCodeBlock = prerender(
	'unchecked',
	(...props: Parameters<typeof hl>) => hl(...props),
	{ dynamic: true }
);
