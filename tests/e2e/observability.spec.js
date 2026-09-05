import { test, expect } from '@playwright/test';

test('production preview renders key routes without browser failures', async ({ page }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(`page: ${error.message}`));
    page.on('console', message => {
        if (message.type() === 'error' && !/^Failed to load resource:/.test(message.text())) {
            failures.push(`console: ${message.text()}`);
        }
    });
    page.on('requestfailed', request => {
        if (request.url().startsWith('http://127.0.0.1:4173')) {
            failures.push(`local resource: ${request.url()}`);
        }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toHaveText('');
    await expect(page.locator('.vite-error-overlay, #webpack-dev-server-client-overlay, [data-nextjs-dialog]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Southern Africa/i }).first()).toBeVisible();

    await page.goto('/my-safari', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'My Safari', exact: true })).toBeVisible();
    await expect(page.locator('script[src*="_vercel/insights"], script[src*="_vercel/speed-insights"]')).toHaveCount(0);
    expect(failures).toEqual([]);
});
