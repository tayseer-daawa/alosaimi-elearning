import type { ProgramSessionPublic, SessionEventPublic } from "@/client"

export type EnrollmentState =
  | { kind: "enrolled"; session: ProgramSessionPublic }
  | { kind: "open"; sessions: ProgramSessionPublic[] }
  | { kind: "none" }

export type ProgramEnrollment =
  | { status: "enrolled"; session: ProgramSessionPublic }
  | { status: "open" }

const dateFormatter = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "long",
  year: "numeric",
  calendar: "gregory",
})

const shortDateFormatter = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "long",
  calendar: "gregory",
})

/** API dates are calendar days (YYYY-MM-DD); parse them as local, not UTC. */
function parseDay(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function byStartDate(a: ProgramSessionPublic, b: ProgramSessionPublic) {
  return a.start_date.localeCompare(b.start_date)
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

  return { kind: "open", sessions: [...programSessions].sort(byStartDate) }
}

/** Programs without any session are absent from the map. */
export function indexEnrollmentByProgram(
  allSessions: ProgramSessionPublic[],
  mySessions: ProgramSessionPublic[],
): Map<string, ProgramEnrollment> {
  const index = new Map<string, ProgramEnrollment>()
  for (const session of allSessions) {
    if (!index.has(session.program_id)) {
      index.set(session.program_id, { status: "open" })
    }
  }
  for (const session of [...mySessions].sort(byStartDate)) {
    if (index.get(session.program_id)?.status !== "enrolled") {
      index.set(session.program_id, { status: "enrolled", session })
    }
  }
  return index
}

export type ScheduleTiming = "past" | "current" | "upcoming"

export type ScheduleEntry = {
  event: SessionEventPublic
  timing: ScheduleTiming
  dateLabel: string
  isNext: boolean
}

function eventDays(event: SessionEventPublic): number {
  return Math.max(event.num_days ?? 1, 1)
}

function eventDateLabel(event: SessionEventPublic): string {
  const start = parseDay(event.event_date)
  const days = eventDays(event)
  if (days === 1) return dateFormatter.format(start)
  const end = addDays(start, days - 1)
  return `من ${shortDateFormatter.format(start)} إلى ${dateFormatter.format(end)}`
}

export function buildSchedule(
  events: SessionEventPublic[],
  now = new Date(),
): ScheduleEntry[] {
  const today = startOfToday(now)
  const entries = [...events]
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .map((event) => {
      const start = parseDay(event.event_date)
      const end = addDays(start, eventDays(event) - 1)
      const timing: ScheduleTiming =
        end < today ? "past" : start > today ? "upcoming" : "current"
      return { event, timing, dateLabel: eventDateLabel(event), isNext: false }
    })

  const next = entries.find((e) => e.timing !== "past")
  if (next) next.isNext = true
  return entries
}
