import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import { composeJourney, journeyToTripTemplate } from '../js/lib/journey-composer.js';
import {
    buildTripActionCentre,
    setTripBorderSelection,
    setTripDocumentComplete,
    setTripVehicleContext,
} from '../js/lib/trip-action-centre.js';

test('saved journeys inherit their selected border and wait for vehicle context', () => {
    const journey = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'botswana'], startCountry: 'namibia', days: 22, vehicle: '4x4', theme: 'wildlife',
    });
    const action = buildTripActionCentre(journeyToTripTemplate(journey));

    assert.equal(action.pairs.length, 1);
    assert.equal(action.allSelected, true);
    assert.equal(action.selectedCrossings.length, 1);
    assert.equal(action.vehicleContext, '');
    assert.ok(action.documents.length >= 3);
    assert.equal(action.isComplete, false);
});

test('manual trips can select a crossing and generate rented-vehicle paperwork', () => {
    let operations = setTripBorderSelection({}, 'botswana|namibia', 'mamuno');
    operations = setTripVehicleContext(operations, 'rented');
    let action = buildTripActionCentre({ countries: ['Namibia', 'Botswana'], operations });

    assert.equal(action.selectedCrossings[0].id, 'mamuno');
    assert.ok(action.documents.some(document => /rental agreement/i.test(document.label)));
    assert.ok(action.documents.some(document => /authorisation letter/i.test(document.label)));

    action.documents.forEach(document => {
        operations = setTripDocumentComplete(operations, document.id, true);
    });
    action = buildTripActionCentre({ countries: ['Namibia', 'Botswana'], operations });
    assert.equal(action.completedCount, action.totalCount);
    assert.equal(action.isComplete, true);
});

test('invalid selections and vehicle values are not trusted', () => {
    const action = buildTripActionCentre({
        countries: ['Namibia', 'Botswana'],
        operations: { borderSelections: { 'botswana|namibia': 'not-a-border' }, vehicleContext: 'hovercraft' },
    });

    assert.equal(action.selectedCrossings.length, 0);
    assert.equal(action.vehicleContext, '');
    assert.equal(action.allSelected, false);
});

test('changing a generated crossing flags the saved road transfer as stale', () => {
    const journey = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'botswana'], startCountry: 'namibia', days: 22, vehicle: '4x4', theme: 'wildlife',
    });
    const trip = journeyToTripTemplate(journey);
    const initial = buildTripActionCentre(trip);
    const alternative = initial.pairs[0].candidates.find(border => border.id !== initial.pairs[0].selectedId);
    assert.ok(alternative);
    const operations = setTripBorderSelection({}, initial.pairs[0].key, alternative.id);
    const changed = buildTripActionCentre({ ...trip, operations });

    assert.equal(changed.routeUpdateRequired, true);
    assert.equal(changed.pairs[0].needsRouteUpdate, true);
    assert.equal(changed.isComplete, false);
});
