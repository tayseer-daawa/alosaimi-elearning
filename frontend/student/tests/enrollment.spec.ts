import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

type Program = { id: string; title: string }
type ProgramWithSession = Program & { sessionId: string }

async function signUpAndLogIn(page: Page, request: APIRequestContext) {
  const stamp = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
  const email = `ui.enroll.${stamp}@example.com`
  const password = "Password1!"

  const signup = await request.post(`${API}/api/v1/users/signup`, {
    data: {
      email,
      password,
      first_name: "عائشة",
      father_name: "عبدالله",
      family_name: "السبيعي",
      is_male: false,
    },
  })
  expect(signup.ok()).toBeTruthy()

  const login = await request.post(`${API}/api/v1/login/access-token`, {
    form: { username: email, password },
  })
  expect(login.ok()).toBeTruthy()
  const { access_token } = (await login.json()) as { access_token: string }

  await page.goto("/welcome")
  await page.evaluate(
    ({ token, email }) => {
      localStorage.setItem("access_token", token)
      localStorage.setItem(
        "student_profile",
        JSON.stringify({ email, first_name: "عائشة" }),
      )
    },
    { token: access_token, email },
  )
  return access_token
}

async function listPrograms(request: APIRequestContext): Promise<Program[]> {
  const res = await request.get(`${API}/api/v1/programs/?limit=100`)
  expect(res.ok()).toBeTruthy()
  return (await res.json()).data as Program[]
}

async function findProgramWithSession(
  request: APIRequestContext,
): Promise<ProgramWithSession | undefined> {
  for (const program of await listPrograms(request)) {
    const res = await request.get(
      `${API}/api/v1/sessions/program/${program.id}`,
    )
    const sessions = (await res.json()).data as { id: string }[]
    if (sessions.length) return { ...program, sessionId: sessions[0].id }
  }
  return undefined
}

async function findProgramWithoutSession(
  request: APIRequestContext,
): Promise<Program | undefined> {
  for (const program of await listPrograms(request)) {
    const res = await request.get(
      `${API}/api/v1/sessions/program/${program.id}`,
    )
    if ((await res.json()).count === 0) return program
  }
  return undefined
}

/** Exact title match: "تمكين مهمات العلم" also contains "مهمات العلم". */
function programCard(scope: Page | Locator, title: string) {
  const page = "page" in scope ? scope.page() : scope
  return scope.getByTestId("program-card").filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  })
}

