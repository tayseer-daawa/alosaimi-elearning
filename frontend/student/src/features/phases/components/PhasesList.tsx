import { Box, Button, Flex, Grid, Image, Text, VStack } from "@chakra-ui/react"
import { Link, useParams } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { loadLastLearningPath } from "@/features/course/lib/lessonProgress"
import { PhasesListSkeleton } from "@/shared/components/PageSkeletons"
import headphones from "/assets/headphones.svg"
import { usePhasesWithBooks } from "../api/usePhasesWithBooks"

export const PhasesList = () => {
  const { programId } = useParams({ strict: false })
  const {
    data: stages,
    isLoading,
    isError,
    isFetching,
    retry,
  } = usePhasesWithBooks(programId)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [didInitExpand, setDidInitExpand] = useState(false)
  const lastBookId = loadLastLearningPath()?.bookId ?? null

  const orderedStages = stages
    ? [...stages].sort((a, b) => a.order - b.order)
    : undefined

  useEffect(() => {
    if (orderedStages?.length && !didInitExpand) {
      setExpandedStage(orderedStages[0].id)
      setDidInitExpand(true)
    }
  }, [orderedStages, didInitExpand])

  const toggleStage = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId)
  }

  if (isLoading) {
    return <PhasesListSkeleton />
  }

  if (isError) {
    return (
      <VStack gap={4} py={10}>
        <Text color="red.500" textAlign="center">
          تعذر تحميل المراحل.
        </Text>
        <Button
          loading={isFetching}
          onClick={() => void retry()}
          data-testid="phases-retry"
        >
          إعادة المحاولة
        </Button>
      </VStack>
    )
  }

  if (!orderedStages?.length) {
    return (
      <Text color="brand.secondary" textAlign="center" py={10}>
        لا توجد مراحل لهذا البرنامج.
      </Text>
    )
  }

  return (
    <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
      {orderedStages.map((stage) => {
        const isExpanded = expandedStage === stage.id
        const showBooks = isExpanded && stage.books.length > 0
        const booksId = `phase-books-${stage.id}`
        // PhasePublic has no title — label from API order only.
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
              {/* The books grid sits outside the toggle: links can't nest in a button. */}
              <Box
                as="button"
                display="block"
                w="full"
                p={8}
                pb={showBooks ? 5 : 8}
                textAlign="start"
                cursor="pointer"
                aria-expanded={isExpanded}
                aria-controls={showBooks ? booksId : undefined}
                _focusVisible={{
                  outline: "2px solid",
                  outlineColor: isExpanded ? "white" : "brand.primary",
                  outlineOffset: "-6px",
                }}
                data-testid="phase-toggle"
                onClick={() => toggleStage(stage.id)}
              >
                <Flex
                  as="span"
                  mb={4}
                  align="center"
                  justify="space-between"
                  gap={3}
                >
                  <Text
                    as="span"
                    fontSize={{ base: "xl", lg: "3xl" }}
                    fontWeight="semibold"
                    color={isExpanded ? "white" : "brand.primary"}
                    textAlign="right"
                    flex="1"
                    minW={0}
                  >
                    {title}
                  </Text>

                  <Box
                    as="span"
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
                      alt=""
                      boxSize={{ base: 4, lg: 6 }}
                      objectFit="contain"
                    />
                  </Box>
                </Flex>

                <Text
                  as="span"
                  display="block"
                  fontSize={{ base: "md", lg: "xl" }}
                  color={isExpanded ? "brand.lightGray" : "brand.secondary"}
                  lineHeight="tall"
                  textAlign="right"
                  w="full"
                >
                  {description}
                </Text>
              </Box>

              {showBooks && (
                <Grid
                  id={booksId}
                  templateColumns={{
                    base: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  }}
                  gap={3}
                  px={8}
                  pb={8}
                >
                  {stage.books.map((book) => {
                    const isLastOpened = lastBookId === book.id
                    return (
                      <Button
                        key={book.id}
                        asChild
                        bg={isLastOpened ? "white" : "brand.accent"}
                        color="text.default"
                        _hover={{
                          bg: isLastOpened ? "brand.lightTeal" : "#d4cc85",
                        }}
                        borderRadius="4px"
                        borderWidth="2px"
                        borderColor={
                          isLastOpened ? "brand.primary" : "transparent"
                        }
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="semibold"
                        h="auto"
                        minH="12"
                        minW={0}
                        w="full"
                        px={3}
                        py={3}
                        pt={isLastOpened ? 6 : 3}
                        whiteSpace="normal"
                        lineHeight="short"
                        textAlign="center"
                        overflow="hidden"
                        position="relative"
                        data-testid={
                          isLastOpened
                            ? "phase-book-chip-last"
                            : "phase-book-chip"
                        }
                      >
                        <Link
                          to="/programs/$programId/phases/$phaseId/books/$bookId"
                          params={{
                            programId: programId ?? "",
                            phaseId: stage.id,
                            bookId: book.id,
                          }}
                        >
                          {isLastOpened ? (
                            <Text
                              as="span"
                              position="absolute"
                              top="0"
                              insetInlineStart="0"
                              px={2}
                              py={0.5}
                              borderBottomEndRadius="md"
                              bg="brand.primary"
                              color="white"
                              fontSize="2xs"
                              fontWeight="bold"
                              lineHeight="1.2"
                              letterSpacing="0.02em"
                            >
                              متابعة
                            </Text>
                          ) : null}
                          <Text
                            as="span"
                            w="full"
                            lineClamp={2}
                            overflowWrap="anywhere"
                          >
                            {book.title}
                          </Text>
                        </Link>
                      </Button>
                    )
                  })}
                </Grid>
              )}
            </Box>
          </Box>
        )
      })}
    </Grid>
  )
}
