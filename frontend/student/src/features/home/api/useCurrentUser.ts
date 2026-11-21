import { useQuery } from "@tanstack/react-query"
import { usersRepo } from "@/shared/api/usersRepo"
import { queryKeys } from "@/shared/lib/queryKeys"

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersRepo.me(),
  })
}
