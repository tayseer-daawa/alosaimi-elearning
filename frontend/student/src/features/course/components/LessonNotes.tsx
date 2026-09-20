import { Box, Text, Textarea } from "@chakra-ui/react"
import { useEffect, useState } from "react"

const storageKey = (lessonId: string) => `lesson_notes:${lessonId}`

type LessonNotesProps = {
  lessonId: string
  explanationNotes?: string | null
}

export function LessonNotes({ lessonId, explanationNotes }: LessonNotesProps) {
  const [draft, setDraft] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [savedHint, setSavedHint] = useState(false)

  useEffect(() => {
    setHydrated(false)
    const saved = localStorage.getItem(storageKey(lessonId))
    setDraft(saved ?? "")
    setHydrated(true)
    setSavedHint(false)
  }, [lessonId])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(storageKey(lessonId), draft)
    setSavedHint(true)
  }, [draft, lessonId, hydrated])

  const explanation = explanationNotes?.trim()

  return (
    <Box data-testid="lesson-notes">
      {explanation ? (
        <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="brand.primary"
            mb={2}
          >
            ملاحظات الشرح
          </Text>
          <Text
            color="brand.secondary"
            whiteSpace="pre-wrap"
            lineHeight="tall"
            data-testid="lesson-explanation"
          >
            {explanation}
          </Text>
        </Box>
      ) : null}

      <Text fontSize="sm" fontWeight="semibold" color="brand.primary" mb={2}>
        ملاحظاتي
      </Text>
      <Textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setSavedHint(false)
        }}
        placeholder="اكتب ملاحظاتك على هذا الدرس…"
        minH="180px"
        resize="vertical"
        bg="white"
        borderColor="gray.200"
        _focusVisible={{ borderColor: "brand.primary", outline: "none" }}
        data-testid="lesson-notes-input"
      />
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
