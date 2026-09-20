/** Timestamp tokens in student notes: [M:SS] or [H:MM:SS]. */

export const NOTE_TIMESTAMP_RE = /\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]/g

export function formatNoteTimestamp(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "[0:00]"
  const total = Math.floor(totalSeconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `[${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`
  }
  return `[${m}:${s.toString().padStart(2, "0")}]`
}

export function parseNoteTimestampToken(token: string): number | null {
  const m = /^\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]$/.exec(token)
  if (!m) return null
  const hours = m[1] != null ? Number(m[1]) : 0
  const minutes = Number(m[2])
  const seconds = Number(m[3])
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null
  }
  return hours * 3600 + minutes * 60 + seconds
}

/** Unique seek targets found in note text, in first-seen order. */
export function listNoteTimestamps(
  text: string,
): { label: string; seconds: number }[] {
  const seen = new Set<number>()
  const out: { label: string; seconds: number }[] = []
  const re = new RegExp(NOTE_TIMESTAMP_RE.source, "g")
  for (const match of text.matchAll(re)) {
    const label = match[0]
    const seconds = parseNoteTimestampToken(label)
    if (seconds == null || seen.has(seconds)) continue
    seen.add(seconds)
    out.push({ label, seconds })
  }
  return out
}
