import { useQueries } from "@tanstack/react-query"
import type { BookPublic, PhasePublic } from "@/client"
import { queryKeys } from "@/shared/lib/queryKeys"
import { phasesRepo } from "./phasesRepo"
import { usePhasesByProgram } from "./usePhasesByProgram"

export type PhaseWithBooks = PhasePublic & { books: BookPublic[] }

/** Load every phase for a program, then each phase's books in parallel. */
export function usePhasesWithBooks(programId: string | undefined) {
  const phasesQuery = usePhasesByProgram(programId)
  const phases = phasesQuery.data?.data ?? []

  const bookQueries = useQueries({
    queries: phases.map((phase) => ({
      queryKey: queryKeys.phases.books(phase.id),
      queryFn: () => phasesRepo.booksByPhase(phase.id, { limit: 100 }),
      enabled: phasesQuery.isSuccess,
    })),
  })

  const isLoading =
    phasesQuery.isLoading || bookQueries.some((q) => q.isLoading)
  const isError = phasesQuery.isError || bookQueries.some((q) => q.isError)

  const data: PhaseWithBooks[] | undefined = phasesQuery.isSuccess
    ? phases.map((phase, index) => ({
        ...phase,
        books: bookQueries[index]?.data?.data ?? [],
      }))
    : undefined

  return {
    data,
    isLoading,
    isError,
    error: phasesQuery.error ?? bookQueries.find((q) => q.error)?.error,
    phasesQuery,
  }
}
