import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const countries = [
    'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe',
    'mozambique', 'malawi', 'lesotho', 'eswatini',
];

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        if (!sessionStorage.getItem('savanna-country-guide-test-started')) {
            localStorage.clear();
            sessionStorage.setItem('savanna-country-guide-test-started', 'true');
        }
    });
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

test('country guides use the shared structured header and overview layout', async ({ page, isMobile }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    const header = guide.locator('#country-page-header');

    await expect(header.getByRole('button', { name: 'Savanna Explorer home' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Back to all destinations' })).toBeVisible();
    await expect(header.getByRole('link', { name: /My Safari/ })).toBeVisible();
    await expect(header.locator('.guide-tab')).toHaveCount(5);
    await expect(guide.locator('#detail-quick-facts .qf-item')).toHaveCount(10);
    await expect(guide.getByRole('heading', { name: 'Plan your trip to Namibia' })).toBeVisible();

    const layout = await page.evaluate(() => ({
        headerTop: document.querySelector('#country-page-header').getBoundingClientRect().top,
        overviewColumns: getComputedStyle(document.querySelector('.country-overview-grid')).gridTemplateColumns.split(' ').length,
        articleColumns: getComputedStyle(document.querySelector('#panel-about .guide-article-grid')).gridTemplateColumns.split(' ').length,
        width: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
    }));

    expect(layout.headerTop).toBeLessThanOrEqual(1);
    expect(layout.overviewColumns).toBe(isMobile ? 1 : 2);
    expect(layout.articleColumns).toBe(isMobile ? 1 : 2);
    expect(layout.width).toBeLessThanOrEqual(layout.viewport + 1);
});

test('Travelling is a responsive trip-planning dashboard', async ({ page, isMobile }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Travelling/ }).click();

    await expect(guide.getByRole('heading', { name: 'Plan your visit to Namibia' })).toBeVisible();
    await expect(guide.locator('.travel-jump-links a')).toHaveCount(4);
    await expect(guide.locator('.travel-planning-group')).toHaveCount(2);
    await expect(guide.locator('#travel-essentials .travel-info-card')).toHaveCount(7);
    await expect(guide.locator('#detail-packing li')).not.toHaveCount(0);
    await expect(guide.getByRole('button', { name: 'Add to My Safari' })).toBeVisible();

    const layout = await page.evaluate(() => ({
        planningColumns: getComputedStyle(document.querySelector('.travel-planning-groups')).gridTemplateColumns.split(' ').length,
        groundColumns: getComputedStyle(document.querySelector('.travel-ground-grid')).gridTemplateColumns.split(' ').length,
        width: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
    }));

    expect(layout.planningColumns).toBe(isMobile ? 1 : 2);
    expect(layout.groundColumns).toBe(isMobile ? 1 : 2);
    expect(layout.width).toBeLessThanOrEqual(layout.viewport + 1);

    const results = await new AxeBuilder({ page })
        .include('#panel-travelling')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});

test('country-level planner creates an editable My Safari trip', async ({ page }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Travelling/ }).click();
    await guide.getByRole('button', { name: 'Add to My Safari' }).click();

    await page.waitForURL('**/my-safari');
    await expect(page.locator('#my-safari-active-name')).toHaveText('Namibia safari');

    const trip = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('se_my_safari_v1') || '{}');
        return saved.trips?.find(item => item.name === 'Namibia safari');
    });
    expect(trip.countries).toEqual(['namibia']);
    expect(trip.notes).toContain('Namibia country guide');
});

test('Attractions supports regional discovery and interest filtering', async ({ page, isMobile }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Attractions/ }).click();

    await expect(guide.getByRole('heading', { name: 'Explore the essential places in Namibia' })).toBeVisible();
    await expect(guide.locator('#detail-attractions-count')).toHaveText('10');
    await expect(guide.locator('#detail-regions-count')).toHaveText('6');
    await expect(guide.locator('.spot-detail-card')).toHaveCount(10);
    await expect(guide.locator('[data-attraction-filter]')).not.toHaveCount(1);

    const columns = await guide.locator('#detail-spots-grid').evaluate(element =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(columns).toBe(isMobile ? 1 : 2);

    const interestFilter = guide.locator('[data-attraction-filter]').nth(1);
    await interestFilter.click();
    await expect(interestFilter).toHaveAttribute('aria-pressed', 'true');
    const visibleCards = guide.locator('.spot-detail-card:not([hidden])');
    expect(await visibleCards.count()).toBeGreaterThan(0);
    expect(await visibleCards.count()).toBeLessThan(10);

    const results = await new AxeBuilder({ page })
        .include('#panel-attractions')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});

test('an attraction can start a country trip and become an editable route stop', async ({ page }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Attractions/ }).click();

    const firstCard = guide.locator('.spot-detail-card').first();
    const attractionName = await firstCard.getByRole('heading').innerText();
    await firstCard.getByRole('button', { name: 'Add stop to My Safari' }).click();
    await expect(firstCard.getByRole('button', { name: 'In My Safari' })).toBeDisabled();
    await firstCard.getByRole('link', { name: 'Open trip' }).click();

    await page.waitForURL('**/my-safari');
    await expect(page.locator('#my-safari-active-name')).toHaveText('Namibia safari');
    await expect(page.locator('#my-safari-route-builder').getByText(attractionName, { exact: true })).toBeVisible();

    const trip = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('se_my_safari_v1') || '{}');
        return saved.trips?.find(item => item.name === 'Namibia safari');
    });
    expect(trip.countries).toEqual(['namibia']);
    expect(trip.routeDays[0].stops[0].name).toBe(attractionName);
});

