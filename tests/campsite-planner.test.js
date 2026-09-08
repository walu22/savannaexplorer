import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { campsiteBooking, campsiteCoverage, filterCampsites, sortCampsites } from '../js/lib/campsite-planner.js';

const data = JSON.parse(readFileSync(new URL('../data/campsites.json', import.meta.url), 'utf8'));
const supportedCountries = [
    'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe',
    'mozambique', 'malawi', 'lesotho', 'eswatini',
];

test('campsite planner covers every supported country with traceable records', () => {
    const coverage = campsiteCoverage(data.sites);
    assert.equal(coverage.countries, 9);
    assert.ok(coverage.sites >= 9);
    supportedCountries.forEach(country => assert.ok(data.sites.some(site => site.country === country), country));
    data.sites.forEach(site => {
        assert.match(site.sourceUrl, /^https:\/\//, site.id);
        assert.match(site.reviewedOn, /^\d{4}-\d{2}-\d{2}$/, site.id);
        assert.match(site.reviewBy, /^\d{4}-\d{2}-\d{2}$/, site.id);
        assert.ok(site.accessNote.length >= 40, site.id);
        assert.ok(site.seasonNote.length >= 35, site.id);
        assert.ok(site.safetyNote.length >= 30, site.id);
        assert.ok(['standard', 'high-clearance', '4x4'].includes(site.accessLevel), site.id);
    });
});

test('combined filters expose only sites matching every traveller constraint', () => {
    const matches = filterCampsites(data.sites, {
        country: 'namibia',
        setting: 'inside-park',
        access: 'standard',
        facility: 'pool',
    });
    assert.deepEqual(matches.map(site => site.id), ['sesriem-campsite', 'okaukuejo-campsite']);
});

test('access sort presents standard roads before higher-commitment tracks', () => {
    const sorted = sortCampsites(data.sites);
    const accessLevels = sorted.map(site => site.accessLevel);
    assert.ok(accessLevels.indexOf('standard') < accessLevels.indexOf('high-clearance'));
    assert.ok(accessLevels.indexOf('high-clearance') < accessLevels.indexOf('4x4'));
});

test('shortlisting creates an honest undated planned stay', () => {
    const booking = campsiteBooking(data.sites[0]);
    assert.deepEqual(booking, {
        type: 'stay',
        provider: data.sites[0].name,
        reference: 'Shortlisted from Campsite Finder',
        date: '',
        status: 'planned',
    });
});
