import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { programsRepo } from "./programsRepo"

export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs.lists(),
    queryFn: () => programsRepo.list({ limit: 100 }),
  })
}
