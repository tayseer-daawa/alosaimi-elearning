import PhasesScreen from '@/features/phases/components/PhasesScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/phases')({
  component: PhasesScreen,
})


