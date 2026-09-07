import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import corridorCollection from '../data/border-corridor-stays.json' with { type: 'json' };
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
    assert.equal(plan.corridorStays[0].id, 'east-gate-namibia');
    assert.equal(plan.corridorStays[0].availability, 'check-direct');
    assert.ok(plan.sources.every(source => /^https:\/\//.test(source.url)));
    assert.match(plan.disclaimer, /not endorsements or confirmed rooms/);
});

test('corridor stay collection is traceable, conservative and geographically consistent', () => {
    const radians = degrees => degrees * Math.PI / 180;
    const distanceKm = (from, to) => {
        const lat = radians(to.lat - from.lat);
        const lng = radians(to.lng - from.lng);
        const a = Math.sin(lat / 2) ** 2
            + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lng / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    assert.equal(corridorCollection.stays.length, 16);
    assert.equal(new Set(corridorCollection.stays.map(stay => stay.borderId)).size, 16);
    assert.deepEqual(
        ['plumtree', 'ponta-do-ouro', 'sani-pass', 'mwanza-zobue'].filter(borderId => !corridorCollection.stays.some(stay => stay.borderId === borderId)),
        [],
    );
    corridorCollection.stays.forEach(stay => {
        const border = borders.find(item => item.id === stay.borderId);
        assert.ok(border, `${stay.id} references a reviewed border`);
        assert.ok(border.countries.includes(stay.countryId), `${stay.id} is on a crossing country`);
        assert.ok(/^https:\/\//.test(stay.propertyUrl));
        assert.ok(/^https:\/\//.test(stay.sourceUrl));
        assert.ok(/^https:\/\//.test(stay.coordinateSourceUrl));
        assert.match(stay.lastVerified, /^2026-\d{2}-\d{2}$/);
        assert.equal(stay.availability, 'check-direct');
        assert.ok(['secure', 'available', 'unknown'].includes(stay.parking.status));
        assert.ok(['published', 'unknown'].includes(stay.checkIn.status));
        assert.ok(Math.abs(distanceKm(stay.coordinates, border.coordinates) - stay.distanceKm) < 0.11,
            `${stay.id} keeps its calculated straight-line distance honest`);
        if (stay.parking.status === 'secure') assert.match(stay.parking.label, /safe|secure|CCTV/i);
        if (stay.parking.status === 'unknown') assert.match(stay.parking.label, /not published|not confirmed/i);
        if (stay.checkIn.status === 'unknown') assert.match(stay.checkIn.label, /not published/i);
    });
});

test('unresearched crossings keep the honest country-directory fallback', () => {
    const fromSegment = { countryId: 'south-africa', countryName: 'South Africa', route: routeCollection.routes.find(route => route.countryIds[0] === 'south-africa') };
    const toSegment = { countryId: 'botswana', countryName: 'Botswana', route: routeCollection.routes.find(route => route.countryIds[0] === 'botswana') };
    const plan = buildStopoverPlan({ status: 'partial', schedulingMinutes: 420 }, borders.find(border => border.id === 'ramatlabama'), fromSegment, toSegment);

    assert.deepEqual(plan.corridorStays, []);
    assert.ok(plan.sources.length >= 2);
    assert.match(plan.disclaimer, /not confirmed rooms near/);
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
