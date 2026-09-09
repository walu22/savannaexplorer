import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import journeyPresets from '../data/journey-presets.json' with { type: 'json' };
import {
    composeJourney,
    countryOrders,
    journeyToTripTemplate,
    normalizeJourneyPreferences,
    reorderJourneyCountries,
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
        countryOrder: [],
        startCountry: 'botswana',
        days: 30,
        vehicle: 'suv',
        vehicleArrangement: 'rental',
        theme: 'wildlife',
        startDate: '',
        transferDepartures: {},
    });
});

test('every classic regional preset builds through the researched journey composer', () => {
    assert.equal(journeyPresets.presets.length, 6);
    for (const preset of journeyPresets.presets) {
        const journey = composeJourney(routeCollection.routes, borders, preset);
        assert.equal(journey.status, 'ready', `${preset.id} should produce a connected journey`);
        assert.equal(journey.totalDays, preset.days);
        assert.deepEqual(new Set(journey.countryOrder), new Set(preset.countries));
        assert.equal(journey.crossings.length, preset.countries.length - 1);
    }
});

test('country order can be moved without losing or duplicating selections', () => {
    assert.deepEqual(
        reorderJourneyCountries(['namibia', 'botswana', 'zambia'], 'zambia', 0),
        ['zambia', 'namibia', 'botswana'],
    );
    assert.deepEqual(
        reorderJourneyCountries(['namibia', 'botswana'], 'unknown', 1),
        ['namibia', 'botswana'],
    );
});

test('composer honours an explicit connected country order', () => {
    const result = composeJourney(routeCollection.routes, borders, {
        countries: ['south-africa', 'eswatini', 'mozambique'],
        countryOrder: ['eswatini', 'south-africa', 'mozambique'],
        days: 30,
        vehicle: '4x4',
        theme: 'culture',
    });
    assert.equal(result.status, 'ready');
    assert.deepEqual(result.countryOrder, ['eswatini', 'south-africa', 'mozambique']);
});

test('composer rejects an explicit order without a direct neighbouring border', () => {
    const result = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'mozambique', 'botswana'],
        countryOrder: ['namibia', 'mozambique', 'botswana'],
        days: 30,
        vehicle: '4x4',
        theme: 'wildlife',
    });
    assert.equal(result.status, 'not-connected');
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
    assert.equal(result.segments.reduce((total, segment) => total + segment.days, 0) + result.borderDays, 30);
    assert.ok(result.borderDays >= result.crossings.length);
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
    const transferStops = trip.routeDays.flatMap(day => day.stops);
    const borderDay = trip.routeDays.find(day => day.stops.some(stop => stop.type === 'border'));
    assert.ok(transferStops.some(stop => /Cached planning estimate|confidence threshold/.test(stop.notes)));
    assert.ok(borderDay.stops.some(stop => /Carry:/.test(stop.notes)));
    assert.ok(transferStops.some(stop => stop.type === 'accommodation'));
    assert.match(trip.templateRouteId, /^journey:/);
});
