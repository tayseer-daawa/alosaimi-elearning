import ProgramsScreen from '@/features/programs/components/ProgramsScreen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/programs')({
  component: ProgramsScreen,
})


