import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function parseRgb(value) {
    const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!channels || channels.length !== 3) throw new Error(`Unsupported color: ${value}`);
    return channels;
}

function relativeLuminance(rgb) {
    const channels = rgb.map(channel => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
    const light = Math.max(relativeLuminance(parseRgb(foreground)), relativeLuminance(parseRgb(background)));
    const dark = Math.min(relativeLuminance(parseRgb(foreground)), relativeLuminance(parseRgb(background)));
    return (light + 0.05) / (dark + 0.05);
}

async function sectionColors(page, sectionSelector, textSelector) {
    return page.locator(sectionSelector).evaluate((section, selector) => {
        const text = section.querySelector(selector);
        return {
            background: getComputedStyle(section).backgroundColor,
            foreground: getComputedStyle(text).color,
            opacity: getComputedStyle(section).opacity,
        };
    }, textSelector);
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
});

test('Safari Bingo remains visible, readable, and keyboard-operable', async ({ page }) => {
    await page.goto('/#safari-bingo', { waitUntil: 'domcontentloaded' });
    const section = page.locator('#safari-bingo');
    await expect(section).toHaveClass(/reveal-active/);
    await expect(section.getByRole('heading', { name: /Safari Bingo/ })).toBeVisible();

    const colors = await sectionColors(page, '#safari-bingo', '.safari-bingo-header p');
    expect(colors.opacity).toBe('1');
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);

    const firstCard = section.locator('.bingo-card').first();
    await expect(firstCard).toHaveAttribute('aria-pressed', 'false');
    await firstCard.focus();
    await page.keyboard.press('Enter');
    await expect(firstCard).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('#bingo-progress-text')).toHaveText('1 / 20');
});

test('Phrasebook remains visible, readable, and exposes accessible tabs', async ({ page }) => {
    await page.goto('/#phrasebook', { waitUntil: 'domcontentloaded' });
    const section = page.locator('#phrasebook');
    await expect(section).toHaveClass(/reveal-active/);
    await expect(section.getByRole('heading', { name: 'Essential Phrasebook' })).toBeVisible();

    const colors = await sectionColors(page, '#phrasebook', '.section-header h2');
    expect(colors.opacity).toBe('1');
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);

    const tabs = section.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(section.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'phrasebook-tab-1');
    await expect(section.locator('.phrase-item').first()).toBeVisible();
});

test('Safari Bingo and Phrasebook have no serious accessibility violations', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/#safari-bingo', { waitUntil: 'domcontentloaded' });
    const bingoResults = await new AxeBuilder({ page })
        .include('#safari-bingo')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(bingoResults.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);

    await page.goto('/#phrasebook', { waitUntil: 'domcontentloaded' });
    const phrasebookResults = await new AxeBuilder({ page })
        .include('#phrasebook')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    expect(phrasebookResults.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});
