import { createFileRoute } from "@tanstack/react-router"
import ProgramsScreen from "@/features/programs/components/ProgramsScreen"

export const Route = createFileRoute("/_layout/programs/")({
  component: ProgramsScreen,
})
