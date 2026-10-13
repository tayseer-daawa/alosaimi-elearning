import { Box, IconButton, Slider } from "@chakra-ui/react"
import { Volume2, VolumeX } from "lucide-react"
import { memo, useState } from "react"
import { chromeIconProps } from "./chromeIconProps"

type VolumeControlProps = {
  volume: number
  muted: boolean
  disabled: boolean
  onToggleMute: () => void
  onChangeLevel: (level: number) => void
  onChangeEnd: () => void
}

/** Mute button with a hover-revealed vertical level slider centered above it. */
function VolumeControl({
  volume,
  muted,
  disabled,
  onToggleMute,
  onChangeLevel,
  onChangeEnd,
}: VolumeControlProps) {
  const [open, setOpen] = useState(false)
  const silent = muted || volume === 0

  return (
    <Box
      position="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-testid="audio-volume-wrap"
    >
      <IconButton
        {...chromeIconProps}
        aria-label={silent ? "إلغاء كتم الصوت" : "كتم الصوت"}
        disabled={disabled}
        onClick={onToggleMute}
        data-testid="audio-mute"
      >
        {silent ? <VolumeX size={22} /> : <Volume2 size={22} />}
      </IconButton>
      {open && !disabled && (
        <Box
          position="absolute"
          bottom="100%"
          left="50%"
          transform="translateX(-50%)"
          // Small bridge so hover stays open without floating the panel away.
          pb={1}
          px={1}
          zIndex={2}
          data-testid="audio-volume-bridge"
        >
          <Box
            bg="white"
            boxShadow="lg"
            borderRadius="lg"
            p={2}
            data-testid="audio-volume-panel"
          >
            <Slider.Root
              height="28"
              orientation="vertical"
              min={0}
              max={100}
              value={[Math.round((muted ? 0 : volume) * 100)]}
              onValueChange={({ value }) =>
                onChangeLevel((value[0] ?? 0) / 100)
              }
              onValueChangeEnd={onChangeEnd}
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
  )
}

export default memo(VolumeControl)
