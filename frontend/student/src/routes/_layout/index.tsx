import { createFileRoute } from "@tanstack/react-router"
import WelcomeScreen from "@/features/home/components/WelcomeScreen"

export const Route = createFileRoute("/_layout/")({
  component: WelcomeScreen,
})
