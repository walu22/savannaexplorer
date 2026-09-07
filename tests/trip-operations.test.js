import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import { routeToTripTemplate } from '../js/lib/route-collection.js';
import { composeJourney, journeyToTripTemplate } from '../js/lib/journey-composer.js';
import { buildTripOperationsBrief } from '../js/lib/trip-operations.js';

test('single-country routes produce a useful fuel, access and overnight brief', () => {
    const route = routeCollection.routes.find(item => item.id === 'namibia-essentials-extended');
    const trip = routeToTripTemplate(route, '2026-10-01');
    const brief = buildTripOperationsBrief(trip);

    assert.equal(brief.routeCount, 1);
    assert.deepEqual(brief.countries, ['Namibia']);
    assert.equal(brief.crossings.length, 0);
    assert.ok(brief.fuelAnchors.some(anchor => anchor.name === 'Khorixas'));
    assert.ok(brief.overnightAnchors.includes('Okaukuejo'));
    assert.ok(brief.accessNotes.some(item => /Etosha|dark/i.test(item.text)));
    assert.ok(brief.sources.every(source => /^https:\/\//.test(source.url)));
});

test('multi-country journeys expose the selected border and researched corridor stay', () => {
    const journey = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'botswana'],
        startCountry: 'namibia',
        days: 22,
        vehicle: '4x4',
        theme: 'wildlife',
        startDate: '2026-10-01',
    });
    const brief = buildTripOperationsBrief(journeyToTripTemplate(journey));

    assert.equal(brief.crossings.length, 1);
    assert.ok(brief.crossings[0].documents.length >= 3);
    assert.equal(brief.crossings[0].stays[0].borderId, brief.crossings[0].id);
    assert.equal(brief.crossings[0].stays[0].availability, 'check-direct');
    assert.ok(brief.actions.some(action => /overnight confirmations/i.test(action)));
});

test('manual multi-country trips do not pretend a crossing has been chosen', () => {
    const brief = buildTripOperationsBrief({
        countries: ['Namibia', 'Botswana'],
        routeDays: [],
        bookings: [],
    });

    assert.equal(brief.status, 'planning');
    assert.ok(brief.actions.some(action => /exact land crossing/i.test(action)));
    assert.equal(brief.crossings.length, 0);
});

test('every published route can produce a traceable operations brief', () => {
    routeCollection.routes.forEach(route => {
        const brief = buildTripOperationsBrief(routeToTripTemplate(route));
        assert.equal(brief.routeCount, 1, route.id);
        assert.ok(brief.routeTitles.includes(route.title), route.id);
        assert.ok(brief.sources.length >= 1, `${route.id} retains reviewed sources`);
        assert.ok(brief.sources.every(source => /^https:\/\//.test(source.url)), route.id);
        assert.equal(brief.road.mappedLegCount <= brief.road.legCount, true, route.id);
    });
});
