import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSiteSearchIndex, normalizeSearchText, searchCountryOptions, searchSiteIndex } from '../js/lib/site-search.js';

const sources = {
    countries: {
        namibia: { name: 'Namibia', tagline: 'Endless horizons', spots: [{ name: 'Etosha National Park', desc: 'Wildlife waterholes' }], activities: [] },
        botswana: { name: 'Botswana', tagline: 'Wetlands and wildlife', spots: [], activities: [] },
    },
    routes: [{ id: 'namibia-loop', title: 'Namibia Family Road Trip', promise: 'An approachable self-drive', countryIds: ['namibia'], duration: { label: '7 days' }, vehicle: { label: 'SUV' }, travellerTypes: ['Families'], themes: ['wildlife'], highlights: ['Etosha'] }],
    parks: [{ id: 'kruger', name: 'Kruger National Park', country: 'south-africa', description: 'Big Five self-drive safari', tags: ['wildlife'], bestSeason: 'May–Oct', lastVerified: '2026-09-06' }],
    borders: [{ id: 'ngoma', name: 'Ngoma Bridge', countries: ['botswana', 'namibia'], route: 'Kasane to Zambezi Region', hours: '07:00–18:00', documents: ['Passport'] }],
    guides: { namibia: { title: 'Namibia Planning Guide', country: 'namibia', topics: ['Visa & Safety'], sections: [{ title: 'Entry', body: 'Passport rules' }] } },
    visaHealth: [{ id: 'namibia', name: 'Namibia', visa: { label: 'eVisa' }, health: { label: 'Malaria north' }, note: 'Check exact passport rules.' }],
};

test('search index covers core travel content and country filters', () => {
    const index = buildSiteSearchIndex(sources);
    assert.ok(index.some(item => item.type === 'destination' && item.href === '/countries/namibia'));
    assert.ok(index.some(item => item.type === 'route' && item.sourceId === 'namibia-loop'));
    assert.ok(index.some(item => item.type === 'park' && item.href === '/parks/kruger'));
    assert.ok(index.some(item => item.type === 'border' && item.href === '/borders/ngoma'));
    assert.ok(index.some(item => item.type === 'guide' && item.href === '/guides/planning/namibia'));
    assert.ok(index.some(item => item.type === 'practical' && item.href === '/plan'));
    assert.ok(index.some(item => item.type === 'practical' && item.href === '/routes#journey-composer'));
    assert.deepEqual(searchCountryOptions(index, sources.countries).map(item => item.id), ['botswana', 'namibia', 'south-africa']);
});

test('search ranks exact titles and expands traveller language', () => {
    const index = buildSiteSearchIndex(sources);
    assert.equal(searchSiteIndex(index, 'Kruger')[0].title, 'Kruger National Park');
    assert.equal(searchSiteIndex(index, 'family drive')[0].sourceId, 'namibia-loop');
    assert.ok(searchSiteIndex(index, 'malaria', { country: 'namibia' }).some(item => item.type === 'practical'));
    assert.ok(searchSiteIndex(index, 'passport', { type: 'guide' }).some(item => item.title === 'Namibia Planning Guide'));
    assert.equal(searchSiteIndex(index, 'multi country itinerary')[0].title, 'Multi-country journey builder');
});

test('search normalizes accents and applies type and country filters safely', () => {
    const index = buildSiteSearchIndex(sources);
    assert.equal(normalizeSearchText('  São Tomé & 4x4 '), 'sao tome 4x4');
    assert.deepEqual(searchSiteIndex(index, 'wildlife', { type: 'park' }).map(item => item.type), ['park']);
    assert.deepEqual(searchSiteIndex(index, 'wildlife', { country: 'botswana' }).map(item => item.type), ['destination']);
    assert.deepEqual(searchSiteIndex(index, 'nonexistentterm'), []);
});
