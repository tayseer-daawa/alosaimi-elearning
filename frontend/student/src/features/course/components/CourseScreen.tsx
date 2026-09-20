import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { MoveLeft, MoveRight } from "lucide-react"
import { useMemo, useState } from "react"

import { useBook } from "@/features/books/api/useBook"
import { useLesson } from "@/features/books/api/useLesson"
import { useLessonsByBook } from "@/features/books/api/useLessonsByBook"
import { usePhase } from "@/features/phases/api/usePhase"
import { useProgram } from "@/features/programs/api/useProgram"
import { AppMenu } from "@/shared/components/AppMenu"
import { Breadcrumbs } from "@/shared/components/BreadcrumbsNavigation"
import AudioPlayer from "./AudioPlayer"
import LessonListDrawer from "./LessonListDrawer"
import { LessonNotes } from "./LessonNotes"
import { PdfReader } from "./PdfReader"

type TabId = "book" | "notes"

export default function CourseScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("book")
  const [lessonListOpen, setLessonListOpen] = useState(false)
  const navigate = useNavigate()
  const { programId, phaseId, bookId, courseId } = useParams({
    strict: false,
  })

  const programQuery = useProgram(programId)
  const phaseQuery = usePhase(phaseId)
  const bookQuery = useBook(bookId)
  const lessonQuery = useLesson(courseId)
  const lessonsQuery = useLessonsByBook(bookId)

  const lessons = useMemo(() => {
    const data = lessonsQuery.data?.data ?? []
    return [...data].sort((a, b) => a.order - b.order)
  }, [lessonsQuery.data?.data])

  const currentIndex = lessons.findIndex((lesson) => lesson.id === courseId)
  const lesson = lessonQuery.data
  const bookTitle = bookQuery.data?.title ?? "الكتاب"
  const lessonLabel =
    currentIndex >= 0 ? `الدرس ${lessons[currentIndex].order + 1}` : "الدرس"
  const phaseLabel =
    phaseQuery.data != null ? `المرحلة ${phaseQuery.data.order + 1}` : "المرحلة"

  const pdfUrl =
    lesson?.book_part_pdf?.trim() || bookQuery.data?.pdf?.trim() || null

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

  const goToBook = () => {
    if (!programId || !phaseId || !bookId) return
    navigate({
      to: "/programs/$programId/phases/$phaseId/books/$bookId",
      params: { programId, phaseId, bookId },
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
        تعذر تحميل الدرس.
      </Text>
    )
  }

  return (
    <Box
      minH="100vh"
      dir="rtl"
      px={{ lg: "16" }}
      py={{ lg: "10" }}
      pb={{ base: "40", lg: "36" }}
      overflow="auto"
      data-testid="course-screen"
      onMouseDown={(event) => {
        // PDF iframe swallows keyboard events; clicking elsewhere restores shortcuts.
        if (
          document.activeElement instanceof HTMLIFrameElement &&
          !(event.target instanceof HTMLIFrameElement)
        ) {
          document.activeElement.blur()
        }
      }}
    >
      <Container maxW="container.lg" px={8} py={4}>
        <Flex
          display={{ base: "none", lg: "flex" }}
          direction="column"
          align="center"
          mb={4}
          gap={3}
        >
          <Flex
            position="relative"
            w="full"
            align="center"
            justify="center"
            minH="14"
          >
            <AppMenu />
            <Heading size={{ base: "xl", lg: "5xl" }} color="brand.primary">
              {bookTitle}
            </Heading>
          </Flex>
          <Button
            variant="ghost"
            size="sm"
            color="brand.primary"
            onClick={goToBook}
            data-testid="back-to-book"
          >
            <MoveRight size={18} />
            العودة إلى الكتاب
          </Button>
        </Flex>

        <Flex
          display={{ base: "flex", lg: "none" }}
          align="center"
          justify="space-between"
          gap={2}
          mb={2}
          px={0}
        >
          <Button
            variant="ghost"
            size="sm"
            color="brand.primary"
            onClick={goToBook}
            data-testid="back-to-book-mobile"
          >
            <MoveRight size={18} />
            العودة إلى الكتاب
          </Button>
          <AppMenu position="static" />
        </Flex>

        <Breadcrumbs
          breadcrumbs={[
            {
              label: programQuery.data?.title ?? "البرنامج",
              url: "/programs",
            },
            {
              label: phaseLabel,
              url: `/programs/${programId}/phases`,
            },
            {
              label: bookTitle,
              url: `/programs/${programId}/phases/${phaseId}/books/${bookId}`,
            },
            {
              label: lessonLabel,
              isCurrent: true,
              hasDropdown: true,
              options: lessons.map((item) => ({
                label: `الدرس ${item.order + 1}`,
                url: `/programs/${programId}/phases/${phaseId}/books/${bookId}/courses/${item.id}`,
              })),
            },
          ]}
        />
      </Container>

      <Flex
        mt={2}
        display={{ base: "flex", lg: "none" }}
        justify="space-between"
        alignItems="center"
        mb={6}
        px={3}
      >
        <Button
          variant="ghost"
          size="sm"
          color="brand.primary"
          onClick={goPrev}
          disabled={currentIndex <= 0}
        >
          <MoveRight size={20} />
          <Text>السابق</Text>
        </Button>
        <Text
          fontSize="xl"
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
          onClick={goNext}
          disabled={currentIndex < 0 || currentIndex >= lessons.length - 1}
        >
          <Text>التالي</Text>
          <MoveLeft size={20} />
        </Button>
      </Flex>

      <Container
        bg="white"
        w={{ base: "92%", lg: "100%" }}
        mx="auto"
        mt={{ lg: "8" }}
        px={{ base: 4, md: 6 }}
        py={6}
        boxShadow="lg"
        borderRadius={4}
      >
        <Flex mb={6} gap={2}>
          <Button
            size="sm"
            flex={1}
            onClick={() => setActiveTab("book")}
            bg={activeTab === "book" ? "brand.primary" : "gray.100"}
            color={activeTab === "book" ? "white" : "gray.700"}
            borderRadius="lg"
            data-testid="tab-book"
          >
            الكتاب
          </Button>
          <Button
            size="sm"
            flex={1}
            onClick={() => setActiveTab("notes")}
            bg={activeTab === "notes" ? "brand.primary" : "gray.100"}
            color={activeTab === "notes" ? "white" : "gray.700"}
            borderRadius="lg"
            data-testid="tab-notes"
          >
            الملاحظات
          </Button>
        </Flex>

        {activeTab === "book" ? (
          <Box data-testid="tab-panel-book">
            <PdfReader url={pdfUrl} title={bookTitle} />
          </Box>
        ) : null}
        <Box
          display={activeTab === "notes" ? "block" : "none"}
          data-testid="tab-panel-notes"
        >
          <LessonNotes
            lessonId={lesson.id}
            explanationNotes={lesson.explanation_notes}
          />
        </Box>
      </Container>

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        boxShadow="lg"
        zIndex={10}
      >
        <AudioPlayer
          key={lesson.id}
          src={lesson.lesson_audio || undefined}
          title={`${lessonLabel} — ${bookTitle}`}
          lessonId={lesson.id}
          onPrevLesson={goPrev}
          onNextLesson={goNext}
          hasPrevLesson={currentIndex > 0}
          hasNextLesson={currentIndex >= 0 && currentIndex < lessons.length - 1}
          onOpenLessonList={() => setLessonListOpen(true)}
        />
      </Box>

      <LessonListDrawer
        open={lessonListOpen}
        onOpenChange={setLessonListOpen}
        lessons={lessons}
        currentLessonId={lesson.id}
        onSelectLesson={goToLesson}
      />
    </Box>
  )
}
