import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { phasesRepo } from "./phasesRepo"

export function usePhasesByProgram(programId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.phases.byProgram(programId ?? ""),
    queryFn: () => phasesRepo.byProgram(programId!, { limit: 100 }),
    enabled: Boolean(programId),
  })
}
