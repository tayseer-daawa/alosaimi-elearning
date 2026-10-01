import { booksRepo } from "@/features/books/api/booksRepo"
import { loadLastLearningPath } from "@/features/course/lib/lessonProgress"
import { phasesRepo } from "@/features/phases/api/phasesRepo"

export type ContinueLearningTarget = {
  programId: string
  phaseId: string
  bookId: string
  courseId: string
}

/**
 * Prefer the last course opened on this device (localStorage).
 * Fall back to the first program → phase → book → lesson leaf.
 */
export async function resolveContinueLearning(
  fallbackProgramId: string,
): Promise<ContinueLearningTarget | null> {
  const last = loadLastLearningPath()
  if (last) {
    return {
      programId: last.programId,
      phaseId: last.phaseId,
      bookId: last.bookId,
      courseId: last.courseId,
    }
  }

  return resolveFirstLessonInProgram(fallbackProgramId)
}

/** First catalog leaf — used when the student has never opened a lesson here. */
export async function resolveFirstLessonInProgram(
  programId: string,
): Promise<ContinueLearningTarget | null> {
  const phases = await phasesRepo.byProgram(programId, { limit: 1 })
  const phase = phases.data[0]
  if (!phase) return null

  const books = await phasesRepo.booksByPhase(phase.id, { limit: 1 })
  const book = books.data[0]
  if (!book) return null

  const lessons = await booksRepo.lessonsByBook(book.id, { limit: 1 })
  const lesson = lessons.data[0]
  if (!lesson) return null

  return {
    programId,
    phaseId: phase.id,
    bookId: book.id,
    courseId: lesson.id,
  }
}
