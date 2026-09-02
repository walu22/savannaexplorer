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
import {
    disableTripShare,
    enableTripShare,
    getCurrentSession,
    getTripShareStatus,
    loadSharedTrip,
    onAuthChange,
    sendSignInLink,
    signOut,
    startAutomaticTripSync,
    syncTrips,
} from '../lib/trip-cloud.js';

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

function setCloudStatus(message = '', error = false) {
    const status = document.getElementById('my-safari-cloud-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', error);
}

function friendlyCloudError(error) {
    const message = String(error?.message || error || 'Cloud sync failed.');
    if (/user_trips|schema cache|relation .* does not exist/i.test(message)) {
        return 'Cloud storage is being set up. Your trips are still safe on this device.';
    }
    if (/fetch|network|offline/i.test(message)) return 'You appear to be offline. Local trip changes are still saved.';
    return message;
}

function renderAccount(session) {
    const signedOut = document.getElementById('my-safari-signed-out');
    const signedIn = document.getElementById('my-safari-signed-in');
    if (signedOut) signedOut.hidden = Boolean(session);
    if (signedIn) signedIn.hidden = !session;
    const email = document.getElementById('my-safari-account-email');
    if (email) email.textContent = session?.user?.email || '';
    const shareButton = document.getElementById('my-safari-share');
    if (shareButton) shareButton.hidden = !session;
    if (!session) document.getElementById('my-safari-share-panel')?.setAttribute('hidden', '');
}

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const input = document.getElementById('my-safari-share-url');
    input?.select();
    document.execCommand('copy');
}

function renderSharedTrip(trip) {
    const view = document.getElementById('my-safari-shared-view');
    if (!view) return;
    view.hidden = false;
    document.getElementById('shared-safari-name').textContent = trip.name || 'Shared safari';
    document.getElementById('shared-safari-meta').textContent = `${formatDates(trip)} · ${trip.countries?.length ? trip.countries.join(', ') : 'Destinations not listed'}`;
    const expenses = Array.isArray(trip.expenses?.items) ? trip.expenses.items.length : 0;
    const packed = Array.isArray(trip.packing?.packedItems) ? trip.packing.packedItems.length : 0;
    document.getElementById('shared-safari-expenses').textContent = `${expenses} item${expenses === 1 ? '' : 's'}`;
    document.getElementById('shared-safari-packing').textContent = `${packed} packed`;
    document.getElementById('shared-safari-updated').textContent = trip.updatedAt
        ? new Date(trip.updatedAt).toLocaleDateString()
        : 'Not provided';

    const notesSection = document.getElementById('shared-safari-notes-section');
    notesSection.hidden = !trip.notes;
    document.getElementById('shared-safari-notes').textContent = trip.notes || '';

    const latestPlan = Array.isArray(trip.aiItinerary?.history)
        ? [...trip.aiItinerary.history].reverse().find(item => item?.role === 'assistant')?.content
        : '';
    const itinerarySection = document.getElementById('shared-safari-itinerary-section');
    itinerarySection.hidden = !latestPlan;
    document.getElementById('shared-safari-itinerary').textContent = latestPlan || '';
}

async function openSharedTrip(token) {
    ['my-safari-cloud', 'my-safari-create-form', 'my-safari-trip-list', 'my-safari-empty', 'my-safari-workspace']
        .forEach(id => document.getElementById(id)?.setAttribute('hidden', ''));
    const view = document.getElementById('my-safari-shared-view');
    view.hidden = false;
    document.getElementById('shared-safari-name').textContent = 'Opening shared safari…';
    try {
        const trip = await loadSharedTrip(token);
        if (!trip) throw new Error('This share link is unavailable or has been turned off.');
        renderSharedTrip(trip);
    } catch (error) {
        document.getElementById('shared-safari-name').textContent = 'Shared safari unavailable';
        document.getElementById('shared-safari-meta').textContent = friendlyCloudError(error);
    }
}

async function refreshSharePanel() {
    const panel = document.getElementById('my-safari-share-panel');
    const input = document.getElementById('my-safari-share-url');
    const active = getActiveTrip();
    if (!panel || !input || !active || !await getCurrentSession()) {
        if (panel) panel.hidden = true;
        return;
    }
    try {
        const url = await getTripShareStatus(active.id);
        panel.hidden = !url;
        input.value = url || '';
    } catch {
        panel.hidden = true;
    }
}

async function syncAndReport(successMessage = 'Trips are up to date.') {
    setCloudStatus('Syncing trips…');
    try {
        const result = await syncTrips();
        setCloudStatus(`${successMessage} ${result?.count ?? 0} trip${result?.count === 1 ? '' : 's'} in the cloud.`);
        await refreshSharePanel();
    } catch (error) {
        setCloudStatus(friendlyCloudError(error), true);
    }
}

export async function initMySafari() {
    const root = document.getElementById('hub-my-safari');
    if (!root) return;
    renderCountryChoices();
    renderDashboard();

    const shareToken = new URLSearchParams(window.location.search).get('share');
    if (shareToken) {
        await openSharedTrip(shareToken);
        return;
    }

    let session = await getCurrentSession();
    renderAccount(session);
    if (session) await syncAndReport('Signed in and synced.');

    onAuthChange(nextSession => {
        const wasSignedIn = Boolean(session);
        session = nextSession;
        renderAccount(session);
        if (session && !wasSignedIn) {
            window.setTimeout(() => syncAndReport('Signed in and synced.'), 0);
        }
        if (!session) setCloudStatus('Signed out. Trips remain available on this device.');
    });
    startAutomaticTripSync(error => setCloudStatus(friendlyCloudError(error), true));

    document.getElementById('my-safari-signin-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const email = new FormData(event.currentTarget).get('email')?.toString().trim();
        if (!email) return;
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        setCloudStatus('Sending your secure sign-in link…');
        try {
            await sendSignInLink(email);
            setCloudStatus(`Sign-in link sent to ${email}. You can keep planning while you check your inbox.`);
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById('my-safari-sync')?.addEventListener('click', () => syncAndReport());
    document.getElementById('my-safari-signout')?.addEventListener('click', async () => {
        try {
            await signOut();
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

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
        if (button) {
            setActiveTrip(button.dataset.tripSelect);
            refreshSharePanel();
        }
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

    document.getElementById('my-safari-share')?.addEventListener('click', async () => {
        const active = getActiveTrip();
        if (!active) return;
        setCloudStatus('Creating a read-only share link…');
        try {
            const url = await enableTripShare(active.id);
            document.getElementById('my-safari-share-url').value = url;
            document.getElementById('my-safari-share-panel').hidden = false;
            await copyText(url);
            setCloudStatus('Share link created and copied.');
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    document.getElementById('my-safari-copy-share')?.addEventListener('click', async () => {
        const url = document.getElementById('my-safari-share-url')?.value;
        if (!url) return;
        await copyText(url);
        setCloudStatus('Share link copied.');
    });

    document.getElementById('my-safari-stop-share')?.addEventListener('click', async () => {
        const active = getActiveTrip();
        if (!active || !confirm('Turn off this share link?')) return;
        try {
            await disableTripShare(active.id);
            document.getElementById('my-safari-share-panel').hidden = true;
            setCloudStatus('Sharing stopped. The old link no longer works.');
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    window.addEventListener(TRIP_CHANGE_EVENT, renderDashboard);
}
