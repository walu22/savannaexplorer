import test from 'node:test';
import assert from 'node:assert/strict';
import collection from '../data/route-collections.json' with { type: 'json' };
import { normalizeComparisonIds, routeCostSignal, toggleComparisonId } from '../js/lib/route-comparison.js';

const routes = collection.routes;

test('route comparison keeps unique valid selections up to three', () => {
    const ids = normalizeComparisonIds([
        'namibia-essentials-extended',
        'missing-route',
        'namibia-essentials-extended',
        'south-africa-garden-route',
        'botswana-okavango-chobe',
        'zambia-southern-zambezi',
    ], routes);
    assert.deepEqual(ids, [
        'namibia-essentials-extended',
        'south-africa-garden-route',
        'botswana-okavango-chobe',
    ]);
});

test('route comparison toggles selections and enforces its limit', () => {
    const first = toggleComparisonId([], 'namibia-essentials-extended', routes);
    assert.equal(first.outcome, 'added');
    const removed = toggleComparisonId(first.ids, 'namibia-essentials-extended', routes);
    assert.deepEqual(removed, { ids: [], outcome: 'removed' });

    const full = ['namibia-essentials-extended', 'south-africa-garden-route', 'botswana-okavango-chobe'];
    const limited = toggleComparisonId(full, 'zambia-southern-zambezi', routes);
    assert.equal(limited.outcome, 'limit');
    assert.deepEqual(limited.ids, full);
});

test('relative cost signal explains the route factors behind it', () => {
    const expedition = routes.find(route => route.id === 'botswana-okavango-chobe');
    const accessible = routes.find(route => route.id === 'eswatini-royal-heartland');
    const expeditionSignal = routeCostSignal(expedition);
    const accessibleSignal = routeCostSignal(accessible);

    assert.equal(expeditionSignal.level, 'Higher');
    assert.ok(expeditionSignal.reasons.includes('specialist 4×4'));
    assert.equal(accessibleSignal.level, 'Lower');
    assert.ok(accessibleSignal.reasons.length >= 1);
});
