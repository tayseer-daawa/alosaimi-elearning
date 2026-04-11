import { createFileRoute } from "@tanstack/react-router"

import ResetPasswordScreen from "@/features/forget-password/components/ResetPasswordScreen"
export const Route = createFileRoute("/_layout/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string } => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    }
  },
  component: ResetPasswordScreen,
})
