import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
const planner = read('js/modules/ai-planner.js');
const featureLoader = read('js/modules/feature-loader.js');
const endpoint = read('api/itinerary/generate.js');
const index = read('index.html');
const css = read('css/ai-planner.css');
const packageJson = JSON.parse(read('package.json'));
const viteConfig = read('vite.config.js');

test('AI planner uses reviewed routes without legacy marketplace claims or ratings', () => {
    assert.match(planner, /route-collections\.json/);
    assert.match(planner, /getMatchingRouteTemplates/);
    assert.match(planner, /SavannaExplorer Route/);
    assert.doesNotMatch(planner, /marketplace|data-experience-id|4\.8|ai-product-rating/i);
    assert.doesNotMatch(endpoint, /REAL, verified experiences|SavannaExplorer Experience|customized, luxury/i);
    assert.match(endpoint, /REVIEWED ROUTE TEMPLATES/);
});

test('AI output is escaped locally and no global markdown dependency remains', () => {
    assert.match(planner, /renderSafeItineraryMarkdown/);
    assert.match(planner, /escapeHtml/);
    assert.doesNotMatch(planner, /DOMPurify|marked\.parse|innerHTML\s*=\s*markdown/i);
    assert.doesNotMatch(index, /cdn\.jsdelivr\.net\/npm\/marked|perfect luxury journey/i);
    assert.equal(packageJson.dependencies?.dompurify, undefined);
});

test('AI planner loads on demand instead of on every homepage visit', () => {
    assert.match(featureLoader, /loaded\.has\('ai'\)/);
    assert.match(featureLoader, /module\?\.openAiPlanner/);
    assert.match(featureLoader, /\['destinations', 'routes', 'newsletter'\]\.map\(loadFeature\)/);
    assert.doesNotMatch(featureLoader, /'hub-my-safari': \['safari', 'ai'\]/);
    assert.doesNotMatch(featureLoader, /plan: \['utility', 'trip-planner', 'safari', 'ai'\]/);
});

test('retired marketplace assets and product-card styling are removed', () => {
    assert.equal(existsSync(new URL('../data/marketplace.json', import.meta.url)), false);
    assert.equal(existsSync(new URL('../data/marketplace-resources.json', import.meta.url)), false);
    assert.equal(existsSync(new URL('../scripts/seed-supabase.mjs', import.meta.url)), false);
    assert.equal(existsSync(new URL('../supabase/seed.sql', import.meta.url)), false);
    assert.doesNotMatch(css, /ai-product-card|ai-product-rating/);
    assert.match(css, /ai-route-reference/);
    assert.doesNotMatch(viteConfig, /data-marketplace|mod-marketplace/);
});

test('one lazy-loaded assistant surface provides itinerary and grounded Q&A modes', () => {
    assert.equal(existsSync(new URL('../js/modules/chat-assistant.js', import.meta.url)), false);
    assert.equal(existsSync(new URL('../css/chat-assistant.css', import.meta.url)), false);
    assert.match(index, /data-assistant-mode="ask"/);
    assert.match(index, /data-assistant-mode="plan"/);
    assert.doesNotMatch(index, /id="chat-panel"/);
    assert.match(planner, /fetch\('\/api\/chat\/ask'/);
    assert.match(planner, /renderMarkdownLite/);
    assert.match(featureLoader, /module\?\.openAiPlanner\?\.\('ask'\)/);
    assert.doesNotMatch(featureLoader, /loadFeature\('chat'\)|chat-assistant\.js/);
    ['South Africa', 'Namibia', 'Botswana', 'Zambia', 'Zimbabwe', 'Mozambique', 'Malawi', 'Lesotho', 'Eswatini']
        .forEach(country => assert.match(index, new RegExp(`<option value="${country}">${country}<\\/option>`)));
});
