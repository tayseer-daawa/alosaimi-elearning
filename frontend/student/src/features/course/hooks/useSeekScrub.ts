import {
  type RefObject,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"

type UseSeekScrubOptions = {
  audioRef: RefObject<HTMLAudioElement | null>
  enabled: boolean
  seekTo: (seconds: number, options?: { persist?: boolean }) => void
  resume: () => void
  pause: () => void
  /** Runs after a drag or keyboard nudge commits (e.g. reclaim shortcut focus). */
  onCommitted: () => void
}

/** Zag fires onValueChangeEnd on pointer-up as well as our window listener. */
const DUPLICATE_COMMIT_MS = 80
const DUPLICATE_COMMIT_DELTA = 0.5

/**
 * Seek-bar scrubbing: preview the time while dragging, pause so the browser
 * stops fetching ranges at the old playhead, and seek once on release.
 */
export function useSeekScrub({
  audioRef,
  enabled,
  seekTo,
  resume,
  pause,
  onCommitted,
}: UseSeekScrubOptions) {
  const [scrubPreview, setScrubPreview] = useState<number | null>(null)
  const previewRef = useRef<number | null>(null)
  const pointerActiveRef = useRef(false)
  const wasPlayingRef = useRef(false)
  const lastCommitRef = useRef({ at: 0, value: -1 })

  const clearPreview = useCallback(() => {
    pointerActiveRef.current = false
    previewRef.current = null
    setScrubPreview(null)
  }, [])

  const resumeIfWasPlaying = useCallback(() => {
    if (!wasPlayingRef.current) return
    wasPlayingRef.current = false
    resume()
  }, [resume])

  const commit = useCallback(
    (value: number) => {
      const now = performance.now()
      const last = lastCommitRef.current
      const isDuplicate =
        now - last.at < DUPLICATE_COMMIT_MS &&
        Math.abs(value - last.value) < DUPLICATE_COMMIT_DELTA
      clearPreview()
      if (isDuplicate) return
      lastCommitRef.current = { at: now, value }
      seekTo(value, { persist: true })
      resumeIfWasPlaying()
    },
    [clearPreview, seekTo, resumeIfWasPlaying],
  )

  const beginPointerScrub = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !enabled || pointerActiveRef.current) return
    pointerActiveRef.current = true
    wasPlayingRef.current = !audio.paused && !audio.ended
    if (wasPlayingRef.current) pause()
  }, [audioRef, enabled, pause])

  const previewScrub = useCallback((value: number) => {
    previewRef.current = value
    setScrubPreview(value)
  }, [])

  /** Keyboard nudges on the thumb — pointer drags commit on window pointerup. */
  const commitFromSlider = useCallback(
    (value: number) => {
      if (pointerActiveRef.current) return
      commit(value)
      onCommitted()
    },
    [commit, onCommitted],
  )

  // Commit on release anywhere — the thumb may leave the control mid-drag.
  const onPointerRelease = useEffectEvent(() => {
    if (!pointerActiveRef.current) return
    const pending = previewRef.current
    if (pending == null) {
      pointerActiveRef.current = false
      resumeIfWasPlaying()
      return
    }
    commit(pending)
    onCommitted()
  })

  useEffect(() => {
    const onUp = () => onPointerRelease()
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [])

  return { scrubPreview, beginPointerScrub, previewScrub, commitFromSlider }
}
