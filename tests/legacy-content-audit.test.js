import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const featureLoader = readFileSync(new URL('../js/modules/feature-loader.js', import.meta.url), 'utf8');
const experiencesModule = readFileSync(new URL('../js/modules/experiences.js', import.meta.url), 'utf8');
const prerender = readFileSync(new URL('../scripts/prerender-seo.mjs', import.meta.url), 'utf8');

test('legacy culture stereotypes are replaced by actionable community-travel guidance', () => {
    assert.doesNotMatch(index, /Cultural Mosaic|most fascinating peoples|legendary warriors|Masters of cattle and democracy/);
    assert.match(index, /Connect with local communities respectfully/);
    assert.match(index, /Choose an experience that benefits its hosts/);
    assert.match(index, /Agree on photography first/);
    assert.match(index, /Protect children/);
    assert.match(index, /Find official operator directories/);
    assert.match(index, /Open the phrasebook/);
});

test('community travel page links to context for all nine supported countries', () => {
    const countryIds = [
        'namibia', 'botswana', 'south-africa', 'zambia', 'zimbabwe',
        'malawi', 'mozambique', 'lesotho', 'eswatini',
    ];

    countryIds.forEach(countryId => assert.match(index, new RegExp(`href="/countries/${countryId}"`)));
});

test('legacy experience products and ratings are replaced by a transparent planning finder', () => {
    assert.doesNotMatch(index, /31 curated activity ideas|data-theme="safari"|Feel the Rush|Discover Traditions/);
    assert.match(index, /Choose the kind of trip you want to remember/);
    assert.match(index, /not packages, paid rankings or unverified ratings/);
    assert.match(index, /No paid ordering and no invented popularity scores/);
    assert.match(index, /Turn inspiration into a safe booking/);
    assert.match(index, /href="\/book-direct"/);
});

test('experience finder offers six useful styles and all supported country filters', () => {
    const styleIds = ['wildlife', 'landscapes', 'water', 'active', 'culture', 'road-trip'];
    const countryIds = [
        'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe',
        'mozambique', 'malawi', 'lesotho', 'eswatini',
    ];

    styleIds.forEach(style => assert.match(index, new RegExp(`data-style="${style}"`)));
    countryIds.forEach(country => assert.match(index, new RegExp(`<option value="${country}">`)));
});

test('experience hub loads its own filters and excludes the legacy marketplace modal', () => {
    assert.match(featureLoader, /experiences: \['experiences'\]/);
    assert.match(experiencesModule, /applyExperienceFilters/);
    assert.match(experiencesModule, /aria-pressed/);
    assert.match(prerender, /path !== 'gastronomy'/);
});

test('legacy must-visit gallery is replaced by an explainable destination matcher', () => {
    assert.doesNotMatch(index, /<h2>Top Destinations<\/h2>|Must Visit|experiences you cannot miss|top-destinations-grid/);
    assert.match(index, /Find the countries that fit your trip/);
    assert.match(index, /No universal “best” destination/);
    assert.match(index, /Find my best matches/);
    assert.match(index, /Season labels are broad country-level planning signals, not forecasts/);
    assert.match(featureLoader, /'top-destinations': \['destination-matcher'\]/);
});
