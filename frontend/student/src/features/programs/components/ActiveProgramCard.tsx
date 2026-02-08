import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Progress,
  Text,
} from "@chakra-ui/react"
import { Play } from "lucide-react"
import Book from "/assets/book.svg"

type ActiveProgramCardProps = {
  status?: string
  title: string
  subtitle?: string
  description: string
  progress: number // 0–100
  onPlay?: () => void
}

export const ActiveProgramCard = ({
  status,
  title,
  subtitle,
  description,
  progress,
  onPlay,
}: ActiveProgramCardProps) => {
  return (
    <Box
      position="relative"
      bg="brand.primary"
      borderRadius="8px"
      p={{
        base: 6,
        lg: 10,
      }}
      boxShadow="lg"
      w={"4/5"}
      h={{
        lg: "200px",
      }}
      onClick={() => onPlay?.()}
    >
      {/* Badge */}
      <Badge
        position="absolute"
        top={{
          base: "-12px",
          lg: "-20px",
        }}
        left="50%"
        transform="translateX(-50%)"
        bg="brand.accent"
        color="teal.900"
        px={{ base: 10, lg: 12 }}
        py={{
          base: 1.5,
          lg: 4,
        }}
        borderRadius="full"
        fontSize={{ base: "sm", lg: "2xl" }}
        fontWeight="semibold"
      >
        {status}
      </Badge>

      <Flex
        h={{
          lg: "100%",
        }}
        justify={"space-between"}
        align={"center"}
      >
        <Flex flexDir={"column"} justify={"center"} align={"start"}>
          <Heading
            size={{
              base: "lg",
              lg: "4xl",
            }}
            fontWeight={"semibold"}
            color="white"
          >
            {title}
          </Heading>
          <Text
            display={{
              base: "none",
              lg: "block",
            }}
            fontSize="xl"
            lineHeight="tall"
            color="brand.lightGray"
          >
            {subtitle}
          </Text>
        </Flex>

        <Button
          display={{
            base: "block",
            lg: "none",
          }}
          w={12}
          h={12}
          borderRadius="full"
          bg="brand.secondary"
          p={0}
        >
          <Icon as={Play} boxSize={5} color="white" fill="white" />
        </Button>

        <Flex
          display={{
            base: "none",
            lg: "flex",
          }}
          w={{
            base: 12,
            lg: 20,
          }}
          h={{
            base: 12,
            lg: 20,
          }}
          bg="brand.secondary"
          borderRadius="full"
          align="center"
          justify="center"
          flexShrink={0}
          cursor={"pointer"}
          onClick={() => onPlay?.()}
        >
          <Image src={Book} boxSize={{ base: 6, lg: 10 }} objectFit="contain" />
        </Flex>
      </Flex>

      {/* Content */}
      <Box mt={4}>
        <Text
          fontSize="md"
          display={{
            lg: "none",
          }}
          lineHeight="tall"
          mb={6}
          color="brand.lightGray"
        >
          {description}
        </Text>

        {/* Progress */}
        <Progress.Root
          display={{
            base: "block",
            lg: "none",
          }}
          value={progress}
        >
          <HStack gap={3} align="center">
            <Progress.ValueText
              color="white"
              fontSize="sm"
              fontWeight="medium"
              minW="3ch"
              textAlign="end"
            >
              {progress}%
            </Progress.ValueText>
            <Progress.Track
              flex="1"
              bg="whiteAlpha.400"
              borderRadius="full"
              h="4px"
            >
              <Progress.Range bg="white" borderRadius="full" />
            </Progress.Track>
          </HStack>
        </Progress.Root>
      </Box>
    </Box>
  )
}
