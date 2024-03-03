'use client';

import {
  useEffect,
  useRef,
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';
import type {
  DefaultError,
  QueryClient,
  QueryKey,
  QueryFunctionContext,
} from '@tanstack/query-core';
import {
  hashKey,
  useQuery,
  useQueries,
  useIsRestoring,
  useQueryClient,
  type DefinedUseQueryResult,
  type UseQueryOptions,
  type UseQueryResult,
  type DefinedInitialDataOptions,
  type UndefinedInitialDataOptions,
  type QueriesResults,
  type QueriesOptions,
} from '@tanstack/react-query';

interface ValueState<T = any> {
  data: T;
  dataUpdatedAt: number;
}
interface Value<T = any> {
  queryHash: string;
  // queryKey:
  state: ValueState<T>;
}

export interface Persister {
  getItem(key: string): Promise<Value<any>>;
  setItem(key: string, value: ValueState<any>): Promise<void>;
  shouldRevalidate(dataUpdatedAt: number): boolean;
}

export class PersisterClient implements Persister {
  key: string;
  state: {
    queries: Record<string, Value>;
    timestamp: number;
  };
  hasLoaded = false;
  timeout: any = undefined;
  throttle = 5000;
  staleTime: number;

  constructor({
    key,
    staleTime = 24 * 60 * 60 * 1000,
    // gcTime =
  }: {
    key: string;
    staleTime?: number;
  }) {
    this.key = key;
    this.state = { queries: {}, timestamp: Date.now() };
    this.staleTime = staleTime;
  }

  shouldRevalidate(dataUpdatedAt: number) {
    return dataUpdatedAt < Date.now() - this.staleTime;
  }

  getState() {
    if (!this.hasLoaded) {
      try {
        this.state = JSON.parse(localStorage.getItem(this.key) || '');
      } catch (e) {
        this.state = { queries: {}, timestamp: Date.now() };
      }
      this.hasLoaded = true;
    }

    return this.state;
  }

  save() {
    // FIXME: if this function is spammed, no save will be performed
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(
      () => localStorage.setItem(this.key, JSON.stringify(this.state)),
      this.throttle,
    );
  }

  async getItem(key: string) {
    return this.getState().queries[key];
  }

  async setItem(queryHash: string, state: ValueState) {
    const globalState = this.getState();
    globalState.queries[queryHash] = {
      queryHash,
      state,
    };
    globalState.timestamp = Date.now();
    this.save();
  }
}

export function enhaceQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryClient: QueryClient,
  persisterClient: Persister | null,
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>;

export function enhaceQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryClient: QueryClient,
  persisterClient: Persister | null,
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>;

export function enhaceQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryClient: QueryClient,
  persisterClient: Persister | null,
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>;

export function enhaceQuery(
  queryClient: QueryClient,
  persisterClient: Persister | null,
  options: UseQueryOptions,
) {
  if (!persisterClient || !options.queryFn) return options;
  const queryFn = options.queryFn;
  return {
    ...options,
    networkMode: options.networkMode || 'offlineFirst',
    queryFn: async (context: QueryFunctionContext) => {
      const isRefetch = !!queryClient.getQueryData(context.queryKey);
      const hashedKey = hashKey(context.queryKey);
      const value = await persisterClient.getItem(hashedKey);

      if (context.signal?.aborted)
        throw new DOMException('AbortError', 'AbortError');

      if (!value) {
        const data = await queryFn(context);
        persisterClient.setItem(hashedKey, {
          dataUpdatedAt: Date.now(),
          data,
        });

        return data;
      }

      if (
        persisterClient.shouldRevalidate(value.state.dataUpdatedAt) ||
        isRefetch
      ) {
        (async () => {
          const data = await queryFn(context);
          queryClient.setQueryData(context.queryKey, data);
          await persisterClient.setItem(hashedKey, {
            dataUpdatedAt: Date.now(),
            data,
          });
        })();
      }

      return value.state.data;
    },
  };
}

export const PersisterClientContext = createContext<Persister | null>(null);

export function usePersisterClient(): Persister | null {
  return useContext(PersisterClientContext);
}

export function PersisterClientProvider({
  client,
  children,
}: PropsWithChildren<{ client: Persister }>) {
  return (
    <PersisterClientContext.Provider value={client}>
      {children}
    </PersisterClientContext.Provider>
  );
}

export function usePersistedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError>;

export function usePersistedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedUseQueryResult<TData, TError>;

export function usePersistedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError>;

export function usePersistedQuery(options: UseQueryOptions) {
  const queryClient = useQueryClient();
  const persisterClient = usePersisterClient();
  return useQuery(enhaceQuery(queryClient, persisterClient, options));
}

export function usePersistedQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>({
  queries,
  ...options
}: {
  queries: readonly [...QueriesOptions<T>];
  combine?: (result: QueriesResults<T>) => TCombinedResult;
}): TCombinedResult {
  const queryClient = useQueryClient();
  const persisterClient = usePersisterClient();
  return useQueries({
    ...options,
    queries: (queries as any).map((q: any) =>
      enhaceQuery(queryClient, persisterClient, q),
    ),
  });
}
