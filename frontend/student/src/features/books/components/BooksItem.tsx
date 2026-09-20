import { Box, Flex, Link, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"

export type BookLessonView = {
  id: string
  order: number
  explanation_notes: string
}

export type BookView = {
  id: string
  title: string
  pdf?: string | null
  audio?: string | null
  lessons: BookLessonView[]
}

interface BooksItemProps {
  book: BookView
}

export const BooksItem = ({ book }: BooksItemProps) => {
  const navigate = useNavigate()
  const { programId, phaseId, bookId } = useParams({ strict: false })

  const hasPdf = Boolean(book.pdf?.trim())
  const hasAudio = Boolean(book.audio?.trim())

  return (
    <Box key={book.id}>
      <Box
        bg="white"
        borderRadius="4px"
        overflow="hidden"
        boxShadow="lg"
        transition="all 0.3s"
      >
        <Box p={8}>
          <Text
            fontSize={{ base: "xl", lg: "3xl" }}
            fontWeight="semibold"
            color="brand.primary"
            textAlign="right"
            mb={4}
          >
            {book.title}
          </Text>

          {(hasPdf || hasAudio) && (
            <Flex gap={4} mb={6} flexWrap="wrap">
              {hasPdf && (
                <Link
                  href={book.pdf!}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="brand.primary"
                  fontSize={{ base: "sm", lg: "md" }}
                  textDecoration="underline"
                  _hover={{ opacity: 0.8 }}
                >
                  ملف PDF
                </Link>
              )}
              {hasAudio && (
                <Link
                  href={book.audio!}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="brand.primary"
                  fontSize={{ base: "sm", lg: "md" }}
                  textDecoration="underline"
                  _hover={{ opacity: 0.8 }}
                >
                  ملف صوتي
                </Link>
              )}
            </Flex>
          )}

          {book.lessons.length === 0 ? (
            <Text color="brand.secondary" fontSize="md">
              لا توجد دروس لهذا الكتاب بعد.
            </Text>
          ) : (
            <Box
              as="ul"
              listStyleType="square"
              listStylePosition="inside"
              m={0}
              p={0}
            >
              {book.lessons.map((lesson) => {
                const notes = lesson.explanation_notes?.trim()
                return (
                  <Box as="li" key={lesson.id} mb={3}>
                    <Text
                      as="span"
                      fontSize={{ base: "sm", lg: "md" }}
                      color="brand.primary"
                      textDecoration="underline"
                      cursor="pointer"
                      _hover={{ opacity: 0.8 }}
                      onClick={() =>
                        navigate({
                          to: "/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId",
                          params: {
                            programId: programId ?? "",
                            phaseId: phaseId ?? "",
                            bookId: bookId ?? book.id,
                            courseId: lesson.id,
                          },
                        })
                      }
                    >
                      {`الدرس ${lesson.order + 1}`}
                    </Text>
                    {notes ? (
                      <Text
                        mt={1}
                        fontSize={{ base: "sm", lg: "md" }}
                        color="brand.secondary"
                        lineHeight="tall"
                        whiteSpace="pre-wrap"
                      >
                        {notes}
                      </Text>
                    ) : null}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
