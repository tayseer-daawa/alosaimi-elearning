import { books } from '@/shared/api/mockData';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from '@tanstack/react-router';

type Book = typeof books[number]

interface BooksItemProps {
    book: Book;
}

export const BooksItem = ({ book }: BooksItemProps) => {
    const navigate = useNavigate()
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
                        fontSize={{ base: "sm", lg: "xl" }}
                        color="brand.secondary"
                        lineHeight="tall"
                        textAlign="justify"
                        w="full"
                        mb={6}
                    >
                        {book.description}
                    </Text>

                    {/* Courses list */}
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
                                    onClick={() => navigate({ to: '/course' })}
                                >
                                    {`المقرر ${index + 1} : ${course.title}`}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