test('Activities provides responsive experience discovery and filtering', async ({ page, isMobile }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Activities/ }).click();

    await expect(guide.getByRole('heading', { name: 'Find your signature experiences in Namibia' })).toBeVisible();
    await expect(guide.locator('#detail-activities-count')).toHaveText('8');
    await expect(guide.locator('#detail-activity-categories-count')).toHaveText('4');
    await expect(guide.locator('.activity-detail-card')).toHaveCount(8);
    await expect(guide.locator('.activity-cat-card')).toHaveCount(4);
    await expect(guide.locator('[data-activity-filter]')).not.toHaveCount(1);

    const columns = await guide.locator('#detail-activities').evaluate(element =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(columns).toBe(isMobile ? 1 : 2);

    const interestFilter = guide.locator('[data-activity-filter]').nth(1);
    await interestFilter.click();
    await expect(interestFilter).toHaveAttribute('aria-pressed', 'true');
    const visibleCards = guide.locator('.activity-detail-card:not([hidden])');
    expect(await visibleCards.count()).toBeGreaterThan(0);
    expect(await visibleCards.count()).toBeLessThan(8);

    const results = await new AxeBuilder({ page })
        .include('#panel-activities')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});

test('an activity can start a country trip and become an editable itinerary item', async ({ page }) => {
    await page.goto('/countries/namibia', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Activities/ }).click();

    const firstCard = guide.locator('.activity-detail-card').first();
    const activityName = await firstCard.getByRole('heading').innerText();
    await firstCard.getByRole('button', { name: 'Add activity to My Safari' }).click();
    await expect(firstCard.getByRole('button', { name: 'In My Safari' })).toBeDisabled();
    await firstCard.getByRole('link', { name: 'Open trip' }).click();

    await page.waitForURL('**/my-safari');
    await expect(page.locator('#my-safari-active-name')).toHaveText('Namibia safari');
    await expect(page.locator('#my-safari-route-builder').getByText(activityName, { exact: true })).toBeVisible();

    const trip = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('se_my_safari_v1') || '{}');
        return saved.trips?.find(item => item.name === 'Namibia safari');
    });
    expect(trip.countries).toEqual(['namibia']);
    expect(trip.routeDays[0].stops[0].type).toBe('activity');
    expect(trip.routeDays[0].stops[0].name).toBe(activityName);
});

test('South Africa region planner connects practical regions to destination cards', async ({ page, isMobile }) => {
    await page.goto('/countries/south-africa', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Attractions/ }).click();

    const regions = guide.locator('.region-card--detailed');
    await expect(regions).toHaveCount(5);
    const regionGrid = guide.locator('#detail-regions-grid');
    await expect(regionGrid).toHaveClass(/regions-grid--detailed/);
    const columnCount = await regionGrid.evaluate(element =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(columnCount).toBe(isMobile ? 1 : 2);
    await expect(regions.first().locator('.region-facts div')).toHaveCount(3);
    await expect(regions.first().locator('.region-source-link')).toHaveAttribute('href', /^https:\/\//);

    const targetLink = guide.getByRole('button', { name: 'Cradle of Humankind' });
    await targetLink.click();
    await expect(guide.locator('#country-spot-cradle-of-humankind')).toHaveClass(/spot-card--spotlight/);
    await expect(guide.locator('#country-spot-cradle-of-humankind')).toBeFocused();
});

test('country routes open the canonical route and start an editable My Safari plan', async ({ page }) => {
    await page.goto('/countries/south-africa', { waitUntil: 'domcontentloaded' });
    const guide = page.locator('#country-detail-view');
    await guide.getByRole('button', { name: /Routes/ }).click();

    const cards = guide.locator('.country-route-card');
    await expect(cards).toHaveCount(2);
    const gardenRoute = cards.filter({ hasText: 'Cape Town and Garden Route' });
    await expect(gardenRoute.locator('.country-route-days li')).toHaveCount(3);
    await expect(gardenRoute.getByRole('link', { name: 'View full route' })).toHaveAttribute('href', '/routes/south-africa-garden-route');

    await gardenRoute.getByRole('button', { name: 'Start in My Safari' }).click();
    await page.waitForURL('**/my-safari');
    const safari = page.locator('#hub-my-safari');
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Cape Town and Garden Route');
    await expect(safari.locator('#my-safari-route-builder .route-day')).toHaveCount(9);

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('se_my_safari_v1') || '{}'));
    const trip = saved.trips.find(item => item.templateRouteId === 'south-africa-garden-route');
    expect(trip.routeDays).toHaveLength(9);
    expect(trip.routeDays.map(day => day.title)).toContain('Plettenberg Bay and Tsitsikamma');
});
