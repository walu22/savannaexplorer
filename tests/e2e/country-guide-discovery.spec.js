import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const countries = [
    'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe',
    'mozambique', 'malawi', 'lesotho', 'eswatini',
];

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
});

test('every country guide exposes concise discovery and seasonal guidance', async ({ page, isMobile }) => {
    test.setTimeout(240_000);
    const guidesToCheck = isMobile ? ['namibia', 'south-africa', 'eswatini'] : countries;
    for (const countryId of guidesToCheck) {
        await page.goto(`/countries/${countryId}`, { waitUntil: 'domcontentloaded' });
        const guide = page.locator('#country-detail-view');
        await expect(guide.locator('#detail-highlights .highlight-chip')).toHaveCount(5);
        await expect(guide.locator('.spot-detail-card')).not.toHaveCount(0);
        expect(await guide.locator('.spot-detail-card').evaluateAll(cards =>
            cards.every(card => card.querySelectorAll('.spot-tags span').length >= 1),
        )).toBe(true);
        await expect(guide.locator('.read-more-toggle').first()).toHaveAttribute('aria-expanded', 'false');

        await guide.getByRole('button', { name: /Travelling/ }).click();
        await expect(guide.locator('#detail-best-time .best-time-card')).toHaveCount(4 + (countryId === 'south-africa' ? 1 : 0));
        await expect(guide.locator('#detail-best-time')).toBeVisible();

        const layout = await page.evaluate(() => ({
            width: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
        }));
        expect(layout.width).toBeLessThanOrEqual(layout.viewport + 1);
    }
});

test('country article previews expand accessibly', async ({ page }) => {
    await page.goto('/countries/south-africa', { waitUntil: 'domcontentloaded' });
    const firstToggle = page.locator('#panel-about .read-more-toggle').first();
    const controlledId = await firstToggle.getAttribute('aria-controls');
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`#${controlledId}`)).toHaveClass(/expanded/);

    const results = await new AxeBuilder({ page })
        .include('#country-detail-view')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});
