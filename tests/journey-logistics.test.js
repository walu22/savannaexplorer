import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import transferData from '../data/journey-transfer-logistics.json' with { type: 'json' };
import {
    borderArrivalCheck,
    buildTransferPlan,
    parsePublishedHours,
    transferKey,
} from '../js/lib/journey-logistics.js';

test('transfer cache covers every generated candidate and identifies its source', () => {
    assert.equal(Object.keys(transferData.transfers).length, transferData.meta.candidateCount);
    assert.ok(transferData.meta.estimatedCount > 0);
    assert.match(transferData.meta.source, /OpenStreetMap/);
    assert.match(transferData.meta.disclaimer, /Not live navigation/);
});

test('published hours parser only treats unqualified schedules as known', () => {
    assert.deepEqual(parsePublishedHours('24 hours'), { status: 'known', alwaysOpen: true, label: '24 hours' });
    assert.equal(parsePublishedHours('06:00–18:00').status, 'known');
    assert.equal(parsePublishedHours('08:00–16:00 Oct–Mar; 08:00–15:00 Apr–Sep').status, 'partial');
    assert.equal(parsePublishedHours('Confirm current daily hours').status, 'partial');
});

test('arrival check warns when the cached approach reaches a border after closing', () => {
    assert.equal(borderArrivalCheck('06:00–18:00', '07:00', 120).status, 'open');
    const late = borderArrivalCheck('06:00–18:00', '16:30', 120);
    assert.equal(late.status, 'closed');
    assert.equal(late.arrivalTime, '18:30');
});

test('transfer plan exposes usable estimates and withholds only low-confidence legs', () => {
    const routesById = Object.fromEntries(routeCollection.routes.map(route => [route.id, route]));
    const bordersById = Object.fromEntries(borders.map(border => [border.id, border]));
    const entries = Object.values(transferData.transfers);
    const usable = entries.find(item => item.status === 'estimated' && item.confidence !== 'low');
    const low = entries.find(item => item.confidence === 'low');
    assert.ok(usable);
    assert.ok(low);

    const goodPlan = buildTransferPlan(routesById[usable.fromRouteId], bordersById[usable.borderId], routesById[usable.toRouteId]);
    assert.equal(goodPlan.status, 'estimated');
    assert.ok(goodPlan.totalDistanceKm > 0);
    assert.equal(goodPlan.key, transferKey(usable.fromRouteId, usable.borderId, usable.toRouteId));

    const withheldPlan = buildTransferPlan(routesById[low.fromRouteId], bordersById[low.borderId], routesById[low.toRouteId]);
    assert.equal(withheldPlan.status, 'partial');
    assert.equal(withheldPlan.totalDistanceKm, null);
    assert.equal([withheldPlan.approach, withheldPlan.onward].filter(Boolean).length, 1);
    assert.match(withheldPlan.dayGuidance, /Confirm/);
});
