import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react"
import { CalendarDays, CircleCheck } from "lucide-react"
import { type ReactNode, useState } from "react"
import type { ProgramSessionPublic } from "@/client"
import {
  isSessionGoneError,
  useEnrollInSession,
} from "../api/useEnrollInSession"
import { useMySessions } from "../api/useMySessions"
import { useProgramSessions } from "../api/useProgramSessions"
import {
  resolveEnrollmentState,
  sessionStartLabel,
} from "../lib/enrollmentState"
import { EnrollConfirmDialog } from "./EnrollConfirmDialog"
import { SessionSchedule } from "./SessionSchedule"

type EnrollmentCardProps = {
  programId: string | undefined
  programTitle: string | undefined
}

export function EnrollmentCard({
  programId,
  programTitle,
}: EnrollmentCardProps) {
  const programSessions = useProgramSessions(programId)
  const mySessions = useMySessions()

  // No skeleton: most programs have no sessions, so a placeholder would
  // flash and then disappear.
  if (programSessions.isLoading || mySessions.isLoading) return null

  if (programSessions.isError || mySessions.isError) {
    const retry = () => {
      if (programSessions.isError) void programSessions.refetch()
      if (mySessions.isError) void mySessions.refetch()
    }
    return (
      <CardShell state="error">
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={4}
        >
          <Text
            color="red.600"
            fontSize={{ base: "md", lg: "lg" }}
            role="alert"
          >
            تعذر تحميل مواعيد الدورات.
          </Text>
          <Button
            flexShrink={0}
            loading={programSessions.isFetching || mySessions.isFetching}
            onClick={retry}
          >
            إعادة المحاولة
          </Button>
        </Flex>
      </CardShell>
    )
  }

  const state = resolveEnrollmentState(
    programSessions.data?.data ?? [],
    mySessions.data?.data ?? [],
  )

  if (state.kind === "none") return null

  if (state.kind === "enrolled") {
    return <EnrolledView session={state.session} />
  }

  return <OpenSessions sessions={state.sessions} programTitle={programTitle} />
}

function EnrolledView({ session }: { session: ProgramSessionPublic }) {
  return (
    <CardShell state="enrolled" bg="brand.lightTeal">
      <Flex align="center" gap={4}>
        <Box color="brand.primary" flexShrink={0} aria-hidden>
          <CircleCheck size={40} strokeWidth={2} />
        </Box>
        <Box>
          <Text
            fontSize={{ base: "xl", lg: "2xl" }}
            fontWeight="bold"
            color="brand.primary"
            data-testid="enrollment-status"
          >
            أنت مسجّل في هذه الدورة
          </Text>
          <Text fontSize={{ base: "md", lg: "lg" }} color="text.default">
            {sessionStartLabel(session)}
          </Text>
        </Box>
      </Flex>
      <Box mt={4}>
        <SessionSchedule sessionId={session.id} tone="teal" />
      </Box>
    </CardShell>
  )
}

function enrollErrorMessage(error: unknown): string {
  return isSessionGoneError(error)
    ? "هذه الدورة لم تعد متاحة للتسجيل."
    : "تعذر إتمام التسجيل. تحقق من اتصالك وحاول مرة أخرى."
}

function OpenSessions({
  sessions,
  programTitle,
}: {
  sessions: ProgramSessionPublic[]
  programTitle: string | undefined
}) {
  const enroll = useEnrollInSession()
  const [confirming, setConfirming] = useState<ProgramSessionPublic | null>(
    null,
  )

  const openConfirm = (session: ProgramSessionPublic) => {
    enroll.reset()
    setConfirming(session)
  }

  return (
    <CardShell state="open">
      <Text
        fontSize={{ base: "xl", lg: "2xl" }}
        fontWeight="bold"
        color="brand.primary"
        mb={1}
      >
        التسجيل في الدورة
      </Text>
      <Text fontSize={{ base: "md", lg: "lg" }} color="brand.secondary" mb={5}>
        سجّل لتنضم إلى طلاب الدورة، وتظهر لك في «برامجي».
      </Text>

      <Stack gap={6}>
        {sessions.map((session) => (
          <Box key={session.id} data-testid="enrollment-session">
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={4}
            >
              <Flex align="center" gap={3} color="text.default">
                <Box color="brand.secondary" flexShrink={0} aria-hidden>
                  <CalendarDays size={24} />
                </Box>
                <Text fontSize={{ base: "lg", lg: "xl" }} fontWeight="semibold">
                  {sessionStartLabel(session)}
                </Text>
              </Flex>
              <Button
                flexShrink={0}
                minW={{ md: "56" }}
                onClick={() => openConfirm(session)}
                data-testid="enroll-button"
              >
                سجّل في الدورة
              </Button>
            </Flex>
            <Box mt={3}>
              <SessionSchedule sessionId={session.id} />
            </Box>
          </Box>
        ))}
      </Stack>

      <EnrollConfirmDialog
        session={confirming}
        programTitle={programTitle}
        isPending={enroll.isPending}
        errorMessage={enroll.isError ? enrollErrorMessage(enroll.error) : null}
        onConfirm={(sessionId) =>
          enroll.mutate(sessionId, { onSuccess: () => setConfirming(null) })
        }
        onClose={() => setConfirming(null)}
      />
    </CardShell>
  )
}

type CardShellProps = {
  state: "enrolled" | "open" | "error"
  bg?: string
  children: ReactNode
}

function CardShell({ state, bg = "white", children }: CardShellProps) {
  return (
    <Box
      bg={bg}
      borderRadius="4px"
      boxShadow="lg"
      p={{ base: 6, lg: 8 }}
      mb={8}
      data-testid="enrollment-card"
      data-state={state}
    >
      {children}
    </Box>
  )
}
