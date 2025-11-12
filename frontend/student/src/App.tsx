// This owns global structural layout (nav, global modals, toasters etc) later.
// This file NEVER imports from any feature domain directly.
// TanStack Router's <Outlet /> is where all feature routes get rendered.

import { Outlet } from "@tanstack/react-router";

export default function App() {
  return <Outlet />;
}
