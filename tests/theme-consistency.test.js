import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const readCss = file => readFileSync(new URL(`../css/${file}`, import.meta.url), 'utf8');

test('shared theme defines the semantic colours used by legacy and current features', () => {
    const tokens = readCss('tokens.css');
    const expectedTokens = [
        'primary-color', 'primary-accent', 'secondary', 'dark', 'off-white',
        'surface-1', 'surface-2', 'surface-elevated', 'text', 'text-color',
        'text-main', 'text-primary', 'border-color', 'brand-dark-surface',
    ];

    expectedTokens.forEach(token => assert.match(tokens, new RegExp(`--${token}\\s*:`)));
});

test('major dark feature bands use the Route Explorer surface instead of separate palettes', () => {
    const combined = [
        'route-explorer.css', 'styles.css', 'redesign.css', 'scroll-ux.css',
        'home-focus.css', 'safari-bingo.css', 'phrasebook.css',
    ].map(readCss).join('\n');

    assert.doesNotMatch(combined, /#1a1a2e|#16213e|#0f3460|#2d1b00|#1a1208|#1a1a20/i);
    assert.ok((combined.match(/var\(--brand-dark-surface\)/g) || []).length >= 10);
});

test('site presentation uses solid colours instead of CSS gradients', () => {
    const cssDirectory = new URL('../css/', import.meta.url);
    const combined = readdirSync(cssDirectory)
        .filter(file => file.endsWith('.css'))
        .map(readCss)
        .join('\n');

    assert.doesNotMatch(combined, /(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\(/i);
    assert.match(readCss('tokens.css'), /--brand-dark-surface:\s*#15241f/);
});
