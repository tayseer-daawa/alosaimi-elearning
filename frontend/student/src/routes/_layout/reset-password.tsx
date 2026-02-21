import { createFileRoute } from "@tanstack/react-router"

import ResetPasswordScreen from "@/features/forget-password/components/ResetPasswordScreen"
export const Route = createFileRoute("/_layout/reset-password")({
  component: ResetPasswordScreen,
})
