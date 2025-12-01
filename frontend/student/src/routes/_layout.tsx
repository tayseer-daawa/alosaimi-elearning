import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout")({
  component: Layout,
})

// IF YOU WANT TO ADD COMPONENTS THAT ARE WRAPPED WITH <Layout/> ADD THEM IN THE /_layout FOLDER

function Layout() {
  return (
    <>
      <h1>Navbar</h1>
      <Outlet />
      <h1>Footer</h1>
    </>
  )
}
