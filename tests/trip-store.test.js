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
    updateActiveTrip({ packing: { month: 'jul', style: 'safari', packedItems: ['coat'] } }, storage);

    assert.equal(getActiveTrip(storage).id, second.id);
    setActiveTrip(first.id, storage);
    assert.equal(getActiveTrip(storage).expenses.items.length, 1);
    assert.deepEqual(getActiveTrip(storage).packing.packedItems, []);
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
