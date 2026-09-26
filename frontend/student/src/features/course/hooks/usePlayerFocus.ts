import { type RefObject, useCallback } from "react"
import { releasePdfFocus } from "../lib/releasePdfFocus"

/**
 * Keep shortcuts alive: the PDF iframe, menus and sliders swallow keys, so
 * controls hand focus back to the player root after they act.
 */
export function usePlayerFocus(playerRef: RefObject<HTMLDivElement | null>) {
  const focusPlayerChrome = useCallback(() => {
    releasePdfFocus()
    const player = playerRef.current
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      player?.contains(active) &&
      active !== player
    ) {
      active.blur()
    }
    player?.focus({ preventScroll: true })
  }, [playerRef])

  /** PDF iframe steals keys; reclaim when the pointer comes back to the player. */
  const reclaimFromIframe = useCallback(() => {
    if (document.activeElement instanceof HTMLIFrameElement) {
      focusPlayerChrome()
    }
  }, [focusPlayerChrome])

  return { focusPlayerChrome, reclaimFromIframe }
}
