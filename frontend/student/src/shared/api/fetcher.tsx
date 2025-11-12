const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetcher(path: string, options?: RequestInit) {
  const res = await fetch(baseURL + path, options);

  if (!res.ok) {
    let message = res.statusText;

    try {
      // try to parse the backend error response
      const data = await res.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // if parsing fails, keep the default status text
    }

    throw new Error(message);
  }

  // handle empty response
  if (res.status === 204) return null;

  return res.json();
}
