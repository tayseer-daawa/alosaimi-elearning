import { Box, Flex, Heading } from "@chakra-ui/react"
import { AppMenu } from "@/shared/components/AppMenu"
import { ProgramsList } from "./ProgramsList"

export default function ProgramsScreen() {
  return (
    <Box
      minH="100dvh"
      display="flex"
      flexDirection="column"
      py={4}
      px={6}
      dir="rtl"
    >
      <Box
        position="relative"
        flexShrink={0}
        h={{ lg: "100px" }}
        w="full"
        mt={5}
        mb={{ base: 6, lg: 8 }}
      >
        <Flex align="center" justify="center" h="100%">
          <AppMenu />

          <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
            البرامج
          </Heading>
        </Flex>
      </Box>

      <Box flex="1 1 auto" w="full" minH={0} overflowY="auto">
        <ProgramsList />
      </Box>
    </Box>
  )
}
