// Shared by login and signup: exchange credentials for a session.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { LoginService, UsersService } from "@/client"
import {
  ACCESS_TOKEN_KEY,
  clearAccessToken,
  setStudentProfile,
} from "@/shared/lib/authSession"
import { queryKeys } from "@/shared/lib/queryKeys"

export type SignInCredentials = {
  email: string
  password: string
}

/**
 * Says which request failed; the original error is on `reason`.
 *
 * Also keeps the raw ApiError away from the global mutation handler, which
 * would read a rejected login (e.g. 400 "Inactive user") as a dead session
 * and redirect to /welcome instead of letting the form show the message.
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
    const profile = await UsersService.readUserMe()
    setStudentProfile({
      email: profile.email,
      first_name: profile.first_name,
    })
  } catch (err) {
    clearAccessToken()
    throw new SignInError("profile", err)
  }
}

/** Store token → fetch /users/me → save profile. Callers navigate on success. */
export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      // A different student may have signed in on this device.
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}
