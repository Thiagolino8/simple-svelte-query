import { getAbortSignal, hydratable, untrack } from 'svelte';

type QueryOptions<T, K extends readonly unknown[] = readonly unknown[]> = {
	staleTime?: number;
	queryKey: K;
	queryFn: (context: { signal?: AbortSignal; queryKey: K }) => Promise<T>;
};

type QueryClientPersistValueHydrator = <T>(value: unknown) => Promise<T>;

type QueryClientPersister = {
	get: (key: string) => unknown | Promise<unknown>;
	set: (key: string, value: unknown) => unknown | Promise<unknown>;
	del: (key: string) => unknown | Promise<unknown>;
	clear: () => unknown | Promise<unknown>;
};

type QueryClientPersistOptions = {
	persister: QueryClientPersister;
	hydrate?: QueryClientPersistValueHydrator;
	dehydrate?: (queryKey: readonly unknown[], value: unknown) => unknown | undefined;
};

type QueryClientOptions = {
	staleTime?: number;
	persist?: QueryClientPersistOptions;
	hashKey?: (queryKey: readonly unknown[]) => string;
};

type QueryInternalOptions<T, K extends readonly unknown[] = readonly unknown[]> = QueryOptions<
	T,
	K
> & {
	hashKey?: (queryKey: K) => string;
};

/**
 * Helper with const generics — preserves the `queryKey` literal type and propagates it to `queryFn`.
 */
export const queryOptions = <T, const K extends readonly unknown[]>(
	options: QueryOptions<T, K>
): QueryOptions<T, K> => options;

export type QueryResult<T> = PromiseLike<T> & {
	readonly queryKey: readonly unknown[];
	readonly pending: boolean;
};

export class Query<T, K extends readonly unknown[] = readonly unknown[]> {
	#staleTime = QueryClient.staleTime;
	#queryKey: string;
	#queryFn: (context: { signal?: AbortSignal; queryKey: K }) => Promise<T>;

	/**
	 * Creates a query with a serializable key, fetch function, and optional `staleTime`.
	 * @param options Query configuration.
	 */
	constructor({
		staleTime = QueryClient.staleTime,
		queryKey,
		queryFn,
		hashKey = QueryClient.hashKey as (queryKey: K) => string
	}: QueryInternalOptions<T, K>) {
		this.#staleTime = staleTime;
		this.#queryKey = hashKey(queryKey);
		this.#queryFn = queryFn;
	}

	/**
	 * Normalized query key used in the cache.
	 */
	get key() {
		return this.#queryKey;
	}

	/**
	 * Indicates whether the cache entry is already stale.
	 * @param lastUpdated Last update timestamp in milliseconds.
	 * @returns `true` when it exceeds `staleTime`.
	 */
	isStale(lastUpdated: number) {
		return Date.now() - lastUpdated > this.#staleTime;
	}

	/**
	 * Executes `queryFn`.
	 * @param queryKey Original query key used for the fetch.
	 * @param signal Optional signal for cancellation.
	 * @returns Promise with the resolved query value.
	 */
	fetch(queryKey: K, signal?: AbortSignal) {
		return this.#queryFn({ signal, queryKey });
	}
}
class CacheEntry<T> {
	#promise: Promise<T>;
	#createdAt = $state(Date.now());

	constructor(promise: Promise<T>) {
		this.#promise = $state.raw(promise);
	}

	get promise() {
		return this.#promise;
	}

	get createdAt() {
		return this.#createdAt;
	}

	invalidate() {
		this.#createdAt = Number.NEGATIVE_INFINITY;
	}
}

export class QueryClient {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#queries = new Map<string, CacheEntry<unknown>>();
	static staleTime: number = 1000 * 60 * 5;
	static hashKey: (queryKey: readonly unknown[]) => string = JSON.stringify;
	#persist: QueryClientPersistOptions | undefined;

	/**
	 * Sets the global defaults used by new queries and stores optional persistence.
	 * @param options Client options.
	 */
	constructor({
		staleTime = 1000 * 60 * 5,
		persist,
		hashKey = JSON.stringify
	}: QueryClientOptions = {}) {
		QueryClient.staleTime = staleTime;
		QueryClient.hashKey = hashKey;
		this.#persist = persist;
	}

