// this file ONLY handles REST calls. never UI, never react hooks.

import { SessionsService, UsersService } from "@/client"

export const enrollmentRepo = {
  sessionsByProgram(programId: string) {
    return SessionsService.readSessionsByProgram({ programId, limit: 100 })
  },
  mySessions() {
    return UsersService.readUserMeSessions({ limit: 500 })
  },
  enroll(sessionId: string) {
    return SessionsService.enrollToSession({ sessionId })
  },
}
