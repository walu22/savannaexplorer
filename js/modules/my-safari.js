import {
    TRIP_CHANGE_EVENT,
    createTrip,
    deleteTrip,
    duplicateTrip,
    getActiveTrip,
    readTripState,
    setActiveTrip,
    updateTrip,
} from '../lib/trip-store.js';

const COUNTRIES = ['Botswana', 'Eswatini', 'Lesotho', 'Malawi', 'Mozambique', 'Namibia', 'South Africa', 'Zambia', 'Zimbabwe'];

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function formatDates(trip) {
    if (!trip.startDate && !trip.endDate) return 'Dates not set';
    const display = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open';
    return `${display(trip.startDate)} – ${display(trip.endDate)}`;
}

function renderCountryChoices() {
    const root = document.getElementById('my-safari-country-options');
    if (!root) return;
    root.innerHTML = COUNTRIES.map(country => `
        <label class="my-safari-country"><input type="checkbox" name="trip-country" value="${escapeHtml(country)}"> <span>${escapeHtml(country)}</span></label>
    `).join('');
}

function renderDashboard() {
    const state = readTripState();
    const active = getActiveTrip();
    const list = document.getElementById('my-safari-trip-list');
    const workspace = document.getElementById('my-safari-workspace');
    const empty = document.getElementById('my-safari-empty');
    if (!list || !workspace || !empty) return;

    list.innerHTML = state.trips.map(trip => `
        <button type="button" class="my-safari-trip-card${trip.id === state.activeTripId ? ' is-active' : ''}" data-trip-select="${escapeHtml(trip.id)}" aria-pressed="${trip.id === state.activeTripId}">
            <strong>${escapeHtml(trip.name)}</strong>
            <span>${escapeHtml(formatDates(trip))}</span>
            <small>${trip.countries.length ? escapeHtml(trip.countries.join(' · ')) : 'Countries not selected'}</small>
        </button>
    `).join('');

    empty.hidden = Boolean(active);
    workspace.hidden = !active;
    if (!active) return;

    document.getElementById('my-safari-active-name').textContent = active.name;
    document.getElementById('my-safari-active-meta').textContent = `${formatDates(active)} · ${active.countries.length ? active.countries.join(', ') : 'Add destinations when editing this trip'}`;
    document.getElementById('my-safari-notes').value = active.notes;
    document.getElementById('my-safari-itinerary-count').textContent = active.aiItinerary ? '1 saved' : 'None yet';
    document.getElementById('my-safari-expense-count').textContent = `${active.expenses.items.length} item${active.expenses.items.length === 1 ? '' : 's'}`;
    document.getElementById('my-safari-packing-count').textContent = `${active.packing.packedItems.length} packed`;
}

export function initMySafari() {
    const root = document.getElementById('hub-my-safari');
    if (!root) return;
    renderCountryChoices();
    renderDashboard();

    document.getElementById('my-safari-create-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = String(form.get('trip-name') || '').trim();
        if (!name) return;
        createTrip({
            name,
            startDate: String(form.get('trip-start') || ''),
            endDate: String(form.get('trip-end') || ''),
            countries: form.getAll('trip-country').map(String),
        });
        event.currentTarget.reset();
    });

    document.getElementById('my-safari-trip-list')?.addEventListener('click', event => {
        const button = event.target.closest('[data-trip-select]');
        if (button) setActiveTrip(button.dataset.tripSelect);
    });

    document.getElementById('my-safari-rename')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (!active) return;
        const name = prompt('Rename this trip', active.name)?.trim();
        if (name) updateTrip(active.id, { name: name.slice(0, 80) });
    });

    document.getElementById('my-safari-duplicate')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (active) duplicateTrip(active.id);
    });

    document.getElementById('my-safari-delete')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (!active || !confirm(`Delete “${active.name}” from this device?`)) return;
        deleteTrip(active.id);
    });

    document.getElementById('my-safari-notes')?.addEventListener('change', event => {
        const active = getActiveTrip();
        if (active) updateTrip(active.id, { notes: event.target.value.trim() });
    });

    window.addEventListener(TRIP_CHANGE_EVENT, renderDashboard);
}
