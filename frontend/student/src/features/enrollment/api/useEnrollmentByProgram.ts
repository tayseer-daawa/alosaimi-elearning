import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { indexEnrollmentByProgram } from "../lib/enrollmentState"
import { enrollmentRepo } from "./enrollmentRepo"
import { useMySessions } from "./useMySessions"

/** Enrollment status for every program, from two list calls (no per-program fetches). */
export function useEnrollmentByProgram() {
  const allSessions = useQuery({
    queryKey: queryKeys.sessions.lists(),
    queryFn: () => enrollmentRepo.allSessions(),
  })
  const mySessions = useMySessions()

  const ready = Boolean(allSessions.data && mySessions.data)
  return {
    byProgram: ready
      ? indexEnrollmentByProgram(allSessions.data!.data, mySessions.data!.data)
      : undefined,
    isLoading: allSessions.isLoading || mySessions.isLoading,
  }
}
