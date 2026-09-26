import { useCallback } from "react"
import type { PlayerHudPayload } from "../components/PlayerActionHud"
import {
  nextRate,
  type Rate,
  rateHudDetail,
  seekHudDetail,
  volumeHudDetail,
} from "../lib/audioPlayer"

type UsePlayerCommandsOptions = {
  isPlaying: boolean
  rate: Rate
  togglePlay: () => Promise<void>
  seekBy: (delta: number) => void
  changeRate: (next: Rate) => void
  toggleMute: () => boolean
  setVolumeLevel: (level: number) => number
  nudgeVolume: (delta: number) => number
  flashHud: (payload: PlayerHudPayload) => void
}

/** Player actions with HUD feedback — one source for buttons and shortcuts. */
export function usePlayerCommands({
  isPlaying,
  rate,
  togglePlay,
  seekBy,
  changeRate,
  toggleMute,
  setVolumeLevel,
  nudgeVolume,
  flashHud,
}: UsePlayerCommandsOptions) {
  const togglePlayWithHud = useCallback(() => {
    flashHud({ kind: isPlaying ? "pause" : "play" })
    void togglePlay()
  }, [flashHud, isPlaying, togglePlay])

  const skip = useCallback(
    (delta: number) => {
      seekBy(delta)
      flashHud({
        kind: delta < 0 ? "seek-back" : "seek-forward",
        detail: seekHudDetail(delta),
      })
    },
    [flashHud, seekBy],
  )

  const toggleMuteWithHud = useCallback(() => {
    flashHud({ kind: toggleMute() ? "mute" : "unmute" })
  }, [flashHud, toggleMute])

  const selectRate = useCallback(
    (next: Rate) => {
      changeRate(next)
      flashHud({ kind: "rate", detail: rateHudDetail(next) })
    },
    [changeRate, flashHud],
  )

  const stepRate = useCallback(
    (direction: 1 | -1) => selectRate(nextRate(rate, direction)),
    [rate, selectRate],
  )

  const changeVolume = useCallback(
    (level: number) => {
      const next = setVolumeLevel(level)
      flashHud(
        next === 0
          ? { kind: "mute" }
          : { kind: "volume", detail: volumeHudDetail(next) },
      )
    },
    [flashHud, setVolumeLevel],
  )

  const stepVolume = useCallback(
    (delta: number) => {
      flashHud({ kind: "volume", detail: volumeHudDetail(nudgeVolume(delta)) })
    },
    [flashHud, nudgeVolume],
  )

  return {
    togglePlayWithHud,
    skip,
    toggleMuteWithHud,
    selectRate,
    stepRate,
    changeVolume,
    stepVolume,
  }
}
