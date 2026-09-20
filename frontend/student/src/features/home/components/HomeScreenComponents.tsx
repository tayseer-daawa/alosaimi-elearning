import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"

import { BookOpen, GraduationCap, MoveLeft } from "lucide-react"
import { AppMenu } from "@/shared/components/AppMenu"

/** Fields that come from GET /programs (plus formatted days). */
interface ProgramSummary {
  id: string
  title: string
  subtitle: string
}

interface HomeScreenProps {
  allPrograms?: ProgramSummary[]
  userName?: string
  onContinueLearning?: () => void
  onViewAllPrograms?: () => void
}

export default function HomeScreenComponents({
  allPrograms = [],
  userName = "الطالب",
  onContinueLearning,
  onViewAllPrograms,
}: HomeScreenProps) {
  const featured = allPrograms[0]
  const totalPrograms = allPrograms.length

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      py={4}
      px={6}
      dir="rtl"
    >
      <Box
        position="relative"
        h={{ base: "auto", lg: "100px" }}
        w="full"
        mt={{ base: 3, lg: 5 }}
        mb={{ base: 8, lg: 10 }}
      >
        <Flex
          align="center"
          justify="center"
          h="100%"
          w="full"
          position="relative"
        >
          <AppMenu />

          <VStack gap={{ base: 1, lg: 2 }}>
            <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
              مرحباً {userName}
            </Heading>
            <Text
              fontSize={{ base: "sm", lg: "xl" }}
              color="brand.secondary"
              fontWeight="400"
            >
              لنواصل رحلة التعلم معاً
            </Text>
          </VStack>
        </Flex>
      </Box>

      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 6, lg: 10 }}
        flex={1}
        maxW="1600px"
        mx="auto"
        w="full"
        pb={{ base: 6, lg: 0 }}
      >
        <Box
          flex={{ base: "1", lg: "1.3" }}
          bg="white"
          borderRadius={{ base: "2xl", lg: "3xl" }}
          boxShadow="0 4px 20px rgba(33, 96, 93, 0.08)"
          overflow="hidden"
          transition="all 0.3s ease"
          _hover={{
            transform: "translateY(-6px)",
            boxShadow: "0 12px 32px rgba(33, 96, 93, 0.15)",
          }}
          cursor={featured ? "pointer" : "default"}
          onClick={featured ? onContinueLearning : undefined}
          p={{ base: 6, lg: 10 }}
        >
          <VStack align="stretch" gap={{ base: 6, lg: 8 }} h="full">
            <Flex justify="space-between" align="flex-start" gap={4}>
              <VStack align="start" gap={{ base: 2, lg: 3 }} flex={1}>
                <Text
                  fontSize={{ base: "sm", lg: "lg" }}
                  color="brand.secondary"
                  fontWeight="600"
                  letterSpacing="0.5px"
                >
                  ابدأ من هنا
                </Text>

                <Heading
                  size={{ base: "xl", lg: "3xl" }}
                  color="brand.primary"
                  lineHeight="1.2"
                  fontWeight="700"
                >
                  {featured?.title || "لا توجد برامج بعد"}
                </Heading>

                {featured?.subtitle ? (
                  <Text
                    fontSize={{ base: "md", lg: "xl" }}
                    color="brand.secondary"
                    fontWeight="500"
                  >
                    {featured.subtitle}
                  </Text>
                ) : null}
              </VStack>

              <Flex
                bg="brand.lightTeal"
                p={{ base: 3, lg: 4 }}
                borderRadius="xl"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon
                  as={BookOpen}
                  boxSize={{ base: 6, lg: 10 }}
                  color="brand.primary"
                />
              </Flex>
            </Flex>

            <Button
              size={{ base: "md", lg: "lg" }}
              w="full"
              mt="auto"
              disabled={!featured}
              onClick={(e) => {
                e.stopPropagation()
                onContinueLearning?.()
              }}
            >
              <Flex align="center" gap={3}>
                <Text fontSize={{ base: "lg", lg: "2xl" }}>
                  استعرض البرنامج
                </Text>
                <Icon as={MoveLeft} boxSize={{ base: 5, lg: 7 }} />
              </Flex>
            </Button>
          </VStack>
        </Box>

        <Box
          flex={{ base: "1", lg: "0.9" }}
          bg="linear-gradient(135deg, #21605D 0%, #2D836E 100%)"
          borderRadius={{ base: "2xl", lg: "3xl" }}
          boxShadow="0 4px 20px rgba(33, 96, 93, 0.25)"
          overflow="hidden"
          position="relative"
          transition="all 0.3s ease"
          _hover={{
            transform: "translateY(-6px)",
            boxShadow: "0 12px 32px rgba(33, 96, 93, 0.35)",
          }}
          cursor="pointer"
          onClick={onViewAllPrograms}
          p={{ base: 6, lg: 10 }}
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at top right, rgba(228, 219, 153, 0.15), transparent 60%)",
            pointerEvents: "none",
          }}
        >
          <VStack
            align="stretch"
            gap={{ base: 6, lg: 8 }}
            h="full"
            position="relative"
            zIndex={1}
          >
            <Flex justify="center" mt={{ base: 2, lg: 6 }}>
              <Flex
                bg="rgba(255, 255, 255, 0.12)"
                p={{ base: 6, lg: 9 }}
                borderRadius="3xl"
                backdropFilter="blur(12px)"
                border="1px solid rgba(255, 255, 255, 0.18)"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
                align="center"
                justify="center"
              >
                <Icon
                  as={GraduationCap}
                  boxSize={{ base: 12, lg: 20 }}
                  color="white"
                />
              </Flex>
            </Flex>

            <VStack align="stretch" gap={{ base: 3, lg: 4 }} flex={1}>
              <Heading
                size={{ base: "xl", lg: "3xl" }}
                color="white"
                textAlign="center"
                lineHeight="1.3"
                fontWeight="700"
              >
                استكشف جميع البرامج
              </Heading>
              <Text
                fontSize={{ base: "sm", lg: "lg" }}
                color="rgba(255, 255, 255, 0.95)"
                textAlign="center"
                lineHeight="1.8"
                fontWeight="400"
              >
                اطلع على البرامج المتاحة في المنصة وابدأ رحلة التعلم
              </Text>
            </VStack>

            <Flex justify="center" mt="auto">
              <Box
                bg="rgba(255, 255, 255, 0.15)"
                backdropFilter="blur(12px)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                px={{ base: 5, lg: 8 }}
                py={{ base: 3, lg: 5 }}
                borderRadius="xl"
                textAlign="center"
                minW={{ base: "120px", lg: "160px" }}
              >
                <Text
                  fontSize={{ base: "3xl", lg: "5xl" }}
                  fontWeight="700"
                  color="white"
                  lineHeight="1"
                >
                  {totalPrograms}
                </Text>
                <Text
                  fontSize={{ base: "xs", lg: "md" }}
                  color="rgba(255, 255, 255, 0.95)"
                  mt={2}
                  fontWeight="500"
                >
                  برنامج
                </Text>
              </Box>
            </Flex>

            <Button
              bg="brand.accent"
              color="brand.primary"
              size={{ base: "md", lg: "lg" }}
              w="full"
              mt={{ base: 4, lg: 6 }}
              onClick={(e) => {
                e.stopPropagation()
                onViewAllPrograms?.()
              }}
            >
              عرض جميع البرامج
            </Button>
          </VStack>
        </Box>
      </Flex>
    </Box>
  )
}
