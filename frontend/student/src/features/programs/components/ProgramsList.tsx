import { Button, Flex, Grid, Text, VStack } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { ProgramsListSkeleton } from "@/shared/components/PageSkeletons"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { usePrograms } from "../api/usePrograms"
import { ProgramCard } from "./ProgramCard"

export const ProgramsList = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch, isFetching } = usePrograms()
  const programs = data?.data ?? []

  if (isLoading) {
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
        const subtitle = formatStudyDays(program.days_of_study)

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
              subtitle={subtitle}
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
