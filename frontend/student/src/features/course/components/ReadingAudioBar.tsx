import { Flex, IconButton, Text } from "@chakra-ui/react"
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react"
import { type ReactNode, type RefObject, useEffect, useState } from "react"
import { type AudioPlaybackApi, formatTime } from "./AudioPlayer"

const SKIP_SECONDS = 10
const AUDIO_EVENTS = [
  "play",
  "pause",
  "ended",
  "timeupdate",
  "durationchange",
  "loadedmetadata",
  "seeked",
] as const

/**
 * Compact play / ±10s / time strip for the PDF reading mode, so students keep
 * listening while the book covers the main player. Drives the same <audio>
 * through the player's API, so both sets of controls stay in sync.
 */
export function ReadingAudioBar({
  apiRef,
}: {
  apiRef: RefObject<AudioPlaybackApi | null>
}) {
  const [state, setState] = useState({ playing: false, time: 0, duration: 0 })

  useEffect(() => {
    const audio = apiRef.current?.getAudioElement()
    if (!audio) return
    const sync = () =>
      setState({
        playing: !audio.paused && !audio.ended,
        time: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      })
    sync()
    for (const name of AUDIO_EVENTS) audio.addEventListener(name, sync)
    return () => {
      for (const name of AUDIO_EVENTS) audio.removeEventListener(name, sync)
    }
  }, [apiRef])

  return (
    // Same left-to-right order as the main player: ↺10  ▶  ↻10.
    <Flex
      dir="ltr"
      align="center"
      justify="center"
      gap={3}
      data-testid="reading-audio-bar"
    >
      <IconButton
        variant="ghost"
        color="brand.primary"
        size="lg"
        aria-label={`ترجيع ${SKIP_SECONDS} ثوانٍ`}
        onClick={() => apiRef.current?.skipBy(-SKIP_SECONDS)}
        data-testid="reading-audio-back"
      >
        <SkipIcon icon={<RotateCcw size={20} />} />
      </IconButton>
      <IconButton
        w="12"
        h="12"
        minW="12"
        flexShrink={0}
        borderRadius="full"
        bg="brand.primary"
        color="white"
        aria-label={state.playing ? "إيقاف مؤقت" : "تشغيل"}
        onClick={() => apiRef.current?.togglePlay()}
        data-testid="reading-audio-play"
      >
        {state.playing ? <Pause size={22} /> : <Play size={22} />}
      </IconButton>
      <IconButton
        variant="ghost"
        color="brand.primary"
        size="lg"
        aria-label={`تقديم ${SKIP_SECONDS} ثوانٍ`}
        onClick={() => apiRef.current?.skipBy(SKIP_SECONDS)}
        data-testid="reading-audio-forward"
      >
        <SkipIcon icon={<RotateCw size={20} />} />
      </IconButton>
      <Text
        dir="ltr"
        fontSize="sm"
        color="brand.secondary"
        fontVariantNumeric="tabular-nums"
        data-testid="reading-audio-time"
      >
        {formatTime(state.time)} / {formatTime(state.duration)}
      </Text>
    </Flex>
  )
}

function SkipIcon({ icon }: { icon: ReactNode }) {
  return (
    <Flex direction="column" align="center" gap={0.5}>
      {icon}
      <Text fontSize="2xs" fontWeight="semibold" lineHeight="1">
        {SKIP_SECONDS}
      </Text>
    </Flex>
  )
}
