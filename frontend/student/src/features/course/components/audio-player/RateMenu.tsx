import { IconButton, Menu, Text } from "@chakra-ui/react"
import { memo } from "react"
import { RATES, type Rate } from "../../lib/audioPlayer"
import { chromeIconProps } from "./chromeIconProps"

type RateMenuProps = {
  rate: Rate
  disabled: boolean
  onSelect: (rate: Rate) => void
}

function RateMenu({ rate, disabled, onSelect }: RateMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          {...chromeIconProps}
          minW={{ base: "11", md: "10" }}
          px={2}
          aria-label="سرعة التشغيل"
          disabled={disabled}
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
              onClick={() => onSelect(r)}
            >
              {r}×
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}

export default memo(RateMenu)
