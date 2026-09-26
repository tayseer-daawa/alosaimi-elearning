import { Box, Flex } from "@chakra-ui/react"
import type { MutableRefObject } from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useAudioPlayback } from "../hooks/useAudioPlayback"
import { useBufferingIndicator } from "../hooks/useBufferingIndicator"
import { usePlayerCommands } from "../hooks/usePlayerCommands"
import { usePlayerFocus } from "../hooks/usePlayerFocus"
import { usePlayerHud } from "../hooks/usePlayerHud"
import { usePlayerShortcuts } from "../hooks/usePlayerShortcuts"
import { useSeekScrub } from "../hooks/useSeekScrub"
import { useVolumeControl } from "../hooks/useVolumeControl"
import { isPlayableSrc, type Rate, SKIP_SECONDS } from "../lib/audioPlayer"
import { PLAYER_ARIA_KEYSHORTCUTS } from "../lib/playerShortcuts"
import LessonNavBar from "./audio-player/LessonNavBar"
import PlayerStatus from "./audio-player/PlayerStatus"
import PlayPauseButton from "./audio-player/PlayPauseButton"
import RateMenu from "./audio-player/RateMenu"
import SeekBar from "./audio-player/SeekBar"
import SkipButton from "./audio-player/SkipButton"
import TimeLabel from "./audio-player/TimeLabel"
import VolumeControl from "./audio-player/VolumeControl"
import { PlayerActionHud } from "./PlayerActionHud"
import PlayerShortcutsHelp from "./PlayerShortcutsHelp"

export type AudioPlaybackApi = {
  getCurrentTime: () => number
  seekTo: (seconds: number) => void
}

export type AudioPlayerProps = {
  src?: string
  title?: string
  /** Stable lesson id — used to persist resume position / rate locally */
  lessonId?: string
  onPrevLesson?: () => void
  onNextLesson?: () => void
  hasPrevLesson?: boolean
  hasNextLesson?: boolean
  /** Opens the lesson playlist (now-playing title, like a media app). */
  onOpenLessonList?: () => void
  /** Imperative bridge for notes timestamps (insert / jump). */
  playbackApiRef?: MutableRefObject<AudioPlaybackApi | null>
}

