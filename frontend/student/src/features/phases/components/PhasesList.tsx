import { Box, Button, Flex, Grid, Image, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"
import { stages } from "@/shared/api/mockData"
import headphones from "/assets/headphones.svg"

export const PhasesList = () => {
  const [expandedStage, setExpandedStage] = useState<number | null>(1)
  const toggleStage = (stageId: number | null) => {
    setExpandedStage(expandedStage === stageId ? null : stageId)
  }
  const navigate = useNavigate()
  const { programId } = useParams({ strict: false })

  return (
    <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
      {stages.map((stage) => (
        <Box key={stage.id}>
          <Box
            bg={expandedStage === stage.id ? "brand.primary" : "white"}
            borderRadius="4px"
            overflow="hidden"
            boxShadow="lg"
            transition="all 0.3s"
          >
            <Box p={8} cursor="pointer" onClick={() => toggleStage(stage.id)}>
              <Flex mb={4} align="center" justify="space-between">
                <Text
                  fontSize={{
                    base: "xl",
                    lg: "3xl",
                  }}
                  fontWeight="semibold"
                  color={expandedStage === stage.id ? "white" : "brand.primary"}
                  textAlign="right"
                >
                  {stage.title}
                </Text>

                <Box
                  w={{
                    base: 8,
                    lg: 14,
                  }}
                  h={{
                    base: 8,
                    lg: 14,
                  }}
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
                fontSize={{
                  base: "md",
                  lg: "xl",
                }}
                color={
                  expandedStage === stage.id
                    ? "brand.lightGray"
                    : "brand.secondary"
                }
                lineHeight="tall"
                textAlign="justify"
                w="full"
              >
                {stage.description}
              </Text>

              {expandedStage === stage.id && stage.lessons.length > 0 && (
                <Grid
                  display={{
                    base: "grid",
                    lg: "none",
                  }}
                  templateColumns="repeat(2, 1fr)"
                  gap={2}
                  mt={4}
                >
                  {stage.lessons.map((lesson) => (
                    <Button
                      key={lesson.id}
                      bg="brand.accent"
                      color="text.default"
                      _hover={{ bg: "#d4cc85" }}
                      borderRadius="4px"
                      fontSize="md"
                      fontWeight="semibold"
                      onClick={() =>
                        navigate({
                          to: "/programs/$programId/phases/$phaseId/books/$bookId",
                          params: {
                            programId: programId?.toString() || "",
                            phaseId: stage.id.toString(),
                            bookId: lesson.id.toString(),
                          },
                        })
                      }
                    >
                      {lesson.label}
                    </Button>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Grid>
  )
}
