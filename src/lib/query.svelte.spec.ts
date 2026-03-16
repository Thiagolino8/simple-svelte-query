import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { CacheEntry, Query, QueryClient, QueryState, queryOptions } from './query.svelte.ts';
import * as publicApi from './index.ts';
import { QueryClient as PublicQueryClient, queryOptions as publicQueryOptions } from './index.ts';
import TestQuery from './TestQuery.svelte';
import TrackedQueryOptions from './TrackedQueryOptions.svelte';

let savedStaleTime: number;
let savedHashKey: (queryKey: readonly unknown[]) => string;

beforeEach(() => {
	savedStaleTime = QueryClient.staleTime;
	savedHashKey = QueryClient.hashKey;
});

afterEach(() => {
	QueryClient.staleTime = savedStaleTime;
	QueryClient.hashKey = savedHashKey;
});

describe('public API exports', () => {
	it('exports QueryClient and queryOptions from index', () => {
		expect(PublicQueryClient).toBe(QueryClient);
		expect(publicQueryOptions).toBe(queryOptions);
	});

	it('keeps internal classes out of index', () => {
		expect(publicApi).not.toHaveProperty('Query');
		expect(publicApi).not.toHaveProperty('CacheEntry');
		expect(publicApi).not.toHaveProperty('QueryState');
	});
});

