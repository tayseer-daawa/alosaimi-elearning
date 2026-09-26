import { expect, test } from "@playwright/test"

test.describe("welcome", () => {
  test("shows Arabic welcome and auth CTAs", async ({ page }) => {
    await page.goto("/welcome")

    await expect(
      page.getByText("مرحبا بك في موقع برامج الشيخ العصيمي"),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "حساب جديد" })).toBeVisible()
    await expect(page.getByRole("button", { name: "تسجيل دخول" })).toBeVisible()
  })

  test("حساب جديد navigates to signup", async ({ page }) => {
    await page.goto("/welcome")
    await page.getByRole("button", { name: "حساب جديد" }).click()
    await page.waitForURL("/signup")
    await expect(page.getByText("أدخل بعض المعلومات")).toBeVisible()
  })

  test("تسجيل دخول navigates to login", async ({ page }) => {
    await page.goto("/welcome")
    await page.getByRole("button", { name: "تسجيل دخول" }).click()
    await page.waitForURL("/login")
    await expect(page.getByText("أدخل معلومات الحساب")).toBeVisible()
  })
})
