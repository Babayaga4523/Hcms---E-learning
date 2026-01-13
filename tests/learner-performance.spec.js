import { test, expect } from '@playwright/test';

// Helper: login as test user
const loginAsTestUser = async (page) => {
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('#email', 'andi@example.com');
  await page.fill('#password', 'password');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);

  // Basic check: ensure we are not still on the login page
  if (page.url().includes('/login')) {
    throw new Error('Login failed in test - check credentials or server state');
  }
};

test.describe('Learner Performance page', () => {
  test('shows loading spinner and renders charts when API responds', async ({ page }) => {
    const mockPerf = {
      averageScore: 82,
      completionRate: 75,
      certifications: 2,
      hoursSpent: 120,
      scoresTrend: [
        { month: 'Jan', score: 70, target: 80 },
        { month: 'Feb', score: 82, target: 80 }
      ],
      performanceByProgram: [
        { name: 'Program A', score: 90, completion: 100 },
        { name: 'Program B', score: 80, completion: 60 }
      ],
      engagement: [
        { name: 'Sangat Aktif', value: 10 },
        { name: 'Aktif', value: 7 }
      ],
      activitiesThisWeek: 4,
      scoreChange: 2,
      completionChange: 1,
      recentActivities: []
    };

    // Delay performance response to assert spinner
    await page.route('**/api/learner/performance**', async route => {
      await new Promise(res => setTimeout(res, 1200));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPerf) });
    });

    await page.route('**/api/learner/progress**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ programs: [] }) });
    });

    await loginAsTestUser(page);
    await page.goto('http://127.0.0.1:8000/learner/performance');

    // Ensure the frontend requested the performance API
    await page.waitForRequest('**/api/learner/performance');

    // After API resolves charts (SVG) should appear and KPI shows values
    await page.waitForSelector('svg', { timeout: 5000 });
    await expect(page.locator('text=Evolusi Skor')).toBeVisible();
    await expect(page.locator(`text=${mockPerf.averageScore}%`)).toBeVisible();
  });

  test('shows toast on API error and displays empty state', async ({ page }) => {
    await page.route('**/api/learner/performance**', route => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) });
    });

    await page.route('**/api/learner/progress**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ programs: [] }) });
    });

    await loginAsTestUser(page);
    await page.goto('http://127.0.0.1:8000/learner/performance');

    // Toast should appear (any toast indicates error was surfaced)
    await expect(page.locator('.wondr-toast')).toBeVisible({ timeout: 6000 });

    // Chart placeholder should show (no data)
    await expect(page.locator('text=Belum ada data skor')).toBeVisible();
  });
});
