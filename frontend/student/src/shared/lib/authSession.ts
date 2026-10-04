/** Auth session keys and clear helpers — no React, no UI. */

export const ACCESS_TOKEN_KEY = "access_token"
export const STUDENT_PROFILE_KEY = "student_profile"

export type StudentProfile = {
  email: string
  first_name?: string
}

/**
 * The token is dead (expired, invalid account, failed login): drop only the
 * token. The profile stays so pagehide flushes still save the student's
 * progress under their namespace (see userStorage).
 */
export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // storage disabled — nothing to clear
  }
}

/**
 * Explicit sign-out: drop the token and profile. The student's progress stays
 * under their namespace for their next sign-in; nobody else can read it in
 * the app (see userStorage).
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(STUDENT_PROFILE_KEY)
  } catch {
    // storage disabled — nothing to clear
  }
}

/**
 * Responses from the backend's get_current_user that mean the token or the
 * account is no longer usable. The invalid-token case is a 403 there, while
 * other 403s are per-resource permission errors that must not sign out.
 */
const DEAD_SESSION_RESPONSES: ReadonlyArray<readonly [number, string]> = [
  [403, "Could not validate credentials"],
  [404, "User not found"],
  [400, "Inactive user"],
]

export function isDeadSessionResponse(status: number, body: unknown): boolean {
  if (status === 401) return true
  const detail =
    typeof body === "object" && body !== null && "detail" in body
      ? (body as { detail: unknown }).detail
      : undefined
  return DEAD_SESSION_RESPONSES.some(
    ([code, message]) => code === status && detail === message,
  )
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStudentProfile(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StudentProfile
    if (typeof parsed.email !== "string" || !parsed.email) return null
    return {
      email: parsed.email,
      first_name:
        typeof parsed.first_name === "string" && parsed.first_name.trim()
          ? parsed.first_name.trim()
          : undefined,
    }
  } catch {
    return null
  }
}

export function setStudentProfile(profile: StudentProfile): void {
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(profile))
}