export default function AudioPlayer({
  src,
  title = "الشرح الصوتي",
  lessonId,
  onPrevLesson,
  onNextLesson,
  hasPrevLesson = false,
  hasNextLesson = false,
  onOpenLessonList,
  playbackApiRef,
}: AudioPlayerProps) {
  const labelId = useId()
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const audioUrl = isPlayableSrc(src) ? src : undefined
  const noAudio = !audioUrl

  const { hud, flashHud } = usePlayerHud()
  const { focusPlayerChrome, reclaimFromIframe } = usePlayerFocus(playerRef)
  const buffering = useBufferingIndicator()
  const volume = useVolumeControl(audioRef, audioUrl)
  const playback = useAudioPlayback({
    audioRef,
    audioUrl,
    lessonId,
    markBufferingSoon: buffering.markBufferingSoon,
    clearBuffering: buffering.clearBuffering,
    resetBuffering: buffering.resetBuffering,
  })
  const scrub = useSeekScrub({
    audioRef,
    enabled: !noAudio,
    seekTo: playback.seekTo,
    resume: playback.resume,
    pause: playback.pause,
    onCommitted: focusPlayerChrome,
  })
  const commands = usePlayerCommands({
    isPlaying: playback.isPlaying,
    rate: playback.rate,
    togglePlay: playback.togglePlay,
    seekBy: playback.seekBy,
    changeRate: playback.changeRate,
    toggleMute: volume.toggleMute,
    setVolumeLevel: volume.setLevel,
    nudgeVolume: volume.nudge,
    flashHud,
  })

  usePlayerShortcuts({
    shortcutsOpen,
    setShortcutsOpen,
    togglePlay: commands.togglePlayWithHud,
    skip: commands.skip,
    toggleMute: commands.toggleMuteWithHud,
    stepRate: commands.stepRate,
    stepVolume: commands.stepVolume,
    hasPrevLesson,
    hasNextLesson,
    prevLesson: () => {
      flashHud({ kind: "prev-lesson" })
      onPrevLesson?.()
    },
    nextLesson: () => {
      flashHud({ kind: "next-lesson" })
      onNextLesson?.()
    },
    focusPlayerChrome,
  })

  // Expose seek/time for lesson notes timestamps.
  const { seekTo } = playback
  useEffect(() => {
    if (!playbackApiRef) return
    playbackApiRef.current = {
      getCurrentTime: () => audioRef.current?.currentTime ?? 0,
      seekTo: (seconds: number) => {
        seekTo(seconds, { persist: true })
        focusPlayerChrome()
      },
    }
    return () => {
      playbackApiRef.current = null
    }
  }, [playbackApiRef, seekTo, focusPlayerChrome])

  const { skip, toggleMuteWithHud, selectRate } = commands
  const handleSkip = useCallback(
    (delta: number) => {
      skip(delta)
      focusPlayerChrome()
    },
    [skip, focusPlayerChrome],
  )
  const handleToggleMute = useCallback(() => {
    toggleMuteWithHud()
    focusPlayerChrome()
  }, [toggleMuteWithHud, focusPlayerChrome])
  const handleSelectRate = useCallback(
    (next: Rate) => {
      selectRate(next)
      // Defer so the menu can close, then drop focus off the trigger/items.
      window.setTimeout(focusPlayerChrome, 0)
    },
    [selectRate, focusPlayerChrome],
  )
  const { togglePlay } = playback
  const handleTogglePlay = useCallback(() => void togglePlay(), [togglePlay])

  return (
    <Box
      ref={playerRef}
      borderTopWidth="1px"
      borderColor="brand.secondary"
      px={{ base: 3, md: 6 }}
      pt={3}
      pb="calc(0.75rem + env(safe-area-inset-bottom, 0px))"
      dir="rtl"
      data-testid="audio-player"
      tabIndex={0}
      outline="none"
      _focusVisible={{ boxShadow: "outline" }}
      onPointerDown={reclaimFromIframe}
      onMouseEnter={reclaimFromIframe}
      aria-keyshortcuts={PLAYER_ARIA_KEYSHORTCUTS}
    >
      <PlayerActionHud payload={hud.payload} flashId={hud.flashId} />
      {audioUrl ? (
        // biome-ignore lint/a11y/useMediaCaption: lesson audio has no captions yet
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          aria-labelledby={labelId}
        />
      ) : null}

      <LessonNavBar
        title={title}
        labelId={labelId}
        hasPrevLesson={hasPrevLesson}
        hasNextLesson={hasNextLesson}
        onPrevLesson={onPrevLesson}
        onNextLesson={onNextLesson}
        onOpenLessonList={onOpenLessonList}
      />

      <PlayerStatus
        audioUrl={audioUrl}
        mediaLoading={playback.mediaLoading}
        isBuffering={buffering.isBuffering}
        error={playback.error}
        onRetry={playback.retry}
      />

      <Box
        display="grid"
        w="full"
        dir="ltr"
        alignItems="center"
        columnGap={{ base: 2, md: 4 }}
        rowGap={0.5}
        gridTemplateColumns="auto 1fr auto"
        gridTemplateAreas={`
          "cur seek dur"
          ". controls ."
        `}
      >
        <TimeLabel
          gridArea="cur"
          seconds={scrub.scrubPreview ?? playback.currentTime}
          testId="audio-current-time"
        />
        <Box gridArea="seek" minW={0} py={1}>
          <SeekBar
            value={scrub.scrubPreview ?? playback.currentTime}
            duration={playback.duration}
            disabled={noAudio || playback.duration <= 0}
            bufferedRanges={playback.bufferedRanges}
            onPointerScrubStart={scrub.beginPointerScrub}
            onPreview={scrub.previewScrub}
            onCommit={scrub.commitFromSlider}
          />
        </Box>
        <TimeLabel
          gridArea="dur"
          seconds={playback.duration}
          testId="audio-duration"
        />

        {/*
          Align with the seek track only: rate under its start, ±10·play
          centered, mute/help under its end — not the full player edges.
        */}
        <Flex
          gridArea="controls"
          w="full"
          align="center"
          justify="space-between"
          gap={{ base: 1, md: 2 }}
        >
          <RateMenu
            rate={playback.rate}
            disabled={noAudio}
            onSelect={handleSelectRate}
          />

          <Flex align="center" justify="center" gap={{ base: 2, md: 3 }}>
            <SkipButton
              direction="back"
              seconds={SKIP_SECONDS}
              disabled={noAudio}
              onSkip={handleSkip}
            />
            <PlayPauseButton
              isPlaying={playback.isPlaying}
              isBuffering={buffering.isBuffering}
              disabled={noAudio}
              onToggle={handleTogglePlay}
            />
            <SkipButton
              direction="forward"
              seconds={SKIP_SECONDS}
              disabled={noAudio}
              onSkip={handleSkip}
            />
          </Flex>

          <Flex align="center" gap={1}>
            <VolumeControl
              volume={volume.volume}
              muted={volume.muted}
              disabled={noAudio}
              onToggleMute={handleToggleMute}
              onChangeLevel={commands.changeVolume}
              onChangeEnd={focusPlayerChrome}
            />
            <Box display={{ base: "none", md: "block" }}>
              <PlayerShortcutsHelp
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
              />
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}
