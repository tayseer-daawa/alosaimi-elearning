import { Flex, Text } from "@chakra-ui/react"
import { useParams } from "@tanstack/react-router"
import { useBook } from "../api/useBook"
import { useLessonsByBook } from "../api/useLessonsByBook"
import { BooksItem } from "./BooksItem"

export const BooksList = () => {
  const { bookId } = useParams({ strict: false })
  const bookQuery = useBook(bookId)
  const lessonsQuery = useLessonsByBook(bookId)

  if (bookQuery.isLoading || lessonsQuery.isLoading) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        جاري التحميل...
      </Text>
    )
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <Text color="red.500" textAlign="center" py={10}>
        تعذر تحميل الكتاب.
      </Text>
    )
  }

  const lessons = lessonsQuery.data?.data ?? []
  const book = {
    id: bookQuery.data.id,
    title: bookQuery.data.title,
    description: bookQuery.data.pdf
      ? "يتوفر لهذا الكتاب ملف PDF للقراءة."
      : "دروس هذا الكتاب مرتبة حسب التسلسل المعتمد في البرنامج.",
    courses: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.explanation_notes?.trim() || `المقرر ${lesson.order + 1}`,
    })),
  }

  return (
    <Flex flexDir="column" gap={4}>
      <BooksItem book={book} />
    </Flex>
  )
}
