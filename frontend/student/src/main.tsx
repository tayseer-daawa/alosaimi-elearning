import { RouterProvider } from "@tanstack/react-router"
import React from "react"
import ReactDOM from "react-dom/client"
import { QueryProvider } from "./providers/query"
import { ThemeProvider } from "./providers/theme"
import { router } from "./routes/router"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>,
)
