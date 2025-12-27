import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout')({
  component: Layout,
});

// IF YOU WANT TO ADD COMPONENTS THAT ARE WRAPPED WITH <Layout/> ADD THEM IN THE /_layout FOLDER

function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === '/signup') {
    return <Outlet />;
  }

  return (
    <>
      <h1>Navbar</h1>
      <Outlet />
      <h1>Footer</h1>
    </>
  );
}
