import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        if (!sessionStorage.getItem('savanna-test-started')) {
            localStorage.clear();
            sessionStorage.setItem('savanna-test-started', 'true');
        }
    });
});

test('traveller can filter routes and start an editable My Safari plan', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/#route-explorer', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('#route-explorer');

    await expect(explorer.getByRole('heading', { name: 'Route Explorer' })).toBeVisible();
    await expect(explorer.locator('.route-explorer-card')).toHaveCount(19);
    await expect(explorer.locator('#route-explorer-count')).toHaveText('19 routes');

    await explorer.locator('#route-filter-country').selectOption('botswana');
    await expect(explorer.locator('.route-explorer-card')).toHaveCount(2);
    await explorer.locator('.route-explorer-card').filter({ hasText: 'Okavango to Chobe Expedition' }).getByRole('link', { name: 'Explore route' }).click();
    await expect(page).toHaveURL(/\/routes\/botswana-okavango-chobe$/);
    await expect(explorer.locator('#route-explorer-detail').getByRole('heading', { name: 'Okavango to Chobe Expedition' })).toBeVisible();
    await expect(explorer.locator('.route-detail-stops li')).toHaveCount(6);

    await explorer.getByLabel('Optional start date').fill('2026-10-03');
    await explorer.getByRole('button', { name: 'Start in My Safari' }).click();
    await expect(page).toHaveURL(/\/my-safari$/);

    const safari = page.locator('#hub-my-safari');
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Okavango to Chobe Expedition');
    await expect(safari.locator('#my-safari-active-meta')).toContainText('Oct 3, 2026');
    await expect(safari.locator('#my-safari-route-builder .route-day')).toHaveCount(10);
    await expect(safari.locator('#my-safari-route-builder').getByText('Maun', { exact: true })).toBeVisible();
    const firstDrive = safari.locator('.route-stop').filter({ hasText: 'Drive: Maun → Moremi Game Reserve' });
    await expect(firstDrive).toBeVisible();
    await expect(firstDrive).toContainText('distance and time withheld until the route is confirmed');
    await expect(firstDrive).toContainText('Fuel plan: Maun');
});

test('dedicated route URL restores its route and metadata', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/routes/namibia-four-rivers-wetlands', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('#route-explorer');

    await expect(explorer.locator('#route-explorer-detail').getByRole('heading', { name: 'Four Rivers Wetlands Route' })).toBeVisible();
    await expect(explorer.locator('#route-filter-country')).toHaveValue('all');
    await expect(explorer.locator('.route-detail-stops li')).toHaveCount(6);
    await expect(page).toHaveTitle(/Four Rivers Wetlands Route Road Trip/);
    await expect(page.locator('#canonical-link')).toHaveAttribute('href', /\/routes\/namibia-four-rivers-wetlands$/);
    await expect(explorer.locator('#route-logistics-title')).toHaveText('Drive legs and fuel readiness');
    await expect(explorer.locator('.route-logistics__legs li')).toHaveCount(5);
    await expect(explorer.locator('[data-route-print]')).toBeVisible();
    await expect(explorer.locator('.route-logistics__field-notes')).toContainText('Fuel and supplies');
    await expect(explorer.locator('.route-logistics__field-notes')).toContainText('Nkasa Rupara requires a 4×4');
    await expect(explorer.locator('.route-detail-share .share-bar')).toHaveAttribute('data-share-url', /\/routes\/namibia-four-rivers-wetlands\?/);
    await expect(page.locator('#seo-prerender')).toHaveCount(0);
});

