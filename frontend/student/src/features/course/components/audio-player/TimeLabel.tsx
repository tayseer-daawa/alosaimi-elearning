import { Text } from "@chakra-ui/react"
import { formatTime } from "../../lib/audioPlayer"

type TimeLabelProps = {
  seconds: number
  gridArea: "cur" | "dur"
  testId: string
}

export default function TimeLabel({
  seconds,
  gridArea,
  testId,
}: TimeLabelProps) {
  const isCurrent = gridArea === "cur"
  return (
    <Text
      gridArea={gridArea}
      fontSize="xs"
      color="brand.secondary"
      minW={{ base: isCurrent ? "10" : "12", md: "14" }}
      textAlign={isCurrent ? "end" : "start"}
      fontVariantNumeric="tabular-nums"
      flexShrink={0}
      data-testid={testId}
    >
      {formatTime(seconds)}
    </Text>
  )
}
