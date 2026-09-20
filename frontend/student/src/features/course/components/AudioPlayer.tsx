import {
  Box,
  Button,
  Flex,
  IconButton,
  Link,
  Menu,
  Slider,
  Text,
} from "@chakra-ui/react"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ListMusic,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react"
import type { MutableRefObject } from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  COMPLETE_RATIO,
  loadPlayback,
  loadVolumePrefs,
  markLessonCompleted,
  resumePosition,
  savePlaybackSafe,
  saveVolumePrefs,
} from "../lib/lessonProgress"
import { PlayerActionHud, type PlayerHudPayload } from "./PlayerActionHud"
import PlayerShortcutsHelp from "./PlayerShortcutsHelp"

/** Compact chrome controls — avoid the tall default button recipe. */
const chromeIconProps = {
  variant: "ghost" as const,
  size: "sm" as const,
  h: { base: "11", md: "8" } as const,
  minW: { base: "11", md: "8" } as const,
  minH: { base: "11", md: "8" } as const,
  p: "0" as const,
  borderRadius: "full" as const,
  color: "brand.secondary" as const,
}

/** YouTube-like seek amounts (seconds). */
const ARROW_SEEK = 5
const JL_SEEK = 10
const AUDIO_LOAD_TIMEOUT_MS = 20_000
/** Wait before showing buffer UI — skips the flash on fast range fetches. */
const BUFFER_SHOW_DELAY_MS = 400
/** Once shown, keep buffer UI up at least this long to avoid show/hide jank. */
const BUFFER_MIN_VISIBLE_MS = 350
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const
type Rate = (typeof RATES)[number]

function audioLoadTimeoutMs(): number {
  if (typeof window === "undefined") return AUDIO_LOAD_TIMEOUT_MS
  const override = (window as Window & { __COURSE_AUDIO_TIMEOUT_MS__?: number })
    .__COURSE_AUDIO_TIMEOUT_MS__
  return typeof override === "number" && override > 0
    ? override
    : AUDIO_LOAD_TIMEOUT_MS
}

function nextRate(current: number, direction: 1 | -1): Rate {
  const idx = RATES.indexOf(current as Rate)
  const from = idx >= 0 ? idx : 1
  const clamped = Math.min(RATES.length - 1, Math.max(0, from + direction))
  return RATES[clamped]!
}

function formatTime(seconds: number): string {
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

function seekHudDetail(seconds: number): string {
  const abs = Math.abs(seconds)
  return `${seconds < 0 ? "−" : "+"}${abs} ثوانٍ`
}

function volumeHudDetail(level: number): string {
  return `${Math.round(level * 100)}٪`
}

function isPlayableSrc(src: string | undefined): src is string {
  return Boolean(
    src &&
      /^https?:\/\//.test(src) &&
      !/(?:example\.com|soundhelix\.com|pdfobject\.com)/.test(src),
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}

/** Menu open / item focused — let arrows & Enter work; Space is stolen by player. */
function isMenuNavigationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('[role="menu"], [role="menuitem"], [data-scope="menu"]'),
  )
}

function blurIframes() {
  for (const frame of document.querySelectorAll("iframe")) {
    if (document.activeElement === frame) {
      frame.blur()
    }
  }
}

export type AudioPlaybackApi = {
  getCurrentTime: () => number
  seekTo: (seconds: number) => void
}

export type AudioPlayerProps = {
  src?: string
  title?: string
  /** Stable lesson id — used to persist resume position / rate locally */
  lessonId?: string
  onPrevLesson?: () => void
  onNextLesson?: () => void
  hasPrevLesson?: boolean
  hasNextLesson?: boolean
  /** Opens the lesson playlist (now-playing title, like a media app). */
  onOpenLessonList?: () => void
  /** Imperative bridge for notes timestamps (insert / jump). */
  playbackApiRef?: MutableRefObject<AudioPlaybackApi | null>
}

