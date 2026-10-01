import { createFileRoute } from "@tanstack/react-router"
import HelpScreen from "@/features/account/components/HelpScreen"

export const Route = createFileRoute("/_layout/help")({
  component: HelpScreen,
})
