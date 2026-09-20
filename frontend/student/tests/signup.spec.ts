import { expect, test } from "@playwright/test"

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
