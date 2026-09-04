import test from 'node:test';
import assert from 'node:assert/strict';
import discovery from '../data/country-discovery.json' with { type: 'json' };
import countries from '../data/countries.json' with { type: 'json' };
import { getFullCountryData } from '../js/lib/merge-country.js';
import { inferSpotTags } from '../js/lib/spot-tags.js';

const countryIds = Object.keys(countries);

test('every country has curated highlights and activity-season guidance', () => {
    assert.deepEqual(Object.keys(discovery).sort(), [...countryIds].sort());
    countryIds.forEach(countryId => {
        const data = getFullCountryData(countryId);
        assert.ok(data.highlights.length >= 4, countryId);
        assert.ok(data.bestTimeFor.length >= 4, countryId);
        data.highlights.forEach(item => assert.ok(item.icon && item.label, countryId));
        data.bestTimeFor.forEach(item => assert.ok(item.icon && item.activity && item.months, countryId));
    });
});

test('every merged destination receives concise discovery tags', () => {
    countryIds.forEach(countryId => {
        getFullCountryData(countryId).spots.forEach(spot => {
            const tags = inferSpotTags(spot);
            assert.ok(tags.length >= 1 && tags.length <= 3, `${countryId}: ${spot.name}`);
            assert.equal(new Set(tags).size, tags.length, `${countryId}: ${spot.name}`);
        });
    });
});
