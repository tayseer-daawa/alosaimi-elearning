import type { ProgramPublic, ProgramSessionPublic } from "@/client"
import { sessionStartLabel } from "@/features/enrollment/lib/enrollmentState"
import { formatStudyDays } from "@/shared/lib/studyDays"

export type FeaturedCard = {
  eyebrow: string
  title: string
  subtitle: string
}

type FeaturedCardInput = {
  /** Set when this device has a saved last lesson. */
  lastLesson: {
    bookTitle?: string
    programTitle?: string
    lessonOrder?: number
  } | null
  enrolled: { program: ProgramPublic; session: ProgramSessionPublic } | null
  fallbackProgram: ProgramPublic | undefined
}

/** Home hero copy: last lesson first, then the enrolled program, then any program. */
export function resolveFeaturedCard({
  lastLesson,
  enrolled,
  fallbackProgram,
}: FeaturedCardInput): FeaturedCard {
  if (lastLesson) {
    return {
      eyebrow: "متابعة التعلم",
      title: lastLesson.bookTitle ?? lastLesson.programTitle ?? "",
      subtitle:
        lastLesson.lessonOrder === undefined
          ? ""
          : `المقرر ${lastLesson.lessonOrder + 1}`,
    }
  }

  if (enrolled) {
    return {
      eyebrow: "برنامجك",
      title: enrolled.program.title,
      subtitle: `أنت مسجّل · ${sessionStartLabel(enrolled.session)}`,
    }
  }

  return {
    eyebrow: "ابدأ من هنا",
    title: fallbackProgram?.title ?? "",
    subtitle: fallbackProgram
      ? formatStudyDays(fallbackProgram.days_of_study)
      : "",
  }
}
