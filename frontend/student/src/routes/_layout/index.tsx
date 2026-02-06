import WelcomeScreen from "@/features/home/components/WelcomeScreen"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/")({
  component: WelcomeScreen,
})

