import { getAbortSignal, hydratable, untrack } from 'svelte';

type QueryOptions<T, K extends readonly unknown[] = readonly unknown[]> = {
	staleTime?: number;
	queryKey: K;
	queryFn: (context: { signal?: AbortSignal; queryKey: K }) => Promise<T>;
};

/**
 * Helper com const generics — preserva o tipo literal da `queryKey` e o propaga para `queryFn`.
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
	 * Cria uma query com chave serializável, função de busca e `staleTime` opcional.
	 * @param options Configuração da query.
	 */
	constructor({ staleTime = QueryClient.staleTime, queryKey, queryFn }: QueryOptions<T, K>) {
		this.#staleTime = staleTime;
		this.#queryKey = JSON.stringify(queryKey);
		this.#queryFn = queryFn;
	}

	/**
	 * Chave normalizada da query, usada no cache.
	 */
	get key() {
		return this.#queryKey;
	}

	/**
	 * Chave original da query.
	 */
	get queryKey() {
		return JSON.parse(this.#queryKey) as K;
	}

	/**
	 * Informa se o registro de cache já está expirado.
	 * @param lastUpdated Timestamp do último update em milissegundos.
	 * @returns `true` quando excede o `staleTime`.
	 */
	isStale(lastUpdated: number) {
		return Date.now() - lastUpdated > this.#staleTime;
	}

	/**
	 * Executa o `queryFn`.
	 * @param signal Sinal opcional para cancelamento.
	 * @returns Promise com o valor resolvido da query.
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
	 * Define o `staleTime` padrão usado pelas novas queries.
	 * @param defaultStaleTime Tempo padrão de staleness em milissegundos.
	 */
	constructor(defaultStaleTime = 1000 * 60 * 5) {
		QueryClient.staleTime = defaultStaleTime;
	}

	/**
	 * Cria uma query reativa com leitura/escrita automática no cache.
	 * @param optionsFn Função que retorna as opções atuais da query.
	 * @returns Thenable custom da query com `queryKey`.
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
	 * Busca uma query no cache; recarrega quando inexistente ou stale.
	 * @param options Opções da query.
	 * @returns Promise com o valor da query.
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
	 * Garante entrada em cache sem checar staleness.
	 * @param options Opções da query.
	 * @returns Promise associada à entrada em cache.
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
	 * Define valor sincronamente no cache para uma chave de query.
	 * @param queryKey Chave da query.
	 * @param value Valor a persistir no cache.
	 */
	setQuery<T>(queryKey: unknown[], value: T) {
		this.#queries.set(JSON.stringify(queryKey), new CacheEntry(Promise.resolve(value)));
	}

	/**
	 * Remove uma query específica do cache.
	 * @param query Instância da query a remover.
	 */
	removeQuery<T>(query: Query<T>) {
		this.#queries.delete(query.key);
	}

	/**
	 * Limpa todo o cache de queries.
	 */
	clear() {
		this.#queries.clear();
	}

	/**
	 * Retorna a promise em cache para uma chave, se existir.
	 * @param queryKey Chave da query.
	 * @returns Promise em cache ou `undefined`.
	 */
	getQuery<T>(queryKey: unknown[]) {
		return this.#queries.get(JSON.stringify(queryKey))?.promise as Promise<T> | undefined;
	}

	/**
	 * Invalida exatamente uma query.
	 * @param queryKey Chave da query.
	 */
	invalidateQuery(queryKey: unknown[]) {
		this.#queries.get(JSON.stringify(queryKey))?.invalidate();
	}

	/**
	 * Invalida todas as queries que começam com o prefixo informado.
	 * @param queryKey Prefixo da chave; vazio invalida todas.
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
