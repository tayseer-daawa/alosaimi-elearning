import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

type Program = { id: string; title: string }

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

async function findProgram(
  request: APIRequestContext,
  withSessions: boolean,
): Promise<Program | undefined> {
  const res = await request.get(`${API}/api/v1/programs/?limit=100`)
  expect(res.ok()).toBeTruthy()
  const programs = (await res.json()).data as Program[]
  for (const program of programs) {
    const sessions = await request.get(
      `${API}/api/v1/sessions/program/${program.id}`,
    )
    expect(sessions.ok()).toBeTruthy()
    const { count } = (await sessions.json()) as { count: number }
    if (count > 0 === withSessions) return program
  }
  return undefined
}

test.describe("program self-enrollment", () => {
  test("a new student enrolls from the program page and stays enrolled after reload", async ({
    page,
    request,
  }) => {
    const program = await findProgram(request, true)
    test.skip(!program, "no program with a session in this database")

    const token = await signUpAndLogIn(page, request)
    await page.goto(`/programs/${program!.id}/phases`)

    const card = page.getByTestId("enrollment-card")
    await expect(card).toHaveAttribute("data-state", "open")
    await expect(card.getByText("التسجيل في الدورة")).toBeVisible()
    const enroll = card.getByTestId("enroll-button").first()
    await expect(enroll).toHaveText("سجّل في الدورة")

    await enroll.click()
    await expect(card).toHaveAttribute("data-state", "enrolled")
    await expect(page.getByTestId("enrollment-status")).toHaveText(
      "أنت مسجّل في هذه الدورة",
    )
    await expect(card).toContainText(/(تبدأ|بدأت) في/)

    const mine = await request.get(`${API}/api/v1/users/me/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(mine.ok()).toBeTruthy()
    expect((await mine.json()).count).toBe(1)

    await page.reload()
    await expect(page.getByTestId("enrollment-card")).toHaveAttribute(
      "data-state",
      "enrolled",
    )
    await expect(page.getByTestId("enroll-button")).toHaveCount(0)
  })

  test("shows an Arabic error and keeps the button when enrollment fails", async ({
    page,
    request,
  }) => {
    const program = await findProgram(request, true)
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

    const card = page.getByTestId("enrollment-card")
    await card.getByTestId("enroll-button").first().click()
    await expect(page.getByTestId("enrollment-error")).toHaveText(
      "تعذر إتمام التسجيل. حاول مرة أخرى.",
    )
    await expect(card).toHaveAttribute("data-state", "open")
    await expect(card.getByTestId("enroll-button").first()).toBeEnabled()
  })

  test("hides the enrollment card when a program has no sessions", async ({
    page,
    request,
  }) => {
    const program = await findProgram(request, false)
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
  })
})
