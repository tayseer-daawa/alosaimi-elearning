import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { booksRepo } from "./booksRepo"

export function useLessonsByBook(bookId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.books.lessons(bookId ?? ""),
    queryFn: () => booksRepo.lessonsByBook(bookId!, { limit: 100 }),
    enabled: Boolean(bookId),
  })
}
