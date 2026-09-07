import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('global search finds trusted content and applies filters', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    const launcher = page.locator('[data-site-search-open]:visible').first();
    await launcher.click();

    const dialog = page.getByRole('dialog', { name: 'Search Savanna Explorer' });
    await expect(dialog).toBeVisible();
    const input = dialog.getByLabel('Search destinations, routes and travel guidance');
    await expect(input).toBeFocused();
    await input.fill('Kruger');
    await expect(dialog.getByRole('link', { name: 'Kruger National Park', exact: true }).first()).toBeVisible();
    await expect(dialog.getByText(/result.*for “Kruger”/)).toBeVisible();

    await dialog.getByRole('button', { name: 'Parks' }).click();
    await expect(dialog.locator('[data-search-result-type]')).toHaveCount(1);
    await expect(dialog.locator('[data-search-result-type="park"]')).toHaveCount(1);
    await dialog.getByLabel('Country').selectOption('south-africa');
    await expect(dialog.getByRole('link', { name: 'Kruger National Park', exact: true }).first()).toBeVisible();

    const accessibility = await new AxeBuilder({ page })
        .include('.site-search-dialog')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
});

test('a route can be added to My Safari directly from search', async ({ page }) => {
    await page.goto('/routes', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search Savanna Explorer' });
    await dialog.getByLabel('Search destinations, routes and travel guidance').fill('Namibia Essentials');
    const result = dialog.locator('[data-search-result-type="route"]').filter({ hasText: 'Namibia Essentials' }).first();
    await expect(result).toBeVisible();
    await result.getByRole('button', { name: 'My Safari' }).click();
    await expect(page).toHaveURL(/\/my-safari$/);

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('se_my_safari_v1')));
    expect(saved.trips).toHaveLength(1);
    expect(saved.trips[0].templateRouteId).toBe('namibia-essentials-extended');
    expect(saved.trips[0].routeDays).toHaveLength(10);
});
