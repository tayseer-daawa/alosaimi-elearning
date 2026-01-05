import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { exampleRepo } from "./exampleRepo"

export function useCreateExample() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => exampleRepo.create(data),
    onSuccess: () => {
      // Invalidate the examples list so it refetches after creating a new example
      queryClient.invalidateQueries({ queryKey: queryKeys.example.lists() })
    },
    onError: (error: any) => {
      console.error("Failed to create example:", error.message || error)
    },
  })
}
