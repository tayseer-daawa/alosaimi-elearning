import { createFileRoute } from "@tanstack/react-router"

import ForgetPasswordScreen from "@/features/forget-password/components/ForgetPasswordScreen"
export const Route = createFileRoute("/_layout/forget-password")({
  component: ForgetPasswordScreen,
})
