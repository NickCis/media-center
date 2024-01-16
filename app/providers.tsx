// https://tanstack.com/query/latest/docs/react/guides/advanced-ssr
// https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient
'use client';

import { useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export function Providers({ children }: PropsWithChildren<{}>) {
  const [{ queryClient, persistOptions }] = useState(() => ({
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
  }));

  if (persistOptions)
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
