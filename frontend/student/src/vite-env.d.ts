/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  /** @deprecated Prefer VITE_API_URL. Kept as a legacy alias for fetcher.tsx. */
  readonly VITE_API_BASE?: string
  /**
   * Course notes pane (ملاحظات). Default off — set `true` to enable.
   * Only "true" / "1" / "yes" (case-insensitive) turn it on.
   */
  readonly VITE_NOTES_FEATURE_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
