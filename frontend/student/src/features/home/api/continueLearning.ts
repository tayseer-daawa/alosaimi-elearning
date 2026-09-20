import { booksRepo } from "@/features/books/api/booksRepo"
import { phasesRepo } from "@/features/phases/api/phasesRepo"

export type ContinueLearningTarget = {
  programId: string
  phaseId: string
  bookId: string
  courseId: string
}

/**
 * Resolve the first program → phase → book → lesson path for "continue learning".
 * Returns null when any level is empty.
 */
export async function resolveContinueLearning(
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
