import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    destinationMatchSummary,
    normalizeDestinationPreferences,
    rankDestinations,
} from '../js/lib/destination-matcher.js';

const matcher = JSON.parse(readFileSync(new URL('../data/destination-matcher.json', import.meta.url), 'utf8'));
const weather = JSON.parse(readFileSync(new URL('../data/country-weather.json', import.meta.url), 'utf8'));
const routes = JSON.parse(readFileSync(new URL('../data/route-collections.json', import.meta.url), 'utf8')).routes;

test('matcher profiles cover every supported country with transparent trade-offs', () => {
    const countryIds = matcher.profiles.map(profile => profile.countryId);
    assert.equal(matcher.lastReviewed, '2026-09');
    assert.equal(new Set(countryIds).size, 9);
    matcher.profiles.forEach(profile => {
        assert.ok(profile.minDays >= 4);
        assert.ok(profile.maxDays >= profile.minDays);
        assert.ok(profile.interests.length >= 4);
        assert.equal(profile.strengths.length, 2);
        assert.ok(profile.tradeoff.length > 20);
        assert.equal(weather[profile.countryId].length, 12);
    });
});

test('preferences are normalized to safe planning limits', () => {
    assert.deepEqual(normalizeDestinationPreferences({
        month: 99,
        days: 200,
        interests: ['wildlife', 'wildlife', 'unknown'],
        budget: 'unlimited',
        driving: 'motorbike',
        pace: 'race',
    }), {
        month: 11,
        days: 30,
        interests: ['wildlife'],
        budget: 'balanced',
        driving: 'suv',
        pace: 'balanced',
    });
});

test('September wildlife and landscape planning surfaces Namibia with a usable route', () => {
    const results = rankDestinations(matcher.profiles, weather, routes, {
        month: 8,
        days: 12,
        interests: ['wildlife', 'landscapes'],
        budget: 'balanced',
        driving: 'suv',
        pace: 'balanced',
    });
    assert.equal(results[0].countryId, 'namibia');
    assert.equal(results[0].route?.id, 'namibia-essentials-extended');
    assert.deepEqual(results[0].interestMatches, ['wildlife', 'landscapes']);
});

test('route suggestions are withheld when the selected trip is materially too short', () => {
    const results = rankDestinations(matcher.profiles, weather, routes, {
        month: 8,
        days: 4,
        interests: ['wildlife'],
        budget: 'value',
        driving: 'standard',
        pace: 'fast',
    });
    const namibia = results.find(result => result.countryId === 'namibia');
    assert.equal(namibia.route, null);
});

test('summary is concise and contains only normalized trip preferences', () => {
    assert.equal(destinationMatchSummary(normalizeDestinationPreferences({
        month: 3,
        days: 5,
        interests: ['culture', 'road-trip'],
    })), 'April · 5 days · culture, road trip');
});
