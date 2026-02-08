import { Box, Button, Flex, Heading, Image } from "@chakra-ui/react"
import { useParams } from "@tanstack/react-router"
import { Breadcrumbs } from "@/shared/components/BreadcrumbsNavigation"
import MenuIcon from "/assets/menu.svg"
import { BooksList } from "./BooksList"

export default function BookScreen() {
  const { programId, phaseId, bookId } = useParams({ strict: false })

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      py={4}
      px={6}
      dir="rtl"
    >
      {/* Breadcrumb */}
      <Box
        display={{
          base: "none",
          lg: "block",
        }}
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
            الكتب
          </Heading>
        </Flex>
      </Box>

      <Breadcrumbs
        breadcrumbs={[
          {
            label: `البرنامج ${programId}`,
            url: `/programs`,
          },
          {
            label: `المرحلة ${phaseId}`,
            url: `/programs/${programId}/phases`,
          },
          {
            label: `الكتاب ${bookId}`,
            isCurrent: true,
          },
        ]}
      />

      {/* Books List */}
      <Box
        mt={10}
        px={{
          lg: "16",
        }}
      >
        <BooksList />
      </Box>
    </Box>
  )
}
