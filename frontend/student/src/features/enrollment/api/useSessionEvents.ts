import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { enrollmentRepo } from "./enrollmentRepo"

export function useSessionEvents(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions.events(sessionId ?? ""),
    queryFn: () => enrollmentRepo.sessionEvents(sessionId!),
    enabled: Boolean(sessionId),
  })
}
