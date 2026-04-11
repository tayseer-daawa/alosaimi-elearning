import { Box, HStack, Text } from "@chakra-ui/react"

export function GenderToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (next: boolean) => void
}) {
  const maleSelected = value === true
  const femaleSelected = value === false

  const baseWordFontSize = { base: "xl", md: "xl", lg: "xl" } as const
  const selectedWordFontSize = { base: "2xl", md: "3xl", lg: "3xl" } as const

  return (
    <Box w="100%">
      <HStack justify="flex-start" gap={2} align="baseline">
        <Text
          as="button"
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={maleSelected}
          cursor="pointer"
          bg="transparent"
          color="text.default"
          fontWeight={maleSelected ? 700 : 500}
          fontSize={maleSelected ? selectedWordFontSize : baseWordFontSize}
          opacity={maleSelected || value === null ? 1 : 0.7}
        >
          ذكر
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
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={femaleSelected}
          cursor="pointer"
          bg="transparent"
          color="text.default"
          fontWeight={femaleSelected ? 700 : 500}
          fontSize={femaleSelected ? selectedWordFontSize : baseWordFontSize}
          opacity={femaleSelected || value === null ? 1 : 0.7}
        >
          أنثى
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