export default function AudioPlayer({
  src,
  title = "الشرح الصوتي",
  lessonId,
  onPrevLesson,
  onNextLesson,
  hasPrevLesson = false,
  hasNextLesson = false,
  onOpenLessonList,
  playbackApiRef,
}: AudioPlayerProps) {
  const labelId = useId()
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => {
    return loadVolumePrefs()?.volume ?? 1
  })
  const [muted, setMuted] = useState(() => {
    return loadVolumePrefs()?.muted ?? false
  })
  const [rate, setRate] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [scrubPreview, setScrubPreview] = useState<number | null>(null)
  const [bufferedRanges, setBufferedRanges] = useState<
    { start: number; end: number }[]
  >([])
  const [_reloadKey, setReloadKey] = useState(0)
  const [showVolume, setShowVolume] = useState(false)
  const [hudPayload, setHudPayload] = useState<PlayerHudPayload | null>(null)
  const [hudFlashId, setHudFlashId] = useState(0)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const audioUrl = isPlayableSrc(src) ? src : undefined
  const displayTime = scrubPreview ?? currentTime

  const playingRef = useRef(isPlaying)
  const mutedRef = useRef(muted)
  const volumeRef = useRef(volume)
  const rateRef = useRef(rate)
  const lessonIdRef = useRef(lessonId)
  const lastSavedAtRef = useRef(0)
  const didResumeRef = useRef(false)
  const scrubbingRef = useRef(false)
  const scrubPreviewRef = useRef<number | null>(null)
  const pointerScrubbingRef = useRef(false)
  const wasPlayingBeforeScrubRef = useRef(false)
  const lastSeekCommitAtRef = useRef(0)
  const lastSeekCommitValueRef = useRef(-1)
  const bufferShowDelayRef = useRef<number | null>(null)
  const bufferHideDelayRef = useRef<number | null>(null)
  const bufferShownAtRef = useRef<number | null>(null)
  const isBufferingRef = useRef(false)
  const onPrevRef = useRef(onPrevLesson)
  const onNextRef = useRef(onNextLesson)
  const hasPrevRef = useRef(hasPrevLesson)
  const hasNextRef = useRef(hasNextLesson)
  const shortcutsOpenRef = useRef(shortcutsOpen)

  const clearBufferTimers = useCallback(() => {
    if (bufferShowDelayRef.current != null) {
      window.clearTimeout(bufferShowDelayRef.current)
      bufferShowDelayRef.current = null
    }
    if (bufferHideDelayRef.current != null) {
      window.clearTimeout(bufferHideDelayRef.current)
      bufferHideDelayRef.current = null
    }
  }, [])

  const markBufferingSoon = useCallback(() => {
    // Still need the indicator — cancel a pending min-visible hide.
    if (bufferHideDelayRef.current != null) {
      window.clearTimeout(bufferHideDelayRef.current)
      bufferHideDelayRef.current = null
    }
    // Already visible or a delayed show is pending — don't restart the clock.
    if (isBufferingRef.current || bufferShowDelayRef.current != null) return
    bufferShowDelayRef.current = window.setTimeout(() => {
      bufferShowDelayRef.current = null
      bufferShownAtRef.current = performance.now()
      isBufferingRef.current = true
      setIsBuffering(true)
    }, BUFFER_SHOW_DELAY_MS)
  }, [])

  const clearBuffering = useCallback(() => {
    if (bufferShowDelayRef.current != null) {
      // Never became visible — cancel quietly.
      window.clearTimeout(bufferShowDelayRef.current)
      bufferShowDelayRef.current = null
      return
    }
    if (!isBufferingRef.current) return
    if (bufferHideDelayRef.current != null) return

    const shownAt = bufferShownAtRef.current
    const elapsed =
      shownAt != null ? performance.now() - shownAt : BUFFER_MIN_VISIBLE_MS
    const remaining = BUFFER_MIN_VISIBLE_MS - elapsed

    const hide = () => {
      bufferHideDelayRef.current = null
      bufferShownAtRef.current = null
      isBufferingRef.current = false
      setIsBuffering(false)
    }

    if (remaining > 0) {
      bufferHideDelayRef.current = window.setTimeout(hide, remaining)
    } else {
      hide()
    }
  }, [])

  const syncBufferedRanges = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      setBufferedRanges([])
      return
    }
    const next: { start: number; end: number }[] = []
    try {
      for (let i = 0; i < audio.buffered.length; i++) {
        next.push({
          start: audio.buffered.start(i),
          end: audio.buffered.end(i),
        })
      }
    } catch {
      // InvalidStateError while media reloads
    }
    setBufferedRanges(next)
  }, [])

  const flashHud = useCallback((payload: PlayerHudPayload) => {
    setHudPayload(payload)
    setHudFlashId((id) => id + 1)
  }, [])

  /** Keep shortcuts alive: blur iframe/menu/slider focus back onto the player chrome. */
  const focusPlayerChrome = useCallback(() => {
    blurIframes()
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      playerRef.current &&
      playerRef.current.contains(active) &&
      active !== playerRef.current
    ) {
      active.blur()
    }
    playerRef.current?.focus({ preventScroll: true })
  }, [])

  const persistPlayback = useCallback(
    (position: number, playbackRate: number, force = false) => {
      const id = lessonIdRef.current
      if (!id) return
      const now = Date.now()
      if (!force && now - lastSavedAtRef.current < 2500) return
      lastSavedAtRef.current = now
      savePlaybackSafe(id, position, playbackRate)
    },
    [],
  )

  useEffect(() => {
    playingRef.current = isPlaying
  }, [isPlaying])
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  useEffect(() => {
    volumeRef.current = volume
  }, [volume])
  useEffect(() => {
    rateRef.current = rate
  }, [rate])
  useEffect(() => {
    lessonIdRef.current = lessonId
  }, [lessonId])
  useEffect(() => {
    shortcutsOpenRef.current = shortcutsOpen
  }, [shortcutsOpen])
  useEffect(() => {
    onPrevRef.current = onPrevLesson
    onNextRef.current = onNextLesson
    hasPrevRef.current = hasPrevLesson
    hasNextRef.current = hasNextLesson
  }, [onPrevLesson, onNextLesson, hasPrevLesson, hasNextLesson])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)
    setMediaLoading(Boolean(audioUrl))
    clearBufferTimers()
    bufferShownAtRef.current = null
    isBufferingRef.current = false
    setIsBuffering(false)
    setScrubPreview(null)
    setBufferedRanges([])
    scrubbingRef.current = false
    didResumeRef.current = false
    lastSavedAtRef.current = 0

    const saved = lessonId ? loadPlayback(lessonId) : null
    if (saved && RATES.includes(saved.rate as Rate)) {
      rateRef.current = saved.rate as Rate
      setRate(saved.rate as Rate)
    } else {
      rateRef.current = 1
      setRate(1)
    }

    if (!audioUrl) return

    let settled = false
    const markReady = () => {
      if (settled) return
      settled = true
      setMediaLoading(false)
    }
    const markFailed = (message: string) => {
      if (settled) return
      settled = true
      setIsPlaying(false)
      setMediaLoading(false)
      setError(message)
    }

    const loadTimer = window.setTimeout(() => {
      markFailed(
        "استغرق تحميل الصوت وقتاً طويلاً. تحقق من الاتصال أو أعد المحاولة.",
      )
    }, audioLoadTimeoutMs())

    const onTime = () => {
      if (!scrubbingRef.current) {
        setCurrentTime(audio.currentTime)
      }
      persistPlayback(audio.currentTime, rateRef.current)
      syncBufferedRanges()
      const dur = audio.duration
      if (
        lessonIdRef.current &&
        Number.isFinite(dur) &&
        dur > 0 &&
        audio.currentTime / dur >= COMPLETE_RATIO
      ) {
        markLessonCompleted(lessonIdRef.current)
      }
    }
    const onMeta = () => {
      if (!Number.isFinite(audio.duration)) return
      setDuration(audio.duration)
      audio.playbackRate = rateRef.current
      markReady()
      syncBufferedRanges()
      if (didResumeRef.current || !saved) return
      const resume = resumePosition(saved.position, audio.duration)
      if (resume != null) {
        markBufferingSoon()
        audio.currentTime = resume
        setCurrentTime(resume)
      }
      didResumeRef.current = true
    }
    const onCanPlay = () => {
      markReady()
      clearBuffering()
      syncBufferedRanges()
    }
    const onWaiting = () => {
      // Same delayed path as seeking — immediate true flashes on fast ranges.
      markBufferingSoon()
    }
    const onSeeking = () => {
      markBufferingSoon()
    }
    const onSeeked = () => {
      syncBufferedRanges()
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        clearBuffering()
      }
    }
    const onPlaying = () => {
      clearBuffering()
    }
    const onProgress = () => {
      syncBufferedRanges()
    }
    const onEnded = () => {
      setIsPlaying(false)
      clearBuffering()
      const endAt = Number.isFinite(audio.duration)
        ? audio.duration
        : audio.currentTime
      setCurrentTime(0)
      if (lessonIdRef.current) {
        markLessonCompleted(lessonIdRef.current)
        // Do not write 0 — that wipes resume under Strict Mode remounts.
        persistPlayback(endAt, rateRef.current, true)
      }
    }
    const onPause = () => {
      persistPlayback(audio.currentTime, rateRef.current, true)
    }
    const onError = () => {
      clearBuffering()
      markFailed("تعذر تشغيل الملف الصوتي. قد يكون الرابط غير متاح حالياً.")
    }

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("durationchange", onMeta)
    audio.addEventListener("canplay", onCanPlay)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("seeking", onSeeking)
    audio.addEventListener("seeked", onSeeked)
    audio.addEventListener("playing", onPlaying)
    audio.addEventListener("progress", onProgress)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("error", onError)
    audio.src = audioUrl
    audio.load()

    return () => {
      window.clearTimeout(loadTimer)
      clearBufferTimers()
      persistPlayback(audio.currentTime, rateRef.current, true)
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("durationchange", onMeta)
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("seeking", onSeeking)
      audio.removeEventListener("seeked", onSeeked)
      audio.removeEventListener("playing", onPlaying)
      audio.removeEventListener("progress", onProgress)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("error", onError)
    }
  }, [
    audioUrl,
    lessonId,
    persistPlayback,
    clearBufferTimers,
    clearBuffering,
    markBufferingSoon,
    syncBufferedRanges,
  ])

  // Flush prefs on tab hide / reload (React effect cleanup alone is unreliable).
  useEffect(() => {
    const flush = () => {
      const audio = audioRef.current
      const id = lessonIdRef.current
      if (id && audio && Number.isFinite(audio.currentTime)) {
        savePlaybackSafe(id, audio.currentTime, rateRef.current)
      }
      saveVolumePrefs(volumeRef.current, mutedRef.current)
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("pagehide", flush)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const retryAudioLoad = () => {
    setError(null)
    setMediaLoading(true)
    setReloadKey((k) => k + 1)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
  }, [rate])

  useEffect(() => {
    if (volume === 0) setMuted(true)
  }, [volume])

  useEffect(() => {
    saveVolumePrefs(volume, muted)
  }, [volume, muted])

  const seekBy = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio || !audioUrl) return
      const max = Number.isFinite(audio.duration) ? audio.duration : 0
      const next = Math.min(Math.max(0, audio.currentTime + delta), max)
      markBufferingSoon()
      audio.currentTime = next
      setCurrentTime(next)
    },
    [audioUrl, markBufferingSoon],
  )

  const commitSeek = useCallback(
    (value: number) => {
      const audio = audioRef.current
      if (!audio || !audioUrl) return
      const max = Number.isFinite(audio.duration) ? audio.duration : 0
      const next = Math.min(Math.max(0, value), max)
      const now = performance.now()
      // Zag fires onValueChangeEnd on pointer-up as well as our window listener —
      // ignore the duplicate within the same gesture.
      if (
        now - lastSeekCommitAtRef.current < 80 &&
        Math.abs(next - lastSeekCommitValueRef.current) < 0.5
      ) {
        scrubbingRef.current = false
        pointerScrubbingRef.current = false
        scrubPreviewRef.current = null
        setScrubPreview(null)
        return
      }
      lastSeekCommitAtRef.current = now
      lastSeekCommitValueRef.current = next
      scrubbingRef.current = false
      pointerScrubbingRef.current = false
      scrubPreviewRef.current = null
      setScrubPreview(null)
      setCurrentTime(next)
      markBufferingSoon()
      // Single media seek — this is what triggers the HTTP 206 range fetch.
      audio.currentTime = next
      persistPlayback(next, rateRef.current, true)
      if (wasPlayingBeforeScrubRef.current) {
        wasPlayingBeforeScrubRef.current = false
        void audio.play().then(
          () => setIsPlaying(true),
          () => setIsPlaying(false),
        )
      }
    },
    [audioUrl, markBufferingSoon, persistPlayback],
  )

  // Expose seek/time for lesson notes timestamps.
  useEffect(() => {
    if (!playbackApiRef) return
    playbackApiRef.current = {
      getCurrentTime: () => audioRef.current?.currentTime ?? 0,
      seekTo: (seconds: number) => {
        commitSeek(seconds)
        focusPlayerChrome()
      },
    }
    return () => {
      playbackApiRef.current = null
    }
  }, [playbackApiRef, commitSeek, focusPlayerChrome])

  const beginPointerScrub = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (pointerScrubbingRef.current) return
    pointerScrubbingRef.current = true
    scrubbingRef.current = true
    wasPlayingBeforeScrubRef.current = !audio.paused && !audio.ended
    // Pause so the browser stops requesting ranges at the old playhead while scrubbing.
    if (wasPlayingBeforeScrubRef.current) {
      audio.pause()
      setIsPlaying(false)
    }
  }, [audioUrl])

  const previewScrub = useCallback((value: number) => {
    scrubbingRef.current = true
    scrubPreviewRef.current = value
    setScrubPreview(value)
  }, [])

  const endPointerScrub = useCallback(() => {
    if (!pointerScrubbingRef.current) return
    const pending = scrubPreviewRef.current
    if (pending == null) {
      pointerScrubbingRef.current = false
      scrubbingRef.current = false
      const audio = audioRef.current
      if (audio && wasPlayingBeforeScrubRef.current) {
        wasPlayingBeforeScrubRef.current = false
        void audio.play().then(
          () => setIsPlaying(true),
          () => setIsPlaying(false),
        )
      }
      return
    }
    commitSeek(pending)
    focusPlayerChrome()
  }, [commitSeek, focusPlayerChrome])

  // Commit scrub on pointer/touch release anywhere (thumb may leave the control).
  useEffect(() => {
    const onPointerUp = () => endPointerScrub()
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    return () => {
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }
  }, [endPointerScrub])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    try {
      if (playingRef.current) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
        setError(null)
      }
    } catch {
      setIsPlaying(false)
      setError("تعذر تشغيل الملف الصوتي.")
    }
  }, [audioUrl])

  const toggleMute = useCallback(
    (showHud = false) => {
      const nextMuted = !mutedRef.current
      setMuted(nextMuted)
      if (showHud) {
        flashHud({ kind: nextMuted ? "mute" : "unmute" })
      }
    },
    [flashHud],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      const key = event.key
      const lower = key.toLowerCase()
      const inMenu = isMenuNavigationTarget(event.target)

      // While the rate menu is open, keep arrow/Enter for a11y menu nav.
      if (
        inMenu &&
        (key === "ArrowDown" ||
          key === "ArrowUp" ||
          key === "Home" ||
          key === "End" ||
          key === "Enter")
      ) {
        return
      }

      const claim = () => {
        event.preventDefault()
        event.stopPropagation()
      }

      if (key === "Escape" && shortcutsOpenRef.current) {
        claim()
        setShortcutsOpen(false)
        focusPlayerChrome()
        return
      }
      if (key === "?" || (key === "/" && event.shiftKey)) {
        claim()
        setShortcutsOpen((open) => !open)
        return
      }
      if (shortcutsOpenRef.current) return

      if (key === " " || lower === "k") {
        claim()
        flashHud({ kind: playingRef.current ? "pause" : "play" })
        void togglePlay()
        focusPlayerChrome()
        return
      }
      if (key === "ArrowLeft") {
        claim()
        seekBy(-ARROW_SEEK)
        flashHud({
          kind: "seek-back",
          detail: seekHudDetail(-ARROW_SEEK),
        })
        return
      }
      if (key === "ArrowRight") {
        claim()
        seekBy(ARROW_SEEK)
        flashHud({
          kind: "seek-forward",
          detail: seekHudDetail(ARROW_SEEK),
        })
        return
      }
      if (lower === "j") {
        claim()
        seekBy(-JL_SEEK)
        flashHud({
          kind: "seek-back",
          detail: seekHudDetail(-JL_SEEK),
        })
        return
      }
      if (lower === "l") {
        claim()
        seekBy(JL_SEEK)
        flashHud({
          kind: "seek-forward",
          detail: seekHudDetail(JL_SEEK),
        })
        return
      }
      if (lower === "m") {
        claim()
        toggleMute(true)
        return
      }
      if (key === "<" || (key === "," && event.shiftKey)) {
        claim()
        const next = nextRate(rateRef.current, -1)
        setRate(next)
        rateRef.current = next
        persistPlayback(audioRef.current?.currentTime ?? 0, next, true)
        flashHud({ kind: "rate", detail: `${next}×` })
        return
      }
      if (key === ">" || (key === "." && event.shiftKey)) {
        claim()
        const next = nextRate(rateRef.current, 1)
        setRate(next)
        rateRef.current = next
        persistPlayback(audioRef.current?.currentTime ?? 0, next, true)
        flashHud({ kind: "rate", detail: `${next}×` })
        return
      }
      if (key === "ArrowUp") {
        claim()
        const next = Math.min(
          1,
          Math.round((volumeRef.current + 0.05) * 100) / 100,
        )
        setMuted(false)
        setVolume(next)
        flashHud({ kind: "volume", detail: volumeHudDetail(next) })
        return
      }
      if (key === "ArrowDown") {
        claim()
        const next = Math.max(
          0,
          Math.round((volumeRef.current - 0.05) * 100) / 100,
        )
        setVolume(next)
        if (next === 0) setMuted(true)
        flashHud({ kind: "volume", detail: volumeHudDetail(next) })
        return
      }
      if (key === "N" && event.shiftKey && hasNextRef.current) {
        claim()
        flashHud({ kind: "next-lesson" })
        onNextRef.current?.()
        return
      }
      if (key === "P" && event.shiftKey && hasPrevRef.current) {
        claim()
        flashHud({ kind: "prev-lesson" })
        onPrevRef.current?.()
      }
    }

    // Capture phase so slider/menu/button focus cannot eat shortcuts first.
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [
    togglePlay,
    seekBy,
    flashHud,
    toggleMute,
    focusPlayerChrome,
    persistPlayback,
  ])

  return (
    <Box
      ref={playerRef}
      borderTopWidth="1px"
      borderColor="brand.secondary"
      px={{ base: 3, md: 6 }}
      pt={3}
      pb={{
        base: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        md: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
      dir="rtl"
      data-testid="audio-player"
      tabIndex={0}
      outline="none"
      _focusVisible={{ boxShadow: "outline" }}
      onMouseEnter={() => {
        // PDF iframe steals keys; reclaim when the pointer returns to the player.
        if (document.activeElement instanceof HTMLIFrameElement) {
          focusPlayerChrome()
        }
      }}
      aria-keyshortcuts="Space, ArrowLeft, ArrowRight, KeyJ, KeyL, KeyK, KeyM, Shift+Comma, Shift+Period, Shift+KeyN, Shift+KeyP, Shift+Slash"
    >
      <PlayerActionHud payload={hudPayload} flashId={hudFlashId} />
      {audioUrl ? (
        // biome-ignore lint/a11y/useMediaCaption: lesson audio has no captions yet
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          aria-labelledby={labelId}
        />
      ) : null}

      <Flex align="center" justify="center" gap={1} mb={2}>
        <IconButton
          {...chromeIconProps}
          color="brand.primary"
          aria-label="الدرس السابق"
          disabled={!hasPrevLesson}
          onClick={onPrevLesson}
          data-testid="audio-prev-lesson"
        >
          <ChevronRight size={18} />
        </IconButton>
        <Button
          variant="ghost"
          h="auto"
          minH="8"
          px={2}
          py={1}
          borderRadius="md"
          color="brand.primary"
          maxW={{ base: "60%", md: "md" }}
          onClick={onOpenLessonList}
          disabled={!onOpenLessonList}
          aria-label={`قائمة الدروس — ${title}`}
          data-testid="lesson-list-open"
          title="فتح قائمة الدروس"
        >
          <Flex align="center" gap={1.5} minW={0}>
            <Text
              id={labelId}
              fontSize="sm"
              fontWeight="medium"
              textAlign="center"
              lineClamp={1}
            >
              {title}
            </Text>
            <Box flexShrink={0} opacity={0.75} aria-hidden>
              <ListMusic size={14} />
            </Box>
          </Flex>
        </Button>
        <IconButton
          {...chromeIconProps}
          color="brand.primary"
          aria-label="الدرس التالي"
          disabled={!hasNextLesson}
          onClick={onNextLesson}
          data-testid="audio-next-lesson"
        >
          <ChevronLeft size={18} />
        </IconButton>
      </Flex>

      {!audioUrl && (
        <Text
          fontSize="sm"
          color="brand.secondary"
          textAlign="center"
          mb={2}
          data-testid="audio-player-empty"
        >
          لا يتوفر تسجيل صوتي لهذا الدرس.
        </Text>
      )}

      {audioUrl && mediaLoading && !error ? (
        <Text
          fontSize="sm"
          color="brand.secondary"
          textAlign="center"
          mb={2}
          data-testid="audio-player-loading"
        >
          جاري تحميل الصوت…
        </Text>
      ) : null}

      {audioUrl && isBuffering && !mediaLoading && !error ? (
        <Text
          fontSize="sm"
          color="brand.secondary"
          textAlign="center"
          mb={2}
          data-testid="audio-player-buffering"
        >
          جاري تحميل الموضع… يُرجى الانتظار قليلاً.
        </Text>
      ) : null}

      {error && (
        <Box textAlign="center" mb={2} data-testid="audio-player-error">
          <Text fontSize="sm" color="red.500" mb={2}>
            {error}
          </Text>
          <Flex justify="center" gap={3} flexWrap="wrap">
            <Button
              size="sm"
              variant="ghost"
              color="brand.primary"
              onClick={retryAudioLoad}
              data-testid="audio-player-retry"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </Button>
            {audioUrl ? (
              <Link
                href={audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                color="brand.primary"
                textDecoration="underline"
                display="inline-flex"
                alignItems="center"
                gap={1}
                data-testid="audio-player-open-tab"
              >
                <ExternalLink size={14} />
                فتح الصوت في تبويب جديد
              </Link>
            ) : null}
          </Flex>
        </Box>
      )}

      <Flex align="center" gap={{ base: 2, md: 4 }} w="full" dir="ltr">
        <IconButton
          aria-label={
            isBuffering ? "جاري التحميل" : isPlaying ? "إيقاف مؤقت" : "تشغيل"
          }
          bg="brand.secondary"
          color="white"
          borderRadius="full"
          boxSize={{ base: 11, md: 10 }}
          minW={{ base: 11, md: 10 }}
          disabled={!audioUrl}
          onClick={() => void togglePlay()}
          _hover={{ opacity: 0.9 }}
          data-testid="audio-play-pause"
        >
          {isBuffering ? (
            <Box
              display="inline-flex"
              animation="spin 0.9s linear infinite"
              css={{
                "@keyframes spin": {
                  from: { transform: "rotate(0deg)" },
                  to: { transform: "rotate(360deg)" },
                },
              }}
            >
              <RefreshCw size={20} />
            </Box>
          ) : isPlaying ? (
            <Pause size={20} fill="white" />
          ) : (
            <Play size={20} fill="white" />
          )}
        </IconButton>

        <Text
          fontSize="xs"
          color="brand.secondary"
          minW={{ base: "12", md: "14" }}
          textAlign="end"
          fontVariantNumeric="tabular-nums"
          data-testid="audio-current-time"
        >
          {formatTime(displayTime)}
        </Text>

        <Box flex="1" minW={0} py={{ base: 3, md: 2 }}>
          <Slider.Root
            min={0}
            max={duration > 0 ? duration : 1}
            step={1}
            value={[Math.min(displayTime, duration || 0)]}
            disabled={!audioUrl || duration <= 0}
            onValueChange={({ value }) => previewScrub(value[0] ?? 0)}
            onValueChangeEnd={({ value }) => {
              // Pointer drags commit via window pointerup + beginPointerScrub.
              // This path covers keyboard nudges on the thumb.
              if (pointerScrubbingRef.current) return
              commitSeek(value[0] ?? 0)
              focusPlayerChrome()
            }}
            data-testid="audio-seek"
          >
            <Slider.Control
              h={{ base: "8", md: "5" }}
              display="flex"
              alignItems="center"
              cursor="pointer"
              onPointerDown={(event) => {
                if (event.button !== 0) return
                beginPointerScrub()
              }}
            >
              <Slider.Track
                h={{ base: "3", md: "2.5" }}
                borderRadius="full"
                bg="gray.200"
                position="relative"
                overflow="hidden"
              >
                {duration > 0
                  ? bufferedRanges.map((range) => (
                      <Box
                        key={`${range.start}-${range.end}`}
                        position="absolute"
                        top={0}
                        bottom={0}
                        left={`${(range.start / duration) * 100}%`}
                        width={`${((range.end - range.start) / duration) * 100}%`}
                        bg="gray.400"
                        opacity={0.55}
                        pointerEvents="none"
                        data-testid="audio-buffered-range"
                      />
                    ))
                  : null}
                <Slider.Range
                  bg="brand.secondary"
                  position="relative"
                  zIndex={1}
                />
              </Slider.Track>
              <Slider.Thumbs
                boxSize={{ base: 5, md: 4 }}
                bg="white"
                borderWidth="2px"
                borderColor="brand.secondary"
                shadow="sm"
                zIndex={2}
                _hover={{ boxSize: { base: 6, md: 5 } }}
                _active={{ boxSize: { base: 6, md: 5 } }}
              />
            </Slider.Control>
          </Slider.Root>
        </Box>

        <Text
          fontSize="xs"
          color="brand.secondary"
          minW={{ base: "12", md: "14" }}
          textAlign="start"
          fontVariantNumeric="tabular-nums"
          data-testid="audio-duration"
        >
          {formatTime(duration)}
        </Text>

        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              {...chromeIconProps}
              minW={{ base: "11", md: "10" }}
              px={2}
              aria-label="سرعة التشغيل"
              disabled={!audioUrl}
              data-testid="audio-rate"
            >
              <Text fontSize="xs" fontWeight="bold" lineHeight="1">
                {rate}×
              </Text>
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content minW="24" borderRadius="lg" py={1}>
              {RATES.map((r) => (
                <Menu.Item
                  key={r}
                  value={String(r)}
                  borderRadius="md"
                  onClick={() => {
                    setRate(r)
                    rateRef.current = r
                    persistPlayback(audioRef.current?.currentTime ?? 0, r, true)
                    flashHud({ kind: "rate", detail: `${r}×` })
                    // Defer so the menu can close, then drop focus off the trigger/items.
                    window.setTimeout(() => focusPlayerChrome(), 0)
                  }}
                >
                  {r}×
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>

        <Box
          position="relative"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          data-testid="audio-volume-wrap"
        >
          <IconButton
            {...chromeIconProps}
            aria-label={muted || volume === 0 ? "إلغاء كتم الصوت" : "كتم الصوت"}
            disabled={!audioUrl}
            onClick={() => {
              toggleMute(true)
              focusPlayerChrome()
            }}
            data-testid="audio-mute"
          >
            {muted || volume === 0 ? (
              <VolumeX size={22} />
            ) : (
              <Volume2 size={22} />
            )}
          </IconButton>
          {showVolume && audioUrl && (
            <Box
              position="absolute"
              bottom="100%"
              left="50%"
              transform="translateX(-50%)"
              // Padding bridges the gap so the cursor never "leaves" the hover zone.
              pb={3}
              pt={1}
              px={1}
              zIndex={2}
              data-testid="audio-volume-bridge"
            >
              <Box
                bg="white"
                boxShadow="lg"
                borderRadius="lg"
                px={3}
                py={3}
                data-testid="audio-volume-panel"
              >
                <Slider.Root
                  height="28"
                  orientation="vertical"
                  min={0}
                  max={100}
                  value={[Math.round((muted ? 0 : volume) * 100)]}
                  onValueChange={({ value }) => {
                    const next = (value[0] ?? 0) / 100
                    setVolume(next)
                    setMuted(next === 0)
                  }}
                  onValueChangeEnd={() => focusPlayerChrome()}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range bg="brand.primary" />
                    </Slider.Track>
                    <Slider.Thumbs borderColor="brand.primary" />
                  </Slider.Control>
                </Slider.Root>
              </Box>
            </Box>
          )}
        </Box>

        <PlayerShortcutsHelp
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      </Flex>
    </Box>
  )
}
