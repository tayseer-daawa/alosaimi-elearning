// Shared QueryClient instance — imported by providers and logout helpers.

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/client"
import { clearAuthSession } from "@/shared/lib/authSession"

function handleApiError(error: Error) {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    clearAuthSession()
    queryClient.clear()
    window.location.href = "/welcome"
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})