test('traveller can compare routes and choose one for My Safari', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/routes', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('#route-explorer');
    await expect(explorer.locator('.route-explorer-card')).toHaveCount(19);

    const namibia = explorer.locator('.route-explorer-card').filter({ hasText: 'Namibia Essentials' });
    const gardenRoute = explorer.locator('.route-explorer-card').filter({ hasText: 'Cape Town and Garden Route' });
    await namibia.getByRole('button', { name: 'Compare' }).click();
    await gardenRoute.getByRole('button', { name: 'Compare' }).click();

    const tray = explorer.locator('#route-compare-tray');
    await expect(tray).toBeVisible();
    await expect(tray.locator('#route-compare-chips button')).toHaveCount(2);
    await tray.getByRole('button', { name: 'Compare selected' }).click();

    const comparison = explorer.locator('#route-comparison');
    await expect(comparison).toBeVisible();
    await expect(comparison.getByRole('heading', { name: 'Which route fits your trip?' })).toBeVisible();
    await expect(comparison.getByRole('rowheader', { name: 'Relative cost planning' })).toBeVisible();
    await expect(comparison.getByText('Namibia Essentials', { exact: true })).toBeVisible();
    await expect(comparison.getByText('Cape Town and Garden Route', { exact: true })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(explorer.locator('#route-compare-chips button')).toHaveCount(2);
    await explorer.locator('#route-compare-open').click();
    await explorer.locator('#route-comparison').getByRole('button', { name: 'Start in My Safari' }).nth(1).click();
    await expect(page).toHaveURL(/\/my-safari$/);
    await expect(page.locator('#my-safari-active-name')).toHaveText('Cape Town and Garden Route');
});

test('route matcher recommends explainable journeys and prepares a comparison', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/routes', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('#route-explorer');
    const matcher = explorer.locator('.route-matcher');

    await matcher.getByLabel('Preferred country').selectOption('namibia');
    await matcher.getByLabel('Days available').fill('12');
    await matcher.getByLabel('Driving comfort').selectOption('suv');
    await matcher.getByLabel('Main interest').selectOption('landscapes');
    await matcher.getByRole('button', { name: 'Find my routes' }).click();

    const recommendations = matcher.locator('.route-match-card');
    await expect(recommendations).toHaveCount(3);
    await expect(recommendations.first()).toContainText('Fits your 12-day window');
    await expect(recommendations.first()).toContainText('Strong landscapes fit');
    await expect(recommendations.first()).toContainText('Namibia');

    const accessibility = await new AxeBuilder({ page })
        .include('.route-matcher')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);

    await matcher.getByRole('button', { name: 'Compare these routes' }).click();
    await expect(explorer.locator('#route-comparison')).toBeVisible();
    await expect(explorer.locator('#route-comparison [data-compare-start]')).toHaveCount(3);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(matcher.locator('.route-match-card')).toHaveCount(3);
    await expect(matcher.getByLabel('Preferred country')).toHaveValue('namibia');
    await expect(matcher.getByLabel('Days available')).toHaveValue('12');
});

test('multi-country builder creates a connected editable My Safari itinerary', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/routes', { waitUntil: 'domcontentloaded' });
    const builder = page.locator('#journey-composer');
    await expect(builder.getByRole('heading', { name: 'Turn several routes into one workable trip' })).toBeVisible();

    await builder.getByLabel('Namibia').check();
    await builder.getByLabel('Botswana').check();
    await builder.getByLabel('Days available').fill('22');
    await builder.getByLabel('Driving comfort').selectOption('4x4');
    await builder.getByLabel('Main interest').selectOption('wildlife');
    await builder.getByLabel('Start date').fill('2026-10-01');
    await builder.getByRole('button', { name: 'Build my journey' }).click();

    const results = builder.locator('#journey-composer-results');
    await expect(results).toContainText('Namibia');
    await expect(results).toContainText('Botswana');
    await expect(results.getByText('22 days')).toBeVisible();
    await expect(results.locator('.journey-step--route')).toHaveCount(2);
    await expect(results.locator('.journey-step--border')).toHaveCount(1);

    const accessibility = await new AxeBuilder({ page })
        .include('#journey-composer')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);

    await results.getByRole('button', { name: 'Save to My Safari' }).click();
    await expect(page).toHaveURL(/\/my-safari$/);
    await expect(page.locator('#my-safari-active-name')).toContainText('Namibia · Botswana journey');

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('se_my_safari_v1')));
    expect(saved.trips).toHaveLength(1);
    expect(saved.trips[0].templateRouteId).toMatch(/^journey:/);
    expect(saved.trips[0].countries).toEqual(['Namibia', 'Botswana']);
    expect(saved.trips[0].routeDays).toHaveLength(22);
    expect(saved.trips[0].routeDays.some(day => day.stops.some(stop => stop.type === 'border'))).toBe(true);
});

test('Route Explorer has no serious accessibility violations', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/#route-explorer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#route-explorer .route-explorer-card')).toHaveCount(19, { timeout: 30_000 });

    const results = await new AxeBuilder({ page })
        .include('#route-explorer')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});
