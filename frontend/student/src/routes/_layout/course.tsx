import CourseScreen from '@/features/course/components/CourseScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/course')({
  component: CourseScreen,
})


