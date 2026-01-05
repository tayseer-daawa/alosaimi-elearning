import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { exampleRepo } from "./exampleRepo"

export function useExample(id: string) {
  return useQuery({
    queryKey: queryKeys.example.detail(id),
    queryFn: () => exampleRepo.getOne(id),
  })
}
