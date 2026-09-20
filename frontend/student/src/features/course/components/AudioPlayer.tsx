import { Box, Flex, IconButton, Menu, Slider, Text } from "@chakra-ui/react"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { PlayerActionHud, type PlayerHudPayload } from "./PlayerActionHud"
import PlayerShortcutsHelp from "./PlayerShortcutsHelp"

/** Compact chrome controls — avoid the tall default button recipe. */
const chromeIconProps = {
  variant: "ghost" as const,
  size: "sm" as const,
  h: "8",
  minW: "8",
  p: "0",
  borderRadius: "full",
  color: "brand.secondary",
}

/** YouTube-like seek amounts (seconds). */
const ARROW_SEEK = 5
const JL_SEEK = 10
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const
type Rate = (typeof RATES)[number]

function nextRate(current: number, direction: 1 | -1): Rate {
  const idx = RATES.indexOf(current as Rate)
  const from = idx >= 0 ? idx : 1
  const clamped = Math.min(RATES.length - 1, Math.max(0, from + direction))
  return RATES[clamped]!
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? m.toString().padStart(2, "0") : String(m)
  const ss = s.toString().padStart(2, "0")
  // Long lectures (often 1–3h): show H:MM:SS so 153:36 is not mistaken for minutes.
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

function seekHudDetail(seconds: number): string {
  const abs = Math.abs(seconds)
  return `${seconds < 0 ? "−" : "+"}${abs} ثوانٍ`
}

function volumeHudDetail(level: number): string {
  return `${Math.round(level * 100)}٪`
}

function isPlayableSrc(src: string | undefined): src is string {
  return Boolean(
    src &&
      /^https?:\/\//.test(src) &&
      !/(?:example\.com|soundhelix\.com|pdfobject\.com)/.test(src),
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  return target.isContentEditable
}

/** Menu open / item focused — let arrows & Enter work; Space is stolen by player. */
function isMenuNavigationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('[role="menu"], [role="menuitem"], [data-scope="menu"]'),
  )
}

function blurIframes() {
  for (const frame of document.querySelectorAll("iframe")) {
    if (document.activeElement === frame) {
      frame.blur()
    }
  }
}

export type AudioPlayerProps = {
  src?: string
  title?: string
  onPrevLesson?: () => void
  onNextLesson?: () => void
  hasPrevLesson?: boolean
  hasNextLesson?: boolean
}

