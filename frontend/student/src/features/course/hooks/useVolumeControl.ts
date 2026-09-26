import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { clampVolume } from "../lib/audioPlayer"
import { loadVolumePrefs, saveVolumePrefs } from "../lib/lessonProgress"

type VolumeState = { volume: number; muted: boolean }

function initialVolumeState(): VolumeState {
  const prefs = loadVolumePrefs()
  const volume = prefs?.volume ?? 1
  return { volume, muted: (prefs?.muted ?? false) || volume === 0 }
}

/**
 * Device-wide volume / mute, persisted to localStorage and mirrored onto the
 * <audio> element. A level of 0 always reads as muted.
 */
export function useVolumeControl(
  audioRef: RefObject<HTMLAudioElement | null>,
  audioUrl: string | undefined,
) {
  const [state, setState] = useState(initialVolumeState)
  /** Handlers read this so they stay stable; `update` is the only writer. */
  const stateRef = useRef(state)
  /** Last non-zero level — restore when unmuting after volume was dragged to 0. */
  const lastAudibleRef = useRef(state.volume > 0 ? state.volume : 1)

  const update = useCallback((next: VolumeState) => {
    if (next.volume > 0) lastAudibleRef.current = next.volume
    stateRef.current = next
    setState(next)
  }, [])

  /** Absolute level from the slider — 0 mutes, anything else unmutes. */
  const setLevel = useCallback(
    (level: number) => {
      const volume = clampVolume(level)
      update({ volume, muted: volume === 0 })
      return volume
    },
    [update],
  )

  /** Arrow-key nudge — raising unmutes; lowering keeps mute unless it hits 0. */
  const nudge = useCallback(
    (delta: number) => {
      const { volume: current, muted } = stateRef.current
      const volume = clampVolume(current + delta)
      update({
        volume,
        muted: delta > 0 ? false : muted || volume === 0,
      })
      return volume
    },
    [update],
  )

  const toggleMute = useCallback(() => {
    const { volume, muted } = stateRef.current
    const nextMuted = !muted
    update({
      volume: !nextMuted && volume <= 0 ? lastAudibleRef.current || 1 : volume,
      muted: nextMuted,
    })
    return nextMuted
  }, [update])

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-apply when a new <audio> mounts for audioUrl
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = state.muted ? 0 : state.volume
  }, [audioRef, audioUrl, state])

  useEffect(() => {
    saveVolumePrefs(state.volume, state.muted)
  }, [state])

  return {
    volume: state.volume,
    muted: state.muted,
    isSilent: state.muted || state.volume === 0,
    setLevel,
    nudge,
    toggleMute,
  }
}
