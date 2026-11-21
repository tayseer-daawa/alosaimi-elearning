import { useMutation } from "@tanstack/react-query"
import { resolveContinueLearning } from "./continueLearning"

/**
 * Resolves where "continue learning" should go. A mutation, not a query: it
 * runs on click, and a failure must stay visible until the student retries.
 */
export function useContinueLearning() {
  return useMutation({
    mutationFn: (fallbackProgramId: string | undefined) =>
      resolveContinueLearning(fallbackProgramId),
  })
}
