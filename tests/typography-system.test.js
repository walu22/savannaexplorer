import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('shared type and spacing tokens define the site rhythm', () => {
    const tokens = read('css/tokens.css');
    const required = [
        'space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6', 'space-7',
        'text-xs', 'text-sm', 'text-base', 'text-lead',
        'leading-tight', 'leading-heading', 'leading-copy', 'copy-measure',
    ];

    required.forEach(token => assert.match(tokens, new RegExp(`--${token}:`)));
});

test('shared typography loads after page-family styles and aligns core elements', () => {
    const main = read('css/main.css');
    const type = read('css/type-system.css');

    assert.ok(main.lastIndexOf("@import './type-system.css';") > main.lastIndexOf("@import './travel-updates.css';"));
    assert.match(type, /:where\(h1, h2\)[\s\S]*text-wrap:\s*balance/);
    assert.match(type, /body\.site-v2 \.btn[\s\S]*display:\s*inline-flex[\s\S]*min-height:\s*44px/);
    assert.match(type, /input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\), select, textarea[\s\S]*min-height:\s*44px/);
});

test('planning surfaces use readable text and aligned control sizes', () => {
    const type = read('css/type-system.css');

    assert.match(type, /\.route-explorer-section, \.journey-composer, \.country-detail-view, \.utility-hub, \.my-safari-card/);
    assert.match(type, /:where\(p, li\)[\s\S]*font-size:\s*var\(--text-sm\)/);
    assert.match(type, /:where\(label, button, input, select, textarea\)[\s\S]*font-size:\s*var\(--text-sm\)/);
});
