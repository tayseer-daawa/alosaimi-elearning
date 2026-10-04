/**
 * Per-student localStorage — no React, no UI.
 *
 * Progress keys are namespaced by the signed-in student's email, so signing
 * out or an expired token never deletes them, and another student on the same
 * device never reads them. Stopgap until progress is stored on the server.
 */

import { getStudentProfile } from "./authSession"

/** Unprefixed progress keys written before namespacing. */
const LEGACY_KEY =
  /^(lesson_playback:|lesson_completed:|lesson_notes:|continue_learning_path$)/

function namespace(): string | null {
  const email = getStudentProfile()?.email.trim().toLowerCase()
  return email ? `user:${email}:` : null
}

export function readUserItem(key: string): string | null {
  const ns = namespace()
  if (!ns) return null
  try {
    return localStorage.getItem(ns + key)
  } catch {
    return null
  }
}

/**
 * No-op once signed out, so pagehide/unmount flushes during logout's hard
 * navigation have no student to write for.
 */
export function writeUserItem(key: string, value: string): void {
  const ns = namespace()
  if (!ns) return
  try {
    localStorage.setItem(ns + key, value)
  } catch {
    // quota / private mode — ignore
  }
}

export function removeUserItem(key: string): void {
  const ns = namespace()
  if (!ns) return
  try {
    localStorage.removeItem(ns + key)
  } catch {
    // storage disabled — nothing to remove
  }
}

/**
 * Move progress saved before namespacing under the signed-in student. Only a
 * signed-in student could have written it, since sign-out used to wipe it.
 */
export function adoptLegacyUserData(): void {
  const ns = namespace()
  if (!ns) return
  try {
    for (const key of Object.keys(localStorage)) {
      if (!LEGACY_KEY.test(key)) continue
      const value = localStorage.getItem(key)
      if (value != null && localStorage.getItem(ns + key) == null) {
        localStorage.setItem(ns + key, value)
      }
      localStorage.removeItem(key)
    }
  } catch {
    // storage disabled — nothing to move
  }
}
