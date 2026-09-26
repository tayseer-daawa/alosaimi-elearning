// this file ONLY handles REST calls. never UI, never react hooks.

import { SessionsService, UsersService } from "@/client"

export const enrollmentRepo = {
  allSessions() {
    return SessionsService.readSessions({ limit: 500 })
  },
  sessionsByProgram(programId: string) {
    return SessionsService.readSessionsByProgram({ programId, limit: 100 })
  },
  sessionEvents(sessionId: string) {
    return SessionsService.readSessionEvents({ sessionId, limit: 500 })
  },
  mySessions() {
    return UsersService.readUserMeSessions({ limit: 500 })
  },
  enroll(sessionId: string) {
    return SessionsService.enrollToSession({ sessionId })
  },
}
