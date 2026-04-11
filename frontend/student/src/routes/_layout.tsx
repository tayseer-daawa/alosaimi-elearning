import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router"

export const Route = createFileRoute("/_layout")({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("access_token")

    // Non-authenticated users can only access these precise public paths
    const publicRoutes = [
      "/login",
      "/signup",
      "/welcome",
      "/forget-password",
      "/reset-password",
    ]

    // Redirect unauthenticated back to the welcome boundary if they try digging dynamically
    if (!token && !publicRoutes.includes(location.pathname)) {
      throw redirect({
        to: "/welcome",
      })
    }

    // Redirect already authenticated users from hitting public boundaries
    if (
      token &&
      ["/login", "/signup", "/welcome"].includes(location.pathname)
    ) {
      throw redirect({
        to: "/",
      })
    }
  },
  component: Layout,
})
// IF YOU WANT TO ADD COMPONENTS THAT ARE WRAPPED WITH <Layout/> ADD THEM IN THE /_layout FOLDER

function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (pathname === "/signup") {
    return <Outlet />
  }

  return <Outlet />
}
