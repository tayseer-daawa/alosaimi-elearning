# Authentication

[← Back to student app docs](./README.md)

The one feature fully wired to the live API. Decision and accepted risks are recorded in
[ADR 0003](../../../docs/adr/0003-auth-token-in-localstorage.md); this page describes how
it works.

---

## Storage

Two `localStorage` keys, and nothing else:

| Key | Written by | Contains |
| --- | --- | --- |
| `access_token` | `useLoginWizard` | the raw JWT |
| `student_profile` | `useLoginWizard` | `{ email }` from `/users/me` |

Both are cleared on logout. If you add a third key, add it to the logout handler in the
same change.

---

## The flow

### 1. Signup — `useSignupWizard`

A five-step wizard: `name → email → gender → goal → password`. Each step validates before
advancing; the final step submits.

```ts
UsersService.registerUser({ requestBody: {
  first_name, father_name, family_name, email, is_male, password,
}})
```

Then redirects to `/login`. Notes:

- Names are three separate fields — see [domain.md](../../../docs/domain.md).
- The wizard enforces a **6**-character minimum password. The backend requires **8**. The
  mismatch surfaces as a server-side validation error rather than inline feedback.
- The "goal" step (notification preference) is collected but never sent — no API field
  exists for it yet.

### 2. Login — `useLoginWizard`

```ts
const response = await LoginService.loginAccessToken({
  formData: { username: email, password },   // form-encoded, and the field is `username`
})
localStorage.setItem("access_token", response.access_token)

const profile = await UsersService.readUserMe()
localStorage.setItem("student_profile", JSON.stringify({ email: profile.email }))
```

Note `username`, not `email` — this endpoint takes an OAuth2 password form.

### 3. Token injection — `src/main.tsx`

One global interceptor, registered at startup. **Never attach the header yourself.**

```ts
OpenAPI.interceptors.request.use((request) => {
  const token = localStorage.getItem("access_token")
  if (token && request.headers) {
    request.headers.Authorization = `Bearer ${token}`
  }
  return request
})
```

### 4. Route guard — `src/routes/_layout.tsx`

Every page sits under `_layout`, so one `beforeLoad` protects them all.

```
no token  + path not public   → redirect to /welcome
has token + /login /signup /welcome → redirect to /
```

Public paths: `/login`, `/signup`, `/welcome`, `/forget-password`, `/reset-password`.
Adding a public page means adding it to that array — otherwise it redirects away.

### 5. Password recovery

```
POST /api/v1/password-recovery/{email}     ← useForgetPassword
        ↓ email containing a token link
/reset-password?token=…                    ← token read via useSearch
POST /api/v1/reset-password/               ← useResetPassword, then redirect to /login
```

Locally, the email lands in **MailCatcher at http://localhost:1080**. The frontend link
host comes from `FRONTEND_STUDENT_HOST` in the root `.env`.

### 6. Logout

Inline in the home screen menu (`HomeScreenComponents.tsx`): clears both keys and
navigates away. No API call — there is no revocation endpoint.

---

## Error messages

Every hook catches, distinguishes `ApiError` from a network failure, and sets Arabic copy.
Login deliberately does not reveal which field was wrong:

```ts
setError({ email: "البريد الإلكتروني أو كلمة السر غير صحيحة", password: null })
```

Full pattern in [data-fetching.md](./data-fetching.md#error-handling).

---

## Known gaps

Live today, and worth knowing before you build on this:

| Gap | Effect |
| --- | --- |
| The guard only checks that a token **string exists** | An expired JWT passes the guard; every request then 401s with no redirect to login |
| No global 401 handler | The user sits on a broken page instead of being sent to `/login` |
| No refresh flow, no revocation on logout | Backend issue #68 |
| Auth state is not reactive | Signing out in one tab does not update another |
| Password minimum is 6 in the UI, 8 in the API | Avoidable server-side error on signup |

The missing piece is a response interceptor that clears storage and redirects on 401.
