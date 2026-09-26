import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { phasesRepo } from "./phasesRepo"

export function usePhase(phaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.phases.detail(phaseId ?? ""),
    queryFn: () => phasesRepo.getOne(phaseId!),
    enabled: Boolean(phaseId),
  })
}
