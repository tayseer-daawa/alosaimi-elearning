import { expect, type Page, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

/** Sign in as the seed student and resolve the first book of the program. */
async function openAsStudent(page: Page) {
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
  const phase = (
    (await phases.json()).data as { id: string; order: number }[]
  ).sort((a, b) => a.order - b.order)[0]
  const books = await page.request.get(
    `${API}/api/v1/phases/${phase.id}/books?limit=50`,
  )
  const book = ((await books.json()).data as { id: string; title: string }[])[0]
  expect(book).toBeTruthy()

  await page.goto("/welcome")
  await page.evaluate(
    (token) => localStorage.setItem("access_token", token),
    access_token,
  )
  return {
    book,
    bookUrl: `/programs/${program!.id}/phases/${phase.id}/books/${book.id}`,
  }
}

test("retry reloads a book after it failed to load", async ({ page }) => {
  const { book, bookUrl } = await openAsStudent(page)

  let failBook = true
  await page.route(`**/api/v1/books/${book.id}`, (route) =>
    failBook ? route.fulfill({ status: 500, body: "{}" }) : route.continue(),
  )

  await page.goto(bookUrl)

  // React Query retries three times before surfacing the error.
  await expect(page.getByText("تعذر تحميل الكتاب.")).toBeVisible({
    timeout: 15_000,
  })
  const retry = page.getByTestId("book-retry")
  await expect(retry).toBeVisible()
  await expect(retry).toHaveText("إعادة المحاولة")

  failBook = false
  await retry.click()

  await expect(page.getByText("تعذر تحميل الكتاب.")).toBeHidden()
  await expect(
    page.getByRole("heading", { name: book.title }).first(),
  ).toBeVisible()
  await expect(page.getByText("المقرر 1", { exact: true })).toBeVisible()
})

test("retry reloads a book's lessons after they failed to load", async ({
  page,
}) => {
  const { book, bookUrl } = await openAsStudent(page)

  let failLessons = true
  await page.route(`**/api/v1/lessons/book/${book.id}**`, (route) =>
    failLessons ? route.fulfill({ status: 500, body: "{}" }) : route.continue(),
  )

  await page.goto(bookUrl)

  await expect(page.getByText("تعذر تحميل مقررات الكتاب.")).toBeVisible({
    timeout: 15_000,
  })

  failLessons = false
  await page.getByTestId("book-lessons-retry").click()

  await expect(page.getByText("تعذر تحميل مقررات الكتاب.")).toBeHidden()
  await expect(page.getByText("المقرر 1", { exact: true })).toBeVisible()
})
