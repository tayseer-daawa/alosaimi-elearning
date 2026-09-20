import { Box, Flex, Heading } from "@chakra-ui/react"
import { AppMenu } from "@/shared/components/AppMenu"
import { ProgramsList } from "./ProgramsList"

export default function ProgramsScreen() {
  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      py={4}
      px={6}
      dir="rtl"
    >
      <Box position="relative" h={{ lg: "100px" }} w="full" mt={5} mb={10}>
        <Flex align="center" justify="center" h="100%">
          <AppMenu />

          <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
            البرامج
          </Heading>
        </Flex>
      </Box>

      <ProgramsList />
    </Box>
  )
}
