// https://tanstack.com/query/latest/docs/react/guides/advanced-ssr
// https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient
'use client';

import { useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  PersistentStorage,
  PersistentStorageProvider,
} from '@/lib/persistent-storage';

export function Providers({ children }: PropsWithChildren<{}>) {
  const [{ queryClient, persistOptions, persistentStorage }] = useState(() => ({
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: 60 * 1000,
          gcTime: 1000 * 60 * 60 * 24, // 24 hours
        },
      },
    }),
    persistOptions:
      typeof window !== 'undefined'
        ? {
            persister: createSyncStoragePersister({
              storage: window.localStorage,
            }),
          }
        : undefined,
    persistentStorage:
      typeof window !== 'undefined' && 'indexedDB' in window
        ? new PersistentStorage()
        : undefined,
  }));

  if (persistentStorage)
    children = (
      <PersistentStorageProvider persistentStorage={persistentStorage}>
        {children}
      </PersistentStorageProvider>
    );
  if (queryClient && persistOptions)
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >
        {children}
      </PersistQueryClientProvider>
    );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
