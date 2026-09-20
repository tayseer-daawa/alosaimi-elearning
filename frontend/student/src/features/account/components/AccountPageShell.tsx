import { Box, Flex, Heading } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { AppMenu } from "@/shared/components/AppMenu"

type AccountPageShellProps = {
  title: string
  children: ReactNode
  testId: string
}

/** Shared header for account/legal pages — title + menu toggler. */
export function AccountPageShell({
  title,
  children,
  testId,
}: AccountPageShellProps) {
  return (
    <Box
      minH="100dvh"
      display="flex"
      flexDirection="column"
      py={4}
      px={6}
      dir="rtl"
      data-testid={testId}
    >
      <Box
        position="relative"
        flexShrink={0}
        h={{ base: "14", lg: "100px" }}
        w="full"
        mt={2}
        mb={{ base: 6, lg: 8 }}
      >
        <Flex align="center" justify="center" h="100%">
          <AppMenu />
          <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
            {title}
          </Heading>
        </Flex>
      </Box>

      <Box flex="1 1 auto" w="full" maxW="container.md" mx="auto" minH={0}>
        {children}
      </Box>
    </Box>
  )
}
