// Shared by login and signup: exchange credentials for a session.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LoginService } from "@/client"
import { usersRepo } from "@/shared/api/usersRepo"
import {
  ACCESS_TOKEN_KEY,
  clearAccessToken,
  setStudentProfile,
} from "@/shared/lib/authSession"

export type SignInCredentials = {
  email: string
  password: string
}

/**
 * Says which request failed; the original error is on `reason`, so the form
 * can pick a message per step.
 */
export class SignInError extends Error {
  constructor(
    readonly stage: "credentials" | "profile",
    readonly reason: unknown,
  ) {
    super(`Sign-in failed at the ${stage} step`)
    this.name = "SignInError"
  }
}

async function signIn({ email, password }: SignInCredentials): Promise<void> {
  let accessToken: string
  try {
    const response = await LoginService.loginAccessToken({
      formData: { username: email.trim(), password },
    })
    accessToken = response.access_token
  } catch (err) {
    clearAccessToken()
    throw new SignInError("credentials", err)
  }

  // Store the token only long enough to call /users/me; clear it if that
  // fails so beforeLoad never treats a half-login as authenticated.
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  try {
    const profile = await usersRepo.me()
    setStudentProfile({
      email: profile.email,
      first_name: profile.first_name,
    })
  } catch (err) {
    clearAccessToken()
    throw new SignInError("profile", err)
  }
}

/**
 * Navigate once the sign-in attempt is over. Its outcome is already settled,
 * so a failed client-side navigation (e.g. a route chunk gone after a deploy)
 * must not reach the form as a sign-in error: load `href` as a full page.
 */
export async function navigateOrLoad(
  navigate: () => Promise<void>,
  href: string,
): Promise<void> {
  try {
    await navigate()
  } catch {
    window.location.assign(href)
  }
}

/** Store token → fetch /users/me → save profile. Callers navigate on success. */
export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signIn,
    // The default ("online") pauses the mutation while the browser reports
    // offline, so the form would spin with no message. Fail fast instead.
    networkMode: "always",
    onSuccess: () => {
      // Nothing cached before this sign-in belongs to the new session; drop it
      // so no screen renders another student's data while refetching.
      queryClient.removeQueries()
    },
  })
}
