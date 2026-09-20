import { Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { usePrograms } from "@/features/programs/api/usePrograms"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { resolveContinueLearning } from "../api/continueLearning"
import { useCurrentUser } from "../api/useCurrentUser"
import HomeScreenComponents from "./HomeScreenComponents"

export default function HomeScreen() {
  const navigate = useNavigate()
  const programsQuery = usePrograms()
  const userQuery = useCurrentUser()

  const programs = programsQuery.data?.data ?? []
  const cards = programs.map((program, index) => ({
    id: program.id,
    title: program.title,
    subtitle: formatStudyDays(program.days_of_study),
    description: undefined as string | undefined,
    progress: 0,
    isActive: index === 0,
    status: index === 0 ? "متاح" : undefined,
  }))

  const handleContinueLearning = async () => {
    const first = programs[0]
    if (!first) return

    const target = await resolveContinueLearning(first.id)
    if (!target) {
      navigate({
        to: "/programs/$programId/phases",
        params: { programId: first.id },
      })
      return
    }

    navigate({
      to: "/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId",
      params: target,
    })
  }

  const handleViewAllPrograms = () => {
    navigate({ to: "/programs" })
  }

  if (programsQuery.isLoading) {
    return (
      <Text dir="rtl" p={8} color="brand.secondary">
        جاري التحميل...
      </Text>
    )
  }

  if (programsQuery.isError) {
    return (
      <Text dir="rtl" p={8} color="red.500">
        تعذر تحميل البرامج. حاول مرة أخرى.
      </Text>
    )
  }

  return (
    <HomeScreenComponents
      allLessons={cards}
      userName={userQuery.data?.first_name ?? "الطالب"}
      onContinueLearning={handleContinueLearning}
      onViewAllPrograms={handleViewAllPrograms}
    />
  )
}
