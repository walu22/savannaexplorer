import {
    addRouteStop,
    createRouteDays,
    moveRouteStop,
    normalizeRouteDays,
    removeRouteStop,
    resizeRouteDays,
    routeEndDate,
    shiftRouteStop,
    updateRouteStop,
} from '../lib/trip-route.js';

const TYPE_LABELS = {
    drive: 'Drive', park: 'Park', stay: 'Stay', border: 'Border', activity: 'Activity', meal: 'Meal', other: 'Other',
};
const TYPE_ICONS = {
    drive: 'fa-car', park: 'fa-tree', stay: 'fa-bed', border: 'fa-passport', activity: 'fa-binoculars', meal: 'fa-utensils', other: 'fa-location-dot',
};

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function dayLabel(day, index) {
    if (!day.date) return `Day ${index + 1}`;
    return `Day ${index + 1} · ${new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`;
}

function stopMarkup(stop, day, days, editable) {
    const dayOptions = days.map((item, index) => `<option value="${escapeHtml(item.id)}"${item.id === day.id ? ' selected' : ''}>Day ${index + 1}</option>`).join('');
    return `
        <article class="route-stop route-stop--${escapeHtml(stop.type)}" draggable="${editable}" data-route-stop="${escapeHtml(stop.id)}">
            <div class="route-stop-main">
                <span class="route-stop-icon" aria-hidden="true"><i class="fas ${TYPE_ICONS[stop.type] || TYPE_ICONS.other}"></i></span>
                <div>
                    <div class="route-stop-heading"><strong>${escapeHtml(stop.name)}</strong>${stop.time ? `<time>${escapeHtml(stop.time)}</time>` : ''}</div>
                    <span>${escapeHtml(TYPE_LABELS[stop.type] || 'Other')}${stop.location ? ` · ${escapeHtml(stop.location)}` : ''}</span>
                    ${stop.notes ? `<p>${escapeHtml(stop.notes)}</p>` : ''}
                </div>
            </div>
            ${editable ? `<div class="route-stop-actions" aria-label="Actions for ${escapeHtml(stop.name)}">
                <button type="button" data-route-earlier="${escapeHtml(stop.id)}" title="Move earlier" aria-label="Move ${escapeHtml(stop.name)} earlier"><i class="fas fa-arrow-up"></i></button>
                <button type="button" data-route-later="${escapeHtml(stop.id)}" title="Move later" aria-label="Move ${escapeHtml(stop.name)} later"><i class="fas fa-arrow-down"></i></button>
                <label><span class="sr-only">Move ${escapeHtml(stop.name)} to day</span><select data-route-move-day="${escapeHtml(stop.id)}">${dayOptions}</select></label>
                <button type="button" data-route-edit="${escapeHtml(stop.id)}" title="Edit stop" aria-label="Edit ${escapeHtml(stop.name)}"><i class="fas fa-pen"></i></button>
                <button type="button" data-route-remove="${escapeHtml(stop.id)}" title="Remove stop" aria-label="Remove ${escapeHtml(stop.name)}"><i class="fas fa-trash-can"></i></button>
            </div>` : ''}
        </article>`;
}

function formMarkup(days, prefix) {
    const options = days.map((day, index) => `<option value="${escapeHtml(day.id)}">${escapeHtml(dayLabel(day, index))}</option>`).join('');
    return `<form class="route-stop-form" data-route-form>
        <input type="hidden" name="stop-id">
        <label for="${prefix}-day">Day<select id="${prefix}-day" name="day" required>${options}</select></label>
        <label for="${prefix}-type">Type<select id="${prefix}-type" name="type"><option value="drive">Drive</option><option value="park">Park</option><option value="stay">Stay</option><option value="border">Border</option><option value="activity">Activity</option><option value="meal">Meal</option><option value="other">Other</option></select></label>
        <label for="${prefix}-name">Stop name<input id="${prefix}-name" name="name" maxlength="100" placeholder="Etosha National Park" required></label>
        <label for="${prefix}-location">Location<input id="${prefix}-location" name="location" maxlength="140" placeholder="Andersson Gate"></label>
        <label for="${prefix}-time">Time<input id="${prefix}-time" name="time" type="time"></label>
        <label class="route-stop-form-notes" for="${prefix}-notes">Notes<input id="${prefix}-notes" name="notes" maxlength="500" placeholder="Gate opens at sunrise"></label>
        <div class="route-stop-form-actions"><button type="submit" class="btn btn-primary btn-sm"><span data-route-submit-label>Add stop</span></button><button type="button" class="btn btn-outline btn-sm" data-route-cancel hidden>Cancel edit</button></div>
    </form>`;
}

