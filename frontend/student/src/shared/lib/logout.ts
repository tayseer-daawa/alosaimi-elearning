import { queryClient } from "@/providers/queryClient"
import { clearSession } from "./authSession"

/**
 * Client-side logout: drop the session and the React Query cache, hard-nav to
 * welcome. Lesson progress stays for this student's next sign-in.
 * No backend revoke — JWT is Stateless until expiry.
 */
export function logout(): void {
  clearSession()
  queryClient.clear()
  window.location.href = "/welcome"
}
