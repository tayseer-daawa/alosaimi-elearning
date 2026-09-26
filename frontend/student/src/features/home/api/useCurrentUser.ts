import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { usersRepo } from "./usersRepo"

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersRepo.me(),
  })
}
