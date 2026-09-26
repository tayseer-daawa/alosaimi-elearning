import { Box, Flex, Heading } from "@chakra-ui/react"
import { useParams } from "@tanstack/react-router"
import { EnrollmentCard } from "@/features/enrollment/components/EnrollmentCard"
import { useProgram } from "@/features/programs/api/useProgram"
import { AppMenu } from "@/shared/components/AppMenu"
import { Breadcrumbs } from "@/shared/components/BreadcrumbsNavigation"
import { PhasesList } from "./PhasesList"

export default function PhasesScreen() {
  const { programId } = useParams({ strict: false })
  const programQuery = useProgram(programId)

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
            {programQuery.data?.title ?? "المراحل"}
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
            label: "المراحل",
            isCurrent: true,
          },
        ]}
      />

      <Box mt={10} px={{ lg: "16" }} flex="1 1 auto" minH={0}>
        {programQuery.isError ? (
          <Heading size="md" color="red.500" textAlign="center">
            تعذر تحميل البرنامج.
          </Heading>
        ) : (
          <>
            <EnrollmentCard programId={programId} />
            <PhasesList />
          </>
        )}
      </Box>
    </Box>
  )
}
