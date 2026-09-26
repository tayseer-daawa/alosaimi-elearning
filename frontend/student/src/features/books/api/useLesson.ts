import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { lessonsRepo } from "./booksRepo"

export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lessons.detail(lessonId ?? ""),
    queryFn: () => lessonsRepo.getOne(lessonId!),
    enabled: Boolean(lessonId),
  })
}
