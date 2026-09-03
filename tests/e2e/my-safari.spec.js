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
    expect(await page.evaluate(() => window.__sharedTripScriptRan)).toBe(false);
});

test('signed-in editor can accept an invitation and save shared notes', async ({ page }) => {
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
    await expect(view.getByRole('heading', { name: 'Friends in Etosha' })).toBeVisible();
    await expect(view.locator('#collaboration-safari-role')).toHaveText('Editor');
    await expect(view.locator('#collaboration-safari-notes')).toHaveValue('Book the waterhole camp');
    await view.locator('#collaboration-safari-notes').fill('Meet at the south gate');
    await view.getByRole('button', { name: 'Save shared notes' }).click();
    await expect(view.locator('#collaboration-safari-status')).toHaveText('Shared notes saved for everyone.');
    await expect(page).toHaveURL(new RegExp(`collaboration=${tripId}`));
});
