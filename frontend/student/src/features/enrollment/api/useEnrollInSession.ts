import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ApiError, type ProgramSessionsPublic } from "@/client"
import { queryKeys } from "@/shared/lib/queryKeys"
import { enrollmentRepo } from "./enrollmentRepo"

export function isSessionGoneError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

export function useEnrollInSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => enrollmentRepo.enroll(sessionId),
    onSuccess: (session) => {
      queryClient.setQueryData<ProgramSessionsPublic>(
        queryKeys.sessions.mine(),
        (current) => {
          if (!current) return current
          if (current.data.some((s) => s.id === session.id)) return current
          return { data: [...current.data, session], count: current.count + 1 }
        },
      )
      return queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.mine(),
      })
    },
    onError: (error) => {
      if (!isSessionGoneError(error)) return
      return queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
    },
  })
}
