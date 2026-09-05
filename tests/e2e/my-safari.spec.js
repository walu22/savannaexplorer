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
    test.setTimeout(60_000);
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    const createForm = safari.locator('#my-safari-create-form');
    await expect(safari.getByRole('heading', { name: 'My Safari' })).toBeVisible();

    await createForm.getByLabel('Trip name').fill('Botswana adventure');
    await createForm.getByLabel('Botswana').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Botswana adventure');

    await page.goto('/expenses', { waitUntil: 'domcontentloaded' });
    const expenses = page.locator('#hub-expense-tracker');
    await expenses.locator('#expense-amount').fill('120');
    await expenses.locator('#expense-note').fill('Camp deposit');
    await expenses.getByRole('button', { name: 'Add expense' }).click();
    await expect(expenses.locator('.expense-row')).toHaveCount(1);

    await page.goto('/packing-list', { waitUntil: 'domcontentloaded' });
    const packing = page.locator('#packing-list');
    await packing.locator('.packing-item').first().click();

    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    await expect(safari.locator('#my-safari-packing-count')).toHaveText('1 packed');

    await createForm.getByLabel('Trip name').fill('Zambia escape');
    await createForm.getByLabel('Zambia').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Zambia escape');
    await expect(safari.locator('#my-safari-expense-count')).toHaveText('0 items');
    await expect(safari.locator('#my-safari-packing-count')).toHaveText('0 packed');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(safari.locator('.my-safari-trip-card')).toHaveCount(2);
    await safari.getByRole('button', { name: /Botswana adventure/ }).click();
    await expect(safari.locator('#my-safari-expense-count')).toHaveText('1 item');
    await expect(safari.locator('#my-safari-packing-count')).toHaveText('1 packed');

    await page.goto('/expenses', { waitUntil: 'domcontentloaded' });
    await expect(expenses.locator('.expense-row')).toHaveCount(1);
});

test('traveller can build and rearrange a day-by-day safari route', async ({ page }) => {
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    const createForm = safari.locator('#my-safari-create-form');
    await createForm.getByLabel('Trip name').fill('Etosha route');
    await createForm.getByLabel('Start date').fill('2026-10-10');
    await createForm.getByLabel('End date').fill('2026-10-12');
    await createForm.getByLabel('Namibia').check();
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

    await route.getByLabel('Trip length').fill('5');
    await route.getByRole('button', { name: 'Update itinerary' }).click();
    await expect(route.locator('.route-day')).toHaveCount(5);
    await expect(route.getByRole('status')).toHaveText('Itinerary updated to 5 days.');
    await expect(safari.locator('#my-safari-active-meta')).toContainText('Oct 14, 2026');

    await route.getByLabel('Trip length').fill('2');
    await route.getByRole('button', { name: 'Update itinerary' }).click();
    await expect(route.locator('.route-day')).toHaveCount(2);
    await expect(route.locator('.route-day').nth(1).getByText('Etosha National Park', { exact: true })).toBeVisible();
    await expect(safari.locator('#my-safari-active-meta')).toContainText('Oct 11, 2026');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(route.locator('.route-day')).toHaveCount(2);
    await expect(route.locator('.route-day').nth(1).getByText('Etosha National Park', { exact: true })).toBeVisible();
});

test('trip readiness adapts to the journey and keeps completed checks', async ({ page }) => {
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    const createForm = safari.locator('#my-safari-create-form');
    await createForm.getByLabel('Trip name').fill('Cross-border safari');
    await createForm.getByLabel('Start date').fill('2026-10-10');
    await createForm.getByLabel('End date').fill('2026-10-20');
    await createForm.getByLabel('Namibia').check();
    await createForm.getByLabel('Botswana').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();

    const readiness = safari.locator('#my-safari-readiness');
    await expect(readiness.getByRole('heading', { name: 'Trip readiness' })).toBeVisible();
    await expect(readiness.getByText('Prepare cross-border documents', { exact: true })).toBeVisible();
    await expect(readiness.locator('[data-readiness-task]')).toHaveCount(11);
    await expect(readiness.locator('#my-safari-readiness-score')).toContainText('0%');

    await expect(readiness.locator('.my-safari-readiness-task').getByText('Verify entry rules for Botswana and Namibia', { exact: true })).toBeVisible();
    const entryCheck = readiness.locator('[data-readiness-task="entry-rules"]');
    await entryCheck.check();
    await expect(readiness.locator('#my-safari-readiness-score')).toContainText('9%');
    await expect(readiness.getByRole('status')).toContainText('Trip readiness is now 9%');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(readiness.locator('[data-readiness-task="entry-rules"]')).toBeChecked();
    await expect(readiness.locator('#my-safari-readiness-score')).toContainText('9%');

    const accessibility = await new AxeBuilder({ page })
        .include('#my-safari-readiness')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});

