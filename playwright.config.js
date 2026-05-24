const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  webServer: {
    command: 'python -m http.server 8000',
    port: 8000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://127.0.0.1:8000',
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 10000,
    navigationTimeout: 15000,
    video: 'retry-with-video',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});
