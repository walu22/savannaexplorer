import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pruneMySafariShell } from '../scripts/lib/my-safari-shell.mjs';

const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const prerender = await readFile(new URL('../scripts/prerender-seo.mjs', import.meta.url), 'utf8');
const entry = await readFile(new URL('../css/my-safari-entry.css', import.meta.url), 'utf8');
const routeStyles = await readFile(new URL('../css/my-safari-route.css', import.meta.url), 'utf8');
const plannerModule = await readFile(new URL('../js/modules/my-safari.js', import.meta.url), 'utf8');
const seo = '<main id="seo-prerender"><article><h1>My Safari</h1></article></main>';
const rendered = source.replace('<body class="site-v2">', `<body class="site-v2">${seo}`);
const page = pruneMySafariShell(rendered, 'assets/my-safari-test.css');

test('direct My Safari loads retain every planner contract inside a dedicated page', () => {
    assert.match(page, /class="site-v2 my-safari-route-shell"/);
    assert.match(page, /class="my-safari-page"/);
    assert.match(page, /id="my-safari-page-title">My Safari/);
    assert.match(page, /id="hub-my-safari"/);
    assert.match(page, /id="my-safari-create-form"/);
    assert.match(page, /id="my-safari-workspace"/);
    assert.match(page, /id="my-safari-route-builder"/);
    assert.match(page, /id="my-safari-bookings"/);
    assert.match(page, /id="my-safari-readiness"/);
    assert.match(page, /id="my-safari-pack-builder"/);
    assert.match(page, /id="my-safari-empty" class="my-safari-empty"/);
    assert.match(page, /aria-disabled="true" tabindex="-1"/);
    assert.match(page, /src="\/js\/app\.js"/);
    assert.match(page, /href="\/assets\/my-safari-test\.css"/);
});

test('direct My Safari loads exclude the old utility hub and unrelated page payload', () => {
    assert.doesNotMatch(page, /id="plan"/);
    assert.doesNotMatch(page, /class="planning-hub-hero"/);
    assert.doesNotMatch(page, /id="home"/);
    assert.doesNotMatch(page, /id="country-detail-view"/);
    assert.doesNotMatch(page, /id="planning-guide-modal"/);
    assert.doesNotMatch(page, /id="ai-planner-sidebar"/);
    assert.doesNotMatch(page, /id="chat-fab"/);
    assert.doesNotMatch(page, /id="pwa-install-banner"/);
    assert.ok(page.length < rendered.length * 0.6);
});

test('the dedicated My Safari shell has no duplicate element ids', () => {
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicates)], []);
});

test('the build pipeline owns a separate My Safari bundle and shell', () => {
    assert.match(viteConfig, /mySafari:\s*resolve\(process\.cwd\(\), 'css', 'my-safari-entry\.css'\)/);
    assert.match(prerender, /pruneMySafariShell\(pageHtml, mySafariStylesheet\)/);
    assert.match(entry, /@import '\.\/my-safari-route\.css'/);
    assert.match(entry, /@import '\.\/nav-journey\.css'/);
    assert.match(entry, /@import '\.\/scroll-ux\.css'/);
    assert.match(routeStyles, /body\.my-safari-route-shell/);
    assert.match(routeStyles, /\.my-safari-page__nav/);
    assert.match(routeStyles, /a\[aria-disabled="true"\]/);
    assert.match(routeStyles, /html\.my-safari-route-document/);
    assert.match(routeStyles, /background: #f2efe8/);
    assert.doesNotMatch(routeStyles, /linear-gradient|radial-gradient/);
});

test('workspace navigation stays honest before and after a trip exists', () => {
    assert.match(plannerModule, /document\.body\.classList\.toggle\('my-safari-has-trip', Boolean\(active\)\)/);
    assert.match(plannerModule, /link\.removeAttribute\('aria-disabled'\)/);
    assert.match(plannerModule, /link\.setAttribute\('aria-disabled', 'true'\)/);
    assert.match(plannerModule, /link\.getAttribute\('href'\) === workspaceHash/);
    assert.match(plannerModule, /history\.replaceState\(null, '', `\$\{window\.location\.pathname\}\$\{window\.location\.search\}`\)/);
});

test('workspace controls keep their fieldset name and restore deep links after rendering', () => {
    assert.match(plannerModule, /<legend>\$\{legend\}<\/legend>/);
    assert.match(plannerModule, /document\.querySelector\(initialWorkspaceHash\)\?\.scrollIntoView\(\{ block: 'start' \}\)/);
});
