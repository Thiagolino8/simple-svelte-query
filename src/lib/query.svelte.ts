import { getAbortSignal, hydratable, untrack } from 'svelte';

type QueryOptions<T, K extends readonly unknown[] = readonly unknown[]> = {
	staleTime?: number;
	queryKey: K;
	queryFn: (context: { signal?: AbortSignal; queryKey: K }) => Promise<T>;
};

/**
 * Helper with const generics — preserves the `queryKey` literal type and propagates it to `queryFn`.
 */
export const queryOptions = <T, const K extends readonly unknown[]>(
	options: QueryOptions<T, K>
): QueryOptions<T, K> => options;

export type QueryResult<T> = PromiseLike<T> & {
	readonly queryKey: readonly unknown[];
};

export class Query<T, K extends readonly unknown[] = readonly unknown[]> {
	#staleTime = QueryClient.staleTime;
	#queryKey: string;
	#queryFn: (context: { signal?: AbortSignal; queryKey: K }) => Promise<T>;

	/**
	 * Creates a query with a serializable key, fetch function, and optional `staleTime`.
	 * @param options Query configuration.
	 */
	constructor({ staleTime = QueryClient.staleTime, queryKey, queryFn }: QueryOptions<T, K>) {
		this.#staleTime = staleTime;
		this.#queryKey = JSON.stringify(queryKey);
		this.#queryFn = queryFn;
	}

	/**
	 * Normalized query key used in the cache.
	 */
	get key() {
		return this.#queryKey;
	}

	/**
	 * Original query key.
	 */
	get queryKey() {
		return JSON.parse(this.#queryKey) as K;
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
	 * @param signal Optional signal for cancellation.
	 * @returns Promise with the resolved query value.
	 */
	fetch(signal?: AbortSignal) {
		return this.#queryFn({ signal, queryKey: this.queryKey });
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

	/**
	 * Sets the default `staleTime` used by new queries.
	 * @param defaultStaleTime Default staleness time in milliseconds.
	 */
	constructor(defaultStaleTime = 1000 * 60 * 5) {
		QueryClient.staleTime = defaultStaleTime;
	}

	/**
	 * Creates a reactive query with automatic cache read/write.
	 * @param optionsFn Function that returns the current query options.
	 * @returns Custom query thenable with `queryKey`.
	 */
	createQuery<T, const K extends readonly unknown[]>(
		optionsFn: () => QueryOptions<T, K>
	): QueryResult<T> {
		const queries = this.#queries;
		const { queryKey, ...rest } = $derived(optionsFn());
		const query = $derived(new Query({ queryKey, ...untrack(() => rest) }));
		const signal = $derived((void query.key, getAbortSignal()));
		const entry = $derived.by(() => {
			const cached = queries.get(query.key) as CacheEntry<T> | undefined;
			if (cached && !query.isStale(cached.createdAt)) return cached;
			const newEntry = new CacheEntry(
				cached ? query.fetch(signal) : hydratable(query.key, () => query.fetch(signal))
			);
			queries.set(query.key, newEntry);
			return newEntry;
		});
		return {
			get queryKey() {
				return query.queryKey;
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
		const entry = this.#queries.has(query.key)
			? query.isStale((this.#queries.get(query.key)! as CacheEntry<T>).createdAt)
				? new CacheEntry(query.fetch())
				: (this.#queries.get(query.key)! as CacheEntry<T>)
			: new CacheEntry(hydratable(query.key, () => query.fetch()));
		if (this.#queries.get(query.key) !== entry) this.#queries.set(query.key, entry);
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
			: new CacheEntry(hydratable(query.key, () => query.fetch()));
		if (this.#queries.get(query.key) !== entry) this.#queries.set(query.key, entry);
		return this.#queries.get(query.key)!.promise as Promise<T>;
	}

	/**
	 * Sets a value synchronously in cache for a query key.
	 * @param queryKey Query key.
	 * @param value Value to persist in cache.
	 */
	setQuery<T>(queryKey: unknown[], value: T | Promise<T>) {
		this.#queries.set(JSON.stringify(queryKey), new CacheEntry(Promise.resolve(value)));
	}

	/**
	 * Removes a specific query from cache.
	 * @param query Query instance to remove.
	 */
	removeQuery<T>(query: Query<T>) {
		this.#queries.delete(query.key);
	}

	/**
	 * Clears the entire query cache.
	 */
	clear() {
		this.#queries.clear();
	}

	/**
	 * Returns the cached promise for a key, if it exists.
	 * @param queryKey Query key.
	 * @returns Cached promise or `undefined`.
	 */
	getQuery<T>(queryKey: unknown[]) {
		return this.#queries.get(JSON.stringify(queryKey))?.promise as Promise<T> | undefined;
	}

	/**
	 * Invalidates exactly one query.
	 * @param queryKey Query key.
	 */
	invalidateQuery(queryKey: unknown[]) {
		this.#queries.get(JSON.stringify(queryKey))?.invalidate();
	}

	/**
	 * Invalidates all queries that start with the given prefix.
	 * @param queryKey Key prefix; empty invalidates all.
	 */
	invalidateQueries(queryKey: unknown[] = []) {
		const stringKey = JSON.stringify(queryKey).slice(0, -1);
		this.#queries.forEach((_, key) => {
			if (key.startsWith(stringKey)) {
				this.#queries.get(key)?.invalidate();
			}
		});
	}
}
