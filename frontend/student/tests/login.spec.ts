import { expect, test } from "@playwright/test"

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
})