async function mySessionCount(request: APIRequestContext, token: string) {
  const res = await request.get(`${API}/api/v1/users/me/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.ok()).toBeTruthy()
  return (await res.json()).count as number
}

test.describe("program self-enrollment", () => {
  test("enrolling shows up on the program page, the programs list and home", async ({
    page,
    request,
  }) => {
    const program = await findProgramWithSession(request)
    test.skip(!program, "no program with a session in this database")

    const token = await signUpAndLogIn(page, request)

    await page.goto("/programs")
    const openBadge = programCard(page, program!.title).getByTestId(
      "program-enrollment-badge",
    )
    await expect(openBadge).toHaveAttribute("data-status", "open")
    await expect(openBadge).toHaveText("التسجيل مفتوح")
    await expect(page.getByTestId("my-programs")).toHaveCount(0)

    await page.goto(`/programs/${program!.id}/phases`)
    const card = page.getByTestId("enrollment-card")
    await expect(card).toHaveAttribute("data-state", "open")
    await card.getByTestId("enroll-button").first().click()

    const dialog = page.getByTestId("enroll-confirm-dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(program!.title)
    await expect(dialog).toContainText(/(تبدأ|بدأت) في/)
    await dialog.getByTestId("enroll-confirm").click()

    await expect(dialog).toBeHidden()
    await expect(card).toHaveAttribute("data-state", "enrolled")
    await expect(page.getByTestId("enrollment-status")).toHaveText(
      "أنت مسجّل في هذه الدورة",
    )
    expect(await mySessionCount(request, token)).toBe(1)

    await page.reload()
    await expect(page.getByTestId("enrollment-card")).toHaveAttribute(
      "data-state",
      "enrolled",
    )
    await expect(page.getByTestId("enroll-button")).toHaveCount(0)

    await page.goto("/programs")
    const mine = page.getByTestId("my-programs")
    await expect(mine.getByRole("heading", { name: "برامجي" })).toBeVisible()
    await expect(
      programCard(mine, program!.title).getByTestId("program-enrollment-badge"),
    ).toHaveText("مسجّل")
    await expect(
      programCard(page.getByTestId("other-programs"), program!.title),
    ).toHaveCount(0)

    await page.goto("/")
    await expect(page.getByText("برنامجك", { exact: true })).toBeVisible()
    await expect(page.getByText(/أنت مسجّل · (تبدأ|بدأت) في/)).toBeVisible()
  })

  test("cancelling the confirmation does not enroll", async ({
    page,
    request,
  }) => {
    const program = await findProgramWithSession(request)
    test.skip(!program, "no program with a session in this database")

    const token = await signUpAndLogIn(page, request)
    await page.goto(`/programs/${program!.id}/phases`)

    await page.getByTestId("enroll-button").first().click()
    const dialog = page.getByTestId("enroll-confirm-dialog")
    await dialog.getByTestId("enroll-cancel").click()

    await expect(dialog).toBeHidden()
    await expect(page.getByTestId("enrollment-card")).toHaveAttribute(
      "data-state",
      "open",
    )
    expect(await mySessionCount(request, token)).toBe(0)
  })

  test("explains when the session is no longer available", async ({
    page,
    request,
  }) => {
    const program = await findProgramWithSession(request)
    test.skip(!program, "no program with a session in this database")

    await signUpAndLogIn(page, request)
    await page.route(`${API}/api/v1/sessions/*/enroll`, (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Session or User not found" }),
      }),
    )
    await page.goto(`/programs/${program!.id}/phases`)

    await page.getByTestId("enroll-button").first().click()
    const dialog = page.getByTestId("enroll-confirm-dialog")
    await dialog.getByTestId("enroll-confirm").click()

    await expect(dialog.getByTestId("enrollment-error")).toHaveText(
      "هذه الدورة لم تعد متاحة للتسجيل.",
    )
    await expect(dialog.getByTestId("enroll-confirm")).toBeEnabled()
    await expect(page.getByTestId("enrollment-card")).toHaveAttribute(
      "data-state",
      "open",
    )
  })

  test("shows the session calendar on request", async ({ page, request }) => {
    const program = await findProgramWithSession(request)
    test.skip(!program, "no program with a session in this database")

    const events = await request.get(
      `${API}/api/v1/sessions/${program!.sessionId}/events`,
    )
    const eventCount = (await events.json()).count as number
    test.skip(eventCount === 0, "the session has no calendar events")

    await signUpAndLogIn(page, request)
    await page.goto(`/programs/${program!.id}/phases`)

    const toggle = page.getByTestId("session-schedule-toggle").first()
    await expect(toggle).toHaveText(/عرض جدول الدورة/)
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await toggle.click()

    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(toggle).toHaveText(/إخفاء جدول الدورة/)
    await expect(page.getByTestId("session-schedule-row")).toHaveCount(
      eventCount,
    )
  })

  test("hides the enrollment card when a program has no sessions", async ({
    page,
    request,
  }) => {
    const program = await findProgramWithoutSession(request)
    test.skip(!program, "every program has a session in this database")

    await signUpAndLogIn(page, request)
    const sessionsLoaded = page.waitForResponse((res) =>
      res.url().includes(`/api/v1/sessions/program/${program!.id}`),
    )
    await page.goto(`/programs/${program!.id}/phases`)
    await sessionsLoaded

    await expect(page.getByText("مرحلة 1", { exact: true })).toBeVisible()
    await expect(page.getByTestId("enrollment-card")).toHaveCount(0)
    await expect(page.getByTestId("enroll-button")).toHaveCount(0)

    await page.goto("/programs")
    await expect(programCard(page, program!.title)).toHaveCount(1)
    await expect(
      programCard(page, program!.title).getByTestId("program-enrollment-badge"),
    ).toHaveCount(0)
  })
})
