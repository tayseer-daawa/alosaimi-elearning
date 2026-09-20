import { Box, Flex, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"

export type BookView = {
  id: string
  title: string
  description: string
  courses: { id: string; title: string }[]
}

interface BooksItemProps {
  book: BookView
}

export const BooksItem = ({ book }: BooksItemProps) => {
  const navigate = useNavigate()
  const { programId, phaseId, bookId } = useParams({ strict: false })

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
          <Flex mb={4} align="center" justify="space-between">
            <Text
              fontSize={{ base: "xl", lg: "3xl" }}
              fontWeight="semibold"
              color="brand.primary"
              textAlign="right"
            >
              {book.title}
            </Text>
          </Flex>

          <Text
            fontSize={{ base: "md", lg: "xl" }}
            color="brand.secondary"
            lineHeight="tall"
            textAlign="justify"
            w="full"
            mb={6}
          >
            {book.description}
          </Text>

          <Box
            as="ul"
            listStyleType="square"
            listStylePosition="inside"
            m={0}
            p={0}
          >
            {book.courses.map((course, index) => (
              <Box as="li" key={course.id} mb={2}>
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
                        courseId: course.id,
                      },
                    })
                  }
                >
                  {`المقرر ${index + 1} : ${course.title}`}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
