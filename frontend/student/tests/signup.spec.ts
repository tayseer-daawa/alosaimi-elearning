import { expect, type Page, test } from "@playwright/test"

test.describe("signup name step validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByText("أدخل بعض المعلومات")).toBeVisible()
  })

  test("shows a distinct error per empty name field", async ({ page }) => {
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(
      page.getByText("الرجاء إدخال الاسم الشخصي", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText("الرجاء إدخال اسم الأب", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText("الرجاء إدخال الاسم العائلي", { exact: true }),
    ).toBeVisible()

    // The old shared message must not appear on any field
    await expect(
      page.getByText("الرجاء إدخال الاسم الشخصي، اسم الأب، والاسم العائلي"),
    ).toHaveCount(0)
  })

  test("only reports the fields that are still invalid", async ({ page }) => {
    await page.getByLabel("الاسم الشخصي").fill("أحمد")
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(
      page.getByText("الرجاء إدخال الاسم الشخصي", { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByText("الرجاء إدخال اسم الأب", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText("الرجاء إدخال الاسم العائلي", { exact: true }),
    ).toBeVisible()
  })

  test("advances past the name step when all names are filled", async ({
    page,
  }) => {
    await page.getByLabel("الاسم الشخصي").fill("أحمد")
    await page.getByLabel("اسم الأب").fill("محمد")
    await page.getByLabel("الاسم العائلي").fill("العصيمي")
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible()
  })
})

async function fillNameStep(page: Page) {
  await page.getByLabel("الاسم الشخصي").fill("أحمد")
  await page.getByLabel("اسم الأب").fill("محمد")
  await page.getByLabel("الاسم العائلي").fill("العصيمي")
  await page.getByRole("button", { name: "مواصلة" }).click()
}

async function reachPasswordStep(page: Page, email: string) {
  await fillNameStep(page)
  await page.getByLabel("البريد الإلكتروني").fill(email)
  await page.getByRole("button", { name: "مواصلة" }).click()
  await page.getByRole("button", { name: "ذكر" }).click()
  await page.getByRole("button", { name: "مواصلة" }).click()
  const passwordInputs = page.locator('input[type="password"]')
  await passwordInputs.nth(0).fill("Password1!")
  await passwordInputs.nth(1).fill("Password1!")
}

test.describe("signup wizard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByText("أدخل بعض المعلومات")).toBeVisible()
  })

  test("blocks reserved test domains on the email step", async ({ page }) => {
    await fillNameStep(page)
    await page.getByLabel("البريد الإلكتروني").fill("someone@mail.test")
    await page.getByRole("button", { name: "مواصلة" }).click()

    await expect(
      page.getByText(
        "هذا البريد غير مقبول، الرجاء استخدام بريدك الإلكتروني الحقيقي",
      ),
    ).toBeVisible()
    await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible()
  })

  test("back button returns to the previous step and keeps values", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "رجوع" })).toHaveCount(0)

    await fillNameStep(page)
    await expect(page.getByTestId("signup-step-indicator")).toHaveText(
      "الخطوة 2 من 4",
    )
    await page.getByLabel("البريد الإلكتروني").fill("ahmad@example.com")
    await page.getByRole("button", { name: "مواصلة" }).click()

    await page.getByRole("button", { name: "رجوع" }).click()
    await expect(page.getByLabel("البريد الإلكتروني")).toHaveValue(
      "ahmad@example.com",
    )

    await page.getByRole("button", { name: "رجوع" }).click()
    await expect(page.getByLabel("الاسم الشخصي")).toHaveValue("أحمد")
    await expect(page.getByTestId("signup-step-indicator")).toHaveText(
      "الخطوة 1 من 4",
    )
  })

  test("API email rejection sends the user back to the email step", async ({
    page,
  }) => {
    await page.route("**/api/v1/users/signup", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          detail: [
            {
              loc: ["body", "email"],
              msg: "value is not a valid email address: The part after the @-sign is a special-use or reserved name that cannot be used with email.",
              type: "value_error",
            },
          ],
        }),
      })
    })

    await reachPasswordStep(page, "ahmad@example.com")
    await page.getByRole("button", { name: "إنشاء الحساب" }).click()

    await expect(
      page.getByText(
        "هذا البريد غير مقبول، الرجاء استخدام بريدك الإلكتروني الحقيقي",
      ),
    ).toBeVisible()
    await expect(page.getByLabel("البريد الإلكتروني")).toHaveValue(
      "ahmad@example.com",
    )
  })

  test("successful signup signs in and redirects home", async ({ page }) => {
    await page.route("**/api/v1/users/signup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "u1", email: "ahmad@example.com" }),
      })
    })
    await page.route("**/api/v1/login/access-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "test-token",
          token_type: "bearer",
        }),
      })
    })
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "u1",
          email: "ahmad@example.com",
          first_name: "أحمد",
        }),
      })
    })

    await reachPasswordStep(page, "ahmad@example.com")
    await page.getByRole("button", { name: "إنشاء الحساب" }).click()

    await page.waitForURL("/", { timeout: 10000 })
    expect(
      await page.evaluate(() => localStorage.getItem("access_token")),
    ).toBe("test-token")
  })
})
