import { createFileRoute } from "@tanstack/react-router"

import LoginScreen from "@/features/login/components/LoginScreen"
export const Route = createFileRoute("/_layout/login")({
  component: LoginScreen,
})
