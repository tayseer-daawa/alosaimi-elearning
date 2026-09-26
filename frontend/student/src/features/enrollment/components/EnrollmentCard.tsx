import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react"
import { CalendarDays, CircleCheck } from "lucide-react"
import type { ReactNode } from "react"
import type { ProgramSessionPublic } from "@/client"
import { useEnrollInSession } from "../api/useEnrollInSession"
import { useMySessions } from "../api/useMySessions"
import { useProgramSessions } from "../api/useProgramSessions"
import {
  type EnrollmentState,
  resolveEnrollmentState,
  sessionStartLabel,
} from "../lib/enrollmentState"

type EnrollmentCardProps = {
  programId: string | undefined
}

export function EnrollmentCard({ programId }: EnrollmentCardProps) {
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
        <Text color="red.600" fontSize={{ base: "md", lg: "lg" }} role="alert">
          تعذر تحميل مواعيد الدورات.
        </Text>
        <Button
          flexShrink={0}
          loading={programSessions.isFetching || mySessions.isFetching}
          onClick={retry}
        >
          إعادة المحاولة
        </Button>
      </CardShell>
    )
  }

  const state = resolveEnrollmentState(
    programSessions.data?.data ?? [],
    mySessions.data?.data ?? [],
  )

  return <EnrollmentStateView state={state} />
}

function EnrollmentStateView({ state }: { state: EnrollmentState }) {
  if (state.kind === "enrolled") {
    return (
      <CardShell state="enrolled" bg="brand.lightTeal">
        <Flex align="center" gap={4}>
          <Box color="brand.primary" flexShrink={0} aria-hidden>
            <CircleCheck size={36} strokeWidth={2} />
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
              {sessionStartLabel(state.session)}
            </Text>
          </Box>
        </Flex>
      </CardShell>
    )
  }

  if (state.kind === "none") return null

  return <OpenSessions sessions={state.sessions} />
}

function OpenSessions({ sessions }: { sessions: ProgramSessionPublic[] }) {
  const enroll = useEnrollInSession()
  const pendingId = enroll.isPending ? enroll.variables : undefined

  return (
    <Box
      bg="white"
      borderRadius="4px"
      boxShadow="lg"
      p={{ base: 6, lg: 8 }}
      mb={8}
      data-testid="enrollment-card"
      data-state="open"
    >
      <Text
        fontSize={{ base: "xl", lg: "2xl" }}
        fontWeight="bold"
        color="brand.primary"
        mb={1}
      >
        التسجيل في الدورة
      </Text>
      <Text fontSize={{ base: "md", lg: "lg" }} color="brand.secondary" mb={5}>
        سجّل لتنضم إلى طلاب الدورة وتتابع دروسها.
      </Text>

      <Stack gap={4}>
        {sessions.map((session) => (
          <Flex
            key={session.id}
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={4}
            data-testid="enrollment-session"
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
              loading={pendingId === session.id}
              disabled={enroll.isPending}
              onClick={() => enroll.mutate(session.id)}
              data-testid="enroll-button"
            >
              سجّل في الدورة
            </Button>
          </Flex>
        ))}
      </Stack>

      {enroll.isError ? (
        <Text
          mt={4}
          color="red.600"
          fontSize={{ base: "md", lg: "lg" }}
          role="alert"
          data-testid="enrollment-error"
        >
          تعذر إتمام التسجيل. حاول مرة أخرى.
        </Text>
      ) : null}
    </Box>
  )
}

type CardShellProps = {
  state: "enrolled" | "error"
  bg?: string
  children: ReactNode
}

function CardShell({ state, bg = "white", children }: CardShellProps) {
  return (
    <Flex
      bg={bg}
      borderRadius="4px"
      boxShadow="lg"
      p={{ base: 6, lg: 8 }}
      mb={8}
      direction={{ base: "column", md: "row" }}
      align={{ base: "stretch", md: "center" }}
      justify="space-between"
      gap={4}
      data-testid="enrollment-card"
      data-state={state}
    >
      {children}
    </Flex>
  )
}
