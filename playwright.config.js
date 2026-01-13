/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: 'tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 800 }
  }
};

// ESM-friendly export
export default config;
