import test from 'node:test';
import assert from 'node:assert/strict';
import collection from '../data/route-collections.json' with { type: 'json' };
import logisticsCollection from '../data/route-logistics.json' with { type: 'json' };
import editorialCollection from '../data/route-logistics-editorial.json' with { type: 'json' };
import {
    durationBand,
    filterRouteCollection,
    routeHasValidMap,
    routeToTripTemplate,
} from '../js/lib/route-collection.js';
import { editorialLegFor, formatDriveMinutes, routeLegPlan, routeLogisticsSummary } from '../js/lib/route-logistics.js';

const routes = collection.routes;
const expectedCountries = ['botswana', 'eswatini', 'lesotho', 'malawi', 'mozambique', 'namibia', 'south-africa', 'zambia', 'zimbabwe'];

test('the first two releases contain nineteen map-ready routes covering every country', () => {
    assert.equal(routes.length, 19);
    assert.deepEqual([...new Set(routes.flatMap(route => route.countryIds))].sort(), expectedCountries);
    assert.equal(new Set(routes.map(route => route.id)).size, routes.length);
    assert.deepEqual(routes.filter(route => !routeHasValidMap(route)).map(route => route.id), []);
});

test('Batch 2 deeper-travel routes are present', () => {
    const expected = [
        'namibia-arid-northwest-etosha',
        'namibia-four-rivers-wetlands',
        'botswana-salt-pans-chobe',
        'zambia-eastern-safari-route',
        'zimbabwe-eastern-highlands',
        'mozambique-gorongosa-central-highlands',
        'malawi-northern-highlands-lake',
        'lesotho-southern-rustic-route',
        'eswatini-northern-community-nature',
    ];
    assert.deepEqual(expected.filter(id => !routes.some(route => route.id === id)), []);
});

test('every route has planning, safety and source metadata', () => {
    routes.forEach(route => {
        assert.ok(route.promise);
        assert.ok(route.duration.min >= 2);
        assert.ok(route.duration.max >= route.duration.min);
        assert.ok(['standard', 'suv', '4x4'].includes(route.vehicle.id));
        assert.ok(route.bestSeason.label);
        assert.ok(route.themes.length >= 2);
        assert.ok(route.travellerTypes.length >= 1);
        assert.ok(route.highlights.length >= 3);
        assert.ok(route.warnings.length >= 1);
        assert.ok(route.phases.length >= 3);
        assert.ok(route.officialSources.every(source => source.url.startsWith('https://')));
        assert.match(route.lastReviewed, /^\d{4}-\d{2}$/);
    });
});

test('route filters combine country, duration, vehicle and theme', () => {
    assert.equal(filterRouteCollection(routes, { country: 'south-africa' }).length, 2);
    assert.equal(filterRouteCollection(routes, { country: 'botswana', vehicle: '4x4' })[0].id, 'botswana-okavango-chobe');
    assert.ok(filterRouteCollection(routes, { duration: 'short' }).every(route => durationBand(route) === 'short'));
    assert.ok(filterRouteCollection(routes, { theme: 'wildlife' }).every(route => route.themes.includes('wildlife')));
});

test('a route template becomes an editable My Safari trip', () => {
    const route = routes.find(item => item.id === 'eswatini-royal-heartland');
    const trip = routeToTripTemplate(route, '2026-10-03');
    assert.equal(trip.templateRouteId, route.id);
    assert.deepEqual(trip.countries, ['Eswatini']);
    assert.equal(trip.routeDays.length, route.duration.min);
    assert.equal(trip.startDate, '2026-10-03');
    assert.equal(trip.endDate, '2026-10-06');
    assert.ok(trip.routeDays.every(day => day.title && day.stops.length));
});

test('every route creates a complete editable day-by-day template', () => {
    routes.forEach(route => {
        const trip = routeToTripTemplate(route, '2026-10-03');
        assert.equal(trip.routeDays.length, route.duration.min, route.id);
        assert.ok(trip.routeDays.every(day => day.title && day.stops.length), route.id);
    });
});

