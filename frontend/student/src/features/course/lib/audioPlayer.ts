/** Pure audio-player helpers and tuning constants — no React. */

/** YouTube-like seek amounts (seconds). */
export const ARROW_SEEK = 5
export const JL_SEEK = 10
/** Visible skip on every viewport — ±10 (podcast habit). Arrows still ±5. */
export const SKIP_SECONDS = JL_SEEK
export const VOLUME_STEP = 0.05

export const AUDIO_LOAD_TIMEOUT_MS = 20_000
/** Wait before showing buffer UI — skips the flash on fast range fetches. */
export const BUFFER_SHOW_DELAY_MS = 400
/** Once shown, keep buffer UI up at least this long to avoid show/hide jank. */
export const BUFFER_MIN_VISIBLE_MS = 350
/** Throttle for non-forced resume-position writes. */
export const PERSIST_THROTTLE_MS = 2500

export const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const
export type Rate = (typeof RATES)[number]

export type BufferedRange = { start: number; end: number }

export function isRate(value: number): value is Rate {
  return (RATES as readonly number[]).includes(value)
}

export function nextRate(current: number, direction: 1 | -1): Rate {
  const idx = RATES.indexOf(current as Rate)
  const from = idx >= 0 ? idx : 1
  const clamped = Math.min(RATES.length - 1, Math.max(0, from + direction))
  return RATES[clamped]!
}

export function audioLoadTimeoutMs(): number {
  if (typeof window === "undefined") return AUDIO_LOAD_TIMEOUT_MS
  const override = (window as Window & { __COURSE_AUDIO_TIMEOUT_MS__?: number })
    .__COURSE_AUDIO_TIMEOUT_MS__
  return typeof override === "number" && override > 0
    ? override
    : AUDIO_LOAD_TIMEOUT_MS
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? m.toString().padStart(2, "0") : String(m)
  const ss = s.toString().padStart(2, "0")
  // Long lectures (often 1–3h): show H:MM:SS so 153:36 is not mistaken for minutes.
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function seekHudDetail(seconds: number): string {
  const abs = Math.abs(seconds)
  return `${seconds < 0 ? "−" : "+"}${abs} ثوانٍ`
}

export function volumeHudDetail(level: number): string {
  return `${Math.round(level * 100)}٪`
}

export function rateHudDetail(rate: number): string {
  return `${rate}×`
}

export function clampVolume(level: number): number {
  return Math.min(1, Math.max(0, Math.round(level * 100) / 100))
}

/** Clamp a target position into the media's seekable window. */
export function clampToDuration(audio: HTMLAudioElement, seconds: number) {
  const max = Number.isFinite(audio.duration) ? audio.duration : 0
  return Math.min(Math.max(0, seconds), max)
}

export function isPlayableSrc(src: string | undefined): src is string {
  return Boolean(
    src &&
      /^https?:\/\//.test(src) &&
      !/(?:example\.com|soundhelix\.com|pdfobject\.com)/.test(src),
  )
}

export function readBufferedRanges(audio: HTMLAudioElement): BufferedRange[] {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return []
  const ranges: BufferedRange[] = []
  try {
    for (let i = 0; i < audio.buffered.length; i++) {
      ranges.push({
        start: audio.buffered.start(i),
        end: audio.buffered.end(i),
      })
    }
  } catch {
    // InvalidStateError while media reloads
  }
  return ranges
}

export function sameRanges(a: BufferedRange[], b: BufferedRange[]): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (range, i) => range.start === b[i]!.start && range.end === b[i]!.end,
  )
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}

/** Menu open / item focused — let arrows & Enter work; Space is stolen by player. */
export function isMenuNavigationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('[role="menu"], [role="menuitem"], [data-scope="menu"]'),
  )
}
