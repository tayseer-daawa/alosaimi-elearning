// react query hooks live here.

import { useQuery } from "@tanstack/react-query";
import { exampleRepo } from "./exampleRepo";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useExamples() {
  return useQuery({
    queryKey: queryKeys.example.lists(),
    queryFn: () => exampleRepo.list(),
  });
}
