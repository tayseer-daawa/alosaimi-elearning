import { createFileRoute } from "@tanstack/react-router"

import WelcomeScreen from "@/features/welcome/components/WelcomeScreen"
export const Route = createFileRoute("/_layout/welcome")({
  component: WelcomeScreen,
})
