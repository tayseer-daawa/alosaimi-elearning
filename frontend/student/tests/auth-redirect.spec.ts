import { expect, test } from "@playwright/test"

test.describe("auth redirects", () => {
  test("unauthenticated user hitting / is sent to /welcome", async ({
    page,
  }) => {
    await page.goto("/")
    await page.waitForURL("/welcome")
    await expect(page).toHaveURL("/welcome")
  })

  test("unauthenticated user hitting /programs is sent to /welcome", async ({
    page,
  }) => {
    await page.goto("/programs")
    await page.waitForURL("/welcome")
    await expect(page).toHaveURL("/welcome")
  })

  test("invalid token + authenticated API 401/403 clears session and goes to /welcome", async ({
    page,
  }) => {
    // Land on a protected shell so a later 401 redirects off public auth pages
    await page.goto("/welcome")
    await page.evaluate(() => {
      localStorage.setItem("access_token", "invalid_token")
      localStorage.setItem(
        "student_profile",
        JSON.stringify({ email: "x@example.com" }),
      )
    })
    // Token presence bounces /welcome → /
    await page.goto("/welcome")
    await page.waitForURL("/")

    // Call through the app OpenAPI client so the response interceptor runs
    await Promise.all([
      page.waitForURL("/welcome", { timeout: 15000 }),
      page.evaluate(async () => {
        const { UsersService } = await import("/src/client/index.ts")
        try {
          await UsersService.readUserMe()
        } catch {
          // expected — interceptor should clear + redirect
        }
      }),
    ])

    await expect(page).toHaveURL("/welcome")
    const token = await page.evaluate(() => localStorage.getItem("access_token"))
    const profile = await page.evaluate(() =>
      localStorage.getItem("student_profile"),
    )
    expect(token).toBeNull()
    expect(profile).toBeNull()
  })
})
