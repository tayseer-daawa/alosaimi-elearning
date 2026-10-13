import { useCallback, useState } from "react"
import type { PlayerHudPayload } from "../components/PlayerActionHud"

/** Center-screen action feedback (play, seek, volume…) shared by buttons and shortcuts. */
export function usePlayerHud() {
  const [hud, setHud] = useState<{
    payload: PlayerHudPayload | null
    flashId: number
  }>({ payload: null, flashId: 0 })

  const flashHud = useCallback((payload: PlayerHudPayload) => {
    setHud((prev) => ({ payload, flashId: prev.flashId + 1 }))
  }, [])

  return { hud, flashHud }
}
