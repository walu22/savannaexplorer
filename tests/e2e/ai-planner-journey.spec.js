import { test, expect } from '@playwright/test';

const generatedItinerary = `## Seven days in Namibia

### Day 1 — Windhoek
Morning arrival, an afternoon city walk, and a relaxed local dinner.

### Day 2 — Sossusvlei
Travel south for sunrise dunes and a guided desert experience.`;

async function openPlanner(page, isMobile) {
    if (isMobile) {
        await page.getByRole('button', { name: 'Open menu' }).click();
        await page.locator('#mobile-nav-panel').getByRole('link', { name: 'Plan with AI' }).click();
    } else {
        await page.getByRole('link', { name: 'Plan with AI' }).click();
    }
    await expect(page.locator('#ai-planner-sidebar')).toHaveAttribute('aria-hidden', 'false');
}

test('visitor can generate, save, and restore an AI itinerary', async ({ page, isMobile }) => {
    test.setTimeout(60_000);
    let requestPayload;
    await page.route('**/api/itinerary/generate', async route => {
        requestPayload = route.request().postDataJSON();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ itinerary: generatedItinerary, method: 'e2e fixture' }),
        });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await openPlanner(page, isMobile);

    await page.getByLabel('Destination Country').selectOption('Namibia');
    await page.getByLabel('Duration (Days)').fill('7');
    await page.getByLabel('Primary Theme').selectOption('Adventure');
    await page.getByLabel('Budget Tier').selectOption('$$');
    await page.getByRole('button', { name: /Generate Itinerary/ }).click();

    await expect(page.locator('#ai-result')).toBeVisible();
    await expect(page.getByText('Seven days in Namibia')).toBeVisible();
    await expect(page.getByText(/AI-generated planning draft/)).toBeVisible();
    expect(requestPayload).toMatchObject({
        country: 'Namibia',
        duration: '7',
        category: 'Adventure',
        budget: '$$',
    });

    await page.getByRole('button', { name: 'Save Itinerary' }).click();
    await expect(page.getByText('Saved on this device. You can reopen it after refreshing.')).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('se_ai_saved_itinerary_v1')));
    expect(saved.history.at(-1).content).toContain('Seven days in Namibia');
    expect(saved.preferences).toMatchObject({ country: 'Namibia', duration: '7' });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await openPlanner(page, isMobile);
    await page.getByRole('button', { name: 'Open Saved Itinerary' }).click();

    await expect(page.getByText('Saved itinerary restored from this device.')).toBeVisible();
    await expect(page.getByText('Seven days in Namibia')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
});
