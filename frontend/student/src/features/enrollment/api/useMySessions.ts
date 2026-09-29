import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { enrollmentRepo } from "./enrollmentRepo"

export function useMySessions() {
  return useQuery({
    queryKey: queryKeys.sessions.mine(),
    queryFn: () => enrollmentRepo.mySessions(),
  })
}
