import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const featureLoader = readFileSync(new URL('../js/modules/feature-loader.js', import.meta.url), 'utf8');
const experiencesModule = readFileSync(new URL('../js/modules/experiences.js', import.meta.url), 'utf8');
const campsitesModule = readFileSync(new URL('../js/modules/campsites.js', import.meta.url), 'utf8');
const prerender = readFileSync(new URL('../scripts/prerender-seo.mjs', import.meta.url), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

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
    assert.doesNotMatch(index, /id="marketplace-modal"|id="marketplace-grid"/);
    assert.doesNotMatch(featureLoader, /marketplace\.js|marketplace: \(\)/);
    assert.doesNotMatch(prerender, /marketplace-modal/);
});

test('legacy dish carousel is replaced by an actionable food and market planner', () => {
    assert.doesNotMatch(index, /Gastronomy Journey|gastro-scroll|gastro-card|Signature Drinks/);
    assert.match(index, /Food &amp; Market Planner/);
    assert.match(index, /id="food-country-filter"/);
    assert.match(index, /id="food-context-filter"/);
    assert.match(index, /id="food-dietary-filter"/);
    assert.match(index, /Market &amp; table etiquette/);
    assert.match(index, /Safer food on the road/);
    assert.match(index, /Sources &amp; review notes/);
    assert.match(featureLoader, /gastronomy: \['food-planner'\]/);
});

test('legacy must-visit gallery is replaced by an explainable destination matcher', () => {
    assert.doesNotMatch(index, /<h2>Top Destinations<\/h2>|Must Visit|experiences you cannot miss|top-destinations-grid/);
    assert.match(index, /Find the countries that fit your trip/);
    assert.match(index, /No universal “best” destination/);
    assert.match(index, /Find my best matches/);
    assert.match(index, /Season labels are broad country-level planning signals, not forecasts/);
    assert.match(featureLoader, /'top-destinations': \['destination-matcher'\]/);
});

test('legacy itineraries are consolidated into one Route Explorer workflow', () => {
    assert.doesNotMatch(index, /id="itineraries"|itinerary-grid|itinerary-modal/);
    assert.match(index, /Start with a classic regional journey/);
    assert.match(index, /id="journey-preset-list"/);
    assert.doesNotMatch(featureLoader, /itineraries\.js|itineraries: \['itineraries'\]/);

    const redirects = new Map(vercel.redirects.map(item => [item.source, item.destination]));
    assert.equal(redirects.get('/itineraries'), '/routes');
    assert.equal(redirects.get('/itineraries/desert-to-delta'), '/routes?journey=desert-to-delta');
    assert.equal(redirects.get('/itineraries/namibia-essentials'), '/routes/namibia-essentials-extended');
});

test('yearless events and unsourced news are replaced by governed traveller briefings', () => {
    assert.doesNotMatch(index, /Travel Updates & Industry News|Latest News|travel-news-grid/);
    assert.match(index, /What’s happening during your trip\?/);
    assert.match(index, /id="events-start-date"/);
    assert.match(index, /Dates not ready yet/);
    assert.match(index, /What changed before your trip\?/);
    assert.match(index, /Source linked/);
    assert.match(index, /Auto-expiring/);
    assert.match(featureLoader, /news: \['travel-updates'\]/);
    assert.doesNotMatch(featureLoader, /news: \['discover'\]/);
});

test('mixed accommodation cards are replaced by a nine-country campsite planner', () => {
    assert.doesNotMatch(index, /Campsite &amp; Accommodation Finder|filter by country, type, and amenities/);
    assert.match(index, /Campsite &amp; Overlander Planner/);
    assert.match(index, /Match the road, not just the view/);
    assert.match(index, /id="camp-planner-access"/);
    assert.match(index, /id="camp-planner-facility"/);
    assert.match(campsitesModule, /Shortlist in My Safari/);
    assert.match(featureLoader, /campsites: \['campsites'\]/);
});
