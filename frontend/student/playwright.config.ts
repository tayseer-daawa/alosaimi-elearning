import { defineConfig, devices } from "@playwright/test"
import "dotenv/config"

/**
 * Student app Playwright config.
 * Dev server runs on 5174 (admin is 5173).
 *
 * First specs cover public/unauthenticated flows only — no auth setup project yet.
 * When authenticated suites are added, reintroduce a setup project + storageState
 * the same way frontend/admin does.
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "blob" : "html",
	use: {
		baseURL: "http://localhost:5174",
		trace: "on-first-retry",
		locale: "ar",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Public specs start logged out
				storageState: { cookies: [], origins: [] },
			},
		},
		// {
		//   name: 'firefox',
		//   use: {
		//     ...devices['Desktop Firefox'],
		//     storageState: 'playwright/.auth/user.json',
		//   },
		//   dependencies: ['setup'],
		// },

		// {
		//   name: 'webkit',
		//   use: {
		//     ...devices['Desktop Safari'],
		//     storageState: 'playwright/.auth/user.json',
		//   },
		//   dependencies: ['setup'],
		// },

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],
	/* Run your local dev server before starting the tests */
	webServer: {
		command: "npm run dev",
		url: "http://localhost:5174",
		reuseExistingServer: !process.env.CI,
	},
});
