import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  globalSetup: "./test/global-setup.js",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