export function createRouteBuilder(root, { onChange = () => {}, autoSave = true } = {}) {
    if (!root) return { render() {} };
    let trip = null;
    let editable = false;
    let notice = '';

    const emit = (days, message = 'Changes saved on this device.', patch = {}) => {
        trip = { ...trip, routeDays: normalizeRouteDays(days) };
        notice = message;
        onChange(trip.routeDays, patch);
        render();
    };

    const findStop = stopId => {
        for (const day of trip.routeDays || []) {
            const stop = day.stops.find(item => item.id === stopId);
            if (stop) return { day, stop };
        }
        return null;
    };

    const render = () => {
        if (!trip) {
            root.replaceChildren();
            return;
        }
        const days = normalizeRouteDays(trip.routeDays);
        trip.routeDays = days;
        const prefix = `${root.id || 'route'}-form`;
        root.innerHTML = `<section class="trip-route-builder${editable ? '' : ' is-readonly'}">
            <div class="trip-route-head"><div><span class="my-safari-shared-label"><i class="fas fa-route"></i> Interactive itinerary</span><h5>Shape your safari, day by day</h5><p>Adjust the trip length, edit each stop, or drag stops between days.</p></div></div>
            ${!days.length ? `<div class="trip-route-empty"><p>No route days yet.</p>${editable ? `<button type="button" class="btn btn-primary btn-sm" data-route-create-days>Build days from trip dates</button>` : ''}</div>` : `
                ${editable ? `<div class="trip-route-tools">
                    <form class="trip-route-duration" data-route-duration-form>
                        <label for="${prefix}-duration">Trip length</label>
                        <div><input id="${prefix}-duration" name="duration" type="number" min="1" max="30" inputmode="numeric" value="${days.length}" required><span>days</span><button type="submit" class="btn btn-outline btn-sm">Update itinerary</button></div>
                    </form>
                    <p class="trip-route-save-status" role="status" aria-live="polite">${escapeHtml(notice || (autoSave ? 'Every change is saved automatically.' : 'Changes are ready when you save the shared plan.'))}</p>
                </div>` : ''}
                ${editable ? formMarkup(days, prefix) : ''}
                <div class="trip-route-board">${days.map((day, index) => `<section class="route-day" data-route-day="${escapeHtml(day.id)}"><header><div><strong>${escapeHtml(dayLabel(day, index))}</strong>${day.title ? `<small>${escapeHtml(day.title)}</small>` : ''}</div><span>${day.stops.length} stop${day.stops.length === 1 ? '' : 's'}</span></header><div class="route-day-stops" data-route-drop="${escapeHtml(day.id)}">${day.stops.length ? day.stops.map(stop => stopMarkup(stop, day, days, editable)).join('') : '<p class="route-day-empty">Drop a stop here</p>'}</div></section>`).join('')}</div>`}
        </section>`;
    };

    root.addEventListener('submit', event => {
        const durationForm = event.target.closest('[data-route-duration-form]');
        if (durationForm && editable) {
            event.preventDefault();
            const requested = Number(new FormData(durationForm).get('duration'));
            const currentCount = trip.routeDays.length;
            const days = resizeRouteDays(trip.routeDays, requested);
            if (days.length === currentCount && requested !== currentCount) {
                notice = 'This trip has too many stops to fit safely into that number of days.';
                render();
                return;
            }
            const endDate = routeEndDate(days);
            emit(days, `Itinerary updated to ${days.length} day${days.length === 1 ? '' : 's'}.`, endDate ? { endDate } : {});
            return;
        }
        const form = event.target.closest('[data-route-form]');
        if (!form || !editable) return;
        event.preventDefault();
        const data = new FormData(form);
        const stopId = String(data.get('stop-id') || '');
        const input = Object.fromEntries(['type', 'name', 'location', 'time', 'notes'].map(key => [key, String(data.get(key) || '')]));
        const targetDayId = String(data.get('day'));
        const current = stopId ? findStop(stopId) : null;
        let days = stopId ? updateRouteStop(trip.routeDays, stopId, input) : addRouteStop(trip.routeDays, targetDayId, input);
        if (stopId && current?.day.id !== targetDayId) days = moveRouteStop(days, stopId, targetDayId);
        emit(days, stopId ? `Stop updated${autoSave ? ' and saved' : ''}.` : `Stop added${autoSave ? ' and saved' : ''}.`);
    });

    root.addEventListener('click', event => {
        if (!editable) return;
        const create = event.target.closest('[data-route-create-days]');
        const remove = event.target.closest('[data-route-remove]');
        const earlier = event.target.closest('[data-route-earlier]');
        const later = event.target.closest('[data-route-later]');
        const edit = event.target.closest('[data-route-edit]');
        const cancel = event.target.closest('[data-route-cancel]');
        if (create) emit(createRouteDays(trip.startDate, trip.endDate), 'Your dated itinerary is ready.');
        else if (remove) emit(removeRouteStop(trip.routeDays, remove.dataset.routeRemove), autoSave ? 'Stop removed and itinerary saved.' : 'Stop removed.');
        else if (earlier) emit(shiftRouteStop(trip.routeDays, earlier.dataset.routeEarlier, -1), 'Stop order updated.');
        else if (later) emit(shiftRouteStop(trip.routeDays, later.dataset.routeLater, 1), 'Stop order updated.');
        else if (edit) {
            const found = findStop(edit.dataset.routeEdit);
            const form = root.querySelector('[data-route-form]');
            if (!found || !form) return;
            form.elements['stop-id'].value = found.stop.id;
            form.elements.day.value = found.day.id;
            ['type', 'name', 'location', 'time', 'notes'].forEach(key => { form.elements[key].value = found.stop[key] || ''; });
            form.querySelector('[data-route-submit-label]').textContent = 'Save stop';
            form.querySelector('[data-route-cancel]').hidden = false;
            form.elements.name.focus();
        } else if (cancel) render();
    });

    root.addEventListener('change', event => {
        const select = event.target.closest('[data-route-move-day]');
        if (select && editable) emit(moveRouteStop(trip.routeDays, select.dataset.routeMoveDay, select.value), 'Stop moved to another day.');
    });

    root.addEventListener('dragstart', event => {
        const card = event.target.closest('[data-route-stop]');
        if (!card || !editable) return;
        event.dataTransfer.setData('text/plain', card.dataset.routeStop);
        event.dataTransfer.effectAllowed = 'move';
        card.classList.add('is-dragging');
    });
    root.addEventListener('dragend', event => event.target.closest('[data-route-stop]')?.classList.remove('is-dragging'));
    root.addEventListener('dragover', event => {
        if (editable && event.target.closest('[data-route-drop]')) event.preventDefault();
    });
    root.addEventListener('drop', event => {
        const target = event.target.closest('[data-route-drop]');
        if (!target || !editable) return;
        event.preventDefault();
        const stopId = event.dataTransfer.getData('text/plain');
        const card = event.target.closest('[data-route-stop]');
        const cards = [...target.querySelectorAll('[data-route-stop]')];
        const index = card ? cards.indexOf(card) : cards.length;
        emit(moveRouteStop(trip.routeDays, stopId, target.dataset.routeDrop, index), 'Stop moved and saved.');
    });

    return {
        render(nextTrip, canEdit = false) {
            const changedTrip = trip?.id !== nextTrip?.id;
            trip = nextTrip ? { ...nextTrip, routeDays: normalizeRouteDays(nextTrip.routeDays) } : null;
            editable = Boolean(canEdit);
            if (changedTrip) notice = '';
            render();
        },
    };
}
