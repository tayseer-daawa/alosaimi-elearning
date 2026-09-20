import { Button, Flex, Text, VStack } from "@chakra-ui/react"
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
      <VStack gap={4} py={10}>
        <Text color="red.500" textAlign="center">
          تعذر تحميل الكتاب.
        </Text>
        <Button
          loading={bookQuery.isFetching}
          onClick={() => void bookQuery.refetch()}
        >
          إعادة المحاولة
        </Button>
      </VStack>
    )
  }

  if (lessonsQuery.isError) {
    return (
      <VStack gap={4} py={10}>
        <Text color="red.500" textAlign="center">
          تعذر تحميل دروس الكتاب.
        </Text>
        <Button
          loading={lessonsQuery.isFetching}
          onClick={() => void lessonsQuery.refetch()}
        >
          إعادة المحاولة
        </Button>
      </VStack>
    )
  }

  const lessons = [...(lessonsQuery.data?.data ?? [])].sort(
    (a, b) => a.order - b.order,
  )

  const book = {
    id: bookQuery.data.id,
    title: bookQuery.data.title,
    pdf: bookQuery.data.pdf,
    audio: bookQuery.data.audio,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      order: lesson.order,
      explanation_notes: lesson.explanation_notes,
    })),
  }

  return (
    <Flex flexDir="column" gap={4}>
      <BooksItem book={book} />
    </Flex>
  )
}
