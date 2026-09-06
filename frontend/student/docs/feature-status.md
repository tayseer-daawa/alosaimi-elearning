# Feature status

[← Back to student app docs](./README.md)

**What is real and what is mock.** The most important page in these docs: auth talks to the
live API, the entire learning experience renders from fixtures.

Update this table in the same pull request that changes a screen's data source.

---

## Screens

| Screen | Route | Data source | Status |
| --- | --- | --- | --- |
| Welcome | `/welcome` | static | ✅ done |
| Signup wizard | `/signup` | `UsersService.registerUser` | ✅ live API |
| Login | `/login` | `LoginService.loginAccessToken` + `UsersService.readUserMe` | ✅ live API |
| Forgot password | `/forget-password` | `LoginService.recoverPassword` | ✅ live API |
| Reset password | `/reset-password` | `LoginService.resetPassword` | ✅ live API |
| Home | `/` | `mockData.lessons` | ⚠️ mock |
| Programs list | `/programs` | `mockData.lessons` | ⚠️ mock |
| Phases | `/programs/$programId/phases` | `mockData.stages` | ⚠️ mock |
| Books | `…/books/$bookId` | `mockData.books` | ⚠️ mock |
| Course + audio player | `…/courses/$courseId` | hardcoded in JSX | ⚠️ mock |
| Exams / questions | — | — | ❌ not started |
| Profile / settings | — | — | ❌ not started |

Tracked in issues #52 (learning API integration), #50 (learning UI), #39 (flow redesign).

---

## The mock fixtures

`src/shared/api/mockData.ts` exports three arrays, all with Arabic content:

| Export | Consumed by | Represents |
| --- | --- | --- |
| `lessons` | `HomeScreen`, `ProgramsList` | Programs, despite the name |
| `stages` | `PhasesList` | Phases, each with a nested `lessons` array that actually holds books |
| `books` | `BooksList`, `BooksItem` | Books |

> The fixture names do not match the domain vocabulary. `lessons` means programs and
> `stages[].lessons` means books. Do not carry these names into real code — use the domain
> terms from [domain.md](../../../docs/domain.md).

Two more places hold hardcoded content that is not in `mockData.ts`:

- `CourseScreen.tsx` — the course title and the breadcrumb dropdown options
  (`المقرر 1` … `المقرر 4`) are literals.
- `AudioPlayer.tsx` — plays a bundled file, `/assets/audio/020.mp3`, ignoring any lesson.

---

## What wiring a screen involves

The API side is already generated and typed — `ProgramsService`, `PhasesService`,
`BooksService`, `LessonsService`, `QuestionsService`, `ExamsService`, `SessionsService`
all exist with full types. Only the wiring is missing. See
[data-fetching.md](./data-fetching.md) for the pattern.

Two things will bite:

1. **Integer ids become UUIDs.** Fixtures use `id: 1` and every `navigate({ params })` call
   passes `"1"`. Real ids are UUID strings. Every params object in the learning flow
   changes.
2. **React Query is provided but unused.** `QueryProvider` wraps the app in `main.tsx`, and
   the only `useQuery` in the codebase is in `src/features/example/` — which you should not
   copy, see below. The first wired screen sets the pattern everyone else copies — get it
   right.

---

## Reference code that is wrong

`src/features/example/` is presented as the reference implementation of a feature slice. Its
*structure* is correct; its *contents* are not. It predates the constitution and violates
four articles:

| What it does | Article |
| --- | --- |
| `exampleRepo.ts` imports the legacy `fetcher` instead of the generated client | [C-04](../../../docs/constitution.md#c-04--the-generated-client-is-the-only-transport) |
| Imports by relative path (`../../../shared/api/fetcher`) instead of `@/` | [conventions](../../../docs/conventions.md#typescript) |
| Types payloads as `any` in `exampleRepo.ts` and `useCreateExample.ts` | `strict` TypeScript |
| Calls `/api/examples`, an endpoint that does not exist | — |

Copy the layering (`api/` → `hooks/` → `components/`) from
[ADR 0001](../../../docs/adr/0001-feature-sliced-frontend.md) and take the calling pattern
from [data-fetching.md](./data-fetching.md) or a real slice under `src/features/`. Treat
this slice as debt under
[C-11](../../../docs/constitution.md#c-11--debt-in-a-slice-is-paid-before-that-slice-gains-behaviour),
not as a precedent.

---

## Known gaps in shipped screens

| Gap | Where |
| --- | --- |
| Home greets a hardcoded `"أحمد"` although `student_profile` is in localStorage and `/users/me` returns real names | `HomeScreen.tsx` |
| Inactive program cards `console.log` on click instead of navigating | `ProgramsList.tsx` |
| Course "previous" / "next" buttons render but do nothing | `CourseScreen.tsx` |
| Page header (menu button + centred heading) is duplicated across four screens | `*Screen.tsx` |
| `Layout()` branches on `/signup` and returns the same `<Outlet />` either way | `routes/_layout.tsx` |
| Playwright `testDir: './tests'` does not exist, and `baseURL` is `:5173` (the admin port) | `playwright.config.ts` |
