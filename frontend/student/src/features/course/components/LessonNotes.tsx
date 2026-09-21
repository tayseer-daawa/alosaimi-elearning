import {
  Box,
  Button,
  Collapsible,
  Flex,
  Text,
  Textarea,
} from "@chakra-ui/react"
import { ChevronDown, Clock } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { formatNoteTimestamp, listNoteTimestamps } from "../lib/noteTimestamps"
import { releasePdfFocus } from "../lib/releasePdfFocus"

const storageKey = (lessonId: string) => `lesson_notes:${lessonId}`
/** Wait for typing to settle before writing + showing «تم الحفظ محلياً». */
const SAVE_DEBOUNCE_MS = 450

/** Chakra `lg` breakpoint — short explanations open by default from here up. */
const LG_MQ = "(min-width: 62em)"
/** Longer teacher notes stay collapsed so «ملاحظاتي» stays above the fold. */
const LONG_EXPLANATION_CHARS = 320

function shouldOpenExplanation(text: string): boolean {
  if (typeof window === "undefined") return false
  if (!window.matchMedia(LG_MQ).matches) return false
  return text.trim().length <= LONG_EXPLANATION_CHARS
}

type LessonNotesProps = {
  lessonId: string
  explanationNotes?: string | null
  /** Current playback time (seconds) for «أدرج الوقت الحالي». */
  getCurrentTime?: () => number
  /** Seek audio when a timestamp chip is clicked. */
  onSeekTo?: (seconds: number) => void
}

export function LessonNotes({
  lessonId,
  explanationNotes,
  getCurrentTime,
  onSeekTo,
}: LessonNotesProps) {
  const [draft, setDraft] = useState("")
  const [savedHint, setSavedHint] = useState(false)
  const explanation = explanationNotes?.trim() ?? ""
  const [explanationOpen, setExplanationOpen] = useState(() =>
    shouldOpenExplanation(explanationNotes ?? ""),
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draftRef = useRef(draft)
  const lessonIdRef = useRef(lessonId)
  const saveTimerRef = useRef<number | null>(null)

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current == null) return
    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
  }, [])

  const flushSave = useCallback(
    (id: string, text: string) => {
      clearSaveTimer()
      localStorage.setItem(storageKey(id), text)
      setSavedHint(true)
    },
    [clearSaveTimer],
  )

  const scheduleSave = useCallback(
    (id: string, text: string) => {
      setSavedHint(false)
      clearSaveTimer()
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        localStorage.setItem(storageKey(id), text)
        setSavedHint(true)
      }, SAVE_DEBOUNCE_MS)
    },
    [clearSaveTimer],
  )

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    lessonIdRef.current = lessonId
  }, [lessonId])

  useEffect(() => {
    clearSaveTimer()
    const saved = localStorage.getItem(storageKey(lessonId))
    setDraft(saved ?? "")
    setSavedHint(saved != null && saved.length > 0)
    return () => {
      clearSaveTimer()
      localStorage.setItem(storageKey(lessonId), draftRef.current)
    }
  }, [lessonId, clearSaveTimer])

  useEffect(() => {
    setExplanationOpen(shouldOpenExplanation(explanationNotes ?? ""))
  }, [explanationNotes])

  // Flush pending debounce on tab hide / unload so a fast leave doesn't drop text.
  useEffect(() => {
    const flush = () => {
      clearSaveTimer()
      localStorage.setItem(storageKey(lessonIdRef.current), draftRef.current)
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("pagehide", flush)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [clearSaveTimer])

  const timestamps = listNoteTimestamps(draft)
  const canInsertTime = Boolean(getCurrentTime)

  const applyDraft = (next: string) => {
    setDraft(next)
    scheduleSave(lessonId, next)
  }

  const insertCurrentTime = () => {
    if (!getCurrentTime) return
    const token = formatNoteTimestamp(getCurrentTime())
    const el = textareaRef.current
    if (!el) {
      applyDraft(`${draft}${draft && !draft.endsWith(" ") ? " " : ""}${token} `)
      return
    }
    const start = el.selectionStart ?? draft.length
    const end = el.selectionEnd ?? start
    const before = draft.slice(0, start)
    const after = draft.slice(end)
    const needsLead = before.length > 0 && !/\s$/.test(before)
    const needsTrail = after.length > 0 && !/^\s/.test(after)
    const inserted = `${needsLead ? " " : ""}${token}${needsTrail ? " " : " "}`
    const next = `${before}${inserted}${after}`
    applyDraft(next)
    const caret = before.length + inserted.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <Box
      data-testid="lesson-notes"
      onPointerDown={() => {
        releasePdfFocus()
      }}
    >
      {explanation ? (
        <Collapsible.Root
          open={explanationOpen}
          onOpenChange={(d) => setExplanationOpen(d.open)}
          mb={6}
        >
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              w="full"
              h="auto"
              py={2}
              px={0}
              justifyContent="space-between"
              color="brand.primary"
              fontWeight="semibold"
              fontSize="sm"
              data-testid="lesson-explanation-toggle"
            >
              <Text>ملاحظات الشرح</Text>
              <Box
                as="span"
                display="inline-flex"
                transition="transform 0.2s"
                transform={explanationOpen ? "rotate(180deg)" : "rotate(0deg)"}
              >
                <ChevronDown size={18} />
              </Box>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Text
              color="brand.secondary"
              whiteSpace="pre-wrap"
              lineHeight="tall"
              pt={1}
              data-testid="lesson-explanation"
            >
              {explanation}
            </Text>
          </Collapsible.Content>
        </Collapsible.Root>
      ) : null}

      <Flex align="center" justify="space-between" gap={2} mb={2} dir="rtl">
        <Text fontSize="sm" fontWeight="semibold" color="brand.primary">
          ملاحظاتي
        </Text>
        {canInsertTime ? (
          <Button
            variant="ghost"
            size="sm"
            h="8"
            minH="8"
            px={2}
            color="brand.secondary"
            fontWeight="medium"
            onClick={insertCurrentTime}
            data-testid="lesson-notes-insert-time"
          >
            <Clock size={14} />
            أدرج الوقت الحالي
          </Button>
        ) : null}
      </Flex>

      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => applyDraft(e.target.value)}
        onBlur={() => flushSave(lessonId, draftRef.current)}
        placeholder="اكتب ملاحظاتك على هذا المقرر…"
        minH={{ base: "180px", lg: "280px" }}
        resize="vertical"
        bg="white"
        borderColor="gray.200"
        _focusVisible={{ borderColor: "brand.primary", outline: "none" }}
        data-testid="lesson-notes-input"
      />

      {timestamps.length > 0 && onSeekTo ? (
        <Flex
          mt={3}
          gap={2}
          flexWrap="wrap"
          dir="rtl"
          data-testid="lesson-notes-timestamps"
        >
          {timestamps.map((item) => (
            <Button
              key={item.label}
              size="sm"
              h="8"
              minH="8"
              px={3}
              borderRadius="full"
              bg="brand.lightTeal"
              color="brand.primary"
              fontWeight="medium"
              fontVariantNumeric="tabular-nums"
              onClick={() => onSeekTo(item.seconds)}
              data-testid={`lesson-notes-seek-${item.seconds}`}
            >
              {item.label}
            </Button>
          ))}
        </Flex>
      ) : null}

      <Text
        mt={2}
        fontSize="xs"
        color={savedHint ? "brand.secondary" : "transparent"}
        data-testid="lesson-notes-saved"
      >
        تم الحفظ محلياً
      </Text>
    </Box>
  )
}
