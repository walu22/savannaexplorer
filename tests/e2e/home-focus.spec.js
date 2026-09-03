import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
});

test('homepage presents a short route-first journey without horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/home-focused/);
    await expect(page.getByRole('heading', { name: /Plan your Southern Africa journey/i })).toBeVisible();
    await expect(page.locator('#route-explorer')).toBeVisible();
    await expect(page.locator('#destinations')).toBeVisible();
    await expect(page.locator('.facts-section')).toBeHidden();

    const layout = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
    }));
    expect(layout.height).toBeLessThan(12_000);
    expect(layout.width).toBeLessThanOrEqual(layout.viewport + 1);
});

test('Route Explorer has a focused public page below the fixed navigation', async ({ page }) => {
    await page.goto('/routes', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('#route-explorer');
    await expect(page.locator('body')).toHaveClass(/home-section-focus/);
    await expect(page.locator('#home')).toBeHidden();
    await expect(explorer.getByRole('heading', { name: 'Route Explorer' })).toBeVisible();
    await expect(explorer.locator('.route-explorer-card')).toHaveCount(19);

    const positions = await page.evaluate(() => ({
        sectionTop: document.querySelector('#route-explorer').getBoundingClientRect().top,
        navBottom: document.querySelector('#navbar').getBoundingClientRect().bottom,
    }));
    expect(positions.sectionTop).toBeGreaterThanOrEqual(positions.navBottom - 1);
});

test('My Safari opens as a focused workspace', async ({ page }) => {
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/home-section-focus--my-safari/);
    await expect(page.locator('#home')).toBeHidden();
    await expect(page.locator('#hub-my-safari')).toBeVisible();

    const visibleHubCards = await page.locator('#plan .hub-card').evaluateAll(cards =>
        cards.filter(card => getComputedStyle(card).display !== 'none').length,
    );
    expect(visibleHubCards).toBe(1);
});

test('mobile country guide fits the viewport and starts at the top', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile layout check');
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/country-detail-open/);
    await expect(page.locator('#country-page-header')).toBeVisible();

    const layout = await page.evaluate(() => {
        const heroText = document.querySelector('.detail-hero-text').getBoundingClientRect();
        const header = document.querySelector('#country-page-header').getBoundingClientRect();
        return {
            headerTop: header.top,
            heroLeft: heroText.left,
            width: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
            navDisplay: getComputedStyle(document.querySelector('#navbar')).display,
        };
    });
    expect(layout.headerTop).toBeLessThanOrEqual(1);
    expect(layout.heroLeft).toBeGreaterThanOrEqual(16);
    expect(layout.width).toBeLessThanOrEqual(layout.viewport + 1);
    expect(layout.navDisplay).toBe('none');
});

test('focused homepage has no serious accessibility violations', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/home-focused/);

    const results = await new AxeBuilder({ page })
        .include('#home')
        .include('#main-content')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});
