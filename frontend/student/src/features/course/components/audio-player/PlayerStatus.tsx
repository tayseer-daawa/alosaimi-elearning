import { Box, Button, Flex, Link, Text } from "@chakra-ui/react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { memo } from "react"

type PlayerStatusProps = {
  audioUrl: string | undefined
  mediaLoading: boolean
  isBuffering: boolean
  error: string | null
  onRetry: () => void
}

function StatusText({
  testId,
  children,
}: {
  testId: string
  children: string
}) {
  return (
    <Text
      fontSize="sm"
      color="brand.secondary"
      textAlign="center"
      mb={2}
      data-testid={testId}
    >
      {children}
    </Text>
  )
}

/** One line of player state: no audio, loading, buffering, or error + recovery. */
function PlayerStatus({
  audioUrl,
  mediaLoading,
  isBuffering,
  error,
  onRetry,
}: PlayerStatusProps) {
  if (!audioUrl) {
    return (
      <StatusText testId="audio-player-empty">
        لا يتوفر تسجيل صوتي لهذا المقرر.
      </StatusText>
    )
  }

  if (error) {
    return (
      <Box textAlign="center" mb={2} data-testid="audio-player-error">
        <Text fontSize="sm" color="red.500" mb={2}>
          {error}
        </Text>
        <Flex justify="center" gap={3} flexWrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            color="brand.primary"
            onClick={onRetry}
            data-testid="audio-player-retry"
          >
            <RefreshCw size={14} />
            إعادة المحاولة
          </Button>
          <Link
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            fontSize="sm"
            color="brand.primary"
            textDecoration="underline"
            display="inline-flex"
            alignItems="center"
            gap={1}
            data-testid="audio-player-open-tab"
          >
            <ExternalLink size={14} />
            فتح الصوت في تبويب جديد
          </Link>
        </Flex>
      </Box>
    )
  }

  if (mediaLoading) {
    return (
      <StatusText testId="audio-player-loading">جاري تحميل الصوت…</StatusText>
    )
  }

  if (isBuffering) {
    return (
      <StatusText testId="audio-player-buffering">
        جاري تحميل الموضع… يُرجى الانتظار قليلاً.
      </StatusText>
    )
  }

  return null
}

export default memo(PlayerStatus)
