import { createFileRoute } from "@tanstack/react-router"
import CopyrightScreen from "@/features/account/components/CopyrightScreen"

export const Route = createFileRoute("/_layout/copyright")({
  component: CopyrightScreen,
})
