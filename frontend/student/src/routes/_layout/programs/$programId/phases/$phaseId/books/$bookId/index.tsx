import { createFileRoute } from "@tanstack/react-router"
import BookScreen from "@/features/books/components/BookScreen"

export const Route = createFileRoute(
  "/_layout/programs/$programId/phases/$phaseId/books/$bookId/",
)({
  component: BookScreen,
})
