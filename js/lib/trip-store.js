export const TRIP_STORE_KEY = 'se_my_safari_v1';
export const TRIP_CHANGE_EVENT = 'se:trip-change';

const LEGACY_EXPENSE_KEY = 'savanna-expense-tracker-v1';
const LEGACY_PACKING_KEY = 'se_packing_list';
const LEGACY_AI_KEY = 'se_ai_saved_itinerary_v1';

function emptyState() {
    return { version: 1, activeTripId: '', trips: [] };
}

function safeParse(value, fallback = null) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function storageOrNull(storage) {
    return storage || globalThis.localStorage || null;
}

function cleanTrip(trip) {
    if (!trip || typeof trip !== 'object' || !trip.id) return null;
    return {
        id: String(trip.id),
        name: String(trip.name || 'Untitled safari').slice(0, 80),
        startDate: String(trip.startDate || ''),
        endDate: String(trip.endDate || ''),
        countries: Array.isArray(trip.countries) ? trip.countries.filter(Boolean).map(String).slice(0, 9) : [],
        notes: String(trip.notes || '').slice(0, 2000),
        createdAt: trip.createdAt || new Date().toISOString(),
        updatedAt: trip.updatedAt || new Date().toISOString(),
        aiItinerary: trip.aiItinerary && typeof trip.aiItinerary === 'object' ? trip.aiItinerary : null,
        expenses: {
            linkedItineraryId: String(trip.expenses?.linkedItineraryId || ''),
            items: Array.isArray(trip.expenses?.items) ? trip.expenses.items : [],
        },
        packing: {
            month: String(trip.packing?.month || 'jan'),
            style: String(trip.packing?.style || 'safari'),
            packedItems: Array.isArray(trip.packing?.packedItems) ? trip.packing.packedItems.map(String) : [],
        },
    };
}

export function readTripState(storage) {
    const target = storageOrNull(storage);
    if (!target) return emptyState();
    const parsed = safeParse(target.getItem(TRIP_STORE_KEY), emptyState());
    const trips = Array.isArray(parsed?.trips) ? parsed.trips.map(cleanTrip).filter(Boolean) : [];
    const activeTripId = trips.some(trip => trip.id === parsed?.activeTripId)
        ? parsed.activeTripId
        : (trips[0]?.id || '');
    return { version: 1, activeTripId, trips };
}

function emitTripChange(action, tripId) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(TRIP_CHANGE_EVENT, { detail: { action, tripId } }));
}

function writeTripState(state, storage, action, tripId) {
    const target = storageOrNull(storage);
    if (!target) return state;
    target.setItem(TRIP_STORE_KEY, JSON.stringify(state));
    emitTripChange(action, tripId);
    return state;
}

function legacyData(storage) {
    const expenses = safeParse(storage?.getItem(LEGACY_EXPENSE_KEY), {});
    const packedItems = safeParse(storage?.getItem(LEGACY_PACKING_KEY), []);
    const aiItinerary = safeParse(storage?.getItem(LEGACY_AI_KEY), null);
    return {
        expenses: {
            linkedItineraryId: String(expenses?.linkedItineraryId || ''),
            items: Array.isArray(expenses?.items) ? expenses.items : [],
        },
        packing: {
            month: 'jan',
            style: 'safari',
            packedItems: Array.isArray(packedItems) ? packedItems.map(String) : [],
        },
        aiItinerary: aiItinerary && typeof aiItinerary === 'object' ? aiItinerary : null,
    };
}

export function getActiveTrip(storage) {
    const state = readTripState(storage);
    return state.trips.find(trip => trip.id === state.activeTripId) || null;
}

export function createTrip(input, storage) {
    const target = storageOrNull(storage);
    const state = readTripState(target);
    const now = new Date().toISOString();
    const imported = state.trips.length ? {} : legacyData(target);
    const trip = cleanTrip({
        id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: input?.name,
        startDate: input?.startDate,
        endDate: input?.endDate,
        countries: input?.countries,
        createdAt: now,
        updatedAt: now,
        ...imported,
    });
    state.trips.unshift(trip);
    state.activeTripId = trip.id;
    writeTripState(state, target, 'create', trip.id);
    return trip;
}

export function updateTrip(tripId, patch, storage) {
    const target = storageOrNull(storage);
    const state = readTripState(target);
    const index = state.trips.findIndex(trip => trip.id === tripId);
    if (index < 0) return null;
    const current = state.trips[index];
    const nextPatch = typeof patch === 'function' ? patch(current) : patch;
    state.trips[index] = cleanTrip({ ...current, ...nextPatch, id: current.id, updatedAt: new Date().toISOString() });
    writeTripState(state, target, 'update', tripId);
    return state.trips[index];
}

export function updateActiveTrip(patch, storage) {
    const active = getActiveTrip(storage);
    return active ? updateTrip(active.id, patch, storage) : null;
}

export function setActiveTrip(tripId, storage) {
    const target = storageOrNull(storage);
    const state = readTripState(target);
    if (!state.trips.some(trip => trip.id === tripId)) return null;
    state.activeTripId = tripId;
    writeTripState(state, target, 'active', tripId);
    return state.trips.find(trip => trip.id === tripId);
}

export function replaceTripState(nextState, storage) {
    const target = storageOrNull(storage);
    const trips = Array.isArray(nextState?.trips) ? nextState.trips.map(cleanTrip).filter(Boolean) : [];
    const activeTripId = trips.some(trip => trip.id === nextState?.activeTripId)
        ? nextState.activeTripId
        : (trips[0]?.id || '');
    const state = { version: 1, activeTripId, trips };
    return writeTripState(state, target, 'cloud', activeTripId);
}

export function duplicateTrip(tripId, storage) {
    const source = readTripState(storage).trips.find(trip => trip.id === tripId);
    if (!source) return null;
    const copy = createTrip({
        name: `${source.name} copy`.slice(0, 80),
        startDate: source.startDate,
        endDate: source.endDate,
        countries: source.countries,
    }, storage);
    return updateTrip(copy.id, {
        notes: source.notes,
        aiItinerary: source.aiItinerary,
        expenses: source.expenses,
        packing: source.packing,
    }, storage);
}

export function deleteTrip(tripId, storage) {
    const target = storageOrNull(storage);
    const state = readTripState(target);
    const before = state.trips.length;
    state.trips = state.trips.filter(trip => trip.id !== tripId);
    if (state.trips.length === before) return false;
    if (state.activeTripId === tripId) state.activeTripId = state.trips[0]?.id || '';
    writeTripState(state, target, 'delete', tripId);
    return true;
}
