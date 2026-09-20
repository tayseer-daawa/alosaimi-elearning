import { Box, Button, Flex, Grid, Image, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import headphones from "/assets/headphones.svg"
import { usePhasesWithBooks } from "../api/usePhasesWithBooks"

export const PhasesList = () => {
  const { programId } = useParams({ strict: false })
  const { data: stages, isLoading, isError } = usePhasesWithBooks(programId)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [didInitExpand, setDidInitExpand] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (stages?.length && !didInitExpand) {
      setExpandedStage(stages[0].id)
      setDidInitExpand(true)
    }
  }, [stages, didInitExpand])

  const toggleStage = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId)
  }

  if (isLoading) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        جاري التحميل...
      </Text>
    )
  }

  if (isError) {
    return (
      <Text color="red.500" textAlign="center" py={10}>
        تعذر تحميل المراحل.
      </Text>
    )
  }

  if (!stages?.length) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        لا توجد مراحل لهذا البرنامج.
      </Text>
    )
  }

  return (
    <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
      {stages.map((stage) => {
        const isExpanded = expandedStage === stage.id
        const title = `مرحلة ${stage.order + 1}`
        const description =
          stage.books.length > 0
            ? `تضم هذه المرحلة ${stage.books.length} ${stage.books.length === 1 ? "كتاب" : "كتب"}.`
            : "لا توجد كتب مرتبطة بهذه المرحلة بعد."

        return (
          <Box key={stage.id}>
            <Box
              bg={isExpanded ? "brand.primary" : "white"}
              borderRadius="4px"
              overflow="hidden"
              boxShadow="lg"
              transition="all 0.3s"
            >
              <Box p={8} cursor="pointer" onClick={() => toggleStage(stage.id)}>
                <Flex mb={4} align="center" justify="space-between">
                  <Text
                    fontSize={{ base: "xl", lg: "3xl" }}
                    fontWeight="semibold"
                    color={isExpanded ? "white" : "brand.primary"}
                    textAlign="right"
                  >
                    {title}
                  </Text>

                  <Box
                    w={{ base: 8, lg: 14 }}
                    h={{ base: 8, lg: 14 }}
                    bg="brand.secondary"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Image
                      src={headphones}
                      boxSize={{ base: 4, lg: 6 }}
                      objectFit="contain"
                    />
                  </Box>
                </Flex>

                <Text
                  fontSize={{ base: "md", lg: "xl" }}
                  color={isExpanded ? "brand.lightGray" : "brand.secondary"}
                  lineHeight="tall"
                  textAlign="justify"
                  w="full"
                >
                  {description}
                </Text>

                {isExpanded && stage.books.length > 0 && (
                  <Grid templateColumns="repeat(2, 1fr)" gap={2} mt={4}>
                    {stage.books.map((book, index) => (
                      <Button
                        key={book.id}
                        bg="brand.accent"
                        color="text.default"
                        _hover={{ bg: "#d4cc85" }}
                        borderRadius="4px"
                        fontSize="md"
                        fontWeight="semibold"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({
                            to: "/programs/$programId/phases/$phaseId/books/$bookId",
                            params: {
                              programId: programId ?? "",
                              phaseId: stage.id,
                              bookId: book.id,
                            },
                          })
                        }}
                      >
                        {book.title || `الكتاب ${index + 1}`}
                      </Button>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>
          </Box>
        )
      })}
    </Grid>
  )
}
