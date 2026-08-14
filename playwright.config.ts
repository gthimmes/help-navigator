import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node demo/serve.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  reporter: [['list']],
});
