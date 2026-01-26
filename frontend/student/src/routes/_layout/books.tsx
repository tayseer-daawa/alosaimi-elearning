import BooksScreen from '@/features/books/components/BooksScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/books')({
  component: BooksScreen,
})


