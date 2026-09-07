import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import {
    composeJourney,
    countryOrders,
    journeyToTripTemplate,
    normalizeJourneyPreferences,
} from '../js/lib/journey-composer.js';

test('journey preferences keep two to four supported countries and safe limits', () => {
    assert.deepEqual(normalizeJourneyPreferences({
        countries: ['namibia', 'botswana', 'namibia', 'invalid', 'zambia', 'zimbabwe', 'malawi'],
        startCountry: 'botswana',
        days: 60,
        vehicle: 'invalid',
        theme: 'invalid',
        startDate: 'not-a-date',
    }), {
        countries: ['namibia', 'botswana', 'zambia', 'zimbabwe'],
        startCountry: 'botswana',
        days: 30,
        vehicle: 'suv',
        theme: 'wildlife',
        startDate: '',
    });
});

test('country ordering only returns directly connected road sequences', () => {
    const orders = countryOrders(['namibia', 'botswana', 'zambia'], borders, 'namibia');
    assert.ok(orders.some(order => order.join('|') === 'namibia|botswana|zambia'));
    assert.ok(orders.every(order => order[0] === 'namibia'));
    assert.ok(orders.every(order => order.slice(1).every((country, index) => borders.some(border =>
        border.countries.includes(order[index]) && border.countries.includes(country)))));
});

test('composer builds an explainable journey that uses the exact available days', () => {
    const result = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'botswana', 'zambia'],
        startCountry: 'namibia',
        days: 30,
        vehicle: '4x4',
        theme: 'wildlife',
        startDate: '2026-10-01',
    });

    assert.equal(result.status, 'ready');
    assert.deepEqual(result.countryOrder, ['namibia', 'botswana', 'zambia']);
    assert.equal(result.segments.length, 3);
    assert.equal(result.crossings.length, 2);
    assert.equal(result.segments.reduce((total, segment) => total + segment.days, 0) + result.crossings.length, 30);
    assert.ok(result.segments.every(segment => segment.themeMatch));
});

test('composer explains when a selected window is too short', () => {
    const result = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'botswana', 'zambia'],
        startCountry: 'namibia',
        days: 10,
        vehicle: '4x4',
        theme: 'wildlife',
    });
    assert.equal(result.status, 'needs-more-days');
    assert.ok(result.requiredDays > 10);
    assert.match(result.message, /Allow at least/);
});

test('journey template includes border days and becomes an editable dated trip', () => {
    const journey = composeJourney(routeCollection.routes, borders, {
        countries: ['south-africa', 'eswatini'],
        startCountry: 'south-africa',
        days: 14,
        vehicle: 'suv',
        theme: 'wildlife',
        startDate: '2026-11-05',
    });
    const trip = journeyToTripTemplate(journey);

    assert.equal(journey.status, 'ready');
    assert.equal(trip.routeDays.length, 14);
    assert.equal(trip.startDate, '2026-11-05');
    assert.equal(trip.endDate, '2026-11-18');
    assert.deepEqual(trip.countries, ['South Africa', 'Eswatini']);
    assert.ok(trip.routeDays.some(day => day.stops.some(stop => stop.type === 'border')));
    assert.match(trip.templateRouteId, /^journey:/);
});
