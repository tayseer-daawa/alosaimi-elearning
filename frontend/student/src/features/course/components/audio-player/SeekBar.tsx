import { Box, Slider } from "@chakra-ui/react"
import { memo } from "react"
import type { BufferedRange } from "../../lib/audioPlayer"

type SeekBarProps = {
  value: number
  duration: number
  disabled: boolean
  bufferedRanges: BufferedRange[]
  onPointerScrubStart: () => void
  onPreview: (seconds: number) => void
  onCommit: (seconds: number) => void
}

function SeekBar({
  value,
  duration,
  disabled,
  bufferedRanges,
  onPointerScrubStart,
  onPreview,
  onCommit,
}: SeekBarProps) {
  return (
    <Slider.Root
      min={0}
      max={duration > 0 ? duration : 1}
      step={1}
      value={[Math.min(value, duration || 0)]}
      disabled={disabled}
      onValueChange={({ value: next }) => onPreview(next[0] ?? 0)}
      onValueChangeEnd={({ value: next }) => onCommit(next[0] ?? 0)}
      data-testid="audio-seek"
    >
      <Slider.Control
        h={{ base: "10", md: "5" }}
        display="flex"
        alignItems="center"
        cursor="pointer"
        onPointerDown={(event) => {
          if (event.button === 0) onPointerScrubStart()
        }}
      >
        <Slider.Track
          h={{ base: "3.5", md: "2.5" }}
          borderRadius="full"
          bg="gray.200"
          position="relative"
          overflow="hidden"
        >
          {duration > 0
            ? bufferedRanges.map((range) => (
                <Box
                  key={`${range.start}-${range.end}`}
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={`${(range.start / duration) * 100}%`}
                  width={`${((range.end - range.start) / duration) * 100}%`}
                  bg="gray.400"
                  opacity={0.55}
                  pointerEvents="none"
                  data-testid="audio-buffered-range"
                />
              ))
            : null}
          <Slider.Range bg="brand.secondary" position="relative" zIndex={1} />
        </Slider.Track>
        <Slider.Thumbs
          boxSize={{ base: 5, md: 4 }}
          bg="white"
          borderWidth="2px"
          borderColor="brand.secondary"
          shadow="sm"
          zIndex={2}
          _hover={{ boxSize: { base: 6, md: 5 } }}
          _active={{ boxSize: { base: 6, md: 5 } }}
        />
      </Slider.Control>
    </Slider.Root>
  )
}

export default memo(SeekBar)
