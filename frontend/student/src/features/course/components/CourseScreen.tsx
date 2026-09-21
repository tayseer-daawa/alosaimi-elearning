import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
} from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { MoveRight, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useBook } from "@/features/books/api/useBook"
import { useLesson } from "@/features/books/api/useLesson"
import { useLessonsByBook } from "@/features/books/api/useLessonsByBook"
import { usePhase } from "@/features/phases/api/usePhase"
import { useProgram } from "@/features/programs/api/useProgram"
import { AppMenu } from "@/shared/components/AppMenu"
import { Breadcrumbs } from "@/shared/components/BreadcrumbsNavigation"
import { CourseSkeleton } from "@/shared/components/PageSkeletons"
import { saveLastLearningPath } from "../lib/lessonProgress"
import {
  readNotesPaneOpen,
  writeNotesPaneOpen,
} from "../lib/notesPanePreference"
import { releasePdfFocus } from "../lib/releasePdfFocus"
import AudioPlayer, { type AudioPlaybackApi } from "./AudioPlayer"
import LessonListDrawer from "./LessonListDrawer"
import { LessonNotes } from "./LessonNotes"
import { PdfReader } from "./PdfReader"

type TabId = "book" | "notes"

export default function CourseScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("book")
  const [lessonListOpen, setLessonListOpen] = useState(false)
  const [pdfIframeFocused, setPdfIframeFocused] = useState(false)
  const [notesPaneOpen, setNotesPaneOpen] = useState(readNotesPaneOpen)
  const playbackApiRef = useRef<AudioPlaybackApi | null>(null)
  const navigate = useNavigate()
  const { programId, phaseId, bookId, courseId } = useParams({
    strict: false,
  })

  useEffect(() => {
    if (!programId || !phaseId || !bookId || !courseId) return
    saveLastLearningPath({ programId, phaseId, bookId, courseId })
  }, [programId, phaseId, bookId, courseId])

  const setNotesOpen = (open: boolean) => {
    setNotesPaneOpen(open)
    writeNotesPaneOpen(open)
  }
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
    return <CourseSkeleton />
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
      px={{ base: 0, lg: "16" }}
      py={{ base: 2, lg: "10" }}
      pb={{ base: "48", lg: "36" }}
      data-testid="course-screen"
      onPointerDown={(event) => {
        // PDF iframe swallows keyboard events; click outside restores shortcuts.
        if (event.target instanceof HTMLIFrameElement) return
        if (releasePdfFocus()) {
          setPdfIframeFocused(false)
        }
      }}
    >
      <Container
        maxW="container.lg"
        px={{ base: 3, lg: 8 }}
        py={{ base: 2, lg: 4 }}
      >
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
          mb={1}
        >
          <Button
            variant="ghost"
            size="sm"
            color="brand.primary"
            px={2}
            h="10"
            minH="10"
            onClick={goToBook}
            data-testid="back-to-book-mobile"
          >
            <MoveRight size={18} />
            العودة إلى الكتاب
          </Button>
          <AppMenu position="static" />
        </Flex>

        <Breadcrumbs
          compact
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

      {/*
        Mobile prev/next lives in the audio player — avoid a second chrome row
        that pushes the PDF below the fold.
      */}

      <Container
        bg="white"
        w={{ base: "100%", lg: "100%" }}
        maxW={{ lg: "container.xl" }}
        mx="auto"
        mt={{ base: 2, lg: "8" }}
        px={{ base: 3, md: 6 }}
        py={{ base: 3, md: 6 }}
        boxShadow={{ base: "sm", lg: "lg" }}
        borderRadius={{ base: 0, lg: 4 }}
        data-testid="course-content"
      >
        {/* Tabs — mobile / tablet only */}
        <Flex
          mb={{ base: 3, lg: 6 }}
          gap={2}
          display={{ base: "flex", lg: "none" }}
        >
          <Button
            size="sm"
            flex={1}
            h="10"
            minH="10"
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
            h="10"
            minH="10"
            onClick={() => setActiveTab("notes")}
            bg={activeTab === "notes" ? "brand.primary" : "gray.100"}
            color={activeTab === "notes" ? "white" : "gray.700"}
            borderRadius="lg"
            data-testid="tab-notes"
          >
            الملاحظات
          </Button>
        </Flex>

        {/*
          Desktop (lg+): PDF | notes side-by-side (RTL → PDF on the right).
          Notes column can collapse so the PDF goes full width.
          Mobile: one panel at a time via tabs.
        */}
        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "stretch", lg: "flex-start" }}
          gap={{ base: 0, lg: notesPaneOpen ? 8 : 0 }}
          data-testid="course-split"
          data-notes-open={notesPaneOpen ? "true" : "false"}
        >
          <Box
            flex={{ lg: notesPaneOpen ? "1.55" : "1" }}
            minW={0}
            w={{ lg: notesPaneOpen ? "auto" : "full" }}
            display={{
              base: activeTab === "book" ? "block" : "none",
              lg: "block",
            }}
            data-testid="tab-panel-book"
          >
            <Flex
              display={{ base: "none", lg: "flex" }}
              align="center"
              justify="space-between"
              gap={3}
              mb={3}
            >
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="brand.primary"
                textAlign="right"
              >
                الكتاب
              </Text>
              {/*
                Second child lands on the inline-end (left): the seam beside
                the notes column, not the outer edge of that column.
              */}
              {notesPaneOpen ? (
                <IconButton
                  variant="ghost"
                  size="sm"
                  color="brand.secondary"
                  aria-label="إخفاء الملاحظات"
                  title="إخفاء الملاحظات"
                  onClick={() => setNotesOpen(false)}
                  data-testid="notes-pane-collapse"
                >
                  <PanelLeftClose size={18} />
                </IconButton>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  color="brand.primary"
                  onClick={() => setNotesOpen(true)}
                  data-testid="notes-pane-expand"
                >
                  <PanelLeftOpen size={16} />
                  إظهار الملاحظات
                </Button>
              )}
            </Flex>
            <PdfReader
              url={pdfUrl}
              title={bookTitle}
              onIframeFocusChange={setPdfIframeFocused}
            />
          </Box>

          <Box
            flex={{ lg: "1" }}
            minW={{ lg: "280px" }}
            maxW={{ lg: "420px" }}
            w={{ lg: "38%" }}
            display={{
              base: activeTab === "notes" ? "block" : "none",
              lg: notesPaneOpen ? "block" : "none",
            }}
            borderStartWidth={{ lg: "1px" }}
            borderColor={{ lg: "gray.100" }}
            ps={{ lg: 6 }}
            data-testid="tab-panel-notes"
          >
            <Box
              position={{ lg: "sticky" }}
              top={{ lg: 4 }}
              maxH={{ lg: "calc(100vh - 11rem)" }}
              overflowY={{ lg: "auto" }}
              overscrollBehavior="contain"
              pe={{ lg: 1 }}
            >
              <Text
                display={{ base: "none", lg: "block" }}
                fontSize="sm"
                fontWeight="semibold"
                color="brand.primary"
                mb={3}
                textAlign="right"
              >
                الملاحظات
              </Text>
              <LessonNotes
                lessonId={lesson.id}
                explanationNotes={lesson.explanation_notes}
                getCurrentTime={() =>
                  playbackApiRef.current?.getCurrentTime() ?? 0
                }
                onSeekTo={(seconds) => playbackApiRef.current?.seekTo(seconds)}
              />
            </Box>
          </Box>
        </Flex>
      </Container>

      {pdfIframeFocused ? (
        <Box
          display={{ base: "none", md: "block" }}
          position="fixed"
          bottom="6.5rem"
          left="50%"
          transform="translateX(-50%)"
          zIndex={20}
          maxW="90vw"
          px={4}
          py={2}
          borderRadius="full"
          bg="brand.primary"
          color="white"
          boxShadow="lg"
          textAlign="center"
          pointerEvents="none"
          data-testid="pdf-shortcuts-hint"
        >
          <Text fontSize="sm" fontWeight="medium">
            اضغط على المشغّل لاستخدام الاختصارات
          </Text>
        </Box>
      ) : null}

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
          playbackApiRef={playbackApiRef}
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
