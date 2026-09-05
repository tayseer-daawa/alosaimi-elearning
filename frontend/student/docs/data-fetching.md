# Data fetching

[← Back to student app docs](./README.md)

How to call the API. Read this before wiring any screen — the first few wired screens set
the pattern for everything after.

---

## The layering

Three layers, one direction. This is the rule
[ADR 0001](../../../docs/adr/0001-feature-sliced-frontend.md) records and
`src/features/example/` demonstrates.

| Layer | Location | May contain | Must not contain |
| --- | --- | --- | --- |
| Transport | the generated `*Service` classes | HTTP | anything else |
| Query | `features/<name>/api/use*.ts` | React Query hooks, cache keys | JSX |
| View | `features/<name>/components/` | rendering | fetch calls |

A component never calls a service directly. A query hook never renders.

---

## Calling the API

Import the service class from `@/client`. Never build a URL by hand, and never set the
`Authorization` header — an interceptor in `src/main.tsx` attaches the bearer token to
every request.

```ts
import { ProgramsService } from "@/client"

ProgramsService.readPrograms({ skip: 0, limit: 100 })
```

Find the method you need in [the API map](../../../docs/api-map.md).
Argument and response types are in `src/client/types.gen.ts`, named after the operation:
`ProgramsReadProgramsData`, `ProgramsReadProgramsResponse`.

> `src/client/sdk.gen.ts` is over 1600 lines of generated code. **Grep it, never read it
> whole** — and never paste it into an AI context window.

---

## Query keys

One factory, `src/shared/lib/queryKeys.ts`, one entry per feature. Every key is built from
it so that invalidation is predictable.

```ts
export const queryKeys = {
  programs: {
    all: ["programs"] as const,
    lists() { return [...this.all, "list"] as const },
    detail(id: string) { return [...this.all, "detail", id] as const },
  },
}
```

Never inline a key literal in a hook.

---

## A query hook

```ts
// src/features/programs/api/usePrograms.ts
import { useQuery } from "@tanstack/react-query"
import { ProgramsService } from "@/client"
import { queryKeys } from "@/shared/lib/queryKeys"

export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs.lists(),
    queryFn: () => ProgramsService.readPrograms({ skip: 0, limit: 100 }),
  })
}
```

## A mutation hook

Invalidate the list the mutation affects:

```ts
export function useCreateProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: ProgramCreate) =>
      ProgramsService.createProgram({ requestBody: body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.lists() })
    },
  })
}
```

## Using it in a component

```tsx
const { data, isLoading, error } = usePrograms()

if (isLoading) return <Spinner />
if (error) return <Text color="red.500">تعذر تحميل البرامج</Text>

return <ProgramsList programs={data.data} />
```

List endpoints return `{ data, count }`, not a bare array.

---

## Error handling

The generated client throws `ApiError` for a server rejection and a plain `Error` for a
network failure. Distinguish them, and always show Arabic to the user:

```ts
import { ApiError } from "@/client"

catch (err) {
  if (err instanceof ApiError) {
    const detail = (err.body as any)?.detail
    if (typeof detail === "string") setError(detail)
    else if (Array.isArray(detail) && detail.length) setError(detail[0].msg)
    else setError("حدث خطأ أثناء الاتصال بالخادم")
  } else {
    setError("تعذر الاتصال بالخادم")
  }
}
```

FastAPI returns `detail` as a string for a business error and as an array of validation
objects for a 422 — hence both branches.

**Never let an English API message reach the screen.**

---

## Two things to avoid

**`src/shared/api/fetcher.tsx`** — a raw `fetch` wrapper that predates the generated
client. It reads a different environment variable (`VITE_API_BASE`) and sends **no
`Authorization` header**. Only `src/features/example/` uses it. Do not use it for new work;
see [ADR 0002](../../../docs/adr/0002-generated-api-client.md).

**Hand-written repository files.** The `exampleRepo.ts` pattern exists for endpoints the
generator does not cover. For anything in the OpenAPI schema, call the service directly
from the query hook and skip the repository layer entirely — you get types for free.

---

## Configuration

`QueryProvider` in `src/providers/query.tsx` creates the `QueryClient` with **default
options** — no custom `staleTime`, `retry` or `refetchOnWindowFocus` yet. If the first
wired screens need different defaults, change them there, once, rather than per hook.
