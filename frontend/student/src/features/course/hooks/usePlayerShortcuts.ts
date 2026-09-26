import { useEffect, useEffectEvent } from "react"
import {
  ARROW_SEEK,
  isMenuNavigationTarget,
  isTypingTarget,
  JL_SEEK,
  VOLUME_STEP,
} from "../lib/audioPlayer"

export type PlayerShortcutActions = {
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
  togglePlay: () => void
  skip: (delta: number) => void
  toggleMute: () => void
  stepRate: (direction: 1 | -1) => void
  stepVolume: (delta: number) => void
  hasPrevLesson: boolean
  hasNextLesson: boolean
  prevLesson: () => void
  nextLesson: () => void
  focusPlayerChrome: () => void
}

/** While the rate menu is open, keep these keys for its own a11y navigation. */
const MENU_NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End", "Enter"])

function resolveShortcut(
  event: KeyboardEvent,
  a: PlayerShortcutActions,
): (() => void) | null {
  const { key, shiftKey } = event
  const lower = key.toLowerCase()

  if (key === "Escape" && a.shortcutsOpen) {
    return () => {
      a.setShortcutsOpen(false)
      a.focusPlayerChrome()
    }
  }
  if (key === "?" || (key === "/" && shiftKey)) {
    return () => a.setShortcutsOpen(!a.shortcutsOpen)
  }
  if (a.shortcutsOpen) return null

  if (key === " " || lower === "k") {
    return () => {
      a.togglePlay()
      a.focusPlayerChrome()
    }
  }
  if (key === "ArrowLeft") return () => a.skip(-ARROW_SEEK)
  if (key === "ArrowRight") return () => a.skip(ARROW_SEEK)
  if (lower === "j") return () => a.skip(-JL_SEEK)
  if (lower === "l") return () => a.skip(JL_SEEK)
  if (lower === "m") return a.toggleMute
  if (key === "<" || (key === "," && shiftKey)) return () => a.stepRate(-1)
  if (key === ">" || (key === "." && shiftKey)) return () => a.stepRate(1)
  if (key === "ArrowUp") return () => a.stepVolume(VOLUME_STEP)
  if (key === "ArrowDown") return () => a.stepVolume(-VOLUME_STEP)
  if (key === "N" && shiftKey && a.hasNextLesson) return a.nextLesson
  if (key === "P" && shiftKey && a.hasPrevLesson) return a.prevLesson
  return null
}

/** Global player shortcuts (YouTube-style), a bonus on top of visible buttons. */
export function usePlayerShortcuts(actions: PlayerShortcutActions) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (isMenuNavigationTarget(event.target) && MENU_NAV_KEYS.has(event.key)) {
      return
    }
    const run = resolveShortcut(event, actions)
    if (!run) return
    event.preventDefault()
    event.stopPropagation()
    run()
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    // Capture phase so slider/menu/button focus cannot eat shortcuts first.
    window.addEventListener("keydown", listener, true)
    return () => window.removeEventListener("keydown", listener, true)
  }, [])
}
