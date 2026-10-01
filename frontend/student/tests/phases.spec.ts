import { expect, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

test("retry reloads a phase's books after they failed to load", async ({
  page,
}) => {
  const login = await page.request.post(`${API}/api/v1/login/access-token`, {
    form: { username: "student@example.com", password: "Student123!" },
  })
  expect(login.ok()).toBeTruthy()
  const { access_token } = (await login.json()) as { access_token: string }

  const programs = await page.request.get(`${API}/api/v1/programs/?limit=50`)
  const program = (
    (await programs.json()).data as { id: string; title: string }[]
  ).find((p) => p.title === "مهمات العلم")
  expect(program).toBeTruthy()
  const phases = await page.request.get(
    `${API}/api/v1/phases/program/${program!.id}?limit=50`,
  )
  const firstPhase = (
    (await phases.json()).data as { id: string; order: number }[]
  ).sort((a, b) => a.order - b.order)[0]

  let failBooks = true
  let phaseListRequests = 0
  await page.route(`**/api/v1/phases/${firstPhase.id}/books**`, (route) =>
    failBooks ? route.fulfill({ status: 500, body: "{}" }) : route.continue(),
  )
  await page.route(`**/api/v1/phases/program/${program!.id}**`, (route) => {
    phaseListRequests += 1
    return route.continue()
  })

  await page.goto("/welcome")
  await page.evaluate(
    (token) => localStorage.setItem("access_token", token),
    access_token,
  )
  await page.goto(`/programs/${program!.id}/phases`)

  // React Query retries three times before surfacing the error.
  await expect(page.getByText("تعذر تحميل المراحل.")).toBeVisible({
    timeout: 15_000,
  })
  const phaseListRequestsBeforeRetry = phaseListRequests

  failBooks = false
  await page.getByRole("button", { name: "إعادة المحاولة" }).click()

  await expect(page.getByText("تعذر تحميل المراحل.")).toBeHidden()
  await expect(page.getByText("مرحلة 1", { exact: true })).toBeVisible()
  await expect(
    page
      .getByTestId("phase-book-chip")
      .or(page.getByTestId("phase-book-chip-last"))
      .first(),
  ).toBeVisible()
  expect(phaseListRequests).toBe(phaseListRequestsBeforeRetry)
})
