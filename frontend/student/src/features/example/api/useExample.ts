import { useQuery } from "@tanstack/react-query";
import { exampleRepo } from "./exampleRepo";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useExample(id: string) {
  return useQuery({
    queryKey: queryKeys.example.detail(id),
    queryFn: () => exampleRepo.getOne(id),
  });
}
