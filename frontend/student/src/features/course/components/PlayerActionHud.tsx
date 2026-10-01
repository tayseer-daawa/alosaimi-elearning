import { Box, Flex, Text } from "@chakra-ui/react"
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export type PlayerHudKind =
  | "play"
  | "pause"
  | "mute"
  | "unmute"
  | "seek-back"
  | "seek-forward"
  | "volume"
  | "next-lesson"
  | "prev-lesson"
  | "rate"

export type PlayerHudPayload = {
  kind: PlayerHudKind
  /** Optional second line, e.g. "65%" or "+5 ثوانٍ" */
  detail?: string
}

const LABELS: Record<PlayerHudKind, string> = {
  play: "تشغيل",
  pause: "إيقاف",
  mute: "صامت",
  unmute: "الصوت مفعّل",
  "seek-back": "ترجيع",
  "seek-forward": "تقديم",
  volume: "مستوى الصوت",
  "next-lesson": "المقرر التالي",
  "prev-lesson": "المقرر السابق",
  rate: "سرعة التشغيل",
}

function HudIcon({ kind }: { kind: PlayerHudKind }) {
  const size = 40
  switch (kind) {
    case "play":
      return <Play size={size} fill="white" />
    case "pause":
      return <Pause size={size} fill="white" />
    case "mute":
      return <VolumeX size={size} />
    case "unmute":
    case "volume":
      return <Volume2 size={size} />
    case "seek-back":
      return <RotateCcw size={size} />
    case "seek-forward":
      return <RotateCw size={size} />
    case "next-lesson":
      return <ChevronLeft size={size} />
    case "prev-lesson":
      return <ChevronRight size={size} />
    case "rate":
      return <Gauge size={size} strokeWidth={2} />
  }
}

type PlayerActionHudProps = {
  payload: PlayerHudPayload | null
  /** Bumps on every flash so the fade restarts */
  flashId: number
}

export function PlayerActionHud({ payload, flashId }: PlayerActionHudProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!payload || flashId === 0) {
      setVisible(false)
      return
    }
    setVisible(true)
    const hide = window.setTimeout(() => setVisible(false), 800)
    return () => window.clearTimeout(hide)
  }, [payload, flashId])

  if (typeof document === "undefined" || !payload || !visible) return null

  const isRate = payload.kind === "rate"
  const isVolume = payload.kind === "volume"

  return createPortal(
    <Flex
      position="fixed"
      inset={0}
      align="center"
      justify="center"
      pointerEvents="none"
      zIndex={40}
      data-testid="player-action-hud"
      aria-live="polite"
    >
      <Box
        key={flashId}
        px={isRate || isVolume ? 10 : 8}
        py={isRate || isVolume ? 7 : 6}
        borderRadius="2xl"
        bg="blackAlpha.700"
        color="white"
        backdropFilter="blur(12px)"
        boxShadow="xl"
        minW={isRate ? "160px" : "140px"}
        textAlign="center"
        animation="playerHudIn 0.18s ease-out"
        css={{
          "@keyframes playerHudIn": {
            from: { opacity: 0, transform: "scale(0.92)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        }}
      >
        <Flex justify="center" mb={isRate ? 3 : 2} minH="40px" align="center">
          <HudIcon kind={payload.kind} />
        </Flex>
        {isRate || isVolume ? (
          <>
            {payload.detail ? (
              <Text
                fontSize="2xl"
                fontWeight="bold"
                lineHeight="1.1"
                fontVariantNumeric="tabular-nums"
                data-testid="player-action-hud-detail"
              >
                {payload.detail}
              </Text>
            ) : null}
            <Text fontSize="sm" mt={2} opacity={0.85}>
              {LABELS[payload.kind]}
            </Text>
          </>
        ) : (
          <>
            <Text fontSize="md" fontWeight="semibold">
              {LABELS[payload.kind]}
            </Text>
            {payload.detail ? (
              <Text
                fontSize="sm"
                mt={1}
                opacity={0.9}
                data-testid="player-action-hud-detail"
              >
                {payload.detail}
              </Text>
            ) : null}
          </>
        )}
      </Box>
    </Flex>,
    document.body,
  )
}
