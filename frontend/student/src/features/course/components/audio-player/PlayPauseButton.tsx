import { Box, IconButton } from "@chakra-ui/react"
import { Pause, Play, RefreshCw } from "lucide-react"
import { memo } from "react"

type PlayPauseButtonProps = {
  isPlaying: boolean
  isBuffering: boolean
  disabled: boolean
  onToggle: () => void
}

const spinCss = {
  "@keyframes spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },
}

function PlayPauseButton({
  isPlaying,
  isBuffering,
  disabled,
  onToggle,
}: PlayPauseButtonProps) {
  const label = isBuffering
    ? "جاري التحميل"
    : isPlaying
      ? "إيقاف مؤقت"
      : "تشغيل"

  return (
    <IconButton
      aria-label={label}
      bg="brand.secondary"
      color="white"
      borderRadius="full"
      boxSize={12}
      minW={12}
      disabled={disabled}
      onClick={onToggle}
      _hover={{ opacity: 0.9 }}
      data-testid="audio-play-pause"
    >
      {isBuffering ? (
        <Box
          display="inline-flex"
          animation="spin 0.9s linear infinite"
          css={spinCss}
        >
          <RefreshCw size={20} />
        </Box>
      ) : isPlaying ? (
        <Pause size={20} fill="white" />
      ) : (
        <Play size={20} fill="white" />
      )}
    </IconButton>
  )
}

export default memo(PlayPauseButton)
