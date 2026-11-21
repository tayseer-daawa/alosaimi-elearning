// Shared QueryClient instance — imported by providers and logout helpers.

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/client"
import {
  clearAccessToken,
  isDeadSessionResponse,
  isPublicAuthPath,
} from "@/shared/lib/authSession"

/**
 * The token or account is dead: drop the token and every cached query. On the
 * public auth pages, stay put so the form can show its own error (a rejected
 * login can look like a dead session, e.g. 400 "Inactive user").
 */
export function endDeadSession() {
  clearAccessToken()
  queryClient.clear()
  if (!isPublicAuthPath(window.location.pathname)) {
    window.location.href = "/welcome"
  }
}

function handleApiError(error: Error) {
  if (
    error instanceof ApiError &&
    isDeadSessionResponse(error.status, error.body)
  ) {
    endDeadSession()
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
