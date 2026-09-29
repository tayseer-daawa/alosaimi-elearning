import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react"
import { BookOpen, CalendarDays, ChevronDown, Coffee } from "lucide-react"
import { useId, useState } from "react"
import { useSessionEvents } from "../api/useSessionEvents"
import { buildSchedule, type ScheduleEntry } from "../lib/enrollmentState"

type SessionScheduleProps = {
  sessionId: string
  /** Colour of the toggle on the card background. */
  tone?: "light" | "teal"
}

export function SessionSchedule({
  sessionId,
  tone = "light",
}: SessionScheduleProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const events = useSessionEvents(sessionId)
  const entries = buildSchedule(events.data?.data ?? [])

  if (!entries.length) return null

  return (
    <Box>
      <Button
        variant="ghost"
        h="12"
        px={3}
        fontSize={{ base: "md", lg: "lg" }}
        fontWeight="semibold"
        color="brand.primary"
        bg={tone === "teal" ? "whiteAlpha.700" : "brand.lightTeal"}
        _hover={{ bg: tone === "teal" ? "white" : "brand.lightTeal" }}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        data-testid="session-schedule-toggle"
      >
        <CalendarDays size={20} aria-hidden />
        {open ? "إخفاء جدول الدورة" : "عرض جدول الدورة"}
        <Box
          as="span"
          transform={open ? "rotate(180deg)" : undefined}
          transition="transform 0.2s"
          display="inline-flex"
        >
          <ChevronDown size={18} aria-hidden />
        </Box>
      </Button>

      {open ? (
        <Stack
          id={panelId}
          as="ol"
          gap={2}
          mt={3}
          listStyleType="none"
          data-testid="session-schedule"
        >
          {entries.map((entry) => (
            <ScheduleRow key={entry.event.id} entry={entry} />
          ))}
        </Stack>
      ) : null}
    </Box>
  )
}

function ScheduleRow({ entry }: { entry: ScheduleEntry }) {
  const { event, timing, dateLabel, isNext } = entry
  const isPast = timing === "past"
  const label = event.is_break ? "استراحة" : "درس"

  return (
    <Flex
      as="li"
      align="center"
      gap={3}
      bg={isNext ? "white" : "whiteAlpha.600"}
      borderWidth="2px"
      borderColor={isNext ? "brand.primary" : "transparent"}
      borderRadius="4px"
      px={4}
      py={3}
      opacity={isPast ? 0.65 : 1}
      data-testid="session-schedule-row"
      data-timing={timing}
    >
      <Box
        color={event.is_break ? "brand.gray" : "brand.secondary"}
        flexShrink={0}
      >
        {event.is_break ? (
          <Coffee size={22} aria-hidden />
        ) : (
          <BookOpen size={22} aria-hidden />
        )}
      </Box>
      <Box flex="1" minW={0}>
        <Text fontSize={{ base: "md", lg: "lg" }} fontWeight="semibold">
          {label}
        </Text>
        <Text fontSize={{ base: "sm", lg: "md" }} color="text.default">
          {dateLabel}
        </Text>
      </Box>
      <TimingTag timing={timing} isNext={isNext} />
    </Flex>
  )
}

function TimingTag({
  timing,
  isNext,
}: {
  timing: ScheduleEntry["timing"]
  isNext: boolean
}) {
  if (timing === "current") {
    return <Tag bg="brand.primary" color="white" label="اليوم" />
  }
  if (isNext) {
    return <Tag bg="brand.accent" color="text.default" label="القادم" />
  }
  if (timing === "past") {
    return <Tag bg="blackAlpha.100" color="brand.gray" label="انتهى" />
  }
  return null
}

function Tag({
  bg,
  color,
  label,
}: {
  bg: string
  color: string
  label: string
}) {
  return (
    <Text
      as="span"
      flexShrink={0}
      bg={bg}
      color={color}
      fontSize="sm"
      fontWeight="bold"
      px={3}
      py={1}
      borderRadius="full"
    >
      {label}
    </Text>
  )
}