	#getHydrator() {
		return this.#persist?.hydrate ?? (<T>(value: unknown) => Promise.resolve(value as T));
	}

	#persistResolvedValue(queryKey: readonly unknown[], value: unknown) {
		const persist = this.#persist;
		if (!persist) return;
		const cacheKey = QueryClient.hashKey(queryKey);
		const dehydrated = persist.dehydrate ? persist.dehydrate(queryKey, value) : value;
		if (dehydrated === undefined) return;
		void Promise.resolve(persist.persister.set(cacheKey, dehydrated)).catch(() => {});
	}

	#persistResolvedEntry(queryKey: readonly unknown[], sourceEntry: CacheEntry<unknown>) {
		if (!this.#persist) return;
		const cacheKey = QueryClient.hashKey(queryKey);
		void sourceEntry.promise
			.then((sourceValue) => {
				const currentEntry = this.#queries.get(cacheKey);
				if (currentEntry !== sourceEntry) return;
				this.#persistResolvedValue(queryKey, sourceValue);
			})
			.catch(() => {});
	}

	#createHydratableEntry<T, const K extends readonly unknown[]>(
		query: Query<T, K>,
		fetcher: () => Promise<T>
	) {
		const persist = this.#persist;
		if (!persist) return new CacheEntry<T>(hydratable(query.key, fetcher));
		const hydratedPromise = Promise.resolve(persist.persister.get(query.key))
			.then((persistedValue) =>
				persistedValue === undefined
					? hydratable(query.key, fetcher)
					: this.#getHydrator()<T>(persistedValue)
			)
			.catch(() => hydratable(query.key, fetcher));
		return new CacheEntry<T>(hydratedPromise);
	}

	#setEntry<T>(cacheKey: string, entry: CacheEntry<T>) {
		this.#queries.set(cacheKey, entry);
	}

	/**
	 * Creates a reactive query with automatic cache read/write.
	 * @param optionsFn Function that returns the current query options.
	 * @returns Custom query thenable with `queryKey` and `pending`.
	 */
	createQuery<T, const K extends readonly unknown[]>(
		optionsFn: () => QueryOptions<T, K>
	): QueryResult<T> {
		const queries = this.#queries;
		const { queryKey, ...rest } = $derived(optionsFn());
		const query = $derived(new Query({ queryKey, ...untrack(() => rest) }));
		const signal = $derived((void queryKey, getAbortSignal()));
		const entry = $derived.by(() => {
			const cached = queries.get(query.key) as CacheEntry<T> | undefined;
			if (cached && !query.isStale(cached.createdAt)) return cached;
			const newEntry = cached
				? new CacheEntry(query.fetch(queryKey, signal))
				: this.#createHydratableEntry(query, () => query.fetch(queryKey, signal));
			this.#setEntry(query.key, newEntry);
			this.#persistResolvedEntry(queryKey, newEntry);
			return newEntry;
		});
		return {
			get queryKey() {
				return queryKey;
			},
			get pending() {
				return $state
					.eager(optionsFn().queryKey)
					.some((key, index) => key !== optionsFn().queryKey[index]);
			},
			get then() {
				const promise = entry.promise as Promise<T>;
				return <TResult1 = T, TResult2 = never>(
					onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
					onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
				) => promise.then(onfulfilled, onrejected);
			}
		};
	}

	/**
	 * Fetches a query from cache; reloads when missing or stale.
	 * @param options Query options.
	 * @returns Promise with the query value.
	 */
	fetchQuery<T, const K extends readonly unknown[]>(options: QueryOptions<T, K>) {
		const query = new Query(options);
		const cached = this.#queries.get(query.key) as CacheEntry<T> | undefined;
		const entry =
			cached && !query.isStale(cached.createdAt)
				? cached
				: cached
					? new CacheEntry(query.fetch(options.queryKey))
					: this.#createHydratableEntry(query, () => query.fetch(options.queryKey));
		if (this.#queries.get(query.key) !== entry) {
			this.#setEntry(query.key, entry);
		}
		this.#persistResolvedEntry(options.queryKey, entry);
		return entry.promise as Promise<T>;
	}

	/**
	 * Ensures a cache entry without checking staleness.
	 * @param options Query options.
	 * @returns Promise associated with the cache entry.
	 */
	ensureQuery<T, const K extends readonly unknown[]>(options: QueryOptions<T, K>) {
		const query = new Query(options);
		const entry = this.#queries.has(query.key)
			? (this.#queries.get(query.key)! as CacheEntry<T>)
			: this.#createHydratableEntry(query, () => query.fetch(options.queryKey));
		if (this.#queries.get(query.key) !== entry) {
			this.#setEntry(query.key, entry);
		}
		this.#persistResolvedEntry(options.queryKey, entry);
		return this.#queries.get(query.key)!.promise as Promise<T>;
	}

	/**
	 * Sets a value synchronously in cache for a query key.
	 * @param queryKey Query key.
	 * @param value Value to persist in cache.
	 */
	setQuery<T>(queryKey: unknown[], value: T | Promise<T>) {
		const cacheKey = QueryClient.hashKey(queryKey);
		const entry = new CacheEntry(Promise.resolve(value));
		this.#setEntry(cacheKey, entry);
		this.#persistResolvedEntry(queryKey, entry);
	}

	/**
	 * Removes a specific query from cache.
	 * @param query Query instance to remove.
	 */
	removeQuery<T>(query: Query<T>) {
		this.#queries.delete(query.key);
		if (!this.#persist) return;
		void Promise.resolve(this.#persist.persister.del(query.key)).catch(() => {});
	}

	/**
	 * Clears the entire query cache.
	 */
	clear() {
		this.#queries.clear();
		if (!this.#persist) return;
		void Promise.resolve(this.#persist.persister.clear()).catch(() => {});
	}

	/**
	 * Returns the cached promise for a key, if it exists.
	 * @param queryKey Query key.
	 * @returns Cached promise or `undefined`.
	 */
	getQuery<T>(queryKey: unknown[]) {
		return this.#queries.get(QueryClient.hashKey(queryKey))?.promise as Promise<T> | undefined;
	}

	/**
	 * Invalidates exactly one query.
	 * @param queryKey Query key.
	 */
	invalidateQuery(queryKey: unknown[]) {
		this.#queries.get(QueryClient.hashKey(queryKey))?.invalidate();
	}

	/**
	 * Invalidates all queries that start with the given prefix.
	 * For custom `hashKey`, prefix invalidation only works when the hash preserves
	 * prefix ordering (for example, adding a prefix to `JSON.stringify(queryKey)`).
	 * @param queryKey Key prefix; empty invalidates all.
	 */
	invalidateQueries(queryKey: unknown[] = []) {
		const hashedPrefix =
			queryKey.length === 0
				? ''
				: QueryClient.hashKey(queryKey).endsWith(']')
					? QueryClient.hashKey(queryKey).slice(0, -1)
					: QueryClient.hashKey(queryKey);
		this.#queries.forEach((_, hash) => {
			if (hash.startsWith(hashedPrefix)) {
				this.#queries.get(hash)?.invalidate();
			}
		});
	}
}
