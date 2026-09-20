import { queryClient } from "@/providers/queryClient"
import { clearAuthSession } from "./authSession"

/**
 * Client-side logout: drop tokens, wipe React Query cache, hard-nav to welcome.
 * No backend revoke — JWT is Stateless until expiry.
 */
export function logout(): void {
  clearAuthSession()
  queryClient.clear()
  window.location.href = "/welcome"
}
