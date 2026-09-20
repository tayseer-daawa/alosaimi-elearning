import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import { useParams } from "@tanstack/react-router"
import { usePhase } from "@/features/phases/api/usePhase"
import { useProgram } from "@/features/programs/api/useProgram"
import { AppMenu } from "@/shared/components/AppMenu"
import { Breadcrumbs } from "@/shared/components/BreadcrumbsNavigation"
import { useBook } from "../api/useBook"
import { BooksList } from "./BooksList"

export default function BookScreen() {
  const { programId, phaseId, bookId } = useParams({ strict: false })
  const programQuery = useProgram(programId)
  const phaseQuery = usePhase(phaseId)
  const bookQuery = useBook(bookId)

  const phaseLabel =
    phaseQuery.data != null ? `المرحلة ${phaseQuery.data.order + 1}` : "المرحلة"

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      py={4}
      px={6}
      dir="rtl"
    >
      <Box
        display={{ base: "none", lg: "block" }}
        position="relative"
        h={{ lg: "100px" }}
        w="full"
        mt={5}
        mb={10}
      >
        <Flex align="center" justify="center" h="100%">
          <AppMenu />

          <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
            {bookQuery.data?.title ?? "الكتب"}
          </Heading>
        </Flex>
      </Box>

      <Breadcrumbs
        breadcrumbs={[
          {
            label: programQuery.data?.title ?? "البرنامج",
            url: "/programs",
          },
          {
            label: phaseLabel,
            url: `/programs/${programId}/phases`,
          },
          {
            label: bookQuery.data?.title ?? "الكتاب",
            isCurrent: true,
          },
        ]}
      />

      <Box mt={10} px={{ lg: "16" }}>
        {bookQuery.isError ? (
          <Text color="red.500" textAlign="center">
            تعذر تحميل الكتاب.
          </Text>
        ) : (
          <BooksList />
        )}
      </Box>
    </Box>
  )
}
