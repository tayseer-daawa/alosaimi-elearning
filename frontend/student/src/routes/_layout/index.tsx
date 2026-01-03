import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <h1>Student app home page</h1>
}
