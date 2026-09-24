import { test, expect } from '@playwright/test';

test.describe('Employee Leave Application Flow', () => {
    test.beforeEach(async ({ page }) => {
        // ログイン処理
        await page.goto('/login');
        await page.fill('input[id="email"]', 'user1@hr-connect.com');
        await page.fill('input[type="password"]', 'User@7m*qR8#tN4');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Submit a paid leave application', async ({ page }) => {
        // 1. 申請ページに遷移
        await page.goto('/applications');
        await expect(page).toHaveURL('/applications');

        // 2. 申請タイプを選択
        // 有給休暇申請を選択
        await page.click('button:has-text("タイプを選択")');
        await page.click('role=option[name="有給休暇申請"]');

        // 動的フォームで「種別*」ドロップダウンが表示されている場合は選択する
        const typeSelect = page.getByRole('combobox', { name: '種別*' }).or(page.locator('button:has-text("選択してください")'));
        if (await typeSelect.count() > 0 && await typeSelect.first().isVisible()) {
            await typeSelect.first().click();
            // 選択肢要素がDOMに表示されるのを明示的に待機してからクリック
            const option = page.locator('[role="option"]').first();
            await option.waitFor({ state: 'visible', timeout: 5000 });
            await option.click();
        }

        // 3. 開始日・終了日等を入力
        // 週末等の公休日チェックをパスするため、通常シフトがある未来の日付を設定
        // 例えば 2026/06/09 (火) などの日付を設定する（公休回避）
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7); // 1週間後
        // もし週末だったら月曜日に調整する
        if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);

        // YYYY/MM/DD フォーマットに変換
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        const targetDateStr = `${yyyy}/${mm}/${dd}`;

        // フォーム内の「開始日」「終了日」を入力（Legacy IDと動的フォームのLabelの両方に対応）
        const startInput = page.locator('input[id="start"]').or(page.getByLabel('開始日*'));
        const endInput = page.locator('input[id="end"]').or(page.getByLabel('終了日*'));
        await startInput.first().fill(targetDateStr);
        await endInput.first().fill(targetDateStr);

        // 理由の入力
        await page.fill('textarea[id="reason"]', 'E2Eテストによる有給休暇申請理由');

        // 申請ボタンクリック
        await page.click('button[type="submit"]:has-text("申請する")');

        // 完了メッセージの確認
        await expect(page.locator('text=申請が完了しました！')).toBeVisible({ timeout: 10000 });

        // 申請履歴の一覧に「有給休暇」かつ「承認待ち」のレコードがあることを確認
        await expect(page.locator('table')).toContainText('有給休暇');
        await expect(page.locator('table')).toContainText('承認待ち');
    });
});
