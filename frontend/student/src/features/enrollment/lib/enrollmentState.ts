import type { ProgramSessionPublic } from "@/client"

export type EnrollmentState =
  | { kind: "enrolled"; session: ProgramSessionPublic }
  | { kind: "open"; sessions: ProgramSessionPublic[] }
  | { kind: "none" }

const dateFormatter = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "long",
  year: "numeric",
  calendar: "gregory",
})

/** `start_date` is a calendar day (YYYY-MM-DD); parse it as local, not UTC. */
function parseDay(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function hasStarted(session: ProgramSessionPublic, now = new Date()) {
  return parseDay(session.start_date) <= startOfToday(now)
}

export function formatSessionDate(isoDay: string): string {
  return dateFormatter.format(parseDay(isoDay))
}

export function sessionStartLabel(
  session: ProgramSessionPublic,
  now = new Date(),
): string {
  const date = formatSessionDate(session.start_date)
  return hasStarted(session, now) ? `بدأت في ${date}` : `تبدأ في ${date}`
}

export function resolveEnrollmentState(
  programSessions: ProgramSessionPublic[],
  mySessions: ProgramSessionPublic[],
): EnrollmentState {
  const enrolledIds = new Set(mySessions.map((s) => s.id))
  const enrolled = programSessions.find((s) => enrolledIds.has(s.id))
  if (enrolled) return { kind: "enrolled", session: enrolled }

  if (!programSessions.length) return { kind: "none" }

  const sessions = [...programSessions].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  )
  return { kind: "open", sessions }
}
