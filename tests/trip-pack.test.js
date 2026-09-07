import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTripPack } from '../js/lib/trip-pack.js';

const trip = {
    id: 'trip-1',
    name: 'Namibia family safari',
    startDate: '2026-11-01',
    endDate: '2026-11-04',
    countries: ['Namibia'],
    travellers: 4,
    notes: 'Insurance policy ABC-PRIVATE',
    routeDays: [{ date: '2026-11-01', title: 'Etosha arrival', stops: [{ time: '14:30', name: 'Andersson Gate', location: 'Etosha South', notes: 'Check in before sunset' }] }],
    bookings: [{ id: 'one', type: 'stay', provider: 'Etosha Camp', reference: 'ET-SECRET-42', date: '2026-11-02', status: 'confirmed' }],
    expenses: { items: [{ currency: 'NAD', amount: 1200 }, { currency: 'NAD', amount: 300 }, { currency: 'USD', amount: 50 }] },
    packing: { packedItems: ['hat', 'boots'] },
    readiness: { completedTaskIds: ['entry-rules'], customTasks: [] },
};

const emergencies = [{ country: 'Namibia', flag: '🇳🇦', numbers: 'Police 10111', sourceUrl: 'https://example.gov.na', lastVerified: '2026-09-06' }];

test('offline pack contains the traveller journey and practical snapshots', () => {
    const pack = buildTripPack(trip, { generatedAt: '2026-09-06T18:00:00Z', emergencies });

    assert.equal(pack.filename, 'namibia-family-safari-offline-pack.html');
    assert.equal(pack.stats.routeDays, 1);
    assert.equal(pack.stats.bookings, 1);
    assert.match(pack.html, /Etosha arrival/);
    assert.match(pack.html, /Andersson Gate/);
    assert.match(pack.html, /Etosha Camp/);
    assert.match(pack.html, /NAD/);
    assert.match(pack.html, /1,500/);
    assert.match(pack.html, /Police 10111/);
    assert.match(pack.html, /2<\/p><p class="trip-pack-caption">items marked packed/);
});

test('private notes and booking references are excluded by default', () => {
    const pack = buildTripPack(trip, { generatedAt: '2026-09-06T18:00:00Z', emergencies });

    assert.doesNotMatch(pack.html, /ABC-PRIVATE/);
    assert.doesNotMatch(pack.html, /ET-SECRET-42/);
    assert.match(pack.html, /Private references excluded/);
});

test('traveller can explicitly include private notes and references', () => {
    const pack = buildTripPack(trip, {
        generatedAt: '2026-09-06T18:00:00Z',
        emergencies,
        includeNotes: true,
        includeReferences: true,
    });

    assert.match(pack.html, /ABC-PRIVATE/);
    assert.match(pack.html, /ET-SECRET-42/);
    assert.equal(pack.stats.includesNotes, true);
    assert.equal(pack.stats.includesReferences, true);
});

test('trip pack escapes traveller-authored content', () => {
    const pack = buildTripPack({ ...trip, name: '<script>alert(1)</script>' }, { generatedAt: '2026-09-06T18:00:00Z' });
    assert.doesNotMatch(pack.html, /<script>/);
    assert.match(pack.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('cross-border pack includes selected crossing, vehicle paperwork and corridor stay', () => {
    const crossBorderTrip = {
        ...trip,
        countries: ['Namibia', 'Botswana'],
        operations: {
            borderSelections: { 'botswana|namibia': 'mamuno' },
            vehicleContext: 'rented',
            completedDocumentIds: ['document:valid-passport-and-any-required-visa-or-evisa'],
        },
    };
    const pack = buildTripPack(crossBorderTrip, { generatedAt: '2026-09-07T18:00:00Z' });

    assert.equal(pack.stats.borderPairs, 1);
    assert.ok(pack.stats.borderDocuments >= 6);
    assert.equal(pack.stats.completedBorderDocuments, 1);
    assert.match(pack.html, /Cross-border action pack/);
    assert.match(pack.html, /Mamuno \/ Trans-Kalahari/);
    assert.match(pack.html, /24 hours/);
    assert.match(pack.html, /Rental vehicle/);
    assert.match(pack.html, /Rental agreement covering every destination country/);
    assert.match(pack.html, /Confirmed or packed/);
    assert.match(pack.html, /Still to confirm or pack/);
    assert.match(pack.html, /East Gate Namibia/);
    assert.match(pack.html, /Straight-line distance, not driving distance/);
    assert.match(pack.html, /https:\/\/dailynews\.gov\.bw\/news-detail\/80127/);
});

test('cross-border pack warns when the chosen crossing differs from the saved route', () => {
    const pack = buildTripPack({
        ...trip,
        countries: ['Namibia', 'Botswana'],
        routeDays: [{ stops: [{ type: 'border', name: 'Ngoma Bridge' }] }],
        operations: { borderSelections: { 'botswana|namibia': 'mamuno' }, vehicleContext: 'owned' },
    }, { generatedAt: '2026-09-07T18:00:00Z' });

    assert.match(pack.html, /Route mismatch/);
    assert.match(pack.html, /Driving itinerary needs updating/);
    assert.match(pack.html, /differs from the border in the saved route/);
});

test('single-country packs omit cross-border paperwork cleanly', () => {
    const pack = buildTripPack(trip, { generatedAt: '2026-09-07T18:00:00Z' });

    assert.equal(pack.stats.borderPairs, 0);
    assert.doesNotMatch(pack.html, /Cross-border action pack/);
    assert.match(pack.html, /<span>03<\/span><div><h2>Readiness checklist/);
});
