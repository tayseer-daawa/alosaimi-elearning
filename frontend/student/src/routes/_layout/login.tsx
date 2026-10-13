import { createFileRoute } from "@tanstack/react-router"

import LoginScreen from "@/features/login/components/LoginScreen"
export const Route = createFileRoute("/_layout/login")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { registered?: boolean } => {
    return search.registered === true ? { registered: true } : {}
  },
  component: LoginScreen,
})
