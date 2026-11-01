import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    viewport: { width: 375, height: 800 },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321/Claudy/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
