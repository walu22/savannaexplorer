import { ITINERARY_COUNTRIES } from './itinerary-route-countries.js';
import { loadExpenses, setExpenseLinkedItinerary } from '../modules/expense-tracker.js';

let syncLock = false;

function setCountrySelection(countryIds) {
    document.querySelectorAll('#trip-country-picker input[type="checkbox"]').forEach(input => {
        input.checked = countryIds.includes(input.value);
    });
}

/** Update trip planner route select + country chips (no expense side-effects). */
export function applyPlannerRoute(routeId) {
    const routeSelect = document.getElementById('trip-route-select');
    if (!routeSelect) return;

    const id = routeId || '';
    if (routeSelect.value !== id) routeSelect.value = id;

    const ids = ITINERARY_COUNTRIES[id];
    if (ids?.length) setCountrySelection(ids);
}

export function getPlannerRouteId() {
    return document.getElementById('trip-route-select')?.value || '';
}

export function updateSyncNotes(routeId) {
    const linked = Boolean(routeId);
    const plannerNote = document.getElementById('trip-route-sync-note');
    const expenseNote = document.getElementById('expense-route-sync-note');
    if (plannerNote) plannerNote.hidden = !linked;
    if (expenseNote) expenseNote.hidden = !linked;
}

/**
 * Keep trip planner route template and expense tracker budget template in sync.
 * @param {string} routeId
 * @param {{ source?: 'planner' | 'expense' | 'external' }} options
 */
export async function syncPlannerExpenseRoute(routeId, { source = 'external' } = {}) {
    const id = routeId || '';
    if (syncLock) return;
    syncLock = true;

    try {
        if (source !== 'planner') {
            applyPlannerRoute(id);
        }
        if (source !== 'expense') {
            await setExpenseLinkedItinerary(id, { refresh: true });
        }
    } finally {
        syncLock = false;
        updateSyncNotes(id);
    }
}

/** On load, reconcile saved expense link with the planner dropdown. */
export async function initPlannerExpenseSync() {
    const savedRoute = loadExpenses().linkedItineraryId || '';
    const plannerRoute = getPlannerRouteId();

    if (savedRoute && savedRoute !== plannerRoute) {
        await syncPlannerExpenseRoute(savedRoute, { source: 'expense' });
    } else if (plannerRoute && plannerRoute !== savedRoute) {
        await syncPlannerExpenseRoute(plannerRoute, { source: 'planner' });
    }
}
