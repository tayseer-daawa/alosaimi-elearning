import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import type { ProgramPublic } from "@/client"
import { useEnrollmentByProgram } from "@/features/enrollment/api/useEnrollmentByProgram"
import { EnrollmentBadge } from "@/features/enrollment/components/EnrollmentBadge"
import type { ProgramEnrollment } from "@/features/enrollment/lib/enrollmentState"
import { ProgramsListSkeleton } from "@/shared/components/PageSkeletons"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { usePrograms } from "../api/usePrograms"
import { ProgramCard } from "./ProgramCard"

export const ProgramsList = () => {
  const { data, isLoading, isError, refetch, isFetching } = usePrograms()
  const enrollment = useEnrollmentByProgram()
  const programs = data?.data ?? []

  if (isLoading || enrollment.isLoading) {
    return <ProgramsListSkeleton />
  }

  if (isError) {
    return (
      <VStack gap={4} py={10}>
        <Text color="red.500" textAlign="center">
          تعذر تحميل البرامج.
        </Text>
        <Button loading={isFetching} onClick={() => void refetch()}>
          إعادة المحاولة
        </Button>
      </VStack>
    )
  }

  if (!programs.length) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        لا توجد برامج حالياً.
      </Text>
    )
  }

  const byProgram = enrollment.byProgram
  const mine = programs.filter(
    (p) => byProgram?.get(p.id)?.status === "enrolled",
  )
  const others = programs.filter(
    (p) => byProgram?.get(p.id)?.status !== "enrolled",
  )

  if (!mine.length) {
    return <ProgramGrid programs={programs} byProgram={byProgram} />
  }

  return (
    <Box pt={2}>
      <ProgramSection
        title="برامجي"
        testId="my-programs"
        programs={mine}
        byProgram={byProgram}
      />
      {others.length ? (
        <ProgramSection
          title="برامج أخرى"
          testId="other-programs"
          programs={others}
          byProgram={byProgram}
        />
      ) : null}
    </Box>
  )
}

type GridProps = {
  programs: ProgramPublic[]
  byProgram: Map<string, ProgramEnrollment> | undefined
}

function ProgramSection({
  title,
  testId,
  ...grid
}: GridProps & { title: string; testId: string }) {
  return (
    <Box as="section" data-testid={testId} mb={4}>
      <Heading
        as="h2"
        size={{ base: "lg", lg: "2xl" }}
        color="brand.primary"
        mt={4}
      >
        {title}
      </Heading>
      <ProgramGrid {...grid} />
    </Box>
  )
}

function ProgramGrid({ programs, byProgram }: GridProps) {
  const navigate = useNavigate()

  return (
    <Grid
      w="full"
      templateColumns={{ base: "1fr", lg: "repeat(3, minmax(0, 1fr))" }}
      columnGap={{ base: 4, lg: 8 }}
      rowGap={{ base: 10, lg: 12 }}
      alignItems="start"
      alignContent="start"
      pb={10}
      pt={6}
    >
      {programs.map((program, index) => {
        const status = byProgram?.get(program.id)?.status
        return (
          <Flex
            key={program.id}
            justify={{
              base: index % 2 !== 0 ? "flex-end" : "flex-start",
              lg: "center",
            }}
            w="full"
            minH="0"
          >
            <ProgramCard
              title={program.title}
              subtitle={formatStudyDays(program.days_of_study)}
              badge={status ? <EnrollmentBadge status={status} /> : undefined}
              highlighted={status === "enrolled"}
              onClick={() =>
                navigate({
                  to: "/programs/$programId/phases",
                  params: { programId: program.id },
                })
              }
            />
          </Flex>
        )
      })}
    </Grid>
  )
}
