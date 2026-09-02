import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        if (sessionStorage.getItem('my-safari-test-ready')) return;
        localStorage.clear();
        sessionStorage.setItem('my-safari-test-ready', 'true');
    });
});

test('My Safari keeps expenses and packing progress with the selected trip', async ({ page }) => {
    await page.goto('/#hub-my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    await expect(safari.getByRole('heading', { name: 'My Safari' })).toBeVisible();

    await safari.getByLabel('Trip name').fill('Botswana adventure');
    await safari.getByLabel('Botswana').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Botswana adventure');

    const expenses = page.locator('#hub-expense-tracker');
    await expenses.locator('#expense-amount').fill('120');
    await expenses.locator('#expense-note').fill('Camp deposit');
    await expenses.getByRole('button', { name: 'Add expense' }).click();
    await expect(expenses.locator('.expense-row')).toHaveCount(1);

    const packing = page.locator('#packing-list');
    await packing.locator('.packing-item').first().click();
    await expect(safari.locator('#my-safari-packing-count')).toHaveText('1 packed');

    await safari.getByLabel('Trip name').fill('Zambia escape');
    await safari.getByLabel('Zambia').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Zambia escape');
    await expect(safari.locator('#my-safari-expense-count')).toHaveText('0 items');
    await expect(safari.locator('#my-safari-packing-count')).toHaveText('0 packed');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(safari.locator('.my-safari-trip-card')).toHaveCount(2);
    await safari.getByRole('button', { name: /Botswana adventure/ }).click();
    await expect(safari.locator('#my-safari-expense-count')).toHaveText('1 item');
    await expect(safari.locator('#my-safari-packing-count')).toHaveText('1 packed');
    await expect(expenses.locator('.expense-row')).toHaveCount(1);
});

test('My Safari has no serious accessibility violations', async ({ page }) => {
    await page.goto('/#hub-my-safari', { waitUntil: 'domcontentloaded' });
    const results = await new AxeBuilder({ page })
        .include('#hub-my-safari')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});
