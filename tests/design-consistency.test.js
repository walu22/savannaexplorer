import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readProjectFile = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('journey starting points keep dark, readable typography on light cards', () => {
    const css = readProjectFile('css/journey-composer.css');

    assert.match(css, /\.journey-presets\s*{[^}]*color:\s*var\(--text-dark\)[^}]*background:\s*var\(--bg-cream\)/s);
    assert.match(css, /\.journey-presets__heading h4\s*{[^}]*color:\s*var\(--text-dark\)/s);
    assert.match(css, /\.journey-preset\s*{[^}]*color:\s*var\(--text-dark\)[^}]*background:\s*#fff/s);
    assert.match(css, /\.journey-preset > strong\s*{[^}]*color:\s*#111a16/s);
    assert.match(css, /\.journey-preset > small\s*{[^}]*color:\s*#48544f/s);
});

test('footer keeps concise navigation, country guides, and the technology credit', () => {
    const html = readProjectFile('index.html');
    const footer = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[0] ?? '';

    assert.match(footer, /aria-label="Explore"/);
    assert.match(footer, /aria-label="Plan"/);
    assert.match(footer, /class="footer-destinations"/);
    assert.match(footer, /Powered by <strong>TumaHelper Technologies<\/strong>/);
    assert.doesNotMatch(footer, /href="#"/);
});

test('direct My Safari view uses a neutral page and charcoal feature surface', () => {
    const css = readProjectFile('css/home-focus.css');

    assert.match(css, /home-section-focus--my-safari #plan\s*{[^}]*background:\s*#f1ede5/s);
    assert.match(css, /home-section-focus--my-safari #hub-my-safari\s*{[^}]*background:\s*linear-gradient\(145deg, #2b2d2a, #1d201f\)/s);
});
