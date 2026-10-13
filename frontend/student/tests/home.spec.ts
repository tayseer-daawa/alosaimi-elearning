import { expect, type Page, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"
const STUDENT_EMAIL = "student@example.com"
const PROGRAMS_LIST = /\/api\/v1\/programs\/(\?.*)?$/

type Ordered = { id: string; order: number }

const byOrder = (items: Ordered[]) =>
  [...items].sort((a, b) => a.order - b.order)

/** Sign in as the seed student and resolve the first lesson of the catalog. */
async function signIn(page: Page) {
  const login = await page.request.post(`${API}/api/v1/login/access-token`, {
    form: { username: STUDENT_EMAIL, password: "Student123!" },
  })
  expect(login.ok()).toBeTruthy()
  const { access_token } = (await login.json()) as { access_token: string }

  const programs = await page.request.get(`${API}/api/v1/programs/?limit=50`)
  const program = ((await programs.json()).data as { id: string }[])[0]
  expect(program).toBeTruthy()
  const phases = await page.request.get(
    `${API}/api/v1/phases/program/${program.id}?limit=50`,
  )
  const phase = byOrder((await phases.json()).data as Ordered[])[0]
  const books = await page.request.get(
    `${API}/api/v1/phases/${phase.id}/books?limit=50`,
  )
  const book = ((await books.json()).data as { id: string }[])[0]
  const lessons = await page.request.get(
    `${API}/api/v1/lessons/book/${book.id}?limit=50`,
  )
  const lesson = byOrder((await lessons.json()).data as Ordered[])[0]
  expect(lesson).toBeTruthy()

  await page.goto("/welcome")
  await page.evaluate(
    ({ token, email }) => {
      localStorage.setItem("access_token", token)
      localStorage.setItem(
        "student_profile",
        JSON.stringify({ email, full_name: "طالب تجريبي" }),
      )
    },
    { token: access_token, email: STUDENT_EMAIL },
  )
  return {
    programId: program.id,
    phaseId: phase.id,
    bookId: book.id,
    courseId: lesson.id,
  }
}

async function saveLastPath(page: Page, path: Record<string, string>) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: `user:${STUDENT_EMAIL}:continue_learning_path`,
    value: JSON.stringify({ ...path, updatedAt: Date.now() }),
  })
}

const lessonUrl = (path: Record<string, string>) =>
  new RegExp(
    `/programs/${path.programId}/phases/${path.phaseId}/books/${path.bookId}/courses/${path.courseId}$`,
  )

test.describe("home: continue learning", () => {
  test("shows loading, then an error that can be retried", async ({ page }) => {
    await signIn(page)

    let fail = true
    await page.route("**/api/v1/phases/program/**", async (route) => {
      if (!fail) return route.continue()
      // Hold the response so the loading state is observable.
      await new Promise((resolve) => setTimeout(resolve, 800))
      return route.fulfill({ status: 500, body: "{}" })
    })

    await page.goto("/")
    const cta = page.getByTestId("home-continue")
    await expect(cta).toContainText("ابدأ التعلم")
    await expect(cta).toBeEnabled()

    await cta.click()
    await expect(cta).toBeDisabled()

    const error = page.getByTestId("home-continue-error")
    await expect(error).toBeVisible()
    await expect(error).toContainText("تعذر فتح المقرر")
    await expect(cta).toBeEnabled()
    await expect(page).toHaveURL(/\/$/)

    fail = false
    await cta.click()
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+$/)
  })

  test("opens the saved lesson when the programs list is empty", async ({
    page,
  }) => {
    const path = await signIn(page)
    await saveLastPath(page, path)
    await page.route(PROGRAMS_LIST, (route) =>
      route.fulfill({ json: { data: [], count: 0 } }),
    )

    await page.goto("/")
    const cta = page.getByTestId("home-continue")
    await expect(cta).toContainText("متابعة المقرر")
    await expect(cta).toBeEnabled()

    await cta.click()
    await expect(page).toHaveURL(lessonUrl(path))
  })

  test("opens the saved lesson when the programs list fails to load", async ({
    page,
  }) => {
    const path = await signIn(page)
    await saveLastPath(page, path)
    await page.route(PROGRAMS_LIST, (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    )

    await page.goto("/")
    // React Query retries three times before giving up on the list.
    const cta = page.getByTestId("home-continue")
    await expect(cta).toBeEnabled({ timeout: 15_000 })

    await cta.click()
    await expect(page).toHaveURL(lessonUrl(path))
  })
})
