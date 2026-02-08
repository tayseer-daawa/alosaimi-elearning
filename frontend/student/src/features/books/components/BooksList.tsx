import { Flex } from "@chakra-ui/react"
import { books } from "@/shared/api/mockData"
import { BooksItem } from "./BooksItem"

export const BooksList = () => {
  return (
    <Flex flexDir={"column"} gap={4}>
      {books.map((book) => (
        <BooksItem key={book.id} book={book} />
      ))}
    </Flex>
  )
}
