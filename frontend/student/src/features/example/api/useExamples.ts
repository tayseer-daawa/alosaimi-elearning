// react query hooks live here.

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { exampleRepo } from "./exampleRepo"

export function useExamples() {
  return useQuery({
    queryKey: queryKeys.example.lists(),
    queryFn: () => exampleRepo.list(),
  })
}
