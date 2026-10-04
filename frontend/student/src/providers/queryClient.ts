// Shared QueryClient instance — imported by providers and logout helpers.

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/client"
import {
  clearAccessToken,
  isDeadSessionResponse,
} from "@/shared/lib/authSession"

function handleApiError(error: Error) {
  if (
    error instanceof ApiError &&
    isDeadSessionResponse(error.status, error.body)
  ) {
    clearAccessToken()
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
