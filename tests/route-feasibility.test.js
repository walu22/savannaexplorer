import test from 'node:test';
import assert from 'node:assert/strict';
import collection from '../data/route-collections.json' with { type: 'json' };
import { evaluateRouteFeasibility, normalizeFeasibilityPreferences } from '../js/lib/route-feasibility.js';

const route = id => collection.routes.find(item => item.id === id);

test('a well-matched route exposes six transparent trip-fit checks', () => {
    const result = evaluateRouteFeasibility(route('south-africa-garden-route'), {
        days: 10,
        vehicle: 'standard',
        startDate: '2026-11-10',
    });

    assert.equal(result.status, 'ready');
    assert.equal(result.alignedCount, 6);
    assert.deepEqual(result.checks.map(item => item.id), ['duration', 'vehicle', 'season', 'driving', 'borders', 'overnights']);
    assert.ok(result.checks.every(item => item.detail.length >= 35));
});

test('too little time and an unsuitable vehicle are blockers, not vague cautions', () => {
    const result = evaluateRouteFeasibility(route('botswana-okavango-chobe'), {
        days: 7,
        vehicle: 'standard',
        startDate: '2026-08-01',
    });

    assert.equal(result.status, 'blocker');
    assert.equal(result.blockerCount, 2);
    assert.equal(result.checks.find(item => item.id === 'duration').status, 'blocker');
    assert.equal(result.checks.find(item => item.id === 'vehicle').status, 'blocker');
});

test('season ranges that cross the year boundary are interpreted correctly', () => {
    const result = evaluateRouteFeasibility(route('south-africa-garden-route'), {
        days: 9,
        vehicle: 'standard',
        startDate: '2027-01-15',
    });

    assert.equal(result.checks.find(item => item.id === 'season').status, 'ready');
});

test('missing dates and locally checked drive legs remain explicit cautions', () => {
    const result = evaluateRouteFeasibility(route('namibia-essentials-extended'), {
        days: 12,
        vehicle: 'suv',
    });

    assert.equal(result.status, 'check');
    assert.equal(result.checks.find(item => item.id === 'season').value, 'Add a start date');
    assert.match(result.checks.find(item => item.id === 'driving').value, /local check/);
});

test('trip-fit preferences are normalized to safe supported values', () => {
    assert.deepEqual(normalizeFeasibilityPreferences(route('south-africa-garden-route'), {
        days: 999,
        vehicle: 'motorbike',
        startDate: 'soon',
    }), { days: 60, vehicle: 'standard', startDate: '' });
});

test('every published route starts with an honest non-blocking assessment', () => {
    collection.routes.forEach(item => {
        const result = evaluateRouteFeasibility(item);
        assert.equal(result.blockerCount, 0, item.id);
        assert.equal(result.checks.length, 6, item.id);
        assert.equal(result.checks.find(check => check.id === 'season').status, 'check', item.id);
    });
});
