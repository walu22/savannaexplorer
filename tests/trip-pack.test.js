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
