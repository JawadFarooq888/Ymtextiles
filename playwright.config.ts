import { defineConfig, devices } from "@playwright/test";

// Load .env for local runs (admin credentials for the tests). CI sets real env vars instead.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env file: rely on the environment
}

const PORT = Number(process.env.E2E_PORT ?? 3123);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 25_000 },
  fullyParallel: false,
  // One worker: the Neon free tier has few connections and is slow to wake up.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    // Cookie choice already made, so the banner does not cover buttons (it has its own test).
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [
            {
              name: "ym-consent",
              value: JSON.stringify({
                state: { choice: "rejected", decidedAt: "2026-01-01T00:00:00.000Z" },
                version: 1,
              }),
            },
          ],
        },
      ],
    },
    trace: "retain-on-failure",
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  // Runs against a production build. Run `npm run build` first.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
