import { createFileRoute } from "@tanstack/react-router"
import PhasesScreen from "@/features/phases/components/PhasesScreen"

export const Route = createFileRoute("/_layout/programs/$programId/phases/")({
  component: PhasesScreen,
})
