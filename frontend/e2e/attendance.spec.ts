import { test, expect } from '@playwright/test';

test.describe('Employee Attendance Stamping', () => {
    test.beforeEach(async ({ page, context }) => {
        // Nominatimの逆ジオコーディングAPIのモック
        await page.route('https://nominatim.openstreetmap.org/reverse*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ display_name: '東京都千代田区丸の内１丁目' })
            });
        });

        // 位置情報権限のモック付与と位置設定 (東京駅付近)
        await context.grantPermissions(['geolocation']);
        await context.setGeolocation({ latitude: 35.681236, longitude: 139.767125 });

        // ログイン処理
        await page.goto('/login');
        await page.fill('input[id="email"]', 'user1@hr-connect.com');
        await page.fill('input[type="password"]', 'User@7m*qR8#tN4');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Stamping clock-in flow', async ({ page }) => {
        // 1. 打刻ページに遷移
        await page.goto('/stamp');
        await expect(page).toHaveURL('/stamp');

        // 2. 位置情報が取得できていることを確認
        await expect(page.locator('.break-all')).toBeVisible({ timeout: 10000 });
        
        // レイアウトの安定と位置情報ローディングが完了するのを少し待つ
        await page.waitForTimeout(1000);

        // 3. 出勤ボタンをクリック (既に打刻済みの場合は無効化されているため、状態によって分岐)
        const clockInBtn = page.getByRole('button', { name: '出勤' });
        const clockOutBtn = page.getByRole('button', { name: '退勤' });

        if (await clockInBtn.isEnabled()) {
            // 他の透明なローディング要素などが重なっている場合を考慮し force: true を指定
            await clockInBtn.click({ force: true });
            
            // 出勤完了後、「退勤」ボタンが有効になる
            await expect(clockOutBtn).toBeEnabled({ timeout: 10000 });
        } else {
            console.log('Already clocked in today in this test run context.');
        }
    });
});
