import { Badge, Box, Flex, Heading, Image, Text } from "@chakra-ui/react"
import BooksIcon from "/assets/icomoon-free_books.svg"

type LessonCardProps = {
  title: string
  subtitle?: string
  showComingSoon?: boolean
  onClick?: () => void
}

export const ProgramCard = ({
  title,
  subtitle,
  showComingSoon = false,
  onClick,
}: LessonCardProps) => {
  return (
    <Box
      bg={"white"}
      position="relative"
      borderRadius="8px"
      p={{
        base: 6,
        lg: 10,
      }}
      boxShadow="lg"
      cursor="pointer"
      mt={{
        base: 5,
        lg: 0,
      }}
      h={{
        lg: "200px",
      }}
      w={{
        base: "70%",
        lg: "90%",
      }}
      onClick={onClick}
    >
      <Flex w={"100%"} align="center" h={"100%"} justifyContent="space-between">
        {/* Content */}
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
          <Text
            fontSize={{
              base: "sm",
              lg: "xl",
            }}
            color="gray.400"
          >
            {subtitle}
          </Text>
        </Box>

        {/* Icon */}
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

      {showComingSoon && (
        <Box>
          <Badge
            position="absolute"
            top={{
              base: "-12px",
              lg: "-20px",
            }}
            left="50%"
            transform="translateX(-50%)"
            bg="brand.lightTeal"
            px={{ base: 10, lg: 16 }}
            py={{
              base: 1.5,
              lg: 4,
            }}
            borderRadius="full"
            fontSize={{ base: "sm", lg: "2xl" }}
            fontWeight="semibold"
          >
            قريبًا
          </Badge>
        </Box>
      )}
    </Box>
  )
}
