import { describe, expectTypeOf, it } from 'vitest';
import {
	CacheEntry,
	Query,
	QueryClient,
	QueryState,
	type QueryResult,
	queryOptions
} from './query.svelte.ts';

describe('query typing', () => {
	it('preserva literal de queryKey em queryOptions', () => {
		const options = queryOptions({
			queryKey: ['users', 1] as const,
			queryFn: ({ queryKey }) => {
				const [scope, id] = queryKey;
				expectTypeOf(scope).toEqualTypeOf<'users'>();
				expectTypeOf(id).toEqualTypeOf<1>();
				return Promise.resolve({ id, scope });
			}
		});

		expectTypeOf(options.queryKey).toEqualTypeOf<readonly ['users', 1]>();
		expectTypeOf(options.queryFn).returns.toEqualTypeOf<Promise<{ id: 1; scope: 'users' }>>();
	});

	it('infere tipo de retorno em fetchQuery e ensureQuery', () => {
		const client = new QueryClient();
		client.setQuery(['post', 10], { id: 10 as const, title: 'cached' as const });
		client.setQuery(['flags'], [true, false] as const);

		const fetchResult = client.fetchQuery({
			queryKey: ['post', 10] as const,
			queryFn: ({ queryKey }) => Promise.resolve({ id: queryKey[1], title: 'Hello' as const })
		});
		const ensureResult = client.ensureQuery({
			queryKey: ['flags'] as const,
			queryFn: () => Promise.resolve([true, false] as const)
		});

		expectTypeOf(fetchResult).resolves.toEqualTypeOf<{ id: 10; title: 'Hello' }>();
		expectTypeOf(ensureResult).resolves.toEqualTypeOf<readonly [true, false]>();
	});

	it('mantem queryKey tipada na classe Query', () => {
		const query = new Query({
			queryKey: ['todos', { done: false }] as const,
			queryFn: ({ queryKey }) => Promise.resolve(queryKey[1].done)
		});

		expectTypeOf(query.fetch)
			.parameter(0)
			.toEqualTypeOf<readonly ['todos', { readonly done: false }]>();
		expectTypeOf(query.fetch).returns.toExtend<Promise<boolean>>();
	});

	it('preserva generics de CacheEntry e QueryState', () => {
		const entry = new CacheEntry(Promise.resolve({ id: 1 as const }));
		const state = new QueryState<{ id: 1 }>();

		state.entry = entry;

		expectTypeOf(entry.promise).resolves.toEqualTypeOf<{ id: 1 }>();
		expectTypeOf<QueryState<{ id: 1 }>['entry']>().toEqualTypeOf<
			CacheEntry<{ id: 1 }> | undefined
		>();
	});

	it('inclui pending no QueryResult', () => {
		expectTypeOf<QueryResult<number>['pending']>().toEqualTypeOf<boolean>();
		expectTypeOf<QueryResult<number>>().toMatchTypeOf<PromiseLike<number>>();
	});

	it('exige queryFn assíncrona e respeita tipos do queryKey', () => {
		queryOptions({
			queryKey: ['sync-error'] as const,
			// @ts-expect-error queryFn precisa retornar Promise<T>
			queryFn: () => 123
		});

		queryOptions({
			queryKey: ['users', 99] as const,
			queryFn: ({ queryKey }) => {
				const id = queryKey[1];
				// @ts-expect-error id é number, não string
				const text: string = id;
				return Promise.resolve(text);
			}
		});
	});
});
