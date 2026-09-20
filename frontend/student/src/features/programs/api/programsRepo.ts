// this file ONLY handles REST calls. never UI, never react hooks.

import { ProgramsService } from "@/client"

export const programsRepo = {
  list(params?: { skip?: number; limit?: number }) {
    return ProgramsService.readPrograms(params)
  },
  getOne(programId: string) {
    return ProgramsService.readProgram({ programId })
  },
}
