import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('desktop header exposes only the five primary journey choices', () => {
    const css = read('css/nav-journey.css');

    assert.match(css, /#nav-links-desktop > li:nth-child\(4\),[\s\S]*li:nth-child\(6\),[\s\S]*nav-dropdown--cta[\s\S]*display:\s*none/);
    assert.match(css, /@media \(max-width:\s*960px\)[\s\S]*\.nav-links--desktop[\s\S]*display:\s*none/);
});

test('desktop dropdowns close after navigation and with Escape', () => {
    const source = read('js/modules/nav.js');

    assert.match(source, /querySelectorAll\('\.nav-drop-menu a'\)[\s\S]*addEventListener\('click', closeDesktopDropdowns\)/);
    assert.match(source, /event\.key === 'Escape'\) closeDesktopDropdowns\(\)/);
    assert.match(source, /setAttribute\('aria-expanded', 'false'\)/);
});

test('header positioning is scoped to the real navbar and cannot capture footer navigation', () => {
    const legacyCss = read('css/styles.css');

    assert.match(legacyCss, /#navbar\s*\{[\s\S]*?position:\s*fixed/);
    assert.doesNotMatch(legacyCss, /(?:^|\n)nav\s*\{\s*position:\s*fixed/);
});

test('My Safari homepage feature keeps its dark surface and readable light text', () => {
    const chapterCss = read('css/scroll-ux.css');
    const homeCss = read('css/home-focus.css');

    assert.match(chapterCss, /section:nth-child\(even\)[^{]*:not\(\.home-my-safari\)/);
    assert.match(homeCss, /\.home-my-safari\s*\{[\s\S]*?color:\s*white;[\s\S]*?background:\s*var\(--brand-dark-surface\)/);
});
