import { RouterProvider } from "@tanstack/react-router"
import React from "react"
import ReactDOM from "react-dom/client"
import { QueryProvider } from "./providers/query"
import { ThemeProvider } from "./providers/theme"
import { router } from "./routes/router"
import { OpenAPI } from "./client"

// Point the API client to the VITE_API_URL
OpenAPI.BASE = import.meta.env.VITE_API_URL || ""

// Inject authorization token globally
OpenAPI.interceptors.request.use((request) => {
  const token = localStorage.getItem("access_token")
  if (token && request.headers) {
    request.headers.Authorization = `Bearer ${token}`
  }
  return request
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>,
)
