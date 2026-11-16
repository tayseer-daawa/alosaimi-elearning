import { Box, Button, Flex, IconButton, Text } from "@chakra-ui/react"
import { ChevronLeft, ChevronRight, ListMusic } from "lucide-react"
import { memo } from "react"
import { chromeIconProps } from "./chromeIconProps"

type LessonNavBarProps = {
  title: string
  labelId: string
  hasPrevLesson: boolean
  hasNextLesson: boolean
  onPrevLesson?: () => void
  onNextLesson?: () => void
  onOpenLessonList?: () => void
}

/** Prev · now-playing title (opens the playlist) · next. */
function LessonNavBar({
  title,
  labelId,
  hasPrevLesson,
  hasNextLesson,
  onPrevLesson,
  onNextLesson,
  onOpenLessonList,
}: LessonNavBarProps) {
  return (
    <Flex align="center" justify="center" gap={1} mb={{ base: 1, md: 2 }}>
      <IconButton
        {...chromeIconProps}
        color="brand.primary"
        aria-label="المقرر السابق"
        disabled={!hasPrevLesson}
        onClick={onPrevLesson}
        data-testid="audio-prev-lesson"
      >
        <ChevronRight size={18} />
      </IconButton>
      <Button
        variant="ghost"
        h="auto"
        minH="8"
        px={2}
        py={1}
        borderRadius="md"
        color="brand.primary"
        maxW={{ base: "72%", md: "md" }}
        onClick={onOpenLessonList}
        disabled={!onOpenLessonList}
        aria-label={`قائمة المقررات — ${title}`}
        data-testid="lesson-list-open"
        title="فتح قائمة المقررات"
      >
        <Flex align="center" gap={1.5} minW={0}>
          <Text
            id={labelId}
            fontSize="sm"
            fontWeight="medium"
            textAlign="center"
            lineClamp={1}
          >
            {title}
          </Text>
          <Box flexShrink={0} opacity={0.75} aria-hidden>
            <ListMusic size={14} />
          </Box>
        </Flex>
      </Button>
      <IconButton
        {...chromeIconProps}
        color="brand.primary"
        aria-label="المقرر التالي"
        disabled={!hasNextLesson}
        onClick={onNextLesson}
        data-testid="audio-next-lesson"
      >
        <ChevronLeft size={18} />
      </IconButton>
    </Flex>
  )
}

export default memo(LessonNavBar)
