/** Auth session keys and clear helper — no React, no UI. */

export const ACCESS_TOKEN_KEY = "access_token"
export const STUDENT_PROFILE_KEY = "student_profile"

export type StudentProfile = {
  email: string
  first_name?: string
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(STUDENT_PROFILE_KEY)
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
