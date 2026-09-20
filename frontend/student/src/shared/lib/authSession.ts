/** Auth session keys and clear helper — no React, no UI. */

export const ACCESS_TOKEN_KEY = "access_token"
export const STUDENT_PROFILE_KEY = "student_profile"

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(STUDENT_PROFILE_KEY)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}
