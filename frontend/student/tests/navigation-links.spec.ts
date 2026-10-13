import { expect, type Page, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

type Ordered = { id: string; order: number }

const byOrder = (items: Ordered[]) =>
  [...items].sort((a, b) => a.order - b.order)

/** Sign in as the seed student and resolve the first program → lesson path. */
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
  const phase = byOrder((await phases.json()).data as Ordered[])[0]
  const books = await page.request.get(
    `${API}/api/v1/phases/${phase.id}/books?limit=50`,
  )
  const book = ((await books.json()).data as { id: string }[])[0]
  const lessons = await page.request.get(
    `${API}/api/v1/lessons/book/${book.id}?limit=50`,
  )
  const lessonList = byOrder((await lessons.json()).data as Ordered[])
  expect(lessonList.length).toBeGreaterThan(0)

  await page.goto("/welcome")
  await page.evaluate(
    (token) => localStorage.setItem("access_token", token),
    access_token,
  )

  const phasesUrl = `/programs/${program!.id}/phases`
  const bookUrl = `${phasesUrl}/${phase.id}/books/${book.id}`
  return {
    phasesUrl,
    bookUrl,
    lessonUrls: lessonList.map((l) => `${bookUrl}/courses/${l.id}`),
  }
}

test.describe("navigation uses real links and buttons", () => {
  test("phase card toggles from the keyboard and exposes its state", async ({
    page,
  }) => {
    const { phasesUrl } = await openAsStudent(page)
    await page.goto(phasesUrl)

    const toggle = page.getByTestId("phase-toggle").first()
    await expect(toggle).toHaveJSProperty("tagName", "BUTTON")
    await expect(toggle).toHaveAttribute("aria-expanded", "true")

    await toggle.focus()
    await page.keyboard.press("Enter")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press("Space")
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
  })

  test("book chips are links that open the book", async ({ page }) => {
    const { phasesUrl, bookUrl } = await openAsStudent(page)
    await page.goto(phasesUrl)

    const chip = page.locator(`a[href="${bookUrl}"]`)
    await expect(chip).toBeVisible()
    await expect(chip).toHaveAttribute(
      "data-testid",
      /^phase-book-chip(-last)?$/,
    )

    await chip.focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(new RegExp(`${bookUrl}$`))
  })

  test("lesson entries are links that open the lesson", async ({ page }) => {
    const { bookUrl, lessonUrls } = await openAsStudent(page)
    await page.goto(bookUrl)

    const lesson = page.getByTestId("book-lesson-link").first()
    await expect(lesson).toHaveJSProperty("tagName", "A")
    await expect(lesson).toHaveAttribute("href", lessonUrls[0])

    await lesson.focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(new RegExp(`${lessonUrls[0]}$`))
  })

  test("menu items are links and close the drawer", async ({ page }) => {
    const { phasesUrl } = await openAsStudent(page)
    await page.goto(phasesUrl)

    await page.getByTestId("app-menu-trigger").click()
    const profile = page.getByTestId("app-menu-nav-profile")
    await expect(profile).toHaveJSProperty("tagName", "A")
    await expect(profile).toHaveAttribute("href", "/profile")
    await expect(page.getByTestId("app-menu-nav-programs")).toHaveAttribute(
      "href",
      "/programs",
    )

    await profile.focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByTestId("app-menu-drawer")).toBeHidden()
  })

  test.describe("breadcrumbs (tablet layout)", () => {
    // The lesson screen shows breadcrumbs only between the md and lg breakpoints.
    test.use({ viewport: { width: 820, height: 1180 } })

    test("crumbs and the lesson dropdown are links", async ({ page }) => {
      const { phasesUrl, bookUrl, lessonUrls } = await openAsStudent(page)
      await page.goto(lessonUrls[0])

      const nav = page.getByRole("navigation", { name: "Breadcrumb" })
      await expect(nav.locator('a[href="/programs"]')).toBeVisible()
      await expect(nav.locator(`a[href="${phasesUrl}"]`)).toBeVisible()
      await expect(nav.locator(`a[href="${bookUrl}"]`)).toBeVisible()

      // The current lesson opens a menu of sibling lessons.
      await nav.getByRole("button").click()
      const items = page.getByRole("menuitem")
      await expect(items.first()).toHaveJSProperty("tagName", "A")
      await expect(items.first()).toHaveAttribute("href", lessonUrls[0])

      await page.keyboard.press("Escape")
      await nav.locator(`a[href="${bookUrl}"]`).focus()
      await page.keyboard.press("Enter")
      await expect(page).toHaveURL(new RegExp(`${bookUrl}$`))
    })

    test("picking a lesson from the dropdown with the keyboard navigates", async ({
      page,
    }) => {
      const { lessonUrls } = await openAsStudent(page)
      test.skip(lessonUrls.length < 2, "needs a book with two lessons")
      await page.goto(lessonUrls[0])

      const nav = page.getByRole("navigation", { name: "Breadcrumb" })
      await nav.getByRole("button").focus()
      await page.keyboard.press("Enter")
      await expect(page.getByRole("menuitem").first()).toBeVisible()
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("Enter")
      await expect(page).toHaveURL(new RegExp(`${lessonUrls[1]}$`))
    })
  })
})
