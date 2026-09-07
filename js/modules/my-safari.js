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
    acceptCollaborationInvite,
    createCollaborationInvite,
    disableTripShare,
    enableTripShare,
    getCollaborationActivity,
    getCollaborationManagement,
    getCurrentSession,
    getTripShareStatus,
    listMyCollaborations,
    loadCollaboration,
    loadSharedTrip,
    onAuthChange,
    removeCollaborator,
    revokeCollaborationInvite,
    saveCollaboration,
    sendSignInLink,
    signOut,
    startAutomaticTripSync,
    syncTrips,
} from '../lib/trip-cloud.js';
import { createRouteBuilder } from './trip-route-builder.js';
import { rebaseRouteDays } from '../lib/trip-route.js';
import {
    addReadinessTask,
    buildTripReadiness,
    removeReadinessTask,
    setReadinessReminderDays,
    setReadinessTask,
} from '../lib/trip-readiness.js';
import { addBooking, removeBooking, updateBooking } from '../lib/trip-bookings.js';
import { buildTripCalendar } from '../lib/trip-calendar.js';
import { buildTripPack } from '../lib/trip-pack.js';
import practical from '../../data/practical.json';
import tripPackCss from '../../css/trip-pack.css?inline';
import { trackProductEvent } from '../lib/product-analytics.js';
import { buildTripOperationsBrief } from '../lib/trip-operations.js';
import { formatDriveMinutes } from '../lib/route-logistics.js';

const COUNTRIES = ['Botswana', 'Eswatini', 'Lesotho', 'Malawi', 'Mozambique', 'Namibia', 'South Africa', 'Zambia', 'Zimbabwe'];
let collaborationPoll = null;
let openCollaborativeTrip = null;
let collaborationDirty = false;
let localRouteBuilder = null;
let sharedRouteBuilder = null;
let collaborationRouteBuilder = null;
let editingBookingId = '';

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

function renderCountryChoices(rootId = 'my-safari-country-options', inputName = 'trip-country', accessiblePrefix = '') {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.innerHTML = COUNTRIES.map(country => `
        <label class="my-safari-country"><input type="checkbox" name="${escapeHtml(inputName)}" value="${escapeHtml(country)}"${accessiblePrefix ? ` aria-label="${escapeHtml(accessiblePrefix)} ${escapeHtml(country)}"` : ''}> <span>${escapeHtml(country)}</span></label>
    `).join('');
}

function readinessTaskHtml(item) {
    return `
        <article class="my-safari-readiness-task${item.completed ? ' is-complete' : ''}" data-due-state="${item.dueState}">
            <label>
                <input type="checkbox" data-readiness-task="${escapeHtml(item.id)}"${item.completed ? ' checked' : ''}>
                <span class="my-safari-readiness-check" aria-hidden="true"><i class="fas fa-check"></i></span>
                <span class="my-safari-readiness-copy">
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${escapeHtml(item.description)}</small>
                </span>
            </label>
            <div class="my-safari-readiness-task-meta">
                <span class="my-safari-readiness-deadline"><i class="far fa-clock" aria-hidden="true"></i> ${escapeHtml(item.dueLabel)}</span>
                ${item.isCustom
        ? `<button type="button" class="my-safari-readiness-remove" data-readiness-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.title)}">Remove</button>`
        : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.linkLabel)} <i class="fas fa-arrow-right" aria-hidden="true"></i></a>`}
            </div>
        </article>
    `;
}

const BOOKING_ICONS = {
    stay: 'fa-bed', transport: 'fa-car', activity: 'fa-binoculars', permit: 'fa-ticket', other: 'fa-receipt',
};

const BOOKING_TYPE_LABELS = {
    stay: 'Stay', transport: 'Transport', activity: 'Activity', permit: 'Permit', other: 'Other',
};

const BOOKING_STATUS_LABELS = {
    planned: 'Planned', reserved: 'Reserved', confirmed: 'Confirmed',
};

function bookingDateLabel(value) {
    return value
        ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Date not set';
}

