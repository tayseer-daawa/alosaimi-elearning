const STORAGE_KEY = "course_notes_pane_open"

/** Desktop notes column preference — default open for first visit. */
export function readNotesPaneOpen(): boolean {
  if (typeof window === "undefined") return true
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return true
  return raw === "1" || raw === "true"
}

export function writeNotesPaneOpen(open: boolean): void {
  localStorage.setItem(STORAGE_KEY, open ? "1" : "0")
}
