import {
  Box,
  Button,
  Drawer,
  Flex,
  IconButton,
  Portal,
  Text,
} from "@chakra-ui/react"
import { CheckCircle2, Circle, X } from "lucide-react"
import { useEffect, useState } from "react"
import {
  isLessonCompleted,
  loadPlayback,
  toggleLessonCompleted,
} from "../lib/lessonProgress"

export type LessonListItem = {
  id: string
  order: number
}

type LessonListDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessons: LessonListItem[]
  currentLessonId: string
  onSelectLesson: (lessonId: string) => void
}

function formatResume(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return ""
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function LessonListDrawer({
  open,
  onOpenChange,
  lessons,
  currentLessonId,
  onSelectLesson,
}: LessonListDrawerProps) {
  const [tick, setTick] = useState(0)

  // Re-read localStorage when the drawer opens.
  useEffect(() => {
    if (open) setTick((n) => n + 1)
  }, [open])

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      // Logical start + Positioner dir=rtl → slides in from the right in Arabic.
      placement="start"
      size="sm"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner dir="rtl">
          <Drawer.Content dir="rtl" lang="ar" data-testid="lesson-list-drawer">
            <Drawer.Header py={3} px={3} position="relative">
              <Flex dir="rtl" align="center" w="full" pe={10}>
                <Drawer.Title
                  flex="1"
                  fontSize="md"
                  fontWeight="bold"
                  color="brand.primary"
                  textAlign="right"
                >
                  مقررات الكتاب
                </Drawer.Title>
                {/*
                  Recipe CloseTrigger uses insetEnd → physical `right` and
                  overlaps the RTL title. Pin to the drawer’s free edge (left).
                */}
                <Drawer.CloseTrigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    borderRadius="full"
                    flexShrink={0}
                    color="gray.500"
                    position="absolute"
                    top={3}
                    left={3}
                    right="auto"
                    aria-label="إغلاق"
                    data-testid="lesson-list-close"
                  >
                    <X size={16} strokeWidth={2} />
                  </IconButton>
                </Drawer.CloseTrigger>
              </Flex>
            </Drawer.Header>

            <Drawer.Body pt={0} dir="rtl">
              <Flex direction="column" gap={1} key={tick} dir="rtl">
                {lessons.map((item) => {
                  const active = item.id === currentLessonId
                  const completed = isLessonCompleted(item.id)
                  const playback = loadPlayback(item.id)
                  const resume =
                    playback && playback.position >= 5
                      ? formatResume(playback.position)
                      : null

                  return (
                    <Flex
                      key={item.id}
                      dir="rtl"
                      align="center"
                      gap={2}
                      borderRadius="lg"
                      bg={active ? "brand.lightTeal" : "transparent"}
                      _hover={{ bg: active ? "brand.lightTeal" : "gray.50" }}
                      px={2}
                      py={2}
                    >
                      {/* First in RTL → complete toggle on the right */}
                      <IconButton
                        variant="ghost"
                        size="sm"
                        borderRadius="full"
                        flexShrink={0}
                        color={completed ? "brand.secondary" : "gray.400"}
                        aria-label={
                          completed ? "إلغاء إكمال المقرر" : "وضع كمكتمل"
                        }
                        onClick={() => {
                          toggleLessonCompleted(item.id)
                          setTick((n) => n + 1)
                        }}
                        data-testid={`lesson-complete-toggle-${item.order}`}
                      >
                        {completed ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Circle size={18} />
                        )}
                      </IconButton>
                      <Button
                        variant="ghost"
                        flex="1"
                        h="auto"
                        py={2}
                        justifyContent="flex-start"
                        textAlign="right"
                        fontWeight={active ? "bold" : "normal"}
                        color="brand.primary"
                        onClick={() => {
                          onSelectLesson(item.id)
                          onOpenChange(false)
                        }}
                        data-testid={`lesson-list-item-${item.order}`}
                      >
                        <Flex
                          direction="column"
                          align="flex-start"
                          gap={0.5}
                          w="full"
                          dir="rtl"
                        >
                          <Text fontSize="sm" w="full" textAlign="right">
                            المقرر {item.order + 1}
                          </Text>
                          {resume && !completed ? (
                            <Text
                              fontSize="2xs"
                              color="brand.secondary"
                              w="full"
                              textAlign="right"
                            >
                              استئناف من {resume}
                            </Text>
                          ) : null}
                          {completed ? (
                            <Text
                              fontSize="2xs"
                              color="brand.secondary"
                              w="full"
                              textAlign="right"
                            >
                              مكتمل
                            </Text>
                          ) : null}
                        </Flex>
                      </Button>
                    </Flex>
                  )
                })}
              </Flex>
              <Box mt={4}>
                <Text
                  fontSize="2xs"
                  color="gray.500"
                  textAlign="right"
                  dir="rtl"
                >
                  التقدم يُحفظ على هذا المتصفح فقط حتى يتوفر المزامنة مع الحساب.
                </Text>
              </Box>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
