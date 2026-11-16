import { type RefObject, useCallback } from "react"

/**
 * Keep shortcuts alive: menus and sliders swallow keys, so controls hand
 * focus back to the player root after they act.
 */
export function usePlayerFocus(playerRef: RefObject<HTMLDivElement | null>) {
  const focusPlayerChrome = useCallback(() => {
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

  return { focusPlayerChrome }
}
