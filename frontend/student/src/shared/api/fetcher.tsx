// Prefer VITE_API_URL (same as the generated OpenAPI client). VITE_API_BASE is
// accepted as a legacy alias so older local .env files keep working.
const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8000"

export async function fetcher(path: string, options?: RequestInit) {
  const res = await fetch(baseURL + path, options)

  if (!res.ok) {
    let message = res.statusText

    try {
      // try to parse the backend error response
      const data = await res.json()
      if (data?.message) {
        message = data.message
      }
    } catch {
      // if parsing fails, keep the default status text
    }

    throw new Error(message)
  }

  // handle empty response
  if (res.status === 204) return null

  return res.json()
}
