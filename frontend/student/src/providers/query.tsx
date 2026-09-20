// React Query global config + QueryClient.
// This file is infra only, never domain logic.

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { ApiError } from "@/client"
import { clearAuthSession } from "@/shared/lib/authSession"

function handleApiError(error: Error) {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    clearAuthSession()
    window.location.href = "/welcome"
  }
}

const client = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
