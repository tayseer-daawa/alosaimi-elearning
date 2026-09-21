import { Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useBook } from "@/features/books/api/useBook"
import { useLesson } from "@/features/books/api/useLesson"
import { loadLastLearningPath } from "@/features/course/lib/lessonProgress"
import { useProgram } from "@/features/programs/api/useProgram"
import { usePrograms } from "@/features/programs/api/usePrograms"
import { HomeSkeleton } from "@/shared/components/PageSkeletons"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { resolveContinueLearning } from "../api/continueLearning"
import { useCurrentUser } from "../api/useCurrentUser"
import HomeScreenComponents from "./HomeScreenComponents"

export default function HomeScreen() {
  const navigate = useNavigate()
  const programsQuery = usePrograms()
  const userQuery = useCurrentUser()
  const lastPath = loadLastLearningPath()

  const lastLessonQuery = useLesson(lastPath?.courseId)
  const lastBookQuery = useBook(lastPath?.bookId)
  const lastProgramQuery = useProgram(lastPath?.programId)

  const programs = programsQuery.data?.data ?? []
  const cards = programs.map((program) => ({
    id: program.id,
    title: program.title,
    subtitle: formatStudyDays(program.days_of_study),
  }))

  const hasContinue = Boolean(lastPath)
  const continueTitle =
    lastBookQuery.data?.title ??
    lastProgramQuery.data?.title ??
    cards[0]?.title ??
    ""
  const continueSubtitle = lastLessonQuery.data
    ? `المقرر ${(lastLessonQuery.data.order ?? 0) + 1}`
    : (cards[0]?.subtitle ?? "")

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
    return <HomeSkeleton />
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
      allPrograms={cards}
      userName={userQuery.data?.first_name ?? "الطالب"}
      continueMode={hasContinue}
      continueTitle={continueTitle || cards[0]?.title}
      continueSubtitle={continueSubtitle || cards[0]?.subtitle}
      onContinueLearning={handleContinueLearning}
      onViewAllPrograms={handleViewAllPrograms}
    />
  )
}