test('every route has one cached logistics leg between each pair of stops', () => {
    routes.forEach(route => {
        const logistics = logisticsCollection.routes[route.id];
        assert.ok(logistics, route.id);
        assert.equal(logistics.legs.length, route.stops.length - 1, route.id);
        logistics.legs.forEach((leg, index) => {
            assert.equal(leg.fromStopId, route.stops[index].id, route.id);
            assert.equal(leg.toStopId, route.stops[index + 1].id, route.id);
            assert.ok(leg.distanceKm > 0, route.id);
            assert.ok(leg.driveMinutes > 0, route.id);
            assert.ok(['high', 'medium', 'low'].includes(leg.confidence), route.id);
        });
    });
});

test('logistics summaries exclude low-confidence remote legs', () => {
    const logistics = logisticsCollection.routes['botswana-okavango-chobe'];
    const summary = routeLogisticsSummary(logistics);
    assert.equal(summary.legCount, 5);
    assert.equal(summary.mappedLegCount, 1);
    assert.equal(summary.needsLocalCheck, true);
    assert.equal(formatDriveMinutes(135), '2 hr 15 min');
});

test('every low-confidence leg has dated editorial guidance', () => {
    routes.forEach(route => {
        const logistics = logisticsCollection.routes[route.id];
        const lowConfidence = logistics.legs.filter(leg => leg.confidence === 'low');
        if (!lowConfidence.length) return;
        const editorial = editorialCollection.routes[route.id];
        assert.ok(editorial, route.id);
        assert.ok(editorial.fuelAnchors.length >= 2, route.id);
        assert.ok(editorial.gatePermitNotes.length >= 1, route.id);
        assert.ok(editorial.sources.every(source => source.url.startsWith('https://')), route.id);
        lowConfidence.forEach(leg => assert.ok(editorialLegFor(editorial, leg)?.guidance, `${route.id}: ${leg.fromStopId}`));
    });
    assert.match(editorialCollection.meta.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test('every route has reviewed fuel, overnight and access planning', () => {
    routes.forEach(route => {
        const editorial = editorialCollection.routes[route.id];
        assert.ok(editorial, route.id);
        assert.ok(editorial.fuelAnchors.length >= 2, route.id);
        assert.ok(editorial.overnightAnchors.length >= 2, route.id);
        assert.ok(editorial.gatePermitNotes.length >= 1, route.id);
        assert.ok(editorial.sources.length >= 2, route.id);
        assert.ok(editorial.sources.every(source => source.url.startsWith('https://')), route.id);
    });
});

test('My Safari templates include a reviewed drive plan before each destination', () => {
    routes.forEach(route => {
        const trip = routeToTripTemplate(route, '2026-10-03');
        const driveStops = trip.routeDays.flatMap(day => day.stops).filter(stop => stop.name.startsWith('Drive: '));
        const plannedStopIds = route.phases.flatMap(phase => phase.stopIds)
            .filter((stopId, index, ids) => index === 0 || stopId !== ids[index - 1]);
        assert.equal(driveStops.length, plannedStopIds.length - 1, route.id);
        assert.ok(driveStops.every(stop => stop.notes.includes('Fuel plan:') && stop.notes.includes('Reviewed 2026-09-03')), route.id);
    });

    const zambia = routes.find(route => route.id === 'zambia-eastern-safari-route');
    const trip = routeToTripTemplate(zambia, '2026-10-03');
    const chipataMfuwe = trip.routeDays.flatMap(day => day.stops).find(stop => stop.name === 'Drive: Chipata → Mfuwe');
    assert.match(chipataMfuwe.notes, /Official source estimate: 123 km · 2 hr\./);

    const botswanaPlan = routeLegPlan('botswana-okavango-chobe', 'maun', 'moremi');
    assert.equal(botswanaPlan.distanceKm, null);
    assert.equal(botswanaPlan.driveMinutes, null);
});

test('official leg guidance can replace a low-confidence map estimate', () => {
    const logistics = logisticsCollection.routes['zambia-eastern-safari-route'];
    const editorial = editorialCollection.routes['zambia-eastern-safari-route'];
    const summary = routeLogisticsSummary(logistics, editorial);
    assert.equal(summary.mappedLegCount, 2);
    assert.equal(summary.needsLocalCheck, true);
    assert.ok(summary.distanceKm >= 123);
});
