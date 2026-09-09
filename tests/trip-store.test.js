import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createTrip,
    deleteTrip,
    duplicateTrip,
    getActiveTrip,
    readTripState,
    setActiveTrip,
    updateActiveTrip,
} from '../js/lib/trip-store.js';

function memoryStorage(seed = {}) {
    const values = new Map(Object.entries(seed));
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
    };
}

test('first My Safari trip imports existing local planning data', () => {
    const storage = memoryStorage({
        'savanna-expense-tracker-v1': JSON.stringify({ linkedItineraryId: 'route-1', items: [{ id: 'expense-1' }] }),
        se_packing_list: JSON.stringify(['boots', 'hat']),
        se_ai_saved_itinerary_v1: JSON.stringify({ version: 1, history: [{ role: 'assistant', content: 'Plan' }] }),
    });

    const trip = createTrip({ name: 'Namibia', countries: ['Namibia'] }, storage);

    assert.equal(getActiveTrip(storage).id, trip.id);
    assert.equal(trip.expenses.linkedItineraryId, 'route-1');
    assert.equal(trip.expenses.items.length, 1);
    assert.deepEqual(trip.packing.packedItems, ['boots', 'hat']);
    assert.equal(trip.aiItinerary.version, 1);
});

test('switching trips keeps their workspace data separate', () => {
    const storage = memoryStorage();
    const first = createTrip({ name: 'Botswana' }, storage);
    updateActiveTrip({ expenses: { linkedItineraryId: '', items: [{ id: 'a' }] } }, storage);
    const second = createTrip({ name: 'Zambia' }, storage);
    updateActiveTrip({ packing: { month: 'jul', style: 'fly-in', packedItems: ['coat'] } }, storage);

    assert.equal(getActiveTrip(storage).id, second.id);
    setActiveTrip(first.id, storage);
    assert.equal(getActiveTrip(storage).expenses.items.length, 1);
    assert.deepEqual(getActiveTrip(storage).packing.packedItems, []);
});

test('packing settings use generator values and normalize obsolete saved styles', () => {
    const storage = memoryStorage();
    createTrip({ name: 'Packing test' }, storage);

    assert.equal(getActiveTrip(storage).packing.style, 'self-drive');
    updateActiveTrip({ packing: { month: 'invalid', style: 'safari', packedItems: ['hat', 'hat'] } }, storage);

    assert.equal(getActiveTrip(storage).packing.month, 'jan');
    assert.equal(getActiveTrip(storage).packing.style, 'self-drive');
    assert.deepEqual(getActiveTrip(storage).packing.packedItems, ['hat']);
});

test('trips can be duplicated and deleted without losing the original', () => {
    const storage = memoryStorage();
    const original = createTrip({ name: 'Southern Africa', countries: ['Namibia', 'Botswana'] }, storage);
    updateActiveTrip({ notes: 'Remember permits' }, storage);
    const copy = duplicateTrip(original.id, storage);

    assert.equal(copy.notes, 'Remember permits');
    assert.deepEqual(copy.countries, original.countries);
    assert.equal(readTripState(storage).trips.length, 2);
    assert.equal(deleteTrip(copy.id, storage), true);
    assert.equal(readTripState(storage).trips.length, 1);
    assert.equal(getActiveTrip(storage).id, original.id);
});

test('route templates create trips with editable days and preserve their source', () => {
    const storage = memoryStorage();
    const trip = createTrip({
        name: 'Royal Heartland',
        countries: ['Eswatini'],
        templateRouteId: 'eswatini-royal-heartland',
        routeDays: [{ id: 'day-1', title: 'Mbabane', stops: [{ id: 'stop-1', name: 'Mbabane', type: 'stay' }] }],
        notes: 'Check current road information.',
    }, storage);

    assert.equal(trip.templateRouteId, 'eswatini-royal-heartland');
    assert.equal(trip.routeDays[0].stops[0].name, 'Mbabane');
    assert.equal(trip.notes, 'Check current road information.');
    assert.equal(duplicateTrip(trip.id, storage).templateRouteId, 'eswatini-royal-heartland');
});

test('trip readiness progress is saved and duplicated with the trip', () => {
    const storage = memoryStorage();
    const trip = createTrip({ name: 'Ready Namibia', countries: ['Namibia'] }, storage);
    updateActiveTrip({ readiness: { completedTaskIds: ['entry-rules', 'health-plan'] } }, storage);

    assert.deepEqual(getActiveTrip(storage).readiness.completedTaskIds, ['entry-rules', 'health-plan']);
    const copy = duplicateTrip(trip.id, storage);
    assert.deepEqual(copy.readiness.completedTaskIds, ['entry-rules', 'health-plan']);
});

test('trip details and booking records survive storage and duplication', () => {
    const storage = memoryStorage();
    const trip = createTrip({ name: 'Family safari', countries: ['Namibia'], travellers: 4 }, storage);
    updateActiveTrip({ bookings: [{ id: 'booking-one', type: 'stay', provider: 'Etosha Camp', reference: 'ET-42', status: 'confirmed' }] }, storage);

    assert.equal(getActiveTrip(storage).travellers, 4);
    assert.equal(getActiveTrip(storage).bookings[0].status, 'confirmed');
    const copy = duplicateTrip(trip.id, storage);
    assert.equal(copy.travellers, 4);
    assert.equal(copy.bookings[0].reference, 'ET-42');
});

test('border and vehicle action-centre progress survives storage and duplication', () => {
    const storage = memoryStorage();
    const trip = createTrip({ name: 'Border trip', countries: ['Namibia', 'Botswana'] }, storage);
    updateActiveTrip({ operations: {
        borderSelections: { 'botswana|namibia': 'mamuno' },
        vehicleContext: 'rented',
        vehicleCapability: '4x4',
        completedDocumentIds: ['document:valid-passport'],
    } }, storage);

    const saved = getActiveTrip(storage);
    assert.equal(saved.operations.borderSelections['botswana|namibia'], 'mamuno');
    assert.equal(saved.operations.vehicleContext, 'rented');
    assert.equal(saved.operations.vehicleCapability, '4x4');
    assert.deepEqual(saved.operations.completedDocumentIds, ['document:valid-passport']);
    assert.deepEqual(duplicateTrip(trip.id, storage).operations, saved.operations);
});
