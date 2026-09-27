import { expect, test } from "@playwright/test"

const API = process.env.VITE_API_URL ?? "http://localhost:8000"

test("profile shows the student's full name and email", async ({
  page,
  request,
}) => {
  const stamp = `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
  const email = `ui.profile.${stamp}@example.com`
  const password = "Password1!"

  const signup = await request.post(`${API}/api/v1/users/signup`, {
    data: {
      email,
      password,
      first_name: "عائشة",
      father_name: "عبدالله",
      family_name: "السبيعي",
      is_male: false,
    },
  })
  expect(signup.ok()).toBeTruthy()

  const login = await request.post(`${API}/api/v1/login/access-token`, {
    form: { username: email, password },
  })
  expect(login.ok()).toBeTruthy()
  const { access_token } = (await login.json()) as { access_token: string }

  await page.goto("/welcome")
  await page.evaluate(
    ({ token, email }) => {
      localStorage.setItem("access_token", token)
      localStorage.setItem(
        "student_profile",
        JSON.stringify({ email, first_name: "عائشة" }),
      )
    },
    { token: access_token, email },
  )

  await page.goto("/profile")
  await expect(page.getByTestId("profile-name")).toHaveText(
    "عائشة عبدالله السبيعي",
  )
  await expect(page.getByTestId("profile-email")).toHaveText(email)
})