export default function AudioPlayer({
  src,
  title = "الشرح الصوتي",
  onPrevLesson,
  onNextLesson,
  hasPrevLesson = false,
  hasNextLesson = false,
}: AudioPlayerProps) {
  const labelId = useId()
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [showVolume, setShowVolume] = useState(false)
  const [hudPayload, setHudPayload] = useState<PlayerHudPayload | null>(null)
  const [hudFlashId, setHudFlashId] = useState(0)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const audioUrl = isPlayableSrc(src) ? src : undefined

  const playingRef = useRef(isPlaying)
  const mutedRef = useRef(muted)
  const volumeRef = useRef(volume)
  const rateRef = useRef(rate)
  const onPrevRef = useRef(onPrevLesson)
  const onNextRef = useRef(onNextLesson)
  const hasPrevRef = useRef(hasPrevLesson)
  const hasNextRef = useRef(hasNextLesson)
  const shortcutsOpenRef = useRef(shortcutsOpen)

  const flashHud = useCallback((payload: PlayerHudPayload) => {
    setHudPayload(payload)
    setHudFlashId((id) => id + 1)
  }, [])

  /** Keep shortcuts alive: blur iframe/menu/slider focus back onto the player chrome. */
  const focusPlayerChrome = useCallback(() => {
    blurIframes()
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      playerRef.current &&
      playerRef.current.contains(active) &&
      active !== playerRef.current
    ) {
      active.blur()
    }
    playerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    playingRef.current = isPlaying
  }, [isPlaying])
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  useEffect(() => {
    volumeRef.current = volume
  }, [volume])
  useEffect(() => {
    rateRef.current = rate
  }, [rate])
  useEffect(() => {
    shortcutsOpenRef.current = shortcutsOpen
  }, [shortcutsOpen])
  useEffect(() => {
    onPrevRef.current = onPrevLesson
    onNextRef.current = onNextLesson
    hasPrevRef.current = hasPrevLesson
    hasNextRef.current = hasNextLesson
  }, [onPrevLesson, onNextLesson, hasPrevLesson, hasNextLesson])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)

    if (!audioUrl) return

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const onError = () => {
      setIsPlaying(false)
      setError("تعذر تشغيل الملف الصوتي.")
    }

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("durationchange", onMeta)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onError)
    // audioUrl drives <audio src>; reload metadata for the new lesson
    audio.src = audioUrl
    audio.load()

    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("durationchange", onMeta)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onError)
    }
  }, [audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
  }, [rate])

  useEffect(() => {
    if (volume === 0) setMuted(true)
  }, [volume])

  const seekBy = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio || !audioUrl) return
      const max = Number.isFinite(audio.duration) ? audio.duration : 0
      const next = Math.min(Math.max(0, audio.currentTime + delta), max)
      audio.currentTime = next
      setCurrentTime(next)
    },
    [audioUrl],
  )

  const seekTo = (value: number) => {
    const audio = audioRef.current
    setCurrentTime(value)
    if (audio) audio.currentTime = value
  }

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    try {
      if (playingRef.current) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
        setError(null)
      }
    } catch {
      setIsPlaying(false)
      setError("تعذر تشغيل الملف الصوتي.")
    }
  }, [audioUrl])

  const toggleMute = useCallback(
    (showHud = false) => {
      const nextMuted = !mutedRef.current
      setMuted(nextMuted)
      if (showHud) {
        flashHud({ kind: nextMuted ? "mute" : "unmute" })
      }
    },
    [flashHud],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      const key = event.key
      const lower = key.toLowerCase()
      const inMenu = isMenuNavigationTarget(event.target)

      // While the rate menu is open, keep arrow/Enter for a11y menu nav.
      if (
        inMenu &&
        (key === "ArrowDown" ||
          key === "ArrowUp" ||
          key === "Home" ||
          key === "End" ||
          key === "Enter")
      ) {
        return
      }

      const claim = () => {
        event.preventDefault()
        event.stopPropagation()
      }

      if (key === "Escape" && shortcutsOpenRef.current) {
        claim()
        setShortcutsOpen(false)
        focusPlayerChrome()
        return
      }
      if (key === "?" || (key === "/" && event.shiftKey)) {
        claim()
        setShortcutsOpen((open) => !open)
        return
      }
      if (shortcutsOpenRef.current) return

      if (key === " " || lower === "k") {
        claim()
        flashHud({ kind: playingRef.current ? "pause" : "play" })
        void togglePlay()
        focusPlayerChrome()
        return
      }
      if (key === "ArrowLeft") {
        claim()
        seekBy(-ARROW_SEEK)
        flashHud({
          kind: "seek-back",
          detail: seekHudDetail(-ARROW_SEEK),
        })
        return
      }
      if (key === "ArrowRight") {
        claim()
        seekBy(ARROW_SEEK)
        flashHud({
          kind: "seek-forward",
          detail: seekHudDetail(ARROW_SEEK),
        })
        return
      }
      if (lower === "j") {
        claim()
        seekBy(-JL_SEEK)
        flashHud({
          kind: "seek-back",
          detail: seekHudDetail(-JL_SEEK),
        })
        return
      }
      if (lower === "l") {
        claim()
        seekBy(JL_SEEK)
        flashHud({
          kind: "seek-forward",
          detail: seekHudDetail(JL_SEEK),
        })
        return
      }
      if (lower === "m") {
        claim()
        toggleMute(true)
        return
      }
      if (key === "<" || (key === "," && event.shiftKey)) {
        claim()
        const next = nextRate(rateRef.current, -1)
        setRate(next)
        rateRef.current = next
        flashHud({ kind: "rate", detail: `${next}×` })
        return
      }
      if (key === ">" || (key === "." && event.shiftKey)) {
        claim()
        const next = nextRate(rateRef.current, 1)
        setRate(next)
        rateRef.current = next
        flashHud({ kind: "rate", detail: `${next}×` })
        return
      }
      if (key === "ArrowUp") {
        claim()
        const next = Math.min(
          1,
          Math.round((volumeRef.current + 0.05) * 100) / 100,
        )
        setMuted(false)
        setVolume(next)
        flashHud({ kind: "volume", detail: volumeHudDetail(next) })
        return
      }
      if (key === "ArrowDown") {
        claim()
        const next = Math.max(
          0,
          Math.round((volumeRef.current - 0.05) * 100) / 100,
        )
        setVolume(next)
        if (next === 0) setMuted(true)
        flashHud({ kind: "volume", detail: volumeHudDetail(next) })
        return
      }
      if (key === "N" && event.shiftKey && hasNextRef.current) {
        claim()
        flashHud({ kind: "next-lesson" })
        onNextRef.current?.()
        return
      }
      if (key === "P" && event.shiftKey && hasPrevRef.current) {
        claim()
        flashHud({ kind: "prev-lesson" })
        onPrevRef.current?.()
      }
    }

    // Capture phase so slider/menu/button focus cannot eat shortcuts first.
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [togglePlay, seekBy, flashHud, toggleMute, focusPlayerChrome])

  return (
    <Box
      ref={playerRef}
      borderTopWidth="1px"
      borderColor="brand.secondary"
      px={{ base: 3, md: 6 }}
      py={3}
      dir="rtl"
      data-testid="audio-player"
      tabIndex={0}
      outline="none"
      _focusVisible={{ boxShadow: "outline" }}
      onMouseEnter={() => {
        // PDF iframe steals keys; reclaim when the pointer returns to the player.
        if (document.activeElement instanceof HTMLIFrameElement) {
          focusPlayerChrome()
        }
      }}
      aria-keyshortcuts="Space, ArrowLeft, ArrowRight, KeyJ, KeyL, KeyK, KeyM, Shift+Comma, Shift+Period, Shift+KeyN, Shift+KeyP, Shift+Slash"
    >
      <PlayerActionHud payload={hudPayload} flashId={hudFlashId} />
      {audioUrl ? (
        // biome-ignore lint/a11y/useMediaCaption: lesson audio has no captions yet
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          aria-labelledby={labelId}
        />
      ) : null}

      <Flex align="center" justify="center" gap={1} mb={2}>
        <IconButton
          {...chromeIconProps}
          color="brand.primary"
          aria-label="الدرس السابق"
          disabled={!hasPrevLesson}
          onClick={onPrevLesson}
          data-testid="audio-prev-lesson"
        >
          <ChevronRight size={18} />
        </IconButton>
        <Text
          id={labelId}
          fontSize="sm"
          fontWeight="medium"
          color="brand.primary"
          textAlign="center"
          lineClamp={1}
          maxW={{ base: "60%", md: "md" }}
        >
          {title}
        </Text>
        <IconButton
          {...chromeIconProps}
          color="brand.primary"
          aria-label="الدرس التالي"
          disabled={!hasNextLesson}
          onClick={onNextLesson}
          data-testid="audio-next-lesson"
        >
          <ChevronLeft size={18} />
        </IconButton>
      </Flex>

      {!audioUrl && (
        <Text
          fontSize="sm"
          color="brand.secondary"
          textAlign="center"
          mb={2}
          data-testid="audio-player-empty"
        >
          لا يتوفر تسجيل صوتي لهذا الدرس.
        </Text>
      )}

      {error && (
        <Text fontSize="sm" color="red.500" textAlign="center" mb={2}>
          {error}
        </Text>
      )}

      <Flex align="center" gap={{ base: 2, md: 4 }} w="full" dir="ltr">
        <IconButton
          aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          bg="brand.secondary"
          color="white"
          borderRadius="full"
          boxSize={10}
          disabled={!audioUrl}
          onClick={() => void togglePlay()}
          _hover={{ opacity: 0.9 }}
          data-testid="audio-play-pause"
        >
          {isPlaying ? (
            <Pause size={20} fill="white" />
          ) : (
            <Play size={20} fill="white" />
          )}
        </IconButton>

        <Text
          fontSize="xs"
          color="brand.secondary"
          minW={{ base: "12", md: "14" }}
          textAlign="end"
          fontVariantNumeric="tabular-nums"
          data-testid="audio-current-time"
        >
          {formatTime(currentTime)}
        </Text>

        <Box flex="1" minW={0} py={2}>
          <Slider.Root
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={[Math.min(currentTime, duration || 0)]}
            disabled={!audioUrl || duration <= 0}
            onValueChange={({ value }) => seekTo(value[0] ?? 0)}
            onValueChangeEnd={() => focusPlayerChrome()}
            data-testid="audio-seek"
          >
            <Slider.Control
              h="5"
              display="flex"
              alignItems="center"
              cursor="pointer"
            >
              <Slider.Track h="2.5" borderRadius="full" bg="gray.200">
                <Slider.Range bg="brand.secondary" />
              </Slider.Track>
              <Slider.Thumbs
                boxSize={4}
                bg="white"
                borderWidth="2px"
                borderColor="brand.secondary"
                shadow="sm"
                _hover={{ boxSize: 5 }}
                _active={{ boxSize: 5 }}
              />
            </Slider.Control>
          </Slider.Root>
        </Box>

        <Text
          fontSize="xs"
          color="brand.secondary"
          minW={{ base: "12", md: "14" }}
          textAlign="start"
          fontVariantNumeric="tabular-nums"
          data-testid="audio-duration"
        >
          {formatTime(duration)}
        </Text>

        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              {...chromeIconProps}
              minW="10"
              px={2}
              aria-label="سرعة التشغيل"
              disabled={!audioUrl}
              data-testid="audio-rate"
            >
              <Text fontSize="xs" fontWeight="bold" lineHeight="1">
                {rate}×
              </Text>
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content minW="24" borderRadius="lg" py={1}>
              {RATES.map((r) => (
                <Menu.Item
                  key={r}
                  value={String(r)}
                  borderRadius="md"
                  onClick={() => {
                    setRate(r)
                    flashHud({ kind: "rate", detail: `${r}×` })
                    // Defer so the menu can close, then drop focus off the trigger/items.
                    window.setTimeout(() => focusPlayerChrome(), 0)
                  }}
                >
                  {r}×
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>

        <Box
          position="relative"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          data-testid="audio-volume-wrap"
        >
          <IconButton
            {...chromeIconProps}
            aria-label={muted || volume === 0 ? "إلغاء كتم الصوت" : "كتم الصوت"}
            disabled={!audioUrl}
            onClick={() => {
              toggleMute(true)
              focusPlayerChrome()
            }}
            data-testid="audio-mute"
          >
            {muted || volume === 0 ? (
              <VolumeX size={22} />
            ) : (
              <Volume2 size={22} />
            )}
          </IconButton>
          {showVolume && audioUrl && (
            <Box
              position="absolute"
              bottom="100%"
              left="50%"
              transform="translateX(-50%)"
              // Padding bridges the gap so the cursor never "leaves" the hover zone.
              pb={3}
              pt={1}
              px={1}
              zIndex={2}
              data-testid="audio-volume-bridge"
            >
              <Box
                bg="white"
                boxShadow="lg"
                borderRadius="lg"
                px={3}
                py={3}
                data-testid="audio-volume-panel"
              >
                <Slider.Root
                  height="28"
                  orientation="vertical"
                  min={0}
                  max={100}
                  value={[Math.round((muted ? 0 : volume) * 100)]}
                  onValueChange={({ value }) => {
                    const next = (value[0] ?? 0) / 100
                    setVolume(next)
                    setMuted(next === 0)
                  }}
                  onValueChangeEnd={() => focusPlayerChrome()}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range bg="brand.primary" />
                    </Slider.Track>
                    <Slider.Thumbs borderColor="brand.primary" />
                  </Slider.Control>
                </Slider.Root>
              </Box>
            </Box>
          )}
        </Box>

        <PlayerShortcutsHelp
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      </Flex>
    </Box>
  )
}
