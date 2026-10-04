import { expect, type Page, test } from "@playwright/test"

/**
 * Lesson progress lives on the device, namespaced per student: an expired
 * token, a failed login or signing out never deletes it, and another student
 * on the same device never sees it.
 * Needs backend :8000 and the seeded student@example.com / sara.student@example.com.
 */
const STUDENT = "student@example.com"
const OTHER_STUDENT = "sara.student@example.com"
const PASSWORD = "Student123!"

const PROGRESS = [
  "continue_learning_path",
  "lesson_completed:e2e-lesson",
  "lesson_notes:e2e-lesson",
  "lesson_playback:e2e-lesson",
]
const progressOf = (email: string) => PROGRESS.map((k) => `user:${email}:${k}`)

async function loginThroughForm(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("البريد الإلكتروني").fill(email)
  await page.getByLabel("كلمة السر").fill(password)
  await page.getByRole("button", { name: "مواصلة" }).click()
}

async function seedProgress(page: Page, prefix: string) {
  await page.evaluate((p) => {
    localStorage.setItem(
      `${p}continue_learning_path`,
      JSON.stringify({
        programId: "p",
        phaseId: "ph",
        bookId: "b",
        courseId: "e2e-lesson",
        updatedAt: Date.now(),
      }),
    )
    localStorage.setItem(
      `${p}lesson_completed:e2e-lesson`,
      JSON.stringify({ completedAt: Date.now() }),
    )
    localStorage.setItem(`${p}lesson_notes:e2e-lesson`, "ملاحظة")
    localStorage.setItem(
      `${p}lesson_playback:e2e-lesson`,
      JSON.stringify({ position: 42, rate: 1, updatedAt: Date.now() }),
    )
  }, prefix)
}

const storedKeys = (page: Page) =>
  page.evaluate(() => Object.keys(localStorage))

test.describe("on-device progress", () => {
  test.describe.configure({ timeout: 60_000 })

  test("survives token expiry, a failed login and signing back in", async ({
    page,
  }) => {
    await loginThroughForm(page, STUDENT, PASSWORD)
    await page.waitForURL("/", { timeout: 15_000 })
    await seedProgress(page, `user:${STUDENT}:`)

    await page.evaluate(() =>
      localStorage.setItem("access_token", "expired_token"),
    )
    // Home calls GET /users/me, which answers 403 "Could not validate credentials".
    await page.goto("/")
    await page.waitForURL("/welcome", { timeout: 15_000 })
    expect(await storedKeys(page)).not.toContain("access_token")
    expect(await storedKeys(page)).toEqual(
      expect.arrayContaining(progressOf(STUDENT)),
    )

    await loginThroughForm(page, STUDENT, "wrong-password")
    await expect(page).toHaveURL(/\/login\/?$/)
    await expect.poll(() => storedKeys(page)).not.toContain("access_token")
    expect(await storedKeys(page)).toEqual(
      expect.arrayContaining(progressOf(STUDENT)),
    )

    await loginThroughForm(page, STUDENT, PASSWORD)
    await page.waitForURL("/", { timeout: 15_000 })
    expect(await storedKeys(page)).toEqual(
      expect.arrayContaining([...progressOf(STUDENT), "access_token"]),
    )
  })

  test("survives signing out, and another student never sees it", async ({
    page,
  }) => {
    await loginThroughForm(page, STUDENT, PASSWORD)
    await page.waitForURL("/", { timeout: 15_000 })
    await seedProgress(page, `user:${STUDENT}:`)

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome", { timeout: 10_000 })
    expect(await storedKeys(page)).toEqual(
      expect.arrayContaining(progressOf(STUDENT)),
    )

    await loginThroughForm(page, OTHER_STUDENT, PASSWORD)
    await page.waitForURL("/", { timeout: 15_000 })
    const keys = await storedKeys(page)
    for (const key of progressOf(OTHER_STUDENT)) expect(keys).not.toContain(key)
    expect(keys).toEqual(expect.arrayContaining(progressOf(STUDENT)))

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome", { timeout: 10_000 })
    await loginThroughForm(page, STUDENT, PASSWORD)
    await page.waitForURL("/", { timeout: 15_000 })
    expect(await storedKeys(page)).toEqual(
      expect.arrayContaining(progressOf(STUDENT)),
    )
  })

  test("progress saved before namespacing moves under the signed-in student", async ({
    page,
  }) => {
    await page.goto("/welcome")
    await page.evaluate(
      (email) =>
        localStorage.setItem("student_profile", JSON.stringify({ email })),
      STUDENT,
    )
    await seedProgress(page, "")

    await page.reload()
    await expect
      .poll(() => storedKeys(page))
      .toEqual(expect.arrayContaining(progressOf(STUDENT)))
    for (const key of PROGRESS)
      expect(await storedKeys(page)).not.toContain(key)
  })
})
