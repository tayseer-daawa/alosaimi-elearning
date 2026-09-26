// this file ONLY handles REST calls. never UI, never react hooks.

import { PhasesService } from "@/client"

export const phasesRepo = {
  byProgram(programId: string, params?: { skip?: number; limit?: number }) {
    return PhasesService.readPhasesByProgram({ programId, ...params })
  },
  getOne(phaseId: string) {
    return PhasesService.readPhase({ phaseId })
  },
  booksByPhase(phaseId: string, params?: { skip?: number; limit?: number }) {
    return PhasesService.readBooksByPhase({ phaseId, ...params })
  },
}
