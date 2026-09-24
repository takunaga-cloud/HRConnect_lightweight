import { test, expect } from '@playwright/test';

test.describe('Database Connection and Display Verification', () => {
    test.beforeEach(async ({ page }) => {
        // 1. 管理者としてログイン
        await page.goto('/login');
        await page.fill('input[id="email"]', 'admin@hr-connect.com');
        await page.fill('input[type="password"]', 'Admin#K9x$2P!w9a');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Verify departments are correctly loaded from DB', async ({ page }) => {
        // 2. 部門（部署）管理画面へ遷移
        await page.goto('/departments');
        await expect(page).toHaveURL('/departments');

        // 3. SQLiteから同期された部署名が正しく表示されているか検証
        // デフォルトシードに含まれる「開発部」「営業部」「人事部」「総務部」などをチェック
        const devDept = page.locator('table');
        await expect(devDept).toContainText('開発部');
        await expect(devDept).toContainText('営業部');
        await expect(devDept).toContainText('人事部');
        await expect(devDept).toContainText('総務部');
    });

    test('Verify users are correctly loaded from DB', async ({ page }) => {
        // 4. ユーザー管理画面へ遷移
        await page.goto('/users');
        await expect(page).toHaveURL('/users');

        // 5. 同期されたユーザー名とメールアドレスが正しく表示されているか検証
        const userTable = page.locator('table');
        await expect(userTable).toContainText('開発 一郎');
        await expect(userTable).toContainText('user1@hr-connect.com');
        await expect(userTable).toContainText('部長 次郎');
        await expect(userTable).toContainText('manager@hr-connect.com');
        await expect(userTable).toContainText('管理 太郎');
        await expect(userTable).toContainText('admin@hr-connect.com');
    });
});
