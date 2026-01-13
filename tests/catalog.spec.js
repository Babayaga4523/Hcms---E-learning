const { test, expect } = require('@playwright/test');

test.describe('Catalog search & enroll', () => {
  test('shows search results and pagination', async ({ page }) => {
    await page.route('**/api/user/trainings**', route => {
      const url = route.request().url();
      if (url.includes('search=test')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [{ id: 101, title: 'Test Training', description: 'desc', duration: '1 jam', enrolled_count: 10, rating: 4.5, instructor: 'Tester' }], meta: { last_page: 2 } })
        });
      }
      return route.continue();
    });

    await page.goto('/catalog');
    await page.fill('input[placeholder="Cari training berdasarkan judul atau deskripsi..."]', 'test');
    // wait for the mocked result to appear
    await expect(page.locator('text=Test Training')).toBeVisible();
    await expect(page.locator('text=Halaman 1 dari 2')).toBeVisible();
  });

  test('clear button clears input and results', async ({ page }) => {
    await page.goto('/catalog');
    await page.fill('input[placeholder="Cari training berdasarkan judul atau deskripsi..."]', 'abc');
    // Manually set searchResults by triggering fetch route
    await page.route('**/api/user/trainings**', route => {
      const url = route.request().url();
      if (url.includes('search=abc')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      return route.continue();
    });
    // wait briefly for debounce
    await page.waitForTimeout(600);

    // Clear button should appear
    await page.click('button:has(svg >> css:svg)');
    // input should be empty
    await expect(page.locator('input[placeholder="Cari training berdasarkan judul atau deskripsi..."]')).toHaveValue('');
  });

  test('enroll failure shows toast', async ({ page }) => {
    await page.route('**/api/user/trainings**', route => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 202, title: 'FailEnroll', description: '', duration: '1 jam', enrolled_count: 0, rating: 4.0, instructor: 'X' }], meta: { last_page: 1 } }) });
    });

    await page.goto('/catalog');
    // wait for data
    await expect(page.locator('text=FailEnroll')).toBeVisible();

    // Intercept enroll POST to return 500
    await page.route('**/api/training/202/start', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) }));

    // Click enroll button inside the card
    const card = page.locator('text=FailEnroll').locator('..').locator('..');
    await card.locator('button:has-text("Daftar Sekarang")').click();

    // Expect toast error (server message should be displayed)
    await expect(page.locator('text=Server error')).toBeVisible();
  });

  test('completed trainings show review link', async ({ page }) => {
    await page.route('**/api/user/trainings**', route => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 303, title: 'CompletedCourse', enrollment_status: 'completed', progress: 100 }], meta: { last_page: 1 } }) });
    });

    await page.goto('/catalog');
    await expect(page.locator('text=CompletedCourse')).toBeVisible();
    // Ensure Review Hasil button is visible and links to training detail
    const entry = page.locator('text=CompletedCourse').locator('..').locator('..');
    await expect(entry.locator('text=Review Hasil')).toBeVisible();
    // Click link and assert navigation
    await entry.locator('a:has-text("Review Hasil")').click();
    await expect(page).toHaveURL(/\/training\/303/);
  });
});
