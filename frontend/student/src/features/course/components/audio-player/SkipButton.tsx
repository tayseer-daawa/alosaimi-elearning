import { Flex, IconButton, Text } from "@chakra-ui/react"
import { RotateCcw, RotateCw } from "lucide-react"
import { memo } from "react"
import { transportIconProps } from "./chromeIconProps"

type SkipButtonProps = {
  direction: "back" | "forward"
  seconds: number
  disabled: boolean
  onSkip: (delta: number) => void
}

/** Labeled ±N seek — always on screen; shortcuts are only a bonus. */
function SkipButton({ direction, seconds, disabled, onSkip }: SkipButtonProps) {
  const isBack = direction === "back"
  const Icon = isBack ? RotateCcw : RotateCw
  return (
    <IconButton
      {...transportIconProps}
      aria-label={`${isBack ? "ترجيع" : "تقديم"} ${seconds} ثوانٍ`}
      disabled={disabled}
      onClick={() => onSkip(isBack ? -seconds : seconds)}
      data-testid={isBack ? "audio-skip-back" : "audio-skip-forward"}
    >
      <Flex direction="column" align="center" justify="center" gap={0.5}>
        <Icon size={18} strokeWidth={2.25} aria-hidden />
        <Text
          as="span"
          fontSize="2xs"
          fontWeight="bold"
          lineHeight="1"
          fontVariantNumeric="tabular-nums"
        >
          {seconds}
        </Text>
      </Flex>
    </IconButton>
  )
}

export default memo(SkipButton)
