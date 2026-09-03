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

test('traveller can build and rearrange a day-by-day safari route', async ({ page }) => {
    await page.goto('/#hub-my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    await safari.getByLabel('Trip name').fill('Etosha route');
    await safari.getByLabel('Start date').fill('2026-10-10');
    await safari.getByLabel('End date').fill('2026-10-12');
    await safari.getByLabel('Namibia').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();

    const route = safari.locator('#my-safari-route-builder');
    await route.getByRole('button', { name: 'Build days from trip dates' }).click();
    await expect(route.locator('.route-day')).toHaveCount(3);

    await route.getByLabel('Type').selectOption('park');
    await route.getByLabel('Stop name').fill('Etosha National Park');
    await route.getByLabel('Location').fill('Andersson Gate');
    await route.getByLabel('Time').fill('07:30');
    await route.getByLabel('Notes').fill('Arrive before sunrise');
    await route.getByRole('button', { name: 'Add stop' }).click();
    await expect(route.locator('.route-stop')).toHaveCount(1);
    await expect(route.getByText('Etosha National Park', { exact: true })).toBeVisible();

    await route.getByLabel('Move Etosha National Park to day').selectOption({ label: 'Day 2' });
    await expect(route.locator('.route-day').nth(0).locator('.route-stop')).toHaveCount(0);
    await expect(route.locator('.route-day').nth(1).getByText('Etosha National Park', { exact: true })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(route.locator('.route-day')).toHaveCount(3);
    await expect(route.locator('.route-day').nth(1).getByText('Etosha National Park', { exact: true })).toBeVisible();
});

test('My Safari has no serious accessibility violations', async ({ page }) => {
    await page.goto('/#hub-my-safari', { waitUntil: 'domcontentloaded' });
    const results = await new AxeBuilder({ page })
        .include('#hub-my-safari')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});

test('visitor can request a password-free sign-in link', async ({ page }) => {
    await page.route('**/auth/v1/otp**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
    }));
    await page.goto('/#hub-my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    await safari.getByLabel('Email address').fill('traveller@example.com');
    await safari.getByRole('button', { name: 'Email sign-in link' }).click();
    await expect(safari.locator('#my-safari-cloud-status')).toContainText('Sign-in link sent to traveller@example.com');
});

test('shared safari link renders a read-only trip safely', async ({ page }) => {
    await page.addInitScript(() => { window.__sharedTripScriptRan = false; });
    await page.route('**/rest/v1/rpc/get_shared_trip', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
            data: {
                id: 'trip-shared',
                name: 'Family safari',
                countries: ['Namibia', 'Botswana'],
                startDate: '2026-10-01',
                endDate: '2026-10-12',
                notes: '<img src=x onerror="window.__sharedTripScriptRan=true">Bring binoculars',
                updatedAt: '2026-09-02T12:00:00Z',
                expenses: { items: [{ id: 'one' }] },
                packing: { packedItems: ['hat', 'boots'] },
                aiItinerary: { history: [{ role: 'assistant', content: 'Day 1: Windhoek' }] },
                routeDays: [{
                    id: 'day-shared', date: '2026-10-01', title: '',
                    stops: [{ id: 'stop-shared', type: 'park', name: '<img src=x onerror="window.__sharedTripScriptRan=true">Etosha', location: 'Andersson Gate', time: '07:30', notes: '' }],
                }],
            },
        }]),
    }));

    await page.goto('/?share=123e4567-e89b-42d3-a456-426614174000#shared-safari', { waitUntil: 'domcontentloaded' });
    const shared = page.locator('#my-safari-shared-view');
    await expect(shared.getByRole('heading', { name: 'Family safari' })).toBeVisible();
    await expect(shared.locator('#shared-safari-meta')).toContainText('Namibia, Botswana');
    await expect(shared.locator('#shared-safari-expenses')).toHaveText('1 item');
    await expect(shared.locator('#shared-safari-itinerary')).toContainText('Day 1: Windhoek');
    await expect(shared.locator('#shared-safari-notes')).toContainText('<img src=x');
    await expect(shared.locator('#shared-safari-route')).toContainText('<img src=x');
    await expect(shared.locator('#shared-safari-route').locator('.route-stop-actions')).toHaveCount(0);
    expect(await page.evaluate(() => window.__sharedTripScriptRan)).toBe(false);
});

test('signed-in editor can accept an invitation and save a shared plan', async ({ page }) => {
    const inviteToken = '11111111-1111-4111-8111-111111111111';
    const tripId = '22222222-2222-4222-8222-222222222222';
    const user = { id: '33333333-3333-4333-8333-333333333333', email: 'friend@example.com', aud: 'authenticated', role: 'authenticated' };
    const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user,
    };
    await page.addInitScript(value => {
        localStorage.setItem('sb-pyfxdiqbpiwmpfutvxbh-auth-token', JSON.stringify(value));
    }, session);

    await page.route('**/auth/v1/user**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
    await page.route('**/rest/v1/rpc/accept_trip_collaboration_invite', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
            trip_id: tripId,
            access_role: 'editor',
            updated_at: '2026-09-03T08:00:00.000Z',
            data: {
                id: 'trip-group-safari', name: 'Friends in Etosha', startDate: '2026-10-10', endDate: '2026-10-14',
                countries: ['Namibia'], notes: 'Book the waterhole camp', expenses: { items: [] }, packing: { packedItems: [] },
            },
        }]),
    }));
    await page.route('**/rest/v1/rpc/get_trip_activity', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ action: 'collaborator_joined', actor_email: 'friend@example.com', details: { role: 'editor' }, created_at: '2026-09-03T08:00:00.000Z' }]),
    }));
    await page.route('**/rest/v1/rpc/save_trip_collaboration', async route => {
        const request = route.request();
        const body = request.postDataJSON();
        expect(body.p_trip_id).toBe(tripId);
        expect(body.p_data.notes).toBe('Meet at the south gate');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ data: body.p_data, updated_at: '2026-09-03T08:10:00.000Z' }]),
        });
    });

    await page.goto(`/?invite=${inviteToken}#hub-my-safari`, { waitUntil: 'domcontentloaded' });
    const view = page.locator('#my-safari-collaboration-view');
    await expect(view.getByRole('heading', { name: 'Friends in Etosha' })).toBeVisible({ timeout: 15_000 });
    await expect(view.locator('#collaboration-safari-role')).toHaveText('Editor');
    await expect(view.locator('#collaboration-safari-notes')).toHaveValue('Book the waterhole camp');
    await view.locator('#collaboration-safari-notes').fill('Meet at the south gate');
    await view.getByRole('button', { name: 'Save shared plan' }).click();
    await expect(view.locator('#collaboration-safari-status')).toHaveText('Shared plan saved for everyone.');
    await expect(page).toHaveURL(new RegExp(`collaboration=${tripId}`));
});
