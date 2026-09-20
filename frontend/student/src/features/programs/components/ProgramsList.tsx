import { Flex, SimpleGrid, Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { usePrograms } from "../api/usePrograms"
import { ActiveProgramCard } from "./ActiveProgramCard"
import { ProgramCard } from "./ProgramCard"

export const ProgramsList = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError } = usePrograms()
  const programs = data?.data ?? []

  if (isLoading) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        جاري التحميل...
      </Text>
    )
  }

  if (isError) {
    return (
      <Text color="red.500" textAlign="center" py={10}>
        تعذر تحميل البرامج.
      </Text>
    )
  }

  if (!programs.length) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        لا توجد برامج متاحة حالياً.
      </Text>
    )
  }

  return (
    <SimpleGrid flex="1" w="full" columns={{ base: 1, lg: 3 }}>
      {programs.map((program, index) => {
        const subtitle = formatStudyDays(program.days_of_study)
        const goToPhases = () =>
          navigate({
            to: "/programs/$programId/phases",
            params: { programId: program.id },
          })

        return (
          <Flex
            key={program.id}
            justify={{
              base: index % 2 !== 0 ? "flex-end" : "flex-start",
              lg: "center",
            }}
          >
            {index === 0 ? (
              <ActiveProgramCard
                status="متاح"
                title={program.title}
                subtitle={subtitle}
                description={subtitle || program.title}
                progress={0}
                onPlay={goToPhases}
              />
            ) : (
              <ProgramCard
                title={program.title}
                subtitle={subtitle}
                onClick={goToPhases}
              />
            )}
          </Flex>
        )
      })}
    </SimpleGrid>
  )
}
