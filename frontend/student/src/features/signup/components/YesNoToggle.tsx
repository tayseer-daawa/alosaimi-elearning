import { Box, HStack, Text } from "@chakra-ui/react"

export function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (next: boolean) => void
}) {
  const yesSelected = value === true
  const noSelected = value === false

  const baseWordFontSize = { base: "xl", md: "xl", lg: "xl" } as const
  const selectedWordFontSize = { base: "2xl", md: "3xl", lg: "3xl" } as const

  return (
    <Box w="100%">
      <HStack justify="flex-start" gap={2} align="baseline">
        <Text
          as="button"
          onClick={() => onChange(true)}
          aria-pressed={yesSelected}
          cursor="pointer"
          bg="transparent"
          color="text.default"
          fontWeight={yesSelected ? 700 : 500}
          fontSize={yesSelected ? selectedWordFontSize : baseWordFontSize}
          opacity={yesSelected || value === null ? 1 : 0.7}
        >
          نعم
        </Text>
        <Text
          color="text.default"
          fontWeight={600}
          fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
          opacity={0.8}
        >
          /
        </Text>
        <Text
          as="button"
          onClick={() => onChange(false)}
          aria-pressed={noSelected}
          cursor="pointer"
          bg="transparent"
          color="text.default"
          fontWeight={noSelected ? 700 : 500}
          fontSize={noSelected ? selectedWordFontSize : baseWordFontSize}
          opacity={noSelected || value === null ? 1 : 0.7}
        >
          لا
        </Text>
      </HStack>

      <Box
        mt={{ base: 3, md: 4 }}
        borderBottomWidth={{ base: "2px", md: "3px", lg: "3px" }}
        borderColor="brand.primary"
      />
    </Box>
  )
}
