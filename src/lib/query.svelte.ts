import { getAbortSignal, hydratable, untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';

const DEFAULT_STALE_TIME = 1000 * 60 * 5;
const HYDRATABLE_KEY_PREFIX = 'simple-svelte-query';
const defaultHashKey = (queryKey: readonly unknown[]) => JSON.stringify(queryKey);
const createEntryToken = () => Symbol();

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

/** @internal Test-only export. Not part of the package public API. */
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
		hashKey = QueryClient.hashKey
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
/** @internal Test-only export. Not part of the package public API. */
export class CacheEntry<T> {
	readonly promise: Promise<T>;
	readonly token: symbol;
	updatedAt = $state(Date.now());
	pending = $state(true);

	constructor(promise: Promise<T>, token = createEntryToken()) {
		this.promise = $state.raw(promise);
		this.token = token;
		const finish = () => {
			this.updatedAt = Date.now();
			this.pending = false;
		};
		void promise.then(finish, finish);
	}
}

/** @internal Test-only export. Not part of the package public API. */
export class QueryState<T> {
	#entry: CacheEntry<T> | undefined;
	#stagedEntry: CacheEntry<T> | undefined;
	#prefixHashes: SvelteSet<string>;
	#revision = $state(0);
	#currentToken = createEntryToken();

	constructor(prefixHashes: readonly string[] = []) {
		this.#prefixHashes = new SvelteSet(prefixHashes);
	}

	get entry() {
		return (this.#revision, this.#stagedEntry ?? this.#entry);
	}

	get currentToken() {
		return (this.#revision, this.#currentToken);
	}

	set entry(entry: CacheEntry<T> | undefined) {
		if (this.#entry === entry && this.#stagedEntry === undefined) return;
		this.#entry = entry;
		this.#stagedEntry = undefined;
		this.#revision += 1;
	}

	set stagedEntry(entry: CacheEntry<T> | undefined) {
		this.#stagedEntry = entry;
	}

	set prefixHashes(prefixHashes: readonly string[]) {
		this.#prefixHashes = new SvelteSet(prefixHashes);
	}

	matchesPrefix(prefixHash: string) {
		return this.#prefixHashes.has(prefixHash);
	}

	invalidate() {
		if (!this.#entry && !this.#stagedEntry) return;
		this.#currentToken = createEntryToken();
		this.#revision += 1;
	}
}

export class QueryClient {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#queries = new Map<string, QueryState<unknown>>();
	static staleTime: number = DEFAULT_STALE_TIME;
	static hashKey: (queryKey: readonly unknown[]) => string = defaultHashKey;
	#persist: QueryClientPersistOptions | undefined;
	#staleTime: number;
	#hashKey: (queryKey: readonly unknown[]) => string;

	/**
	 * Stores instance defaults and optional persistence.
	 * @param options Client options.
	 */
	constructor({
		staleTime = QueryClient.staleTime,
		persist,
		hashKey = QueryClient.hashKey
	}: QueryClientOptions = {}) {
		this.#staleTime = staleTime;
		this.#hashKey = hashKey;
		this.#persist = persist;
	}

	get #hydrator() {
		return this.#persist?.hydrate ?? (<T>(value: unknown) => Promise.resolve(value as T));
	}

	#getCacheKey(queryKey: readonly unknown[]) {
		return this.#hashKey(queryKey);
	}

	#getHydratableKey(cacheKey: string) {
		return `${HYDRATABLE_KEY_PREFIX}:${cacheKey}`;
	}

	#getPrefixHashes(queryKey: readonly unknown[]) {
		return queryKey.map((_, index) => this.#getCacheKey(queryKey.slice(0, index + 1)));
	}

	#createQuery<T, const K extends readonly unknown[]>(options: QueryOptions<T, K>) {
		return new Query({
			staleTime: options.staleTime ?? this.#staleTime,
			queryKey: options.queryKey,
			queryFn: options.queryFn,
			hashKey: this.#hashKey
		});
	}

	#getQueryState<T>(cacheKey: string, prefixHashes: readonly string[] = []) {
		const existing = this.#queries.get(cacheKey) as QueryState<T> | undefined;
		if (existing) {
			existing.prefixHashes = prefixHashes;
			return existing;
		}
		const state = new QueryState<T>(prefixHashes);
		this.#queries.set(cacheKey, state);
		return state;
	}

	#detachTask(task: unknown | Promise<unknown>) {
		void Promise.resolve(task).catch(() => {});
	}

	#persistResolvedEntry(queryKey: readonly unknown[], sourceEntry: CacheEntry<unknown>) {
		const cacheKey = this.#getCacheKey(queryKey);
		const persist = this.#persist;
		if (!persist) return;
		this.#detachTask(
			sourceEntry.promise.then((sourceValue) => {
				const currentEntry = this.#queries.get(cacheKey)?.entry;
				if (currentEntry !== sourceEntry) return;
				const dehydrated = persist.dehydrate
					? persist.dehydrate(queryKey, sourceValue)
					: sourceValue;
				if (dehydrated === undefined) return;
				return persist.persister.set(cacheKey, dehydrated);
			})
		);
	}

	#createHydratableEntry<T>(cacheKey: string, token: symbol, fetcher: () => Promise<T>) {
		const persist = this.#persist;
		const hydratableKey = this.#getHydratableKey(cacheKey);
		if (!persist) {
			return new CacheEntry<T>(hydratable(hydratableKey, fetcher), token);
		}
		const hydratedPromise = Promise.resolve(persist.persister.get(cacheKey))
			.then((persistedValue) =>
				persistedValue === undefined
					? hydratable(hydratableKey, fetcher)
					: this.#hydrator<T>(persistedValue)
			)
			.catch(() => hydratable(hydratableKey, fetcher));
		return new CacheEntry<T>(hydratedPromise, token);
	}

	#createNextEntry<T, const K extends readonly unknown[]>(
		query: Query<T, K>,
		cacheKey: string,
		queryKey: K,
		token: symbol,
		cached: CacheEntry<T> | undefined,
		signal?: AbortSignal
	) {
		return cached
			? new CacheEntry(query.fetch(queryKey, signal), token)
			: this.#createHydratableEntry(cacheKey, token, () => query.fetch(queryKey, signal));
	}

	#resolveEntry<T, const K extends readonly unknown[]>(
		query: Query<T, K>,
		cacheKey: string,
		queryKey: K,
		currentToken: symbol,
		cached?: CacheEntry<T>,
		signal?: AbortSignal,
		ignoreStale = false
	) {
		if (
			cached &&
			cached.token === currentToken &&
			(ignoreStale || !query.isStale(cached.updatedAt))
		) {
			return cached;
		}
		return this.#createNextEntry(query, cacheKey, queryKey, currentToken, cached, signal);
	}

	#syncEntry<T>(state: QueryState<T>, queryKey: readonly unknown[], entry: CacheEntry<T>) {
		state.entry = entry;
		this.#persistResolvedEntry(queryKey, entry);
	}

	#stageObservedEntry<T, const K extends readonly unknown[]>(
		state: QueryState<T>,
		query: Query<T, K>,
		cacheKey: string,
		queryKey: K,
		signal?: AbortSignal
	) {
		const cached = state.entry;
		const entry = this.#resolveEntry(query, cacheKey, queryKey, state.currentToken, cached, signal);
		if (cached !== entry) {
			state.stagedEntry = entry;
		}
		return entry;
	}

	/**
	 * Creates a reactive query with automatic cache read/write.
	 * @param optionsFn Function that returns the current query options.
	 * @returns Custom query thenable with `queryKey` and `pending`.
	 */
	createQuery<T, const K extends readonly unknown[]>(
		optionsFn: () => QueryOptions<T, K>
	): QueryResult<T> {
		const queryKey = $derived(optionsFn().queryKey);
		const cacheKey = $derived(this.#getCacheKey(queryKey));
		const prefixHashes = $derived(this.#getPrefixHashes(queryKey));
		const { staleTime, queryFn } = untrack(optionsFn);
		const query = $derived(
			this.#createQuery({
				staleTime,
				queryKey,
				queryFn
			})
		);
		const signal = $derived((void queryKey, getAbortSignal()));
		const state = $derived(this.#getQueryState<T>(cacheKey, prefixHashes));
		const entry = $derived(this.#stageObservedEntry(state, query, cacheKey, queryKey, signal));
		$effect.pre(() => {
			this.#syncEntry(state, queryKey, entry);
		});
		return {
			get queryKey() {
				return queryKey;
			},
			get pending() {
				return $state.eager(entry.pending);
			},
			get then() {
				const promise = entry.promise;
				return promise.then.bind(promise);
			}
		};
	}

	/**
	 * Fetches a query from cache; reloads when missing or stale.
	 * @param options Query options.
	 * @returns Promise with the query value.
	 */
	fetchQuery<T, const K extends readonly unknown[]>(options: QueryOptions<T, K>) {
		const query = this.#createQuery(options);
		const cacheKey = this.#getCacheKey(options.queryKey);
		const prefixHashes = this.#getPrefixHashes(options.queryKey);
		const state = this.#getQueryState<T>(cacheKey, prefixHashes);
		const cached = state.entry;
		const entry = this.#resolveEntry(query, cacheKey, options.queryKey, state.currentToken, cached);
		this.#syncEntry(state, options.queryKey, entry);
		return entry.promise;
	}

	/**
	 * Ensures a cache entry without checking staleness.
	 * @param options Query options.
	 * @returns Promise associated with the cache entry.
	 */
	ensureQuery<T, const K extends readonly unknown[]>(options: QueryOptions<T, K>) {
		const query = this.#createQuery(options);
		const cacheKey = this.#getCacheKey(options.queryKey);
		const prefixHashes = this.#getPrefixHashes(options.queryKey);
		const state = this.#getQueryState<T>(cacheKey, prefixHashes);
		const entry = this.#resolveEntry(
			query,
			cacheKey,
			options.queryKey,
			state.currentToken,
			state.entry,
			undefined,
			true
		);
		this.#syncEntry(state, options.queryKey, entry);
		return entry.promise;
	}

	/**
	 * Sets a value synchronously in cache for a query key.
	 * @param queryKey Query key.
	 * @param value Value to persist in cache.
	 */
	setQuery<T>(queryKey: unknown[], value: T | Promise<T>) {
		const cacheKey = this.#getCacheKey(queryKey);
		const prefixHashes = this.#getPrefixHashes(queryKey);
		const state = this.#getQueryState<T>(cacheKey, prefixHashes);
		this.#syncEntry(state, queryKey, new CacheEntry(Promise.resolve(value), state.currentToken));
	}

	/**
	 * Removes a specific query from cache.
	 * @param queryKey Original query key to remove.
	 */
	removeQuery(queryKey: readonly unknown[]) {
		const cacheKey = this.#getCacheKey(queryKey);
		const state = this.#queries.get(cacheKey);
		if (state) {
			state.entry = undefined;
		}
		if (!this.#persist) return;
		this.#detachTask(this.#persist.persister.del(cacheKey));
	}

	/**
	 * Clears the entire query cache.
	 */
	clear() {
		for (const state of this.#queries.values()) {
			state.entry = undefined;
		}
		if (!this.#persist) return;
		this.#detachTask(this.#persist.persister.clear());
	}

	/**
	 * Returns the cached promise for a key, if it exists.
	 * @param queryKey Query key.
	 * @returns Cached promise or `undefined`.
	 */
	getQuery<T>(queryKey: unknown[]) {
		return this.#queries.get(this.#getCacheKey(queryKey))?.entry?.promise as Promise<T> | undefined;
	}

	/**
	 * Invalidates exactly one query.
	 * @param queryKey Query key.
	 */
	invalidateQuery(queryKey: unknown[]) {
		const state = this.#queries.get(this.#getCacheKey(queryKey));
		if (state) {
			state.invalidate();
		}
	}

	/**
	 * Invalidates all queries that start with the given prefix.
	 * @param queryKey Key prefix; empty invalidates all.
	 */
	invalidateQueries(queryKey: unknown[] = []) {
		const prefixHash = queryKey.length === 0 ? undefined : this.#getCacheKey(queryKey);
		this.#queries.forEach((state) => {
			if (!prefixHash || state.matchesPrefix(prefixHash)) {
				state.invalidate();
			}
		});
	}
}
