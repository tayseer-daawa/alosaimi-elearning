/**
 * Student course-player feature gates (Vite env).
 * Defaults stay off for v0 — set VITE_NOTES_FEATURE_ENABLED=true in
 * frontend/student/.env (or Docker build args) to re-enable notes UI.
 */
function envFlag(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes"
}

export const NOTES_FEATURE_ENABLED = envFlag(
  import.meta.env.VITE_NOTES_FEATURE_ENABLED,
)
