import { expect, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

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

  test("an invalid token signs the student out and goes to /welcome", async ({
    page,
  }) => {
    await page.goto("/welcome")
    await page.evaluate(() => {
      localStorage.setItem("access_token", "invalid_token")
      localStorage.setItem(
        "student_profile",
        JSON.stringify({ email: "x@example.com" }),
      )
    })

    // Home calls GET /users/me, which answers 403 "Could not validate credentials".
    await page.goto("/")
    await page.waitForURL("/welcome", { timeout: 15000 })

    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
  })

  test("a permission 403 on one resource keeps the student signed in", async ({
    page,
  }) => {
    const login = await page.request.post(`${API}/api/v1/login/access-token`, {
      form: { username: "student@example.com", password: "Student123!" },
    })
    expect(login.ok()).toBeTruthy()
    const { access_token } = (await login.json()) as { access_token: string }

    await page.route(/\/api\/v1\/programs\/\?/, (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "The user doesn't have enough privileges",
        }),
      }),
    )

    await page.goto("/welcome")
    await page.evaluate(
      (token) => localStorage.setItem("access_token", token),
      access_token,
    )
    await page.goto("/programs")

    // React Query retries three times before surfacing the error.
    await expect(page.getByText("تعذر تحميل البرامج.")).toBeVisible({
      timeout: 15_000,
    })
    await expect(page).toHaveURL(/\/programs\/?$/)
    expect(
      await page.evaluate(() => localStorage.getItem("access_token")),
    ).toBe(access_token)
  })
})
