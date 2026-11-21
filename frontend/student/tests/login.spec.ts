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

  test("shows no account-created notice on a plain visit", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("أدخل معلومات الحساب")).toBeVisible()
    await expect(page.getByTestId("login-notice")).toHaveCount(0)
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

  test("offline sign-in shows an error instead of spinning", async ({
    page,
    context,
  }) => {
    await page.goto("/login")
    await page.getByLabel("البريد الإلكتروني").fill("student@example.com")
    await page.getByLabel("كلمة السر").fill("Student123!")
    await context.setOffline(true)
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(
      page.getByText("حدث خطأ غير متوقع للاتصال بالخادم"),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "مواصلة" })).toBeEnabled()
    await context.setOffline(false)
  })

  test("pressing Enter twice starts one sign-in", async ({ page }) => {
    let tokenRequests = 0
    await page.route("**/api/v1/login/access-token", async (route) => {
      tokenRequests += 1
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Incorrect email or password" }),
      })
    })

    await page.goto("/login")
    await page.getByLabel("البريد الإلكتروني").fill("student@example.com")
    const password = page.getByLabel("كلمة السر")
    await password.fill("Student123!")
    await password.press("Enter")
    await password.press("Enter")

    await expect(
      page.getByText("البريد الإلكتروني أو كلمة السر غير صحيحة"),
    ).toBeVisible()
    expect(tokenRequests).toBe(1)
  })

  test("announces the account-created notice to screen readers", async ({
    page,
  }) => {
    await page.goto("/login?registered=true")

    await expect(
      page.getByRole("status").filter({
        hasText: "تم إنشاء الحساب، يرجى تسجيل الدخول",
      }),
    ).toHaveCount(1)
  })
})
