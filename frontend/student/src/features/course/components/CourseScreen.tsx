import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { MoveLeft, MoveRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useBook } from "@/features/books/api/useBook"
import { useLesson } from "@/features/books/api/useLesson"
import { useLessonsByBook } from "@/features/books/api/useLessonsByBook"
import { useProgram } from "@/features/programs/api/useProgram"
import { AppMenu } from "@/shared/components/AppMenu"
import { Breadcrumbs } from "@/shared/components/BreadcrumbsNavigation"
import AudioPlayer from "./AudioPlayer"

export default function CourseScreen() {
  const [activeTab, setActiveTab] = useState("content")
  const navigate = useNavigate()
  const { programId, phaseId, bookId, courseId } = useParams({
    strict: false,
  })

  const programQuery = useProgram(programId)
  const bookQuery = useBook(bookId)
  const lessonQuery = useLesson(courseId)
  const lessonsQuery = useLessonsByBook(bookId)

  const lessons = lessonsQuery.data?.data ?? []
  const currentIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === courseId),
    [lessons, courseId],
  )
  const lesson = lessonQuery.data
  const lessonLabel =
    currentIndex >= 0 ? `المقرر ${currentIndex + 1}` : "المقرر"

  const goToLesson = (lessonId: string) => {
    if (!programId || !phaseId || !bookId) return
    navigate({
      to: "/programs/$programId/phases/$phaseId/books/$bookId/courses/$courseId",
      params: {
        programId,
        phaseId,
        bookId,
        courseId: lessonId,
      },
    })
  }

  const goPrev = () => {
    if (currentIndex > 0) goToLesson(lessons[currentIndex - 1].id)
  }
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      goToLesson(lessons[currentIndex + 1].id)
    }
  }

  if (lessonQuery.isLoading) {
    return (
      <Text dir="rtl" p={8} color="brand.secondary">
        جاري التحميل...
      </Text>
    )
  }

  if (lessonQuery.isError || !lesson) {
    return (
      <Text dir="rtl" p={8} color="red.500">
        تعذر تحميل المقرر.
      </Text>
    )
  }

  return (
    <Box
      minH="100vh"
      dir="rtl"
      px={{ lg: "16" }}
      py={{ lg: "10" }}
      overflow="auto"
    >
      <Box>
        <Container maxW="container.lg" px={8} py={4}>
          <Flex
            display={{ base: "none", lg: "flex" }}
            align="center"
            justify="center"
            h="100%"
            position="relative"
          >
            <AppMenu />

            <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
              المقررات
            </Heading>
          </Flex>

          <Breadcrumbs
            breadcrumbs={[
              {
                label: programQuery.data?.title ?? "البرنامج",
                url: "/programs",
              },
              {
                label: phaseId ? "المرحلة" : "المرحلة",
                url: `/programs/${programId}/phases`,
              },
              {
                label: bookQuery.data?.title ?? "الكتاب",
                url: `/programs/${programId}/phases/${phaseId}/books/${bookId}`,
              },
              {
                label: lessonLabel,
                isCurrent: true,
                hasDropdown: true,
                options: lessons.map((item, index) => ({
                  label: `المقرر ${index + 1}`,
                  url: `/programs/${programId}/phases/${phaseId}/books/${bookId}/courses/${item.id}`,
                })),
              },
            ]}
          />
        </Container>
      </Box>
      <Flex
        mt={2}
        display={{ base: "flex", lg: "none" }}
        justify="space-between"
        alignItems="center"
        mb={8}
        px={3}
      >
        <Button
          variant="ghost"
          size="sm"
          color="brand.primary"
          _hover={{ color: "gray.800" }}
          onClick={goPrev}
          disabled={currentIndex <= 0}
        >
          <MoveRight size={20} />
          <Text>السابق</Text>
        </Button>
        <Text
          fontSize="2xl"
          fontWeight="semibold"
          color="text.default"
          textAlign="center"
        >
          {lessonLabel}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          color="brand.primary"
          _hover={{ color: "gray.800" }}
          onClick={goNext}
          disabled={currentIndex < 0 || currentIndex >= lessons.length - 1}
        >
          <Text>التالي</Text>
          <MoveLeft size={20} />
        </Button>
      </Flex>

      <Container
        bg="white"
        w={{ base: "85%", lg: "100%" }}
        mx="auto"
        mt={{ lg: "20" }}
        mb={{ base: "32" }}
        px={4}
        py={8}
        boxShadow={{ base: "lg", lg: "none" }}
        borderRadius={4}
      >
        <Flex display={{ base: "flex", lg: "none" }} mb={6} gap={2}>
          <Button
            size="sm"
            flex={1}
            onClick={() => setActiveTab("content")}
            bg={activeTab === "content" ? "brand.primary" : "white"}
            color={activeTab === "content" ? "white" : "gray.600"}
            borderRadius="lg"
            fontWeight="medium"
          >
            الكتاب
          </Button>
          <Button
            size="sm"
            flex={1}
            onClick={() => setActiveTab("notes")}
            bg={activeTab === "notes" ? "gray.200" : "gray.100"}
            color={activeTab === "notes" ? "gray.800" : "gray.600"}
            borderRadius="lg"
            fontWeight="medium"
          >
            الملاحظات
          </Button>
        </Flex>
        {activeTab === "content" && (
          <Box p={2}>
            <Text
              color="brand.primary"
              fontSize={{ base: "md", lg: "2xl" }}
              textAlign="justify"
              lineHeight={{ base: 1.8, lg: 2 }}
              whiteSpace="pre-wrap"
            >
              {lesson.explanation_notes?.trim() ||
                "لا يتوفر محتوى نصي لهذا المقرر بعد."}
            </Text>
          </Box>
        )}

        {activeTab === "notes" && (
          <Box>
            <Text
              color="brand.secondary"
              textAlign="center"
              whiteSpace="pre-wrap"
            >
              {lesson.explanation_notes?.trim() || "لا توجد ملاحظات حتى الآن"}
            </Text>
          </Box>
        )}
      </Container>

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        boxShadow="lg"
        borderTop="1px solid"
        borderColor="brand.secondary"
      >
        <AudioPlayer key={lesson.id} src={lesson.lesson_audio || undefined} />
      </Box>
    </Box>
  )
}
