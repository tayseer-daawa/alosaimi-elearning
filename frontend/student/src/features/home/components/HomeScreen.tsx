import { Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useBook } from "@/features/books/api/useBook"
import { useLesson } from "@/features/books/api/useLesson"
import { loadLastLearningPath } from "@/features/course/lib/lessonProgress"
import { useProgram } from "@/features/programs/api/useProgram"
import { usePrograms } from "@/features/programs/api/usePrograms"
import { HomeSkeleton } from "@/shared/components/PageSkeletons"
import { formatStudyDays } from "@/shared/lib/studyDays"
import { useContinueLearning } from "../api/useContinueLearning"
import { useCurrentUser } from "../api/useCurrentUser"
import HomeScreenComponents from "./HomeScreenComponents"

const CONTINUE_ERROR_MESSAGE =
  "تعذر فتح المقرر. تحقق من الاتصال ثم حاول مرة أخرى."

export default function HomeScreen() {
  const navigate = useNavigate()
  const programsQuery = usePrograms()
  const userQuery = useCurrentUser()
  const continueLearning = useContinueLearning()
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

  const firstProgramId = programs[0]?.id
  const canContinue = hasContinue || Boolean(firstProgramId)

  const handleContinueLearning = () => {
    if (!canContinue || continueLearning.isPending) return

    continueLearning.mutate(firstProgramId, {
      onSuccess: (target) => {
        if (target) {
          navigate({
            to: "/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId",
            params: target,
          })
        } else if (firstProgramId) {
          // The program has no lesson yet — open it so the student sees why.
          navigate({
            to: "/programs/$programId/phases",
            params: { programId: firstProgramId },
          })
        }
      },
    })
  }

  const handleViewAllPrograms = () => {
    navigate({ to: "/programs" })
  }

  if (programsQuery.isLoading) {
    return <HomeSkeleton />
  }

  // A saved path opens without the program list, so its failure must not
  // hide the continue card.
  if (programsQuery.isError && !hasContinue) {
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
      canContinue={canContinue}
      continueLoading={continueLearning.isPending}
      continueError={
        continueLearning.isError ? CONTINUE_ERROR_MESSAGE : undefined
      }
      onContinueLearning={handleContinueLearning}
      onViewAllPrograms={handleViewAllPrograms}
    />
  )
}
