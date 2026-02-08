import { Box, Button, Flex, Heading, Image } from "@chakra-ui/react"
import MenuIcon from "/assets/menu.svg"
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
      {/* Header */}
      <Box
        position={"relative"}
        h={{
          lg: "100px",
        }}
        w={"full"}
        mt={5}
        mb={10}
      >
        <Flex align="center" justify="center" h={"100%"}>
          <Button
            position={"absolute"}
            right={{
              base: 0,
              lg: 14,
            }}
            variant="ghost"
            p={2}
          >
            <Image
              src={MenuIcon}
              boxSize={{ base: 6, lg: 12 }}
              objectFit="contain"
            />
          </Button>

          <Heading
            size={{
              base: "xl",
              lg: "5xl",
            }}
            color="brand.primary"
          >
            البرامج
          </Heading>
        </Flex>
      </Box>

      {/* Main Content */}
      <ProgramsList />
    </Box>
  )
}
