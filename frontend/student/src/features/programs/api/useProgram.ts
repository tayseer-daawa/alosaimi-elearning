import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { programsRepo } from "./programsRepo"

export function useProgram(programId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programs.detail(programId ?? ""),
    queryFn: () => programsRepo.getOne(programId!),
    enabled: Boolean(programId),
  })
}
