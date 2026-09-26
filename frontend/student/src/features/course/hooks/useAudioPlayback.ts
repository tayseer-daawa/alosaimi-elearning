import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import {
  audioLoadTimeoutMs,
  type BufferedRange,
  clampToDuration,
  isRate,
  PERSIST_THROTTLE_MS,
  type Rate,
  readBufferedRanges,
  sameRanges,
} from "../lib/audioPlayer"
import {
  COMPLETE_RATIO,
  isLessonCompleted,
  loadPlayback,
  markLessonCompleted,
  resumePosition,
  savePlaybackSafe,
} from "../lib/lessonProgress"

const LOAD_TIMEOUT_MESSAGE =
  "استغرق تحميل الصوت وقتاً طويلاً. تحقق من الاتصال أو أعد المحاولة."
const MEDIA_ERROR_MESSAGE =
  "تعذر تشغيل الملف الصوتي. قد يكون الرابط غير متاح حالياً."
const PLAY_ERROR_MESSAGE = "تعذر تشغيل الملف الصوتي."

type BufferingControls = {
  markBufferingSoon: () => void
  clearBuffering: () => void
  resetBuffering: () => void
}

type UseAudioPlaybackOptions = BufferingControls & {
  audioRef: RefObject<HTMLAudioElement | null>
  audioUrl: string | undefined
  lessonId: string | undefined
}

function markCompleted(lessonId: string) {
  if (!isLessonCompleted(lessonId)) markLessonCompleted(lessonId)
}

/**
 * Owns the <audio> lifecycle for one lesson: loading + timeout, resume point,
 * playback rate, buffered ranges, completion, and local persistence.
 */