function downloadTripCalendar(trip) {
    const calendar = buildTripCalendar(trip);
    const blob = new Blob([calendar.content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = calendar.filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return calendar;
}

function tripPackOptions() {
    return {
        includeNotes: document.getElementById('my-safari-pack-notes')?.checked === true,
        includeReferences: document.getElementById('my-safari-pack-references')?.checked === true,
        emergencies: practical.emergencies || [],
        disclaimer: practical.meta?.disclaimer || '',
    };
}

function tripPackDocument(pack, title) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} — Offline trip pack</title><style>${tripPackCss.replace(/<\/style/gi, '<\\/style')}</style></head><body>${pack.html}</body></html>`;
}

function downloadTripPack(trip) {
    const pack = buildTripPack(trip, tripPackOptions());
    const blob = new Blob([tripPackDocument(pack, trip.name || 'My Safari')], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pack.filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return pack;
}

function printTripPack(trip) {
    const pack = buildTripPack(trip, tripPackOptions());
    const iframe = document.createElement('iframe');
    iframe.title = 'My Safari trip pack print preview';
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, { position: 'fixed', width: '0', height: '0', border: '0', opacity: '0' });
    document.body.append(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(tripPackDocument(pack, trip.name || 'My Safari'));
    doc.close();
    const cleanup = () => iframe.remove();
    const triggerPrint = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        window.setTimeout(cleanup, 8000);
    };
    iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
    if (doc.readyState === 'complete') window.setTimeout(triggerPrint, 150);
    else iframe.contentWindow.addEventListener('load', () => window.setTimeout(triggerPrint, 150), { once: true });
    return pack;
}

function renderBookings(trip) {
    const list = document.getElementById('my-safari-booking-list');
    const empty = document.getElementById('my-safari-booking-empty');
    const progress = document.getElementById('my-safari-bookings-progress');
    if (!list || !empty || !progress) return;
    const bookings = trip.bookings || [];
    const confirmed = bookings.filter(booking => booking.status === 'confirmed').length;
    progress.textContent = `${confirmed} of ${bookings.length} confirmed`;
    empty.hidden = Boolean(bookings.length);
    list.innerHTML = bookings.map(booking => `
        <article class="my-safari-booking-row">
            <span class="my-safari-booking-type" aria-hidden="true"><i class="fas ${BOOKING_ICONS[booking.type] || BOOKING_ICONS.other}"></i></span>
            <div class="my-safari-booking-copy"><strong>${escapeHtml(booking.provider)}</strong><small>${booking.reference ? `Reference: ${escapeHtml(booking.reference)}` : 'No reference recorded'}</small></div>
            <span class="my-safari-booking-date">${escapeHtml(bookingDateLabel(booking.date))}</span>
            <label class="sr-only" for="booking-status-${escapeHtml(booking.id)}">Status for ${escapeHtml(booking.provider)}</label>
            <select id="booking-status-${escapeHtml(booking.id)}" class="my-safari-booking-status-select" data-booking-status="${escapeHtml(booking.id)}">
                <option value="planned"${booking.status === 'planned' ? ' selected' : ''}>Planned</option>
                <option value="reserved"${booking.status === 'reserved' ? ' selected' : ''}>Reserved</option>
                <option value="confirmed"${booking.status === 'confirmed' ? ' selected' : ''}>Confirmed</option>
            </select>
            <div class="my-safari-booking-actions">
                <button type="button" data-booking-edit="${escapeHtml(booking.id)}" aria-label="Edit ${escapeHtml(booking.provider)}"><i class="fas fa-pen" aria-hidden="true"></i></button>
                <button type="button" class="my-safari-booking-remove" data-booking-remove="${escapeHtml(booking.id)}" aria-label="Remove ${escapeHtml(booking.provider)}"><i class="far fa-trash-can" aria-hidden="true"></i></button>
            </div>
            ${editingBookingId === booking.id ? `
                <form class="my-safari-booking-edit-form" data-booking-edit-form="${escapeHtml(booking.id)}">
                    <div class="my-safari-edit-head"><div><strong>Edit booking</strong><span>Update the saved record without losing its place in this trip.</span></div><button type="button" class="my-safari-icon-button" data-booking-edit-cancel aria-label="Cancel booking edit"><i class="fas fa-xmark" aria-hidden="true"></i></button></div>
                    <div class="my-safari-booking-edit-grid">
                        <label><span>Type</span><select name="booking-type">${Object.entries(BOOKING_TYPE_LABELS).map(([value, label]) => `<option value="${value}"${booking.type === value ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
                        <label><span>Provider or place</span><input name="booking-provider" type="text" maxlength="100" value="${escapeHtml(booking.provider)}" required></label>
                        <label><span>Reference</span><input name="booking-reference" type="text" maxlength="100" value="${escapeHtml(booking.reference)}"></label>
                        <label><span>Date</span><input name="booking-date" type="date" value="${escapeHtml(booking.date)}"></label>
                        <label><span>Status</span><select name="booking-status">${Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => `<option value="${value}"${booking.status === value ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
                    </div>
                    <div class="my-safari-edit-actions"><span></span><button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-check" aria-hidden="true"></i> Save booking</button></div>
                </form>
            ` : ''}
        </article>
    `).join('');
}

function openTripEditor(trip) {
    const form = document.getElementById('my-safari-edit-form');
    if (!form || !trip) return;
    form.elements['edit-trip-name'].value = trip.name;
    form.elements['edit-trip-start'].value = trip.startDate;
    form.elements['edit-trip-end'].value = trip.endDate;
    form.elements['edit-trip-travellers'].value = trip.travellers || 1;
    form.querySelectorAll('[name="edit-trip-country"]').forEach(input => {
        input.checked = trip.countries.includes(input.value);
    });
    document.getElementById('my-safari-edit-status').textContent = '';
    form.hidden = false;
    form.elements['edit-trip-name'].focus();
}

function renderReadiness(trip) {
    const root = document.getElementById('my-safari-readiness');
    const score = document.getElementById('my-safari-readiness-score');
    const next = document.getElementById('my-safari-readiness-next');
    const groups = document.getElementById('my-safari-readiness-groups');
    const reminderSelect = document.getElementById('my-safari-reminder-days');
    const reminderHint = document.getElementById('my-safari-reminder-hint');
    if (!root || !score || !next || !groups) return;
    const plan = buildTripReadiness(trip);
    if (reminderSelect) reminderSelect.value = String(plan.reminderDays);
    if (reminderHint) {
        const reminderLabel = plan.reminderDays < 0
            ? 'without alerts'
            : plan.reminderDays === 0
                ? 'with alerts on each due date'
                : `with alerts ${plan.reminderDays} day${plan.reminderDays === 1 ? '' : 's'} before each deadline`;
        reminderHint.textContent = `Calendar export includes incomplete deadlines ${reminderLabel}.`;
    }
    score.style.setProperty('--readiness-score', `${plan.score * 3.6}deg`);
    score.querySelector('strong').textContent = `${plan.score}%`;
    score.setAttribute('aria-label', `Trip readiness ${plan.score} percent, ${plan.completedCount} of ${plan.totalCount} checks complete`);

    if (plan.nextTask) {
        next.innerHTML = `
            <span>Next priority</span>
            <strong>${escapeHtml(plan.nextTask.title)}</strong>
            <small>${escapeHtml(plan.nextTask.dueLabel)}</small>
        `;
    } else {
        next.innerHTML = '<span>All checks complete</span><strong>Your planning checklist is ready for a final official-source review.</strong>';
    }

    groups.innerHTML = plan.categories.map(category => `
        <section class="my-safari-readiness-group" aria-labelledby="readiness-${category.id}-title">
            <header>
                <span class="my-safari-readiness-category-icon"><i class="fas ${category.icon}" aria-hidden="true"></i></span>
                <div><h6 id="readiness-${category.id}-title">${escapeHtml(category.label)}</h6><p>${category.completedCount} of ${category.tasks.length} complete</p></div>
            </header>
            <div>${category.tasks.map(readinessTaskHtml).join('')}</div>
        </section>
    `).join('');
    root.classList.toggle('is-complete', plan.score === 100);
}

function renderOperations(trip) {
    const root = document.getElementById('my-safari-operations');
    if (!root) return;
    const brief = buildTripOperationsBrief(trip);
    const roadCoverage = brief.road.legCount
        ? `${brief.road.mappedLegCount} of ${brief.road.legCount} legs`
        : 'No route legs yet';
    const routeLabel = brief.routeCount
        ? `${brief.routeCount} researched route${brief.routeCount === 1 ? '' : 's'}`
        : 'Route not selected';
    const borderMarkup = brief.crossings.length ? brief.crossings.map(crossing => `
        <details class="my-safari-operation-item">
            <summary><span><strong>${escapeHtml(crossing.name)}</strong><small>${escapeHtml(crossing.route)}</small></span><em>${escapeHtml(crossing.hours)}</em></summary>
            <div class="my-safari-operation-detail">
                <p><b>Carry:</b> ${escapeHtml(crossing.documents.join(' · '))}</p>
                <p><b>Charges:</b> ${escapeHtml(crossing.fees)}</p>
                ${crossing.stays[0] ? `<p><b>Corridor stay:</b> ${escapeHtml(crossing.stays[0].name)} · ${escapeHtml(crossing.stays[0].distanceKm)} km straight-line from the crossing · availability not checked.</p>` : '<p><b>Overnight:</b> Confirm a suitable corridor stay locally.</p>'}
                <a href="/borders/${escapeHtml(crossing.id)}">Open crossing guide <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </div>
        </details>`).join('') : `<div class="my-safari-operation-empty"><i class="fas fa-route" aria-hidden="true"></i><p><strong>${brief.countries.length > 1 ? 'Crossing not selected' : 'No land border in this itinerary'}</strong><span>${brief.countries.length > 1 ? 'Choose the exact crossing to unlock hours, documents and corridor stays.' : 'This route remains within one country.'}</span></p></div>`;
    const fuelMarkup = brief.fuelAnchors.length
        ? `<ul>${brief.fuelAnchors.slice(0, 5).map(anchor => `<li><strong>${escapeHtml(anchor.name)}</strong><span>${escapeHtml(anchor.note)}</span></li>`).join('')}</ul>`
        : '<p class="my-safari-operation-copy">Save a researched route to show its verified supply anchors.</p>';
    const overnightMarkup = brief.overnightAnchors.length
        ? `<div class="my-safari-operation-chips">${brief.overnightAnchors.slice(0, 8).map(anchor => `<span>${escapeHtml(anchor)}</span>`).join('')}</div>`
        : '<p class="my-safari-operation-copy">No reviewed overnight anchors are attached to this trip yet.</p>';
    const actionsMarkup = brief.actions.length
        ? `<ol>${brief.actions.slice(0, 5).map(action => `<li>${escapeHtml(action)}</li>`).join('')}</ol>`
        : '<div class="my-safari-operation-ready"><i class="fas fa-circle-check" aria-hidden="true"></i><p><strong>Core planning is covered.</strong><span>Complete the checklist below and perform a final official-source review close to departure.</span></p></div>';
    const sourceMarkup = brief.sources.slice(0, 8).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`).join('');

    root.innerHTML = `
        <div class="my-safari-operations-head">
            <div><span class="my-safari-operations-eyebrow"><i class="fas fa-compass" aria-hidden="true"></i> Departure briefing</span><h5 id="my-safari-operations-title">${escapeHtml(brief.countries.join(' · ') || 'Your journey')} readiness brief</h5><p>The route facts that matter before you commit money or begin driving.</p></div>
            <span class="my-safari-operations-status is-${escapeHtml(brief.status)}"><i class="fas ${brief.status === 'ready' ? 'fa-circle-check' : brief.status === 'check' ? 'fa-circle-exclamation' : 'fa-pen-ruler'}" aria-hidden="true"></i>${escapeHtml(brief.statusLabel)}</span>
        </div>
        <div class="my-safari-operations-facts" aria-label="Route readiness summary">
            <div><span>Route coverage</span><strong>${escapeHtml(routeLabel)}</strong></div>
            <div><span>Road plan</span><strong>${escapeHtml(roadCoverage)}</strong><small>${brief.road.driveMinutes ? `${escapeHtml(formatDriveMinutes(brief.road.driveMinutes))} mapped driving` : 'Add a route to calculate'}</small></div>
            <div><span>Land crossings</span><strong>${brief.crossings.length}</strong><small>${brief.crossings.length ? 'hours and papers linked' : brief.countries.length > 1 ? 'selection required' : 'not required'}</small></div>
            <div><span>Confirmed bookings</span><strong>${brief.bookings.confirmed} of ${brief.bookings.total}</strong><small>${brief.bookings.confirmedStays} confirmed stay${brief.bookings.confirmedStays === 1 ? '' : 's'}</small></div>
        </div>
        <div class="my-safari-operations-grid">
            <section class="my-safari-operation-card my-safari-operation-card--border"><header><span><i class="fas fa-passport" aria-hidden="true"></i></span><div><h6>Border plan</h6><p>Hours, documents and the overnight position</p></div></header><div>${borderMarkup}</div></section>
            <section class="my-safari-operation-card"><header><span><i class="fas fa-gas-pump" aria-hidden="true"></i></span><div><h6>Fuel and supplies</h6><p>Named anchors from the reviewed route</p></div></header>${fuelMarkup}</section>
            <section class="my-safari-operation-card"><header><span><i class="fas fa-bed" aria-hidden="true"></i></span><div><h6>Overnight anchors</h6><p>Places to structure the trip around</p></div></header>${overnightMarkup}</section>
            <section class="my-safari-operation-card my-safari-operation-card--actions"><header><span><i class="fas fa-list-check" aria-hidden="true"></i></span><div><h6>Resolve next</h6><p>Only the gaps that still affect this journey</p></div></header>${actionsMarkup}</section>
        </div>
        ${brief.accessNotes.length ? `<details class="my-safari-operations-notes"><summary>Road, gate and permit cautions <span>${brief.accessNotes.length}</span></summary><ul>${brief.accessNotes.map(item => `<li><strong>${escapeHtml(item.routeTitle)}</strong><span>${escapeHtml(item.text)}</span></li>`).join('')}</ul></details>` : ''}
        <footer><p><i class="fas fa-circle-info" aria-hidden="true"></i> Planning guidance only. Reconfirm changing conditions before departure.${brief.reviewedAt ? ` Route records reviewed ${escapeHtml(brief.reviewedAt)}.` : ''}</p>${sourceMarkup ? `<details><summary>Reviewed sources</summary><div>${sourceMarkup}</div></details>` : ''}</footer>`;
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
    if (!active) {
        localRouteBuilder?.render(null);
        return;
    }

    document.getElementById('my-safari-active-name').textContent = active.name;
    document.getElementById('my-safari-active-meta').textContent = `${formatDates(active)} · ${active.countries.length ? active.countries.join(', ') : 'Add destinations when editing this trip'}`;
    document.getElementById('my-safari-notes').value = active.notes;
    document.getElementById('my-safari-itinerary-count').textContent = active.aiItinerary ? '1 saved' : 'None yet';
    document.getElementById('my-safari-booking-count').textContent = `${active.bookings.length} recorded`;
    document.getElementById('my-safari-expense-count').textContent = `${active.expenses.items.length} item${active.expenses.items.length === 1 ? '' : 's'}`;
    document.getElementById('my-safari-packing-count').textContent = `${active.packing.packedItems.length} packed`;
    renderOperations(active);
    renderReadiness(active);
    renderBookings(active);
    localRouteBuilder?.render(active, true);
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

function invitationUrl(token) {
    return `${window.location.origin}${window.location.pathname}?invite=${token}#hub-my-safari`;
}

function activityLabel(item) {
    const actions = {
        collaborator_joined: 'joined the trip',
        collaborator_removed: 'removed a collaborator',
        invite_created: 'created a collaboration invitation',
        invite_revoked: 'revoked a collaboration invitation',
        trip_updated: 'updated the shared trip',
    };
    return `${item.actor_email || 'A collaborator'} ${actions[item.action] || item.action.replaceAll('_', ' ')}`;
}

function renderActivity(targetId, activity = []) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.replaceChildren();
    if (!activity.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No collaboration activity yet.';
        target.append(empty);
        return;
    }
    activity.forEach(item => {
        const row = document.createElement('div');
        row.className = 'my-safari-activity-item';
        const label = document.createElement('strong');
        label.textContent = activityLabel(item);
        const date = document.createElement('span');
        date.textContent = new Date(item.created_at).toLocaleString();
        row.append(label, date);
        target.append(row);
    });
}

async function refreshCollaborationManagement() {
    const active = getActiveTrip();
    const panel = document.getElementById('my-safari-collaboration-panel');
    if (!active || !panel || panel.hidden) return;
    try {
        const management = await getCollaborationManagement(active.id);
        const people = document.getElementById('my-safari-collaborators');
        people.replaceChildren();
        if (!management.collaborators.length) people.append(Object.assign(document.createElement('p'), { textContent: 'No collaborators yet.' }));
        management.collaborators.forEach(person => {
            const row = document.createElement('div');
            row.className = 'my-safari-access-item';
            const identity = document.createElement('strong');
            identity.textContent = person.email;
            const role = document.createElement('span');
            role.textContent = person.role === 'editor' ? 'Can edit' : 'View only';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.dataset.removeCollaborator = person.user_id;
            remove.textContent = 'Remove';
            row.append(identity, remove, role);
            people.append(row);
        });

        const invites = document.getElementById('my-safari-invites');
        invites.replaceChildren();
        if (!management.invites.length) invites.append(Object.assign(document.createElement('p'), { textContent: 'No open invitations.' }));
        management.invites.forEach(invite => {
            const row = document.createElement('div');
            row.className = 'my-safari-access-item';
            const role = document.createElement('strong');
            role.textContent = invite.invite_role === 'editor' ? 'Editor invitation' : 'Viewer invitation';
            const revoke = document.createElement('button');
            revoke.type = 'button';
            revoke.dataset.revokeInvite = invite.invite_id;
            revoke.textContent = 'Revoke';
            const expiry = document.createElement('span');
            expiry.textContent = invite.claimed ? 'Accepted' : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`;
            const copy = document.createElement('button');
            copy.type = 'button';
            copy.dataset.copyInvite = invite.invite_token;
            copy.textContent = 'Copy';
            row.append(role, revoke, expiry, copy);
            invites.append(row);
        });
        renderActivity('my-safari-activity', management.activity);
    } catch (error) {
        setCloudStatus(friendlyCloudError(error), true);
    }
}

async function refreshMyCollaborations() {
    const box = document.getElementById('my-safari-shared-with-me');
    const list = document.getElementById('my-safari-collaboration-list');
    if (!box || !list) return;
    try {
        const collaborations = await listMyCollaborations();
        list.replaceChildren();
        collaborations.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'my-safari-collaboration-chip';
            button.dataset.openCollaboration = item.trip_id;
            const name = document.createElement('strong');
            name.textContent = item.data?.name || 'Shared safari';
            const role = document.createElement('small');
            role.textContent = ` · ${item.access_role === 'editor' ? 'Can edit' : 'View only'}`;
            button.append(name, role);
            list.append(button);
        });
        box.hidden = collaborations.length === 0;
    } catch {
        box.hidden = true;
    }
}

function enterCollaborationLayout() {
    ['my-safari-create-form', 'my-safari-trip-list', 'my-safari-empty', 'my-safari-workspace', 'my-safari-shared-view', 'my-safari-shared-with-me']
        .forEach(id => document.getElementById(id)?.setAttribute('hidden', ''));
    document.getElementById('my-safari-collaboration-view').hidden = false;
}

function renderCollaboration(record) {
    const trip = record?.data || {};
    openCollaborativeTrip = record;
    const canEdit = record?.access_role === 'editor' || record?.access_role === 'owner';
    document.getElementById('collaboration-safari-name').textContent = trip.name || 'Collaborative safari';
    document.getElementById('collaboration-safari-role').textContent = canEdit ? 'Editor' : 'Viewer';
    document.getElementById('collaboration-safari-meta').textContent = `${formatDates(trip)} · ${trip.countries?.length ? trip.countries.join(', ') : 'Destinations not listed'}`;
    const expenseCount = trip.expenses?.items?.length || 0;
    document.getElementById('collaboration-safari-expenses').textContent = `${expenseCount} item${expenseCount === 1 ? '' : 's'}`;
    document.getElementById('collaboration-safari-packing').textContent = `${trip.packing?.packedItems?.length || 0} packed`;
    document.getElementById('collaboration-safari-updated').textContent = new Date(record.updated_at || trip.updatedAt || Date.now()).toLocaleString();
    const notes = document.getElementById('collaboration-safari-notes');
    notes.value = trip.notes || '';
    notes.disabled = !canEdit;
    document.getElementById('collaboration-safari-save').hidden = !canEdit;
    collaborationRouteBuilder?.render(trip, canEdit);
}

async function refreshOpenCollaboration(showStatus = false) {
    if (!openCollaborativeTrip?.trip_id) return;
    if (collaborationDirty) {
        if (showStatus) document.getElementById('collaboration-safari-status').textContent = 'Save your changes before refreshing.';
        return;
    }
    const record = await loadCollaboration(openCollaborativeTrip.trip_id);
    if (!record) throw new Error('You no longer have access to this safari.');
    renderCollaboration(record);
    renderActivity('collaboration-safari-activity', await getCollaborationActivity(record.data.id));
    if (showStatus) document.getElementById('collaboration-safari-status').textContent = 'Shared trip refreshed.';
}

async function openCollaboration(recordOrId) {
    enterCollaborationLayout();
    const status = document.getElementById('collaboration-safari-status');
    status.classList.remove('is-error');
    status.textContent = 'Opening shared trip…';
    try {
        const record = typeof recordOrId === 'string' ? await loadCollaboration(recordOrId) : recordOrId;
        if (!record) throw new Error('This collaborative trip is unavailable.');
        collaborationDirty = false;
        renderCollaboration(record);
        renderActivity('collaboration-safari-activity', await getCollaborationActivity(record.data.id));
        status.textContent = 'Changes are shared with everyone who has access.';
        clearInterval(collaborationPoll);
        collaborationPoll = window.setInterval(() => refreshOpenCollaboration(false).catch(() => {}), 12000);
    } catch (error) {
        document.getElementById('collaboration-safari-name').textContent = 'Collaborative safari unavailable';
        status.textContent = friendlyCloudError(error);
        status.classList.add('is-error');
    }
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
    const collaborateButton = document.getElementById('my-safari-collaborate');
    if (collaborateButton) collaborateButton.hidden = !session;
    if (!session) {
        document.getElementById('my-safari-share-panel')?.setAttribute('hidden', '');
        document.getElementById('my-safari-collaboration-panel')?.setAttribute('hidden', '');
        document.getElementById('my-safari-shared-with-me')?.setAttribute('hidden', '');
    }
}

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
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
    sharedRouteBuilder?.render(trip, false);

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
    renderCountryChoices('my-safari-edit-country-options', 'edit-trip-country', 'Edit destination');
    localRouteBuilder = createRouteBuilder(document.getElementById('my-safari-route-builder'), {
        onChange(routeDays, tripPatch = {}) {
            const active = getActiveTrip();
            if (active) updateTrip(active.id, { routeDays, ...tripPatch });
        },
    });
    sharedRouteBuilder = createRouteBuilder(document.getElementById('shared-safari-route'));
    collaborationRouteBuilder = createRouteBuilder(document.getElementById('collaboration-safari-route'), {
        autoSave: false,
        onChange(routeDays, tripPatch = {}) {
            if (!openCollaborativeTrip?.data) return;
            collaborationDirty = true;
            openCollaborativeTrip = {
                ...openCollaborativeTrip,
                data: { ...openCollaborativeTrip.data, routeDays, ...tripPatch },
            };
        },
    });
    renderDashboard();

    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    const inviteToken = params.get('invite');
    const collaborationId = params.get('collaboration');
    if (shareToken) {
        await openSharedTrip(shareToken);
        return;
    }

    let session = await getCurrentSession();
    renderAccount(session);
    if (inviteToken || collaborationId) {
        enterCollaborationLayout();
        document.getElementById('collaboration-safari-name').textContent = session
            ? 'Opening collaborative safari…'
            : 'Sign in to join this safari';
        document.getElementById('collaboration-safari-status').textContent = session
            ? 'Checking your access…'
            : 'Use the email sign-in form above. This invitation will remain open.';
        if (session) {
            try {
                const record = inviteToken
                    ? await acceptCollaborationInvite(inviteToken)
                    : await loadCollaboration(collaborationId);
                if (inviteToken) trackProductEvent('collaboration_invite_accepted', { source: 'my_safari' });
                if (inviteToken && record?.trip_id) {
                    history.replaceState(null, '', `${window.location.pathname}?collaboration=${record.trip_id}#hub-my-safari`);
                }
                await openCollaboration(record);
            } catch (error) {
                document.getElementById('collaboration-safari-name').textContent = 'Could not join this safari';
                document.getElementById('collaboration-safari-status').textContent = friendlyCloudError(error);
                document.getElementById('collaboration-safari-status').classList.add('is-error');
            }
        }
    } else if (session) {
        await syncAndReport('Signed in and synced.');
        await refreshMyCollaborations();
    }

    onAuthChange(nextSession => {
        const wasSignedIn = Boolean(session);
        session = nextSession;
        renderAccount(session);
        if (session && !wasSignedIn) {
            window.setTimeout(async () => {
                if (inviteToken) {
                    try {
                        const record = await acceptCollaborationInvite(inviteToken);
                        trackProductEvent('collaboration_invite_accepted', { source: 'my_safari' });
                        if (record?.trip_id) history.replaceState(null, '', `${window.location.pathname}?collaboration=${record.trip_id}#hub-my-safari`);
                        await openCollaboration(record);
                    } catch (error) {
                        document.getElementById('collaboration-safari-status').textContent = friendlyCloudError(error);
                    }
                } else if (collaborationId) {
                    await openCollaboration(collaborationId);
                } else {
                    await syncAndReport('Signed in and synced.');
                    await refreshMyCollaborations();
                }
            }, 0);
        }
        if (!session) setCloudStatus('Signed out. Trips remain available on this device.');
    });
    if (!inviteToken && !collaborationId) {
        startAutomaticTripSync(error => setCloudStatus(friendlyCloudError(error), true));
    }

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

    document.getElementById('my-safari-collaboration-list')?.addEventListener('click', event => {
        const button = event.target.closest('[data-open-collaboration]');
        if (button) window.location.assign(`${window.location.pathname}?collaboration=${button.dataset.openCollaboration}#hub-my-safari`);
    });

    document.getElementById('my-safari-create-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = String(form.get('trip-name') || '').trim();
        if (!name) return;
        const countries = form.getAll('trip-country').map(String);
        const startDate = String(form.get('trip-start') || '');
        const endDate = String(form.get('trip-end') || '');
        createTrip({
            name,
            startDate,
            endDate,
            countries,
        });
        trackProductEvent('trip_created', {
            source: 'my_safari',
            countryCount: countries.length,
            hasDates: Boolean(startDate && endDate),
        });
        event.currentTarget.reset();
    });

    document.getElementById('my-safari-trip-list')?.addEventListener('click', event => {
        const button = event.target.closest('[data-trip-select]');
        if (button) {
            setActiveTrip(button.dataset.tripSelect);
            refreshSharePanel();
            refreshCollaborationManagement();
        }
    });

    document.getElementById('my-safari-edit')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (active) openTripEditor(active);
    });

    document.getElementById('my-safari-edit-cancel')?.addEventListener('click', () => {
        document.getElementById('my-safari-edit-form').hidden = true;
    });

    document.getElementById('my-safari-edit-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const active = getActiveTrip();
        if (!active) return;
        const data = new FormData(event.currentTarget);
        const startDate = String(data.get('edit-trip-start') || '');
        const endDate = String(data.get('edit-trip-end') || '');
        const status = document.getElementById('my-safari-edit-status');
        if (startDate && endDate && endDate < startDate) {
            status.textContent = 'End date must be on or after the start date.';
            return;
        }
        const countries = data.getAll('edit-trip-country').map(String);
        updateTrip(active.id, {
            name: String(data.get('edit-trip-name') || '').trim(),
            startDate,
            endDate,
            travellers: Number(data.get('edit-trip-travellers')) || 1,
            countries,
            routeDays: rebaseRouteDays(active.routeDays, startDate, endDate),
        });
        trackProductEvent('trip_details_updated', {
            source: 'my_safari',
            countryCount: countries.length,
            hasDates: Boolean(startDate && endDate),
        });
        event.currentTarget.hidden = true;
    });

    document.getElementById('my-safari-duplicate')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (active) {
            duplicateTrip(active.id);
            trackProductEvent('trip_created', {
                source: 'duplicate',
                countryCount: active.countries.length,
                hasDates: Boolean(active.startDate && active.endDate),
            });
        }
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

    document.getElementById('my-safari-readiness-groups')?.addEventListener('change', event => {
        const checkbox = event.target.closest('[data-readiness-task]');
        const active = getActiveTrip();
        if (!checkbox || !active) return;
        const readiness = setReadinessTask(active.readiness, checkbox.dataset.readinessTask, checkbox.checked);
        updateTrip(active.id, { readiness });
        trackProductEvent('readiness_task_completed', {
            source: 'readiness',
            status: checkbox.checked ? 'completed' : 'reopened',
        });
        const plan = buildTripReadiness({ ...active, readiness });
        const status = document.getElementById('my-safari-readiness-status');
        if (status) status.textContent = checkbox.checked
            ? `Check completed. Trip readiness is now ${plan.score}%.`
            : `Check reopened. Trip readiness is now ${plan.score}%.`;
    });

    document.getElementById('my-safari-reminder-days')?.addEventListener('change', event => {
        const active = getActiveTrip();
        if (!active) return;
        const readiness = setReadinessReminderDays(active.readiness, event.target.value);
        updateTrip(active.id, { readiness });
        trackProductEvent('readiness_reminder_updated', {
            source: 'readiness',
            status: readiness.calendarReminderDays < 0 ? 'disabled' : 'enabled',
        });
        const status = document.getElementById('my-safari-readiness-status');
        if (status) status.textContent = readiness.calendarReminderDays < 0
            ? 'Calendar deadlines will export without alerts.'
            : 'Calendar alert timing updated for this trip.';
    });

    document.getElementById('my-safari-readiness-groups')?.addEventListener('click', event => {
        const button = event.target.closest('[data-readiness-remove]');
        const active = getActiveTrip();
        if (!button || !active) return;
        updateTrip(active.id, { readiness: removeReadinessTask(active.readiness, button.dataset.readinessRemove) });
        document.getElementById('my-safari-readiness-status').textContent = 'Personal task removed.';
    });

    document.getElementById('my-safari-custom-task-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const active = getActiveTrip();
        if (!active) return;
        const data = new FormData(event.currentTarget);
        const readiness = addReadinessTask(active.readiness, {
            title: data.get('custom-task-title'),
            category: data.get('custom-task-category'),
            dueDate: data.get('custom-task-date'),
        });
        updateTrip(active.id, { readiness });
        trackProductEvent('readiness_task_added', {
            source: 'my_safari',
            status: data.get('custom-task-date') ? 'dated' : 'undated',
        });
        event.currentTarget.reset();
        document.getElementById('my-safari-readiness-status').textContent = 'Personal task added to this trip.';
    });

    document.getElementById('my-safari-booking-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const active = getActiveTrip();
        if (!active) return;
        const data = new FormData(event.currentTarget);
        const bookings = addBooking(active.bookings, {
            type: data.get('booking-type'),
            provider: data.get('booking-provider'),
            reference: data.get('booking-reference'),
            date: data.get('booking-date'),
            status: 'planned',
        });
        updateTrip(active.id, { bookings });
        trackProductEvent('booking_record_added', {
            source: 'my_safari',
            itemType: data.get('booking-type'),
        });
        event.currentTarget.reset();
        document.getElementById('my-safari-booking-status').textContent = 'Booking record added.';
    });

    document.getElementById('my-safari-booking-list')?.addEventListener('change', event => {
        const select = event.target.closest('[data-booking-status]');
        const active = getActiveTrip();
        if (!select || !active) return;
        updateTrip(active.id, { bookings: updateBooking(active.bookings, select.dataset.bookingStatus, { status: select.value }) });
        trackProductEvent('booking_status_updated', { source: 'my_safari', status: select.value });
        document.getElementById('my-safari-booking-status').textContent = `Booking marked ${select.value}.`;
    });

    document.getElementById('my-safari-booking-list')?.addEventListener('click', event => {
        const editButton = event.target.closest('[data-booking-edit]');
        const cancelButton = event.target.closest('[data-booking-edit-cancel]');
        const button = event.target.closest('[data-booking-remove]');
        const active = getActiveTrip();
        if (!active) return;
        if (editButton) {
            editingBookingId = editButton.dataset.bookingEdit;
            renderBookings(active);
            document.querySelector(`[data-booking-edit-form="${CSS.escape(editingBookingId)}"] [name="booking-provider"]`)?.focus();
            return;
        }
        if (cancelButton) {
            editingBookingId = '';
            renderBookings(active);
            return;
        }
        if (button) {
            if (editingBookingId === button.dataset.bookingRemove) editingBookingId = '';
            updateTrip(active.id, { bookings: removeBooking(active.bookings, button.dataset.bookingRemove) });
            document.getElementById('my-safari-booking-status').textContent = 'Booking record removed.';
        }
    });

    document.getElementById('my-safari-booking-list')?.addEventListener('submit', event => {
        const form = event.target.closest('[data-booking-edit-form]');
        const active = getActiveTrip();
        if (!form || !active) return;
        event.preventDefault();
        const data = new FormData(form);
        const bookings = updateBooking(active.bookings, form.dataset.bookingEditForm, {
            type: data.get('booking-type'),
            provider: data.get('booking-provider'),
            reference: data.get('booking-reference'),
            date: data.get('booking-date'),
            status: data.get('booking-status'),
        });
        editingBookingId = '';
        updateTrip(active.id, { bookings });
        trackProductEvent('booking_record_updated', { source: 'my_safari', itemType: data.get('booking-type'), status: data.get('booking-status') });
        document.getElementById('my-safari-booking-status').textContent = 'Booking record updated.';
    });

    document.getElementById('my-safari-calendar-export')?.addEventListener('click', () => {
        const active = getActiveTrip();
        const status = document.getElementById('my-safari-export-status');
        if (!active || !status) return;
        try {
            const calendar = downloadTripCalendar(active);
            status.textContent = `${calendar.eventCount} calendar event${calendar.eventCount === 1 ? '' : 's'} downloaded, including ${calendar.reminderCount} incomplete readiness deadline${calendar.reminderCount === 1 ? '' : 's'}.`;
            status.classList.remove('is-error');
            trackProductEvent('trip_calendar_exported', {
                source: 'my_safari',
                countryCount: active.countries.length,
                hasDates: Boolean(active.startDate && active.endDate),
            });
        } catch (error) {
            status.textContent = error?.message || 'The calendar could not be created.';
            status.classList.add('is-error');
        }
    });

    document.getElementById('my-safari-pack-download')?.addEventListener('click', () => {
        const active = getActiveTrip();
        const status = document.getElementById('my-safari-pack-status');
        if (!active || !status) return;
        try {
            const pack = downloadTripPack(active);
            status.textContent = `Offline pack downloaded with ${pack.stats.routeDays} route day${pack.stats.routeDays === 1 ? '' : 's'} and ${pack.stats.bookings} booking${pack.stats.bookings === 1 ? '' : 's'}.`;
            status.classList.remove('is-error');
            trackProductEvent('trip_pack_exported', { source: 'my_safari', status: 'offline', countryCount: active.countries.length, hasDates: Boolean(active.startDate && active.endDate) });
        } catch (error) {
            status.textContent = error?.message || 'The offline pack could not be created.';
            status.classList.add('is-error');
        }
    });

    document.getElementById('my-safari-pack-print')?.addEventListener('click', () => {
        const active = getActiveTrip();
        const status = document.getElementById('my-safari-pack-status');
        if (!active || !status) return;
        try {
            printTripPack(active);
            status.textContent = 'Print view opened. Choose Save as PDF to keep a PDF copy.';
            status.classList.remove('is-error');
            trackProductEvent('trip_pack_exported', { source: 'my_safari', status: 'print', countryCount: active.countries.length, hasDates: Boolean(active.startDate && active.endDate) });
        } catch (error) {
            status.textContent = error?.message || 'The print view could not be created.';
            status.classList.add('is-error');
        }
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
            trackProductEvent('trip_share_created', { source: 'my_safari' });
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

    document.getElementById('my-safari-collaborate')?.addEventListener('click', async () => {
        const panel = document.getElementById('my-safari-collaboration-panel');
        panel.hidden = false;
        setCloudStatus('Loading collaboration access…');
        await syncAndReport('Trip ready to share.');
        await refreshCollaborationManagement();
    });

    document.getElementById('my-safari-close-collaboration')?.addEventListener('click', () => {
        document.getElementById('my-safari-collaboration-panel').hidden = true;
    });

    document.getElementById('my-safari-invite-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const active = getActiveTrip();
        if (!active) return;
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const role = new FormData(event.currentTarget).get('role')?.toString() || 'editor';
            const invite = await createCollaborationInvite(active.id, role);
            document.getElementById('my-safari-invite-url').value = invite.url;
            document.getElementById('my-safari-invite-result').hidden = false;
            await copyText(invite.url);
            setCloudStatus('Private invitation created and copied. It expires in seven days.');
            trackProductEvent('collaboration_invite_created', { source: 'my_safari', status: role });
            await refreshCollaborationManagement();
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById('my-safari-copy-invite')?.addEventListener('click', async () => {
        const url = document.getElementById('my-safari-invite-url')?.value;
        if (url) {
            await copyText(url);
            setCloudStatus('Invitation link copied.');
        }
    });

    document.getElementById('my-safari-collaboration-panel')?.addEventListener('click', async event => {
        const copy = event.target.closest('[data-copy-invite]');
        const revoke = event.target.closest('[data-revoke-invite]');
        const remove = event.target.closest('[data-remove-collaborator]');
        try {
            if (copy) {
                await copyText(invitationUrl(copy.dataset.copyInvite));
                setCloudStatus('Invitation link copied.');
            } else if (revoke) {
                await revokeCollaborationInvite(revoke.dataset.revokeInvite);
                setCloudStatus('Invitation revoked.');
                await refreshCollaborationManagement();
            } else if (remove) {
                const active = getActiveTrip();
                if (!active || !confirm('Remove this person from the trip?')) return;
                await removeCollaborator(active.id, remove.dataset.removeCollaborator);
                setCloudStatus('Collaborator removed.');
                await refreshCollaborationManagement();
            }
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    document.getElementById('collaboration-safari-save')?.addEventListener('click', async () => {
        if (!openCollaborativeTrip?.data) return;
        const status = document.getElementById('collaboration-safari-status');
        status.textContent = 'Saving shared plan…';
        try {
            const data = {
                ...openCollaborativeTrip.data,
                notes: document.getElementById('collaboration-safari-notes').value.trim(),
                updatedAt: new Date().toISOString(),
            };
            const saved = await saveCollaboration(openCollaborativeTrip.trip_id, data);
            collaborationDirty = false;
            renderCollaboration({ ...openCollaborativeTrip, ...saved, data: saved.data });
            renderActivity('collaboration-safari-activity', await getCollaborationActivity(data.id));
            status.classList.remove('is-error');
            status.textContent = 'Shared plan saved for everyone.';
        } catch (error) {
            status.textContent = friendlyCloudError(error);
            status.classList.add('is-error');
        }
    });

    document.getElementById('collaboration-safari-notes')?.addEventListener('input', () => {
        collaborationDirty = true;
    });

    document.getElementById('collaboration-safari-refresh')?.addEventListener('click', () => {
        refreshOpenCollaboration(true).catch(error => {
            document.getElementById('collaboration-safari-status').textContent = friendlyCloudError(error);
        });
    });

    window.addEventListener(TRIP_CHANGE_EVENT, renderDashboard);
}
