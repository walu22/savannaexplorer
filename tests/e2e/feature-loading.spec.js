import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
});

function loadedFeatures(page) {
    return page.locator('html').getAttribute('data-loaded-features').then(value => value?.split(',') || []);
}

test('homepage loads only its visible interactive features', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-loaded-features', /routes/);
    await expect(page.locator('#destinations-grid .country-card')).toHaveCount(9);
    await expect(page.locator('#route-explorer .route-explorer-card')).toHaveCount(19);
    await expect(page.locator('#parks')).toHaveCount(0);

    const features = await loadedFeatures(page);
    expect(features).toEqual(['ai', 'chat', 'destinations', 'newsletter', 'routes']);
    expect(features).not.toContain('marketplace');
    expect(features).not.toContain('statistics');
});

test('standalone parks page contains and loads only the park experience', async ({ page }) => {
    await page.goto('/parks', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/home-section-focus/);
    await expect(page.locator('#parks-grid .park-card')).toHaveCount(27);
    await expect(page.locator('#route-explorer')).toHaveCount(0);
    expect(await loadedFeatures(page)).toEqual(['chat', 'parks']);
    await expect(page).toHaveTitle(/National Parks & Reserves/);
});

test('destination cards use real country pages and country guides still open', async ({ page }) => {
    await page.goto('/destinations', { waitUntil: 'domcontentloaded' });
    const namibia = page.locator('.country-card[data-country-id="namibia"]');
    await expect(namibia).toHaveAttribute('href', '/countries/namibia');
    await namibia.click();
    await expect(page).toHaveURL(/\/countries\/namibia$/);
    await expect(page.locator('body')).toHaveClass(/country-detail-open/);
    await expect(page.locator('#detail-title')).toHaveText('Namibia');
});

test('My Safari page loads its workspace without unrelated content', async ({ page }) => {
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#hub-my-safari')).toBeVisible();
    await expect(page.locator('#parks')).toHaveCount(0);
    expect(await loadedFeatures(page)).toEqual(['ai', 'chat', 'safari']);
});
