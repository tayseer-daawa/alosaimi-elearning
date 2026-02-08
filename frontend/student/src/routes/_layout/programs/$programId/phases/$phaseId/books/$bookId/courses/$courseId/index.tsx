import { createFileRoute } from "@tanstack/react-router"
import CourseScreen from "@/features/course/components/CourseScreen"

export const Route = createFileRoute(
  "/_layout/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId/",
)({
  component: CourseScreen,
})
