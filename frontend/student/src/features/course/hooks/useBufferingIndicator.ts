import { useCallback, useEffect, useRef, useState } from "react"
import { BUFFER_MIN_VISIBLE_MS, BUFFER_SHOW_DELAY_MS } from "../lib/audioPlayer"

function clearTimer(timer: { current: number | null }) {
  if (timer.current == null) return
  window.clearTimeout(timer.current)
  timer.current = null
}

/**
 * Debounced "loading this position…" flag: shown only after a short delay and,
 * once shown, kept up for a minimum time so fast range fetches don't flicker.
 */
export function useBufferingIndicator() {
  const [isBuffering, setIsBuffering] = useState(false)
  const visibleRef = useRef(false)
  const shownAtRef = useRef<number | null>(null)
  const showTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  const hideNow = useCallback(() => {
    clearTimer(showTimerRef)
    clearTimer(hideTimerRef)
    shownAtRef.current = null
    visibleRef.current = false
    setIsBuffering(false)
  }, [])

  const markBufferingSoon = useCallback(() => {
    // Still need the indicator — cancel a pending min-visible hide.
    clearTimer(hideTimerRef)
    // Already visible or a delayed show is pending — don't restart the clock.
    if (visibleRef.current || showTimerRef.current != null) return
    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = null
      shownAtRef.current = performance.now()
      visibleRef.current = true
      setIsBuffering(true)
    }, BUFFER_SHOW_DELAY_MS)
  }, [])

  const clearBuffering = useCallback(() => {
    if (showTimerRef.current != null) {
      // Never became visible — cancel quietly.
      clearTimer(showTimerRef)
      return
    }
    if (!visibleRef.current || hideTimerRef.current != null) return

    const shownAt = shownAtRef.current
    const elapsed =
      shownAt != null ? performance.now() - shownAt : BUFFER_MIN_VISIBLE_MS
    const remaining = BUFFER_MIN_VISIBLE_MS - elapsed
    if (remaining > 0) {
      hideTimerRef.current = window.setTimeout(hideNow, remaining)
    } else {
      hideNow()
    }
  }, [hideNow])

  useEffect(() => hideNow, [hideNow])

  return {
    isBuffering,
    markBufferingSoon,
    clearBuffering,
    resetBuffering: hideNow,
  }
}
