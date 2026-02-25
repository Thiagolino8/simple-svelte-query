import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { Query, QueryClient, queryOptions } from './query.svelte.ts';
import TestQuery from './TestQuery.svelte';

let savedStaleTime: number;

beforeEach(() => {
	savedStaleTime = QueryClient.staleTime;
});

afterEach(() => {
	QueryClient.staleTime = savedStaleTime;
});

// ---------------------------------------------------------------------------
// queryOptions
// ---------------------------------------------------------------------------
describe('queryOptions', () => {
	it('returns the same options reference', () => {
		const fn = () => Promise.resolve({ name: 'Alice' });
		const opts = queryOptions({ queryKey: ['users', 1] as const, queryFn: fn });

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

	it('deserializes queryKey', () => {
		const q = new Query({ queryKey: ['products', 'phone'], queryFn: () => Promise.resolve(null) });
		expect(q.queryKey).toEqual(['products', 'phone']);
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
		const result = await q.fetch(ctrl.signal);

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
// QueryClient
// ---------------------------------------------------------------------------
describe('QueryClient', () => {
	let client: QueryClient;

	beforeEach(() => {
		client = new QueryClient(5000);
	});

	// -- constructor --------------------------------------------------------
	describe('constructor', () => {
		it('sets static staleTime', () => {
			new QueryClient(12345);
			expect(QueryClient.staleTime).toBe(12345);
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
	});

	// -- removeQuery --------------------------------------------------------
	describe('removeQuery', () => {
		it('removes cached entry', () => {
			client.setQuery(['a'], 1);
			client.removeQuery(new Query<number>({ queryKey: ['a'], queryFn: () => Promise.resolve(1) }));
			expect(client.getQuery(['a'])).toBeUndefined();
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
			const shortClient = new QueryClient(0);
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
			const shortClient = new QueryClient(0);
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
	});
});
