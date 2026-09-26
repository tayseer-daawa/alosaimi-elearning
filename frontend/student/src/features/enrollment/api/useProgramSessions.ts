import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { enrollmentRepo } from "./enrollmentRepo"

export function useProgramSessions(programId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions.byProgram(programId ?? ""),
    queryFn: () => enrollmentRepo.sessionsByProgram(programId!),
    enabled: Boolean(programId),
  })
}