test('traveller edits trip details, adds a personal task and records a booking', async ({ page }) => {
    await page.addInitScript(() => {
        window.__productEvents = [];
        window.addEventListener('savanna:product-event', event => window.__productEvents.push(event.detail));
    });
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    const safari = page.locator('#hub-my-safari');
    const createForm = safari.locator('#my-safari-create-form');
    await createForm.getByLabel('Trip name').fill('Namibia draft');
    await createForm.getByLabel('Namibia').check();
    await safari.getByRole('button', { name: 'Create trip' }).click();

    await safari.getByRole('button', { name: 'Edit trip' }).click();
    const editor = safari.locator('#my-safari-edit-form');
    await editor.getByLabel('Edit trip name').fill('Namibia family safari');
    await editor.getByLabel('Edit start date').fill('2026-11-01');
    await editor.getByLabel('Edit end date').fill('2026-11-04');
    await editor.getByLabel('Edit traveller count').fill('4');
    await editor.getByLabel('Edit destination Botswana').check();
    await editor.getByRole('button', { name: 'Save changes' }).click();
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Namibia family safari');
    await expect(safari.locator('#my-safari-active-meta')).toContainText('Botswana, Namibia');

    const readiness = safari.locator('#my-safari-readiness');
    await readiness.getByText('Add a personal task').click();
    await readiness.getByLabel('Task').fill('Download offline maps');
    await readiness.getByLabel('Group').selectOption('road');
    await readiness.getByLabel('Target date').fill('2026-10-28');
    await readiness.getByRole('button', { name: 'Add task' }).click();
    await expect(readiness.getByText('Download offline maps', { exact: true })).toBeVisible();

    const bookings = safari.locator('#my-safari-bookings');
    await bookings.getByLabel('Type').selectOption('stay');
    await bookings.getByLabel('Provider or place').fill('Etosha Safari Camp');
    await bookings.getByLabel('Reference').fill('ET-42');
    await bookings.getByLabel('Date').fill('2026-11-02');
    await bookings.getByRole('button', { name: 'Add record' }).click();
    await expect(bookings.getByText('Etosha Safari Camp', { exact: true })).toBeVisible();
    await expect(bookings.getByText('Reference: ET-42', { exact: true })).toBeVisible();
    await bookings.getByLabel('Status for Etosha Safari Camp').selectOption('confirmed');
    await expect(bookings.locator('#my-safari-bookings-progress')).toHaveText('1 of 1 confirmed');

    const productEvents = await page.evaluate(() => window.__productEvents);
    expect(productEvents.map(event => event.event_type)).toEqual(expect.arrayContaining([
        'trip_created',
        'trip_details_updated',
        'readiness_task_added',
        'booking_record_added',
        'booking_status_updated',
    ]));
    const telemetry = JSON.stringify(productEvents);
    expect(telemetry).not.toContain('Namibia family safari');
    expect(telemetry).not.toContain('Download offline maps');
    expect(telemetry).not.toContain('Etosha Safari Camp');
    expect(telemetry).not.toContain('ET-42');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(safari.locator('#my-safari-active-name')).toHaveText('Namibia family safari');
    await expect(readiness.getByText('Download offline maps', { exact: true })).toBeVisible();
    await expect(bookings.getByLabel('Status for Etosha Safari Camp')).toHaveValue('confirmed');

    const accessibility = await new AxeBuilder({ page })
        .include('#my-safari-workspace')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});

test('My Safari has no serious accessibility violations', async ({ page }) => {
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
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

    await page.goto('/my-safari?share=123e4567-e89b-42d3-a456-426614174000#shared-safari', { waitUntil: 'domcontentloaded' });
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

    await page.goto(`/my-safari?invite=${inviteToken}#hub-my-safari`, { waitUntil: 'domcontentloaded' });
    const view = page.locator('#my-safari-collaboration-view');
    await expect(view.getByRole('heading', { name: 'Friends in Etosha' })).toBeVisible({ timeout: 15_000 });
    await expect(view.locator('#collaboration-safari-role')).toHaveText('Editor');
    await expect(view.locator('#collaboration-safari-notes')).toHaveValue('Book the waterhole camp');
    await view.locator('#collaboration-safari-notes').fill('Meet at the south gate');
    await view.getByRole('button', { name: 'Save shared plan' }).click();
    await expect(view.locator('#collaboration-safari-status')).toHaveText('Shared plan saved for everyone.');
    await expect(page).toHaveURL(new RegExp(`collaboration=${tripId}`));
});
