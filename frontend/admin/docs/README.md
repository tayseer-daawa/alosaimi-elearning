# Admin app

[← Back to project docs](../../../docs/README.md)

The dashboard for administrators and teachers. Dev server runs on **port 5173**.

---

## Status: unmodified template

> **Nothing project-specific has been built here yet.**
>
> This is the `full-stack-fastapi-template` dashboard with its example "Items" CRUD
> removed. What remains is authentication, user administration, a user-settings page, and
> a placeholder dashboard that greets the logged-in user and shows nothing else. None of
> the Alosaimi domain — programs, phases, books, lessons, sessions, exams — is
> represented.

What that means in practice:

- Do not treat anything in `frontend/admin/src/` as an example of this project's
  conventions. It groups code by technical type (`components/`, `hooks/`, `routes/`),
  which is **not** how the student app is organised — see
  [ADR 0001](../../../docs/adr/0001-feature-sliced-frontend.md).
- Do not copy patterns from here into `frontend/student`, or the reverse, without deciding
  deliberately.
- The generated API client (`src/client/`) **is** current — `scripts/generate-client.sh`
  regenerates both frontends together, so the admin app already has typed access to every
  endpoint listed in the [API map](../../../docs/api-map.md).

---

## What is here today

```
src/
├── routes/                    login, signup, recover-password, reset-password
│   └── _layout/
│       ├── index.tsx          placeholder dashboard — greeting only
│       ├── admin.tsx          user management (superusers only)
│       └── settings.tsx       user settings
├── components/
│   ├── Admin/                 AddUser, EditUser, DeleteUser
│   ├── UserSettings/          profile, password, appearance, delete account
│   ├── Common/                navbar, sidebar, shared dialogs
│   ├── Pending/               loading skeletons — PendingItems is an orphan leftover
│   └── ui/                    template's Chakra wrappers — excluded from linting
├── hooks/                     useAuth, useCustomToast
├── client/                    GENERATED — never edit
└── theme.tsx
```

Sidebar navigation is Dashboard · User Settings · Admin (the last shown to superusers
only).

Same stack as the student app: React 19, Vite, Chakra UI v3, TanStack Router + Query,
Biome, Node 24. It also ships the template's Playwright suite under `tests/`.

---

## Shared with the student app

| Concern | Where it is documented |
| --- | --- |
| Commit format, branches, lint, TypeScript rules | [conventions.md](../../../docs/conventions.md) |
| Running locally, ports, env files | [local-setup.md](../../../docs/local-setup.md) |
| Domain vocabulary | [domain.md](../../../docs/domain.md) |
| Endpoints | [api-map.md](../../../docs/api-map.md) |

---

## Before building here

The admin app has not been designed yet — there is no Figma for it and no agreed
structure. When real work starts:

1. Decide whether to keep the template's type-based layout or move to the student app's
   feature-sliced layout, and record it as an ADR.
2. Decide what to do with the remaining template leftovers — the orphaned
   `PendingItems.tsx`, and the appearance/dark-mode settings the student app does not
   have.
3. Expand this document at that point. Until then it is deliberately short.
