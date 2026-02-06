import BookScreen from '@/features/books/components/BookScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/programs/$programId/phases/$phaseId/books/$bookId/')({
  component: BookScreen,
})


