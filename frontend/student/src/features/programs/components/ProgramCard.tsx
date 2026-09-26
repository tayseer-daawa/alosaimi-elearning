import { Box, Flex, Heading, Image, Text } from "@chakra-ui/react"
import BooksIcon from "/assets/icomoon-free_books.svg"

type ProgramCardProps = {
  title: string
  subtitle?: string
  onClick?: () => void
}

/** Catalog card — only fields the programs API exposes (title + study days). */
export const ProgramCard = ({ title, subtitle, onClick }: ProgramCardProps) => {
  return (
    <Box
      bg="white"
      position="relative"
      borderRadius="8px"
      p={{
        base: 6,
        lg: 10,
      }}
      boxShadow="lg"
      cursor="pointer"
      minH={{ base: "auto", lg: "168px" }}
      h="auto"
      flexShrink={0}
      w={{
        base: "70%",
        lg: "90%",
      }}
      onClick={onClick}
    >
      <Flex w="100%" align="center" h="100%" justifyContent="space-between">
        <Box>
          <Heading
            size={{
              base: "lg",
              lg: "4xl",
            }}
            color="brand.primary"
            mb={1}
          >
            {title}
          </Heading>
          {subtitle ? (
            <Text
              fontSize={{
                base: "sm",
                lg: "xl",
              }}
              color="gray.400"
            >
              {subtitle}
            </Text>
          ) : null}
        </Box>

        <Flex
          w={{
            base: 12,
            lg: 20,
          }}
          h={{
            base: 12,
            lg: 20,
          }}
          bg="brand.lightTeal"
          borderRadius="full"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Image
            src={BooksIcon}
            boxSize={{ base: 6, lg: 10 }}
            objectFit="contain"
          />
        </Flex>
      </Flex>
    </Box>
  )
}
