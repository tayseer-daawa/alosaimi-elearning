import { createFileRoute } from "@tanstack/react-router"
import HomeScreen from "@/features/home/components/HomeScreen"

export const Route = createFileRoute("/_layout/")({
  component: HomeScreen,
})
