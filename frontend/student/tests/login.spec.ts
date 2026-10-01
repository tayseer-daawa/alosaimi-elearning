import { expect, type Page, test } from "@playwright/test"

test.describe("login", () => {
  test("shows email and password fields with continue CTA", async ({
    page,
  }) => {
    await page.goto("/login")

    await expect(page.getByText("أدخل معلومات الحساب")).toBeVisible()
    await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible()
    await expect(page.getByLabel("كلمة السر")).toBeVisible()
    await expect(page.getByRole("button", { name: "مواصلة" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "نسيت كلمة السر؟" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "إنشاء حساب" })).toBeVisible()
  })

  test("shows per-field errors when submitting empty", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(page.getByText("الرجاء إدخال بريدك الإلكتروني")).toBeVisible()
    await expect(page.getByText("الرجاء إدخال كلمة السر")).toBeVisible()
  })

  async function submitLogin(page: Page, password = "Student123!") {
    await page.goto("/login")
    await page.getByLabel("البريد الإلكتروني").fill("student@example.com")
    await page.getByLabel("كلمة السر").fill(password)
    await page.getByRole("button", { name: "مواصلة" }).click()
  }

  function mockLogin(page: Page, status: number, body: unknown) {
    return page.route("**/api/v1/login/access-token", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      }),
    )
  }

  test("wrong password says the credentials are wrong", async ({ page }) => {
    await submitLogin(page, "wrong-password-123")

    await expect(
      page.getByText("البريد الإلكتروني أو كلمة السر غير صحيحة"),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("inactive account says the account is not active", async ({ page }) => {
    await mockLogin(page, 400, { detail: "Inactive user" })
    await submitLogin(page)

    await expect(
      page.getByText("هذا الحساب غير مفعّل. تواصل مع الإدارة"),
    ).toBeVisible()
    await expect(
      page.getByText("البريد الإلكتروني أو كلمة السر غير صحيحة"),
    ).toHaveCount(0)
    await expect(page).toHaveURL(/\/login$/)
  })

  test("server error does not blame the credentials", async ({ page }) => {
    await mockLogin(page, 500, {})
    await submitLogin(page)

    await expect(page.getByText("حدث خطأ أثناء الاتصال بالخادم")).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
