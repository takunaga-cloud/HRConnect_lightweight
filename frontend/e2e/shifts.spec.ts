
import { test, expect } from '@playwright/test';

test.describe('Admin Shift Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[id="email"]', 'admin@hr-connect.com');
        await page.fill('input[type="password"]', 'Admin#K9x$2P!w9a');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Navigate to Shift Management and verify elements', async ({ page }) => {
        // 1. Navigate to Shifts page
        await page.goto('/shifts');

        // 2. Verify URL
        await expect(page).toHaveURL('/shifts');

        // 3. Verify content
        // Check for "一括削除" button which should be present
        await expect(page.getByRole('button', { name: '一括削除' })).toBeVisible();
    });
});
