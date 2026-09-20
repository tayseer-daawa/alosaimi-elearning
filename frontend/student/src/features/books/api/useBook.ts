import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/queryKeys"
import { booksRepo } from "./booksRepo"

export function useBook(bookId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.books.detail(bookId ?? ""),
    queryFn: () => booksRepo.getOne(bookId!),
    enabled: Boolean(bookId),
  })
}
