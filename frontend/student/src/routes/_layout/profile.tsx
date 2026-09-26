import { createFileRoute } from "@tanstack/react-router"
import ProfileScreen from "@/features/account/components/ProfileScreen"

export const Route = createFileRoute("/_layout/profile")({
  component: ProfileScreen,
})
