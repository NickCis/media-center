// https://tanstack.com/query/latest/docs/react/guides/advanced-ssr
// https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient
'use client';

import { useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  PersistentStorage,
  PersistentStorageProvider,
} from '@/lib/persistent-storage';
import {
  PersisterClient,
  PersisterClientProvider,
} from '@/lib/query-persister';
import { CastManager, CastManagerProvider } from '@/lib/cast';

export function Providers({ children }: PropsWithChildren<{}>) {
  const [{ queryClient, persistentStorage, persisterClient, castManager }] =
    useState(() => ({
      queryClient: new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 5 * 60 * 1000, // 5 min
            gcTime: 10 * 60 * 1000, // 10 min
          },
        },
      }),
      persistentStorage:
        typeof window !== 'undefined' && 'indexedDB' in window
          ? new PersistentStorage()
          : undefined,
      persisterClient:
        typeof window !== 'undefined'
          ? new PersisterClient({
              key: '__media_center__persister__',
            })
          : undefined,
      castManager:
        typeof window !== 'undefined' ? new CastManager() : undefined,
    }));

  if (castManager)
    children = (
      <CastManagerProvider manager={castManager}>
        {children}
      </CastManagerProvider>
    );

  if (persistentStorage)
    children = (
      <PersistentStorageProvider persistentStorage={persistentStorage}>
        {children}
      </PersistentStorageProvider>
    );

  if (persisterClient)
    children = (
      <PersisterClientProvider client={persisterClient}>
        {children}
      </PersisterClientProvider>
    );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
