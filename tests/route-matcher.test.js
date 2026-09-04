import test from 'node:test';
import assert from 'node:assert/strict';
import collection from '../data/route-collections.json' with { type: 'json' };
import { normalizeRoutePreferences, rankRouteMatches, scoreRouteMatch } from '../js/lib/route-matcher.js';

const routes = collection.routes;

test('route matcher normalizes days and unsupported choices safely', () => {
    assert.deepEqual(normalizeRoutePreferences({ country: 'unknown', days: 90, vehicle: 'motorbike', theme: 'unknown' }), {
        country: 'all',
        days: 30,
        vehicle: 'suv',
        theme: 'wildlife',
    });
});

test('route matcher ranks three explainable options inside a preferred country', () => {
    const matches = rankRouteMatches(routes, {
        country: 'namibia',
        days: 12,
        vehicle: 'suv',
        theme: 'landscapes',
    });
    assert.equal(matches.length, 3);
    assert.ok(matches.every(match => match.route.countryIds.includes('namibia')));
    assert.ok(matches[0].score >= matches[1].score);
    assert.ok(matches[0].reasons.some(reason => reason.includes('12-day')));
    assert.ok(matches[0].reasons.some(reason => reason.includes('landscapes')));
});

test('route matcher flags vehicle and duration mismatches instead of hiding them', () => {
    const expedition = routes.find(route => route.id === 'botswana-okavango-chobe');
    const match = scoreRouteMatch(expedition, {
        country: 'botswana',
        days: 6,
        vehicle: 'standard',
        theme: 'wildlife',
    });
    assert.ok(match.cautions.some(caution => caution.includes('at least 10 days')));
    assert.ok(match.cautions.some(caution => caution.includes('4x4')));
});