// ---------------------------------------------------------------------------
// queryOptions
// ---------------------------------------------------------------------------
describe('queryOptions', () => {
	it('returns the same options reference', () => {
		const fn = () => Promise.resolve({ name: 'Alice' });
		const options = { queryKey: ['users', 1] as const, queryFn: fn };
		const opts = queryOptions(options);

		expect(opts).toBe(options);
		expect(opts.queryKey).toEqual(['users', 1]);
		expect(opts.queryFn).toBe(fn);
	});
});

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------
describe('Query', () => {
	it('serializes queryKey to JSON', () => {
		const q = new Query({ queryKey: ['users', 1], queryFn: () => Promise.resolve(null) });
		expect(q.key).toBe('["users",1]');
	});

	it('isStale → false within staleTime', () => {
		const q = new Query({ queryKey: ['t'], staleTime: 5000, queryFn: () => Promise.resolve(0) });
		expect(q.isStale(Date.now())).toBe(false);
	});

	it('isStale → true after staleTime', () => {
		const q = new Query({ queryKey: ['t'], staleTime: 0, queryFn: () => Promise.resolve(0) });
		expect(q.isStale(Date.now() - 1)).toBe(true);
	});

	it('fetch passes signal and queryKey to queryFn', async () => {
		const fn = vi.fn().mockResolvedValue('data');
		const q = new Query({ queryKey: ['k'], queryFn: fn });
		const ctrl = new AbortController();
		const result = await q.fetch(['k'], ctrl.signal);

		expect(fn).toHaveBeenCalledWith({ signal: ctrl.signal, queryKey: ['k'] });
		expect(result).toBe('data');
	});

	it('defaults staleTime from QueryClient.staleTime', () => {
		QueryClient.staleTime = 9999;
		const q = new Query({ queryKey: ['x'], queryFn: () => Promise.resolve(0) });

		expect(q.isStale(Date.now() - 9998)).toBe(false);
		expect(q.isStale(Date.now() - 10000)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// CacheEntry
// ---------------------------------------------------------------------------
describe('CacheEntry', () => {
	it('starts pending and settles on resolve', async () => {
		let resolve!: (value: string) => void;
		const promise = new Promise<string>((next) => {
			resolve = next;
		});
		const entry = new CacheEntry(promise);

		expect(entry.pending).toBe(true);

		resolve('ok');
		await expect(entry.promise).resolves.toBe('ok');
		expect(entry.pending).toBe(false);
	});

	it('clears pending on rejection too', async () => {
		let reject!: (reason?: unknown) => void;
		const promise = new Promise<never>((_, fail) => {
			reject = fail;
		});
		const entry = new CacheEntry(promise);

		reject(new Error('boom'));
		await expect(entry.promise).rejects.toThrow('boom');
		expect(entry.pending).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// QueryState
// ---------------------------------------------------------------------------
describe('QueryState', () => {
	it('prefers stagedEntry over entry until sync', () => {
		const current = new CacheEntry(Promise.resolve('current'));
		const staged = new CacheEntry(Promise.resolve('next'));
		const state = new QueryState<string>();

		state.entry = current;
		expect(state.entry).toBe(current);

		state.stagedEntry = staged;
		expect(state.entry).toBe(staged);

		state.entry = staged;
		expect(state.entry).toBe(staged);
	});

	it('updates prefix hashes', () => {
		const state = new QueryState(['users']);

		expect(state.matchesPrefix('users')).toBe(true);

		state.prefixHashes = ['posts'];
		expect(state.matchesPrefix('users')).toBe(false);
		expect(state.matchesPrefix('posts')).toBe(true);
	});

	it('only rotates token when there is tracked state', () => {
		const emptyState = new QueryState<string>();
		const emptyToken = emptyState.currentToken;

		emptyState.invalidate();
		expect(emptyState.currentToken).toBe(emptyToken);

		const state = new QueryState<string>();
		state.entry = new CacheEntry(Promise.resolve('value'));
		const token = state.currentToken;

		state.invalidate();
		expect(state.currentToken).not.toBe(token);
	});
});

// ---------------------------------------------------------------------------
// QueryClient
// ---------------------------------------------------------------------------
describe('QueryClient', () => {
	let client: QueryClient;

	beforeEach(() => {
		client = new QueryClient({ staleTime: 5000 });
	});

	// -- constructor --------------------------------------------------------
	describe('constructor', () => {
		it('does not overwrite the global staleTime default', () => {
			new QueryClient({ staleTime: 12345 });
			expect(QueryClient.staleTime).toBe(savedStaleTime);
		});

		it('does not overwrite the global hashKey default', () => {
			const hashKey = (queryKey: readonly unknown[]) => `h:${JSON.stringify(queryKey)}`;
			new QueryClient({ hashKey });
			expect(QueryClient.hashKey).toBe(savedHashKey);
		});

		it('isolates staleTime and hashKey between instances', async () => {
			const shortClient = new QueryClient({
				staleTime: 0,
				hashKey: (queryKey: readonly unknown[]) => [...queryKey].reverse().join(':')
			});
			const longClient = new QueryClient({
				staleTime: 5000
			});

			shortClient.setQuery(['scope', 'short'], 'short');
			longClient.setQuery(['scope', 'short'], 'long');

			expect(await shortClient.getQuery(['scope', 'short'])).toBe('short');
			expect(await longClient.getQuery(['scope', 'short'])).toBe('long');

			await longClient.fetchQuery({
				queryKey: ['fresh'],
				queryFn: vi.fn().mockResolvedValue('cached')
			});

			const nextResult = await longClient.fetchQuery({
				queryKey: ['fresh'],
				queryFn: vi.fn().mockResolvedValue('refetched')
			});

			expect(nextResult).toBe('cached');
		});
	});

	// -- setQuery / getQuery ------------------------------------------------
	describe('setQuery / getQuery', () => {
		it('round-trips a value', async () => {
			client.setQuery(['users', 1], { name: 'Alice' });
			const result = await client.getQuery<{ name: string }>(['users', 1]);
			expect(result).toEqual({ name: 'Alice' });
		});

		it('returns undefined for missing key', () => {
			expect(client.getQuery(['nope'])).toBeUndefined();
		});

		it('overwrites existing entry', async () => {
			client.setQuery(['x'], 'first');
			client.setQuery(['x'], 'second');
			expect(await client.getQuery(['x'])).toBe('second');
		});

		it('accepts a promise as value', async () => {
			client.setQuery(['async'], Promise.resolve('from-promise'));
			expect(await client.getQuery(['async'])).toBe('from-promise');
		});
	});

	// -- removeQuery --------------------------------------------------------
	describe('removeQuery', () => {
		it('removes cached entry', () => {
			client.setQuery(['a'], 1);
			client.removeQuery(['a']);
			expect(client.getQuery(['a'])).toBeUndefined();
		});

		it('removes cached entry with custom hashKey when passed the queryKey', () => {
			const customClient = new QueryClient({
				hashKey: (queryKey: readonly unknown[]) => [...queryKey].reverse().join(':')
			});

			customClient.setQuery(['products', 'phone'], 'p1');
			customClient.removeQuery(['products', 'phone']);

			expect(customClient.getQuery(['products', 'phone'])).toBeUndefined();
		});
	});

	// -- clear --------------------------------------------------------------
	describe('clear', () => {
		it('removes all entries', () => {
			client.setQuery(['a'], 1);
			client.setQuery(['b'], 2);
			client.clear();
			expect(client.getQuery(['a'])).toBeUndefined();
			expect(client.getQuery(['b'])).toBeUndefined();
		});
	});

	// -- fetchQuery ---------------------------------------------------------
	describe('fetchQuery', () => {
		it('fetches and caches', async () => {
			const fn = vi.fn().mockResolvedValue('data');
			const result = await client.fetchQuery({ queryKey: ['f1'], queryFn: fn });

			expect(result).toBe('data');
			expect(fn).toHaveBeenCalledOnce();
		});

		it('returns cached value when not stale', async () => {
			const fn = vi.fn().mockResolvedValue('first');
			await client.fetchQuery({ queryKey: ['f2'], queryFn: fn });

			const fn2 = vi.fn().mockResolvedValue('second');
			const result = await client.fetchQuery({ queryKey: ['f2'], queryFn: fn2 });

			expect(result).toBe('first');
			expect(fn2).not.toHaveBeenCalled();
		});

		it('refetches when stale', async () => {
			const shortClient = new QueryClient({ staleTime: 0 });
			await shortClient.fetchQuery({
				queryKey: ['f3'],
				queryFn: vi.fn().mockResolvedValue('v1')
			});

			await new Promise((r) => setTimeout(r, 10));

			const fn2 = vi.fn().mockResolvedValue('v2');
			const result = await shortClient.fetchQuery({ queryKey: ['f3'], queryFn: fn2 });

			expect(result).toBe('v2');
			expect(fn2).toHaveBeenCalledOnce();
		});

		it('counts staleness from resolution time instead of request start', async () => {
			let resolveFetch: (value: string) => void = () => undefined;
			const timedClient = new QueryClient({ staleTime: 25 });

			const firstFetch = timedClient.fetchQuery({
				queryKey: ['f5'],
				queryFn: () =>
					new Promise<string>((resolve) => {
						resolveFetch = resolve;
					})
			});

			await new Promise((resolve) => setTimeout(resolve, 30));
			resolveFetch('fresh');
			await firstFetch;

			const secondFn = vi.fn().mockResolvedValue('stale');
			const result = await timedClient.fetchQuery({
				queryKey: ['f5'],
				queryFn: secondFn
			});

			expect(result).toBe('fresh');
			expect(secondFn).not.toHaveBeenCalled();
		});
	});

	// -- ensureQuery --------------------------------------------------------
	describe('ensureQuery', () => {
		it('creates entry if not cached', async () => {
			const fn = vi.fn().mockResolvedValue('ensured');
			const result = await client.ensureQuery({ queryKey: ['e1'], queryFn: fn });

			expect(result).toBe('ensured');
			expect(fn).toHaveBeenCalledOnce();
		});

		it('returns existing entry regardless of staleness', async () => {
			const shortClient = new QueryClient({ staleTime: 0 });
			await shortClient.ensureQuery({
				queryKey: ['e2'],
				queryFn: vi.fn().mockResolvedValue('original')
			});

			await new Promise((r) => setTimeout(r, 10));

			const fn2 = vi.fn().mockResolvedValue('nope');
			const result = await shortClient.ensureQuery({ queryKey: ['e2'], queryFn: fn2 });

			expect(result).toBe('original');
			expect(fn2).not.toHaveBeenCalled();
		});
	});

	// -- persistence --------------------------------------------------------
	describe('persist', () => {
		it('hydrates from persister on first fetchQuery', async () => {
			const persister = {
				get: vi.fn().mockResolvedValue('persisted-value'),
				set: vi.fn(),
				del: vi.fn(),
				clear: vi.fn()
			};
			const hydrate = vi.fn().mockResolvedValue('hydrated-value');
			const persistentClient = new QueryClient({
				persist: { persister, hydrate }
			});
			const queryFn = vi.fn().mockResolvedValue('network-value');

			const value = await persistentClient.fetchQuery({
				queryKey: ['persist', 1],
				queryFn
			});

			expect(value).toBe('hydrated-value');
			expect(persister.get).toHaveBeenCalledWith('["persist",1]');
			expect(hydrate).toHaveBeenCalledWith('persisted-value');
			expect(queryFn).not.toHaveBeenCalled();
		});

		it('persists resolved value from fetchQuery', async () => {
			const persister = {
				get: vi.fn().mockResolvedValue(undefined),
				set: vi.fn().mockResolvedValue(undefined),
				del: vi.fn(),
				clear: vi.fn()
			};
			const dehydrate = vi.fn((queryKey: readonly unknown[], value: unknown) => ({
				queryKey,
				value
			}));
			const persistentClient = new QueryClient({
				persist: { persister, dehydrate }
			});

			await persistentClient.fetchQuery({
				queryKey: ['persist', 2],
				queryFn: vi.fn().mockResolvedValue('network-data')
			});
			await Promise.resolve();

			expect(dehydrate).toHaveBeenCalledWith(['persist', 2], 'network-data');
			expect(persister.set).toHaveBeenCalledWith('["persist",2]', {
				queryKey: ['persist', 2],
				value: 'network-data'
			});
		});

		it('does not persist when dehydrate returns undefined', async () => {
			const persister = {
				get: vi.fn().mockResolvedValue(undefined),
				set: vi.fn(),
				del: vi.fn(),
				clear: vi.fn()
			};
			const persistentClient = new QueryClient({
				persist: {
					persister,
					dehydrate: () => undefined
				}
			});

			await persistentClient.fetchQuery({
				queryKey: ['persist', 3],
				queryFn: vi.fn().mockResolvedValue('network-data')
			});
			await Promise.resolve();

			expect(persister.set).not.toHaveBeenCalled();
		});

		it('removeQuery calls persister.del and clear calls persister.clear', async () => {
			const persister = {
				get: vi.fn(),
				set: vi.fn(),
				del: vi.fn().mockResolvedValue(undefined),
				clear: vi.fn().mockResolvedValue(undefined)
			};
			const persistentClient = new QueryClient({
				persist: { persister }
			});

			persistentClient.setQuery(['persist', 4], 1);
			persistentClient.removeQuery(['persist', 4]);
			persistentClient.clear();
			await Promise.resolve();

			expect(persister.del).toHaveBeenCalledWith('["persist",4]');
			expect(persister.clear).toHaveBeenCalledOnce();
		});

		it('removeQuery uses the client hashKey when passed the queryKey', async () => {
			const persister = {
				get: vi.fn(),
				set: vi.fn(),
				del: vi.fn().mockResolvedValue(undefined),
				clear: vi.fn()
			};
			const persistentClient = new QueryClient({
				hashKey: (queryKey: readonly unknown[]) => [...queryKey].reverse().join(':'),
				persist: { persister }
			});

			persistentClient.setQuery(['persist', 'custom'], 1);
			persistentClient.removeQuery(['persist', 'custom']);
			await Promise.resolve();

			expect(persister.del).toHaveBeenCalledWith('custom:persist');
		});

		it('invalidate does not call persister.del', async () => {
			const persister = {
				get: vi.fn(),
				set: vi.fn(),
				del: vi.fn(),
				clear: vi.fn()
			};
			const persistentClient = new QueryClient({
				persist: { persister }
			});

			persistentClient.setQuery(['persist', 5], 1);
			persistentClient.invalidateQuery(['persist', 5]);
			persistentClient.invalidateQueries(['persist']);
			await Promise.resolve();

			expect(persister.del).not.toHaveBeenCalled();
		});

		it('uses current resolved cache value for persistence when previous promise resolves later', async () => {
			let resolveFirst: (value: string) => void = () => undefined;
			const firstPromise = new Promise<string>((resolve) => {
				resolveFirst = resolve;
			});
			const persister = {
				get: vi.fn().mockResolvedValue(undefined),
				set: vi.fn().mockResolvedValue(undefined),
				del: vi.fn(),
				clear: vi.fn()
			};
			const persistentClient = new QueryClient({
				persist: { persister }
			});

			const firstFetch = persistentClient.fetchQuery({
				queryKey: ['race'],
				staleTime: 0,
				queryFn: () => firstPromise
			});
			await new Promise((resolve) => setTimeout(resolve, 1));
			const secondFetch = persistentClient.fetchQuery({
				queryKey: ['race'],
				staleTime: 0,
				queryFn: vi.fn().mockResolvedValue('latest')
			});
			await secondFetch;
			resolveFirst('old');
			await firstFetch;
			await Promise.resolve();

			expect(persister.set).toHaveBeenCalledWith('["race"]', 'latest');
		});

		it('uses hashKey for persister key', async () => {
			const hashKey = (queryKey: readonly unknown[]) => `h:${JSON.stringify(queryKey)}`;
			const persister = {
				get: vi.fn().mockResolvedValue(undefined),
				set: vi.fn().mockResolvedValue(undefined),
				del: vi.fn(),
				clear: vi.fn()
			};
			const persistentClient = new QueryClient({
				hashKey,
				persist: { persister }
			});

			await persistentClient.fetchQuery({
				queryKey: ['persist', 'hash'],
				queryFn: vi.fn().mockResolvedValue('network-data')
			});
			await Promise.resolve();

			expect(persister.get).toHaveBeenCalledWith('h:["persist","hash"]');
			expect(persister.set).toHaveBeenCalledWith('h:["persist","hash"]', 'network-data');
		});
	});

	// -- invalidateQuery ----------------------------------------------------
	describe('invalidateQuery', () => {
		it('exact invalidation triggers refetch', async () => {
			client.setQuery(['users', 1], 'old');
			client.invalidateQuery(['users', 1]);

			let called = 0;
			const result = await client.fetchQuery({
				queryKey: ['users', 1],
				queryFn: () => {
					called++;
					return Promise.resolve('new');
				}
			});

			expect(called).toBe(1);
			expect(result).toBe('new');
		});

		it('does not affect other keys', async () => {
			client.setQuery(['a'], 'va');
			client.setQuery(['b'], 'vb');
			client.invalidateQuery(['a']);

			expect(await client.getQuery(['b'])).toBe('vb');
		});
	});

	// -- invalidateQueries --------------------------------------------------
	describe('invalidateQueries', () => {
		it('invalidates by prefix', async () => {
			client.setQuery(['products', 'phone'], 'p1');
			client.setQuery(['products', 'laptop'], 'p2');
			client.setQuery(['users', 1], 'u1');
			client.invalidateQueries(['products']);

			let productCalls = 0;
			await client.fetchQuery({
				queryKey: ['products', 'phone'],
				queryFn: () => {
					productCalls++;
					return Promise.resolve('new-p1');
				}
			});
			expect(productCalls).toBe(1);

			expect(await client.getQuery<string>(['users', 1])).toBe('u1');
		});

		it('empty prefix invalidates all', async () => {
			client.setQuery(['a'], 1);
			client.setQuery(['b'], 2);
			client.invalidateQueries();

			let calls = 0;
			await client.fetchQuery({
				queryKey: ['a'],
				queryFn: () => {
					calls++;
					return Promise.resolve(10);
				}
			});
			await client.fetchQuery({
				queryKey: ['b'],
				queryFn: () => {
					calls++;
					return Promise.resolve(20);
				}
			});

			expect(calls).toBe(2);
		});

		it('invalidates by prefix with custom hashKey that does not preserve string prefixes', async () => {
			const customClient = new QueryClient({
				hashKey: (queryKey: readonly unknown[]) => [...queryKey].reverse().join(':')
			});

			customClient.setQuery(['products', 'phone'], 'p1');
			customClient.setQuery(['products', 'laptop'], 'p2');
			customClient.setQuery(['users', 1], 'u1');
			customClient.invalidateQueries(['products']);

			let productCalls = 0;
			await customClient.fetchQuery({
				queryKey: ['products', 'phone'],
				queryFn: () => {
					productCalls++;
					return Promise.resolve('new-p1');
				}
			});

			expect(productCalls).toBe(1);
			expect(await customClient.getQuery<string>(['users', 1])).toBe('u1');
		});
	});

	// -- createQuery (component tests) --------------------------------------
	describe('createQuery', () => {
		it('resolves with data', async () => {
			render(TestQuery, {
				client,
				queryKey: ['cq-ok'],
				queryFn: () => Promise.resolve(42)
			});

			await expect.element(page.getByTestId('status')).toHaveTextContent('success');
			await expect.element(page.getByTestId('data')).toHaveTextContent('42');
		});

		it('handles rejection', async () => {
			render(TestQuery, {
				client,
				queryKey: ['cq-err'],
				queryFn: () => Promise.reject(new Error('boom'))
			});

			await expect.element(page.getByTestId('status')).toHaveTextContent('error');
			await expect.element(page.getByTestId('error')).toHaveTextContent('boom');
		});

		it('exposes queryKey', async () => {
			render(TestQuery, {
				client,
				queryKey: ['users', 42],
				queryFn: () => Promise.resolve('ok')
			});

			await expect.element(page.getByTestId('query-key')).toHaveTextContent('["users",42]');
		});

		it('tracks only queryKey from queryOptions state, not staleTime', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second');

			render(TrackedQueryOptions, {
				client,
				queryFn: fn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			await page.getByTestId('set-stale-time-zero').click();
			await new Promise((resolve) => setTimeout(resolve, 10));

			await expect.element(page.getByTestId('data')).toHaveTextContent('"first"');
			await expect.element(page.getByTestId('query-key')).toHaveTextContent('["tracked",1]');
			expect(fn).toHaveBeenCalledTimes(1);

			await page.getByTestId('increment-query-key').click();

			await expect.element(page.getByTestId('data')).toHaveTextContent('"second"');
			await expect.element(page.getByTestId('query-key')).toHaveTextContent('["tracked",2]');
			expect(fn).toHaveBeenCalledTimes(2);

			await page.getByTestId('decrement-query-key').click();

			await expect.element(page.getByTestId('data')).toHaveTextContent('"first"');
			await expect.element(page.getByTestId('query-key')).toHaveTextContent('["tracked",1]');
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('tracks only queryKey from queryOptions state, not queryFn', async () => {
			const initialFn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockImplementation(({ queryKey }) => Promise.resolve(`initial:${String(queryKey[1])}`));
			const nextFn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockImplementation(({ queryKey }) => Promise.resolve(`next:${String(queryKey[1])}`));

			render(TrackedQueryOptions, {
				client,
				queryFn: initialFn,
				nextQueryFn: nextFn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"initial:1"');
			expect(initialFn).toHaveBeenCalledTimes(1);
			expect(nextFn).not.toHaveBeenCalled();

			await page.getByTestId('set-next-query-fn').click();
			await new Promise((resolve) => setTimeout(resolve, 10));

			await expect.element(page.getByTestId('data')).toHaveTextContent('"initial:1"');
			expect(initialFn).toHaveBeenCalledTimes(1);
			expect(nextFn).not.toHaveBeenCalled();

			await page.getByTestId('increment-query-key').click();

			await expect.element(page.getByTestId('data')).toHaveTextContent('"initial:2"');
			await expect.element(page.getByTestId('query-key')).toHaveTextContent('["tracked",2]');
			expect(initialFn).toHaveBeenCalledTimes(2);
			expect(nextFn).not.toHaveBeenCalled();
		});

		it('caches result for same key', async () => {
			let calls = 0;
			const fn = () => {
				calls++;
				return Promise.resolve('cached');
			};

			const s1 = render(TestQuery, { client, queryKey: ['cq-cache'], queryFn: fn });
			await expect.element(s1.getByTestId('status')).toHaveTextContent('success');
			s1.unmount();

			render(TestQuery, { client, queryKey: ['cq-cache'], queryFn: fn });
			await expect.element(page.getByTestId('data')).toHaveTextContent('cached');

			expect(calls).toBe(1);
		});

		it('sets pending to true while a new query is pending', async () => {
			let resolveFetch: (value: string) => void = () => undefined;
			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-pending-initial'],
				queryFn: () =>
					new Promise<string>((resolve) => {
						resolveFetch = resolve;
					})
			});

			await expect.element(screen.getByTestId('pending')).toHaveTextContent('true');

			resolveFetch('first');
			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('false');
		});

		it('reacts to setQuery while observed', async () => {
			const fn = vi.fn().mockResolvedValue('first');
			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-set-observed'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');

			client.setQuery(['cq-set-observed'], 'manual');

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"manual"');
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('refetches on every invalidateQuery while observed', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second')
				.mockResolvedValueOnce('third');

			render(TestQuery, {
				client,
				queryKey: ['cq-invalidate-observed'],
				queryFn: fn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			client.invalidateQuery(['cq-invalidate-observed']);
			await expect.element(page.getByTestId('data')).toHaveTextContent('"second"');
			expect(fn).toHaveBeenCalledTimes(2);

			client.invalidateQuery(['cq-invalidate-observed']);
			await expect.element(page.getByTestId('data')).toHaveTextContent('"third"');
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it('does not collapse repeated invalidateQuery calls while a refetch is pending', async () => {
			let resolveSecondFetch: (value: string) => void = () => undefined;
			let resolveThirdFetch: (value: string) => void = () => undefined;
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockImplementationOnce(
					() =>
						new Promise<string>((resolve) => {
							resolveSecondFetch = resolve;
						})
				)
				.mockImplementationOnce(
					() =>
						new Promise<string>((resolve) => {
							resolveThirdFetch = resolve;
						})
				);

			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-invalidate-observed-rapid'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			client.invalidateQuery(['cq-invalidate-observed-rapid']);
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('true');
			expect(fn).toHaveBeenCalledTimes(2);

			client.invalidateQuery(['cq-invalidate-observed-rapid']);
			expect(fn).toHaveBeenCalledTimes(3);

			resolveSecondFetch('second');
			await Promise.resolve();
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('true');

			resolveThirdFetch('third');
			await expect.element(screen.getByTestId('data')).toHaveTextContent('"third"');
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('false');
		});

		it('sets pending to true while revalidating the current query', async () => {
			let resolveSecondFetch: (value: string) => void = () => undefined;
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockImplementationOnce(
					() =>
						new Promise<string>((resolve) => {
							resolveSecondFetch = resolve;
						})
				);

			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-pending-revalidate'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('false');

			client.invalidateQuery(['cq-pending-revalidate']);
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('true');

			resolveSecondFetch('second');
			await expect.element(screen.getByTestId('data')).toHaveTextContent('"second"');
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('false');
		});

		it('refetches when removeQuery clears an observed cache entry', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second');
			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-remove-observed'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');

			client.removeQuery(['cq-remove-observed']);

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"second"');
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('refetches when clear clears an observed cache entry', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second');
			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-clear-observed'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');

			client.clear();

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"second"');
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('refetches on every invalidateQueries while observed', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second')
				.mockResolvedValueOnce('third');

			render(TestQuery, {
				client,
				queryKey: ['cq-prefix', 'observed'],
				queryFn: fn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			client.invalidateQueries(['cq-prefix']);
			await expect.element(page.getByTestId('data')).toHaveTextContent('"second"');
			expect(fn).toHaveBeenCalledTimes(2);

			client.invalidateQueries(['cq-prefix']);
			await expect.element(page.getByTestId('data')).toHaveTextContent('"third"');
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it('does not collapse repeated invalidateQueries calls while a refetch is pending', async () => {
			let resolveSecondFetch: (value: string) => void = () => undefined;
			let resolveThirdFetch: (value: string) => void = () => undefined;
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockImplementationOnce(
					() =>
						new Promise<string>((resolve) => {
							resolveSecondFetch = resolve;
						})
				)
				.mockImplementationOnce(
					() =>
						new Promise<string>((resolve) => {
							resolveThirdFetch = resolve;
						})
				);

			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-prefix', 'observed-rapid'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			client.invalidateQueries(['cq-prefix']);
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('true');
			expect(fn).toHaveBeenCalledTimes(2);

			client.invalidateQueries(['cq-prefix']);
			expect(fn).toHaveBeenCalledTimes(3);

			resolveSecondFetch('second');
			await Promise.resolve();
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('true');

			resolveThirdFetch('third');
			await expect.element(screen.getByTestId('data')).toHaveTextContent('"third"');
			await expect.element(screen.getByTestId('pending')).toHaveTextContent('false');
		});

		it('does not refetch on invalidateQuery while unobserved until observed again', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second');

			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-invalidate-unobserved'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			screen.unmount();

			client.invalidateQuery(['cq-invalidate-unobserved']);
			client.invalidateQuery(['cq-invalidate-unobserved']);
			expect(fn).toHaveBeenCalledTimes(1);

			render(TestQuery, {
				client,
				queryKey: ['cq-invalidate-unobserved'],
				queryFn: fn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"second"');
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('does not refetch on invalidateQueries while unobserved until observed again', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second');

			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-prefix', 'unobserved'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');
			expect(fn).toHaveBeenCalledTimes(1);

			screen.unmount();

			client.invalidateQueries(['cq-prefix']);
			client.invalidateQueries(['cq-prefix']);
			expect(fn).toHaveBeenCalledTimes(1);

			render(TestQuery, {
				client,
				queryKey: ['cq-prefix', 'unobserved'],
				queryFn: fn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"second"');
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('does not duplicate refetches across remounts and repeated invalidations', async () => {
			const fn = vi
				.fn<
					({
						signal,
						queryKey
					}: {
						signal?: AbortSignal;
						queryKey: readonly unknown[];
					}) => Promise<string>
				>()
				.mockResolvedValueOnce('first')
				.mockResolvedValueOnce('second')
				.mockResolvedValueOnce('third');

			const screen = render(TestQuery, {
				client,
				queryKey: ['cq-no-leak'],
				queryFn: fn
			});

			await expect.element(screen.getByTestId('data')).toHaveTextContent('"first"');

			client.invalidateQuery(['cq-no-leak']);
			await expect.element(screen.getByTestId('data')).toHaveTextContent('"second"');

			screen.unmount();
			client.invalidateQuery(['cq-no-leak']);

			render(TestQuery, {
				client,
				queryKey: ['cq-no-leak'],
				queryFn: fn
			});

			await expect.element(page.getByTestId('data')).toHaveTextContent('"third"');
			expect(fn).toHaveBeenCalledTimes(3);
		});
	});
});
