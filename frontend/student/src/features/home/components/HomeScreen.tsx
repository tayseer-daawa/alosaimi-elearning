import { Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import type { ProgramPublic } from "@/client"
import { useBook } from "@/features/books/api/useBook"
import { useLesson } from "@/features/books/api/useLesson"
import { loadLastLearningPath } from "@/features/course/lib/lessonProgress"
import { useEnrollmentByProgram } from "@/features/enrollment/api/useEnrollmentByProgram"
import type { ProgramEnrollment } from "@/features/enrollment/lib/enrollmentState"
import { useProgram } from "@/features/programs/api/useProgram"
import { usePrograms } from "@/features/programs/api/usePrograms"
import { HomeSkeleton } from "@/shared/components/PageSkeletons"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { resolveContinueLearning } from "../api/continueLearning"
import { useCurrentUser } from "../api/useCurrentUser"
import { resolveFeaturedCard } from "../lib/featuredCard"
import HomeScreenComponents from "./HomeScreenComponents"

function findEnrolledProgram(
  programs: ProgramPublic[],
  byProgram: Map<string, ProgramEnrollment> | undefined,
) {
  for (const program of programs) {
    const entry = byProgram?.get(program.id)
    if (entry?.status === "enrolled") {
      return { program, session: entry.session }
    }
  }
  return null
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const programsQuery = usePrograms()
  const enrollment = useEnrollmentByProgram()
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

  const enrolled = findEnrolledProgram(programs, enrollment.byProgram)
  const featuredProgram = enrolled?.program ?? programs[0]

  const featured = resolveFeaturedCard({
    lastLesson: lastPath
      ? {
          bookTitle: lastBookQuery.data?.title,
          programTitle: lastProgramQuery.data?.title,
          lessonOrder: lastLessonQuery.data?.order,
        }
      : null,
    enrolled,
    fallbackProgram: featuredProgram,
  })

  const handleContinueLearning = async () => {
    const first = featuredProgram
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

  if (programsQuery.isLoading || enrollment.isLoading) {
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
      continueMode={Boolean(lastPath)}
      eyebrow={featured.eyebrow}
      continueTitle={featured.title || cards[0]?.title}
      continueSubtitle={featured.subtitle}
      onContinueLearning={handleContinueLearning}
      onViewAllPrograms={handleViewAllPrograms}
    />
  )
}
