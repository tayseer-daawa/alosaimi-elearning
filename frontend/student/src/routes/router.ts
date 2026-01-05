import { createRouter } from "@tanstack/react-router"
import { routeTree } from "../routeTree.gen" // this auto generates after you run dev

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
