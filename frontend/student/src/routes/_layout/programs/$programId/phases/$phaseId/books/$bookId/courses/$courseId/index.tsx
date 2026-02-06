import CourseScreen from '@/features/course/components/CourseScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_layout/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId/',
)({
  component: CourseScreen,
})


