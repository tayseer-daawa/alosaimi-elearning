import { RouterProvider } from "@tanstack/react-router"
import React from "react"
import ReactDOM from "react-dom/client"
import { OpenAPI } from "./client"
import { QueryProvider } from "./providers/query"
import { queryClient } from "./providers/queryClient"
import { ThemeProvider } from "./providers/theme"
import { router } from "./routes/router"
import { clearAuthSession } from "./shared/lib/authSession"

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) {
  if (import.meta.env.PROD) {
    throw new Error(
      "VITE_API_URL is required in production builds. Set it in the environment before building.",
    )
  }
  console.warn(
    "[student] VITE_API_URL is unset; API calls will use relative URLs. Copy frontend/student/.env.example to .env.",
  )
}
OpenAPI.BASE = apiUrl || ""

const publicAuthPaths = [
  "/login",
  "/signup",
  "/welcome",
  "/forget-password",
  "/reset-password",
]

// Inject authorization token globally
OpenAPI.interceptors.request.use((request) => {
  const token = localStorage.getItem("access_token")
  if (token && request.headers) {
    request.headers.Authorization = `Bearer ${token}`
  }
  return request
})

// Clear session on auth failures from the generated client (login uses this path,
// not only React Query). Stay on public auth pages so login can show its own error.
OpenAPI.interceptors.response.use((response) => {
  if ([401, 403].includes(response.status)) {
    clearAuthSession()
    queryClient.clear()
    const path = window.location.pathname
    if (!publicAuthPaths.includes(path)) {
      window.location.href = "/welcome"
    }
  }
  return response
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
