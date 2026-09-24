import { test, expect } from '@playwright/test';

test('Login flow and redirect to dashboard', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');

    // 2. Fill login form
    // Using Mock Auth triggers (admin@example.com)
    await page.fill('input[id="email"]', 'admin@hr-connect.com');
    await page.fill('input[type="password"]', 'Admin#K9x$2P!w9a');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // 5. Verify dashboard content
    // 5. Verify dashboard content
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
});
