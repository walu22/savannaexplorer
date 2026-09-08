import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRouteDays } from '../js/lib/trip-route.js';
import {
    addCampsiteToTrip,
    assignStayToDay,
    buildStayPlacementAudit,
    removeBookingAndPlacement,
} from '../js/lib/trip-stay-placement.js';

const campsites = JSON.parse(readFileSync(new URL('../data/campsites.json', import.meta.url), 'utf8')).sites;

test('a campsite can become one dated booking and one linked itinerary stop', () => {
    const routeDays = createRouteDays('2026-10-10', '2026-10-11');
    const trip = { countries: ['Botswana'], routeDays, bookings: [], operations: { vehicleCapability: '4x4' } };
    const site = campsites.find(item => item.id === 'third-bridge-campsite');
    const result = addCampsiteToTrip(trip, site, routeDays[0].id);

    assert.equal(result.placed, true);
    assert.equal(result.booking.date, '2026-10-10');
    assert.equal(result.booking.routeDayId, routeDays[0].id);
    assert.equal(result.booking.sourceId, site.id);
    assert.equal(result.routeDays[0].stops.length, 1);
    assert.equal(result.routeDays[0].stops[0].bookingId, result.booking.id);
    assert.equal(result.routeDays[0].stops[0].sourceUrl, site.sourceUrl);
    assert.equal(buildStayPlacementAudit({ ...trip, ...result }).issues.length, 0);
});

test('moving or removing a stay keeps its booking and itinerary stop in sync', () => {
    const routeDays = createRouteDays('2026-10-10', '2026-10-11');
    const site = campsites.find(item => item.id === 'sesriem-campsite');
    const trip = { countries: ['Namibia'], routeDays, bookings: [], operations: { vehicleCapability: 'standard' } };
    const added = addCampsiteToTrip(trip, site, routeDays[0].id);
    const moved = assignStayToDay({ ...trip, ...added }, added.booking.id, routeDays[1].id);

    assert.equal(moved.booking.date, '2026-10-11');
    assert.equal(moved.routeDays[0].stops.length, 0);
    assert.equal(moved.routeDays[1].stops.length, 1);
    const removed = removeBookingAndPlacement({ ...trip, ...moved }, added.booking.id);
    assert.equal(removed.bookings.length, 0);
    assert.equal(removed.routeDays.flatMap(day => day.stops).length, 0);
});

test('stay audit catches unplaced, country and vehicle conflicts', () => {
    const routeDays = createRouteDays('2026-10-10', '2026-10-10');
    const site = campsites.find(item => item.id === 'third-bridge-campsite');
    const trip = { countries: ['Namibia'], routeDays, bookings: [], operations: { vehicleCapability: 'standard' } };
    const added = addCampsiteToTrip(trip, site);
    const audit = buildStayPlacementAudit({ ...trip, ...added });

    assert.ok(audit.issues.some(issue => issue.code === 'unplaced'));
    assert.ok(audit.issues.some(issue => issue.code === 'country-mismatch'));
    assert.ok(audit.issues.some(issue => issue.code === 'vehicle-mismatch'));
    assert.equal(audit.blockers, 2);
});