export function useAudioPlayback({
  audioRef,
  audioUrl,
  lessonId,
  markBufferingSoon,
  clearBuffering,
  resetBuffering,
}: UseAudioPlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState<Rate>(1)
  const [error, setError] = useState<string | null>(null)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  const rateRef = useRef<Rate>(1)
  const lastSavedAtRef = useRef(0)

  const persistPlayback = useCallback(
    (position: number, playbackRate: number, force = false) => {
      if (!lessonId) return
      const now = Date.now()
      if (!force && now - lastSavedAtRef.current < PERSIST_THROTTLE_MS) return
      lastSavedAtRef.current = now
      savePlaybackSafe(lessonId, position, playbackRate)
    },
    [lessonId],
  )

  const applyRate = useCallback(
    (next: Rate) => {
      rateRef.current = next
      setRate(next)
      const audio = audioRef.current
      if (audio) audio.playbackRate = next
    },
    [audioRef],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey re-runs the load on retry
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)
    setMediaLoading(Boolean(audioUrl))
    setBufferedRanges([])
    resetBuffering()
    lastSavedAtRef.current = 0

    const saved = lessonId ? loadPlayback(lessonId) : null
    applyRate(saved && isRate(saved.rate) ? saved.rate : 1)

    if (!audioUrl) return

    let settled = false
    let didResume = false
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
    const syncBuffered = () => {
      const next = readBufferedRanges(audio)
      setBufferedRanges((prev) => (sameRanges(prev, next) ? prev : next))
    }

    const loadTimer = window.setTimeout(
      () => markFailed(LOAD_TIMEOUT_MESSAGE),
      audioLoadTimeoutMs(),
    )

    const onTime = () => {
      const t = audio.currentTime
      // Labels and the slider tick per second — skip sub-second re-renders.
      setCurrentTime((prev) => (Math.floor(prev) === Math.floor(t) ? prev : t))
      persistPlayback(t, rateRef.current)
      syncBuffered()
      const dur = audio.duration
      if (
        lessonId &&
        Number.isFinite(dur) &&
        dur > 0 &&
        t / dur >= COMPLETE_RATIO
      ) {
        markCompleted(lessonId)
      }
    }
    const onMeta = () => {
      if (!Number.isFinite(audio.duration)) return
      setDuration(audio.duration)
      audio.playbackRate = rateRef.current
      markReady()
      syncBuffered()
      if (didResume || !saved) return
      const resume = resumePosition(saved.position, audio.duration)
      if (resume != null) {
        markBufferingSoon()
        audio.currentTime = resume
        setCurrentTime(resume)
      }
      didResume = true
    }
    const onCanPlay = () => {
      markReady()
      clearBuffering()
      syncBuffered()
    }
    const onSeeked = () => {
      syncBuffered()
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        clearBuffering()
      }
    }
    const onEnded = () => {
      setIsPlaying(false)
      clearBuffering()
      const endAt = Number.isFinite(audio.duration)
        ? audio.duration
        : audio.currentTime
      setCurrentTime(0)
      if (lessonId) {
        markCompleted(lessonId)
        // Do not write 0 — that wipes resume under Strict Mode remounts.
        persistPlayback(endAt, rateRef.current, true)
      }
    }
    const onPause = () => {
      persistPlayback(audio.currentTime, rateRef.current, true)
    }
    const onError = () => {
      clearBuffering()
      markFailed(MEDIA_ERROR_MESSAGE)
    }

    const listeners: [keyof HTMLMediaElementEventMap, () => void][] = [
      ["timeupdate", onTime],
      ["loadedmetadata", onMeta],
      ["durationchange", onMeta],
      ["canplay", onCanPlay],
      // Same delayed path as seeking — immediate true flashes on fast ranges.
      ["waiting", markBufferingSoon],
      ["seeking", markBufferingSoon],
      ["seeked", onSeeked],
      ["playing", clearBuffering],
      ["progress", syncBuffered],
      ["ended", onEnded],
      ["pause", onPause],
      ["error", onError],
    ]
    for (const [type, fn] of listeners) audio.addEventListener(type, fn)
    audio.src = audioUrl
    audio.load()

    return () => {
      window.clearTimeout(loadTimer)
      resetBuffering()
      persistPlayback(audio.currentTime, rateRef.current, true)
      for (const [type, fn] of listeners) audio.removeEventListener(type, fn)
    }
  }, [
    audioRef,
    audioUrl,
    lessonId,
    reloadKey,
    applyRate,
    persistPlayback,
    markBufferingSoon,
    clearBuffering,
    resetBuffering,
  ])

  // Flush the resume point on tab hide / reload (effect cleanup alone is unreliable).
  useEffect(() => {
    if (!lessonId) return
    const flush = () => {
      const audio = audioRef.current
      if (audio && Number.isFinite(audio.currentTime)) {
        savePlaybackSafe(lessonId, audio.currentTime, rateRef.current)
      }
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
  }, [audioRef, lessonId])

  const resume = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    )
  }, [audioRef])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [audioRef])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (!audio.paused) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    try {
      await audio.play()
      setIsPlaying(true)
      setError(null)
    } catch (err) {
      // A pause while play() was pending — not a playback failure.
      if (err instanceof DOMException && err.name === "AbortError") return
      setIsPlaying(false)
      setError(PLAY_ERROR_MESSAGE)
    }
  }, [audioRef, audioUrl])

  const seekTo = useCallback(
    (seconds: number, { persist = false } = {}) => {
      const audio = audioRef.current
      if (!audio || !audioUrl) return
      const next = clampToDuration(audio, seconds)
      setCurrentTime(next)
      markBufferingSoon()
      // Single media seek — this is what triggers the HTTP 206 range fetch.
      audio.currentTime = next
      if (persist) persistPlayback(next, rateRef.current, true)
    },
    [audioRef, audioUrl, markBufferingSoon, persistPlayback],
  )

  const seekBy = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (audio) seekTo(audio.currentTime + delta)
    },
    [audioRef, seekTo],
  )

  const changeRate = useCallback(
    (next: Rate) => {
      applyRate(next)
      persistPlayback(audioRef.current?.currentTime ?? 0, next, true)
    },
    [audioRef, applyRate, persistPlayback],
  )

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  return {
    isPlaying,
    currentTime,
    duration,
    rate,
    error,
    mediaLoading,
    bufferedRanges,
    togglePlay,
    resume,
    pause,
    seekTo,
    seekBy,
    changeRate,
    retry,
  }
}
