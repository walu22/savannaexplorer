import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruneCountryShell } from '../scripts/lib/country-shell.mjs';

const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const prerender = await readFile(new URL('../scripts/prerender-seo.mjs', import.meta.url), 'utf8');
const controller = await readFile(new URL('../js/modules/country-guide.js', import.meta.url), 'utf8');
const seo = '<main id="seo-prerender" class="seo-prerender"><article><h1>Namibia Travel Guide</h1></article></main>';
const rendered = source.replace('<body class="site-v2">', `<body class="site-v2">${seo}`);
const country = pruneCountryShell(rendered, 'assets/country-test.css');

test('direct country pages retain the guide and crawlable content', () => {
    assert.match(country, /class="site-v2 country-route-shell"/);
    assert.match(country, /id="seo-prerender"/);
    assert.match(country, /id="country-detail-view"/);
    assert.match(country, /id="country-page-header"/);
    assert.match(country, /src="\/js\/app\.js"/);
    assert.match(country, /href="\/assets\/country-test\.css"/);
});

test('direct country pages exclude homepage, hub and global overlay payload', () => {
    assert.doesNotMatch(country, /id="navbar"/);
    assert.doesNotMatch(country, /id="mobile-nav-panel"/);
    assert.doesNotMatch(country, /id="home"/);
    assert.doesNotMatch(country, /id="main-content"/);
    assert.doesNotMatch(country, /id="planning-guide-modal"/);
    assert.doesNotMatch(country, /id="ai-planner-sidebar"/);
    assert.doesNotMatch(country, /id="chat-fab"/);
    assert.doesNotMatch(country, /<footer\b/);
    assert.ok(country.length < rendered.length * 0.55);
});

test('the retained country shell has no duplicate element ids', () => {
    const ids = [...country.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicates)], []);
});

test('the production pipeline uses the lean shell for every direct country route', () => {
    assert.match(viteConfig, /country:\s*resolve\(process\.cwd\(\), 'css', 'country-entry\.css'\)/);
    assert.match(viteConfig, /manifest:\s*true/);
    assert.match(prerender, /page\.path\.startsWith\('\/countries\/'\)/);
    assert.match(prerender, /pruneCountryShell\(pageHtml, countryStylesheet\)/);
    assert.match(controller, /document\.body\.classList\.contains\('country-route-shell'\)/);
    assert.match(controller, /window\.location\.assign\(destination\)/);
});
