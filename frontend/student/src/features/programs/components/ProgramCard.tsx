import { Box, Flex, Heading, Image, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"
import BooksIcon from "/assets/icomoon-free_books.svg"

type ProgramCardProps = {
  title: string
  subtitle?: string
  /** Shown above the title, e.g. the enrollment badge. */
  badge?: ReactNode
  highlighted?: boolean
  onClick?: () => void
}

/** Catalog card — only fields the programs API exposes (title + study days). */
export const ProgramCard = ({
  title,
  subtitle,
  badge,
  highlighted = false,
  onClick,
}: ProgramCardProps) => {
  return (
    <Box
      bg="white"
      position="relative"
      borderRadius="8px"
      borderWidth="2px"
      borderColor={highlighted ? "brand.primary" : "transparent"}
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
      data-testid="program-card"
    >
      <Flex w="100%" align="center" h="100%" justifyContent="space-between">
        <Box>
          {badge ? <Box mb={2}>{badge}</Box> : null}
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
            alt=""
            boxSize={{ base: 6, lg: 10 }}
            objectFit="contain"
          />
        </Flex>
      </Flex>
    </Box>
  )
}
