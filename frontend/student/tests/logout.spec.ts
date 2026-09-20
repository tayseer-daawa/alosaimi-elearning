import { expect, test } from "@playwright/test"

/**
 * Logout from home and programs menus.
 * Needs backend :8000 and seeded student@example.com (or any valid account).
 */
const email = process.env.E2E_STUDENT_EMAIL || "student@example.com"
const password = process.env.E2E_STUDENT_PASSWORD || "Student123!"

async function loginAsStudent(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.getByLabel("البريد الإلكتروني").fill(email)
  await page.getByLabel("كلمة السر").fill(password)
  await page.getByRole("button", { name: "مواصلة" }).click()
  await page.waitForURL("/", { timeout: 15000 })
}

test.describe("logout", () => {
  test.describe.configure({ timeout: 45_000 })

  test("home menu clears session and lands on welcome", async ({ page }) => {
    await loginAsStudent(page)

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome", { timeout: 10000 })

    expect(
      await page.evaluate(() => localStorage.getItem("access_token")),
    ).toBeNull()
    expect(
      await page.evaluate(() => localStorage.getItem("student_profile")),
    ).toBeNull()

    await page.goto("/")
    await page.waitForURL("/welcome", { timeout: 10000 })
  })

  test("programs menu also logs out", async ({ page }) => {
    await loginAsStudent(page)
    await page.goto("/programs")
    await expect(page.getByRole("heading", { name: "البرامج" })).toBeVisible()

    await page.getByRole("button", { name: "القائمة الرئيسية" }).click()
    await page.getByText("تسجيل الخروج").click()
    await page.waitForURL("/welcome", { timeout: 10000 })
    expect(
      await page.evaluate(() => localStorage.getItem("access_token")),
    ).toBeNull()
  })
})
