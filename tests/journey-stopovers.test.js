import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import { composeJourney, journeyToTripTemplate } from '../js/lib/journey-composer.js';
import { buildStopoverPlan, estimateTransferDays } from '../js/lib/journey-stopovers.js';

test('transfer-day estimate protects a seven-hour daily driving ceiling', () => {
    assert.equal(estimateTransferDays({ status: 'estimated', totalDriveMinutes: 360 }), 1);
    assert.equal(estimateTransferDays({ status: 'estimated', totalDriveMinutes: 421 }), 2);
    assert.equal(estimateTransferDays({ status: 'estimated', totalDriveMinutes: 1260 }), 3);
    assert.equal(estimateTransferDays({ status: 'partial', schedulingMinutes: 420 }), 2);
});

test('stopover plan distinguishes reviewed booking sources from live availability', () => {
    const fromSegment = { countryId: 'namibia', countryName: 'Namibia', route: routeCollection.routes.find(route => route.countryIds[0] === 'namibia') };
    const toSegment = { countryId: 'botswana', countryName: 'Botswana', route: routeCollection.routes.find(route => route.countryIds[0] === 'botswana') };
    const plan = buildStopoverPlan({
        status: 'estimated',
        totalDriveMinutes: 900,
        approach: { driveMinutes: 600 },
        onward: { driveMinutes: 300 },
    }, borders.find(border => border.id === 'mamuno'), fromSegment, toSegment);

    assert.equal(plan.transferDays, 3);
    assert.equal(plan.stopoverNights, 2);
    assert.equal(plan.status, 'required');
    assert.ok(plan.sources.length >= 2);
    assert.ok(plan.sources.every(source => /^https:\/\//.test(source.url)));
    assert.match(plan.disclaimer, /not confirmed rooms/);
});

test('journey composition chooses practical transfer days and preserves the requested trip length', () => {
    const journey = composeJourney(routeCollection.routes, borders, {
        countries: ['namibia', 'botswana', 'zambia'],
        startCountry: 'namibia',
        days: 30,
        vehicle: '4x4',
        theme: 'wildlife',
    });
    const trip = journeyToTripTemplate(journey);

    assert.equal(journey.status, 'ready');
    assert.equal(trip.routeDays.length, 30);
    assert.equal(journey.borderDays, journey.stopovers.reduce((total, plan) => total + plan.transferDays, 0));
    assert.ok(journey.stopovers.some(plan => plan.stopoverNights > 0));
    assert.ok(trip.routeDays.flatMap(day => day.stops).some(stop => stop.type === 'accommodation'));
});
