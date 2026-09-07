import routeCollection from '../../data/route-collections.json';
import borders from '../../data/borders.json';
import {
    JOURNEY_COUNTRIES,
    composeJourney,
    journeyToTripTemplate,
    normalizeJourneyPreferences,
    reorderJourneyCountries,
} from '../lib/journey-composer.js';
import { createTrip } from '../lib/trip-store.js';
import { trackProductEvent } from '../lib/product-analytics.js';
import { destroyJourneyMap, mountJourneyMap } from '../lib/itinerary-maps.js';
import { buildTransferPlan, formatDriveMinutes } from '../lib/journey-logistics.js';

const STORAGE_KEY = 'se_journey_composer_v1';
const DEFAULTS = {
    countries: ['namibia', 'botswana'],
    startCountry: 'namibia',
    days: 22,
    vehicle: '4x4',
    theme: 'wildlife',
    startDate: '',
};

let currentJourney = null;
let draggedCountry = '';

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function readStoredPreferences() {
    try {
        return normalizeJourneyPreferences(JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULTS);
    } catch {
        return normalizeJourneyPreferences(DEFAULTS);
    }
}

function savePreferences(preferences) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* Device storage is optional. */ }
}

function selectedCountries(form) {
    return [...form.querySelectorAll('input[name="countries"]:checked')].map(input => input.value);
}

function syncCountryControls(form, status = null) {
    const selected = selectedCountries(form);
    form.querySelectorAll('input[name="countries"]').forEach(input => {
        input.disabled = !input.checked && selected.length >= 4;
    });

    const start = form.elements.startCountry;
    const previous = start.value;
    start.innerHTML = selected.length
        ? selected.map(country => `<option value="${escapeHtml(country)}">${escapeHtml(JOURNEY_COUNTRIES[country])}</option>`).join('')
        : '<option value="">Choose countries first</option>';
    start.value = selected.includes(previous) ? previous : (selected[0] || '');
    start.disabled = selected.length === 0;
    if (status) status.textContent = selected.length >= 4
        ? 'Four countries selected — the maximum for a reliable 30-day plan.'
        : `${selected.length} of 4 countries selected.`;
}

function readForm(form) {
    const data = new FormData(form);
    return normalizeJourneyPreferences({
        countries: selectedCountries(form),
        startCountry: String(data.get('startCountry') || ''),
        days: data.get('days'),
        vehicle: String(data.get('vehicle') || ''),
        theme: String(data.get('theme') || ''),
        startDate: String(data.get('startDate') || ''),
        transferDepartures: currentJourney?.preferences?.transferDepartures || {},
    });
}

function setForm(form, preferences) {
    const normalized = normalizeJourneyPreferences(preferences);
    form.querySelectorAll('input[name="countries"]').forEach(input => {
        input.checked = normalized.countries.includes(input.value);
    });
    form.elements.days.value = normalized.days;
    form.elements.vehicle.value = normalized.vehicle;
    form.elements.theme.value = normalized.theme;
    form.elements.startDate.value = normalized.startDate;
    syncCountryControls(form);
    form.elements.startCountry.value = normalized.startCountry;
}

function emptyResult(root, message, action = '') {
    destroyJourneyMap();
    root.hidden = false;
    root.innerHTML = `<div class="journey-composer-empty">
        <span class="journey-composer-empty__icon" aria-hidden="true"><i class="fas fa-route"></i></span>
        <div><h4 tabindex="-1">This plan needs one adjustment</h4><p>${escapeHtml(message)}</p>
        ${action ? `<button type="button" class="btn btn-outline btn-sm" data-journey-days="${escapeHtml(action)}">Use ${escapeHtml(action)} days</button>` : ''}</div>
    </div>`;
    root.querySelector('h4')?.focus({ preventScroll: true });
}

function orderControls(journey) {
    return `<section class="journey-order" aria-labelledby="journey-order-title">
        <div><span class="section-eyebrow">Travel order</span><h5 id="journey-order-title">Drag countries or use the arrow buttons</h5><p>Every change is checked against the reviewed land-border network.</p></div>
        <ol class="journey-order__list" data-journey-order-list>
            ${journey.countryOrder.map((country, index) => `<li draggable="true" data-journey-country="${escapeHtml(country)}">
                <span class="journey-order__handle" aria-hidden="true"><i class="fas fa-grip-vertical"></i></span>
                <span class="journey-order__number">${index + 1}</span>
                <strong>${escapeHtml(JOURNEY_COUNTRIES[country])}</strong>
                <span class="journey-order__buttons">
                    <button type="button" data-journey-move="${escapeHtml(country)}" data-journey-target="${index - 1}" aria-label="Move ${escapeHtml(JOURNEY_COUNTRIES[country])} earlier"${index === 0 ? ' disabled' : ''}><i class="fas fa-arrow-left" aria-hidden="true"></i></button>
                    <button type="button" data-journey-move="${escapeHtml(country)}" data-journey-target="${index + 1}" aria-label="Move ${escapeHtml(JOURNEY_COUNTRIES[country])} later"${index === journey.countryOrder.length - 1 ? ' disabled' : ''}><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </span>
            </li>`).join('')}
        </ol>
        <p class="journey-order__status" role="status" aria-live="polite" tabindex="-1"></p>
    </section>`;
}

function segmentReason(segment, theme) {
    const reasons = [];
    if (theme !== 'all' && segment.themeMatch) reasons.push(`strong ${theme} fit`);
    reasons.push(segment.vehicleFit ? 'fits your vehicle comfort' : `requires ${segment.route.vehicle.label}`);
    if (segment.extraDays) reasons.push(`${segment.extraDays} flexible day${segment.extraDays === 1 ? '' : 's'}`);
    return reasons.join(' · ');
}

function transferMarkup(transfer, crossing, stopover, index) {
    const confidence = transfer.status === 'estimated'
        ? `${transfer.confidence} confidence · cached ${transfer.capturedAt}`
        : transfer.status === 'partial' ? `Partial coverage · cached ${transfer.capturedAt}` : 'Local route check required';
    const arrivalClass = transfer.arrival.status === 'closed' ? 'is-warning'
        : transfer.arrival.status === 'open' ? 'is-ready' : 'is-neutral';
    const legMarkup = (leg, label, fallbackRoute) => `<div class="${leg ? '' : 'is-withheld'}"><span>${label}</span><strong>${leg ? `${escapeHtml(leg.fromName)} → ${escapeHtml(leg.toName)}` : escapeHtml(fallbackRoute)}</strong><small>${leg ? `${leg.distanceKm} km · ${formatDriveMinutes(leg.driveMinutes)}` : 'Road match withheld · check locally'}</small></div>`;
    const legs = transfer.approach || transfer.onward ? `<div class="journey-transfer__legs">
        ${legMarkup(transfer.approach, 'To the border', `Route endpoint → ${crossing.name}`)}
        ${legMarkup(transfer.onward, 'After the border', `${crossing.name} → next route`)}
    </div>` : `<div class="journey-transfer__withheld"><i class="fas fa-location-crosshairs" aria-hidden="true"></i><p><strong>Distance withheld</strong><br>The cached road match did not meet our confidence threshold. Confirm this transfer with your host, rental company or a local route planner.</p></div>`;
    const stopoverSources = stopover.sources.slice(0, 3).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(source.countryName)} · ${escapeHtml(source.relevance)}</span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.linkLabel)} · reviewed ${escapeHtml(source.lastVerified)}</small></a>`).join('');
    return `<section class="journey-transfer" aria-label="Cross-border transfer plan">
        <div class="journey-transfer__head">
            <div><span class="journey-transfer__eyebrow">Cross-border logistics</span><strong>${transfer.status === 'estimated' ? `${transfer.totalDistanceKm} km · ${formatDriveMinutes(transfer.totalDriveMinutes)} driving` : transfer.status === 'partial' ? 'Partial estimate · complete locally' : 'Verify the road transfer locally'}</strong></div>
            <span class="journey-transfer__confidence ${transfer.status === 'estimated' ? '' : 'is-withheld'}">${escapeHtml(confidence)}</span>
        </div>
        ${legs}
        <div class="journey-transfer__arrival ${arrivalClass}">
            <label for="journey-departure-${index}">Planned departure</label>
            <input id="journey-departure-${index}" type="time" value="${escapeHtml(transfer.departureTime)}" data-transfer-departure="${index}" aria-describedby="journey-arrival-${index}">
            <p id="journey-arrival-${index}"><i class="fas ${transfer.arrival.status === 'closed' ? 'fa-triangle-exclamation' : 'fa-clock'}" aria-hidden="true"></i>${escapeHtml(transfer.arrival.label)}</p>
        </div>
        <div class="journey-transfer__advice"><p><i class="fas fa-gas-pump" aria-hidden="true"></i>${escapeHtml(transfer.fuelGuidance)}</p><p><i class="fas fa-sun" aria-hidden="true"></i>${escapeHtml(transfer.dayGuidance)}</p></div>
        <div class="journey-stopover journey-stopover--${escapeHtml(stopover.status)}">
            <div class="journey-stopover__head"><span><i class="fas fa-bed" aria-hidden="true"></i> Stopover plan</span><strong>${escapeHtml(stopover.title)}</strong></div>
            <p>${escapeHtml(stopover.summary)} ${escapeHtml(stopover.placement)}</p>
            ${stopoverSources ? `<div class="journey-stopover__sources">${stopoverSources}</div>` : ''}
            <small>${escapeHtml(stopover.disclaimer)}</small>
        </div>
        <details class="journey-transfer__documents"><summary>Vehicle and document checklist</summary><ul>${(crossing.documents || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}<li>${escapeHtml(crossing.fees || 'Confirm current fees and requirements')}</li></ul></details>
        <p class="journey-transfer__source">Road figures are cached planning estimates from ${escapeHtml(transfer.source)}. They exclude stops, border processing, queues and current disruption.</p>
    </section>`;
}

function renderJourney(root, journey, focusHeading = true) {
    destroyJourneyMap();
    let day = 1;
    const timeline = journey.segments.map((segment, index) => {
        const startDay = day;
        const endDay = day + segment.days - 1;
        day = endDay + 1;
        const crossing = journey.crossings[index];
        const transfer = journey.transfers[index];
        const stopover = journey.stopovers[index];
        const routeMarkup = `<article class="journey-step journey-step--route">
            <div class="journey-step__marker"><span>${index + 1}</span></div>
            <div class="journey-step__body">
                <div class="journey-step__meta"><span>${escapeHtml(segment.countryName)}</span><span>Days ${startDay}–${endDay}</span></div>
                <h5>${escapeHtml(segment.route.title)}</h5>
                <p>${escapeHtml(segment.route.promise)}</p>
                <div class="journey-step__reason"><i class="fas ${segment.vehicleFit ? 'fa-circle-check' : 'fa-triangle-exclamation'}" aria-hidden="true"></i>${escapeHtml(segmentReason(segment, journey.preferences.theme))}</div>
                <a href="/routes/${escapeHtml(segment.route.id)}">Review this route <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </div>
        </article>`;
        if (!crossing) return routeMarkup;
        const crossingStartDay = day;
        const crossingEndDay = day + stopover.transferDays - 1;
        day = crossingEndDay + 1;
        return `${routeMarkup}<article class="journey-step journey-step--border">
            <div class="journey-step__marker"><i class="fas fa-passport" aria-hidden="true"></i></div>
            <div class="journey-step__body">
                <div class="journey-step__meta"><span>Border transfer</span><span>${crossingStartDay === crossingEndDay ? `Day ${crossingStartDay}` : `Days ${crossingStartDay}–${crossingEndDay}`}</span></div>
                <h5>${escapeHtml(crossing.name)}</h5>
                <p>${escapeHtml(crossing.route)} · ${escapeHtml(crossing.hours)}</p>
                <div class="journey-step__reason"><i class="fas fa-shield-halved" aria-hidden="true"></i>Reviewed ${escapeHtml(crossing.lastVerified)} · reconfirm before travel</div>
                ${transferMarkup(transfer, crossing, stopover, index)}
                <a href="/borders/${escapeHtml(crossing.id)}">Open border guide <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </div>
        </article>`;
    }).join('');

    const vehicleWarnings = journey.segments.filter(segment => !segment.vehicleFit);
    root.hidden = false;
    root.innerHTML = `<div class="journey-result__head">
        <div><span class="section-eyebrow">Your connected journey</span><h4 tabindex="-1">${journey.segments.map(segment => escapeHtml(segment.countryName)).join(' <i class="fas fa-arrow-right" aria-hidden="true"></i> ')}</h4></div>
        <div class="journey-result__actions">
            <button type="button" class="btn btn-primary" data-journey-save><i class="fas fa-map-location-dot" aria-hidden="true"></i> Save to My Safari</button>
            <button type="button" class="btn btn-outline" data-journey-edit>Edit choices</button>
        </div>
    </div>
    <div class="journey-result__facts" aria-label="Journey summary">
        <div><span>Total time</span><strong>${journey.totalDays} days</strong></div>
        <div><span>Countries</span><strong>${journey.segments.length}</strong></div>
        <div><span>Transfer days</span><strong>${journey.borderDays}</strong></div>
        <div><span>Flexible days</span><strong>${journey.extraDays}</strong></div>
    </div>
    ${orderControls(journey)}
    ${vehicleWarnings.length ? `<div class="journey-result__warning"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i><p><strong>Vehicle check:</strong> ${escapeHtml(vehicleWarnings.map(segment => `${segment.route.title} needs ${segment.route.vehicle.label}`).join('; '))}.</p></div>` : ''}
    <div class="journey-result__workspace">
        <section class="journey-map-panel" aria-labelledby="journey-map-title">
            <div class="journey-map-panel__head"><span class="section-eyebrow">Journey map</span><h5 id="journey-map-title">Route and border sequence</h5></div>
            <div id="journey-map-canvas" class="journey-map-canvas" role="img" aria-label="Map of ${escapeHtml(journey.segments.map(segment => segment.countryName).join(' to '))}" aria-busy="true"></div>
            <p class="journey-map-panel__note"><i class="fas fa-circle-info" aria-hidden="true"></i> Geographic sequence only. Lines between stops are not turn-by-turn navigation.</p>
        </section>
        <div class="journey-timeline" aria-label="Day-by-day route structure">${timeline}</div>
    </div>
    <details class="journey-checks"><summary>Important checks before booking</summary><ul>${journey.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}<li>Recheck border hours, entry rules, vehicle paperwork and regional travel advice close to departure.</li></ul></details>
    <p class="journey-result__note"><i class="fas fa-circle-info" aria-hidden="true"></i> This is a planning sequence, not live navigation. Saving creates an editable itinerary; it does not make bookings.</p>
    <p class="journey-result__status" role="status" aria-live="polite"></p>`;
    if (focusHeading) root.querySelector('h4')?.focus({ preventScroll: true });
    mountJourneyMap(journey).then(mounted => {
        if (mounted) return;
        const map = document.getElementById('journey-map-canvas');
        if (map) {
            map.removeAttribute('aria-busy');
            map.innerHTML = '<p>The map is unavailable, but the ordered route timeline remains complete.</p>';
        }
    }).catch(() => {
        const map = document.getElementById('journey-map-canvas');
        if (map) {
            map.removeAttribute('aria-busy');
            map.innerHTML = '<p>The map could not load. Use the ordered route timeline below.</p>';
        }
    });
}

function applyCountryOrder(form, results, nextOrder) {
    const nextJourney = composeJourney(routeCollection.routes, borders, {
        ...currentJourney.preferences,
        countries: nextOrder,
        countryOrder: nextOrder,
        startCountry: nextOrder[0],
        transferDepartures: currentJourney.preferences.transferDepartures,
    });
    const status = results.querySelector('.journey-order__status');
    if (nextJourney.status !== 'ready') {
        if (status) {
            status.textContent = 'That order has no direct reviewed road connection between every neighbouring country.';
            status.focus({ preventScroll: true });
        }
        return false;
    }

    currentJourney = nextJourney;
    form.elements.startCountry.value = nextOrder[0];
    savePreferences(nextJourney.preferences);
    trackProductEvent('journey_reordered', {
        source: 'journey_composer',
        status: 'connected',
        countryCount: nextOrder.length,
        hasDates: Boolean(nextJourney.preferences.startDate),
    });
    renderJourney(results, nextJourney, false);
    const nextStatus = results.querySelector('.journey-order__status');
    if (nextStatus) {
        nextStatus.textContent = `Journey reordered: ${nextOrder.map(country => JOURNEY_COUNTRIES[country]).join(' to ')}.`;
        nextStatus.focus({ preventScroll: true });
    }
    return true;
}

function runComposer(form, results) {
    const preferences = readForm(form);
    savePreferences(preferences);
    currentJourney = composeJourney(routeCollection.routes, borders, preferences);
    trackProductEvent('journey_composed', {
        source: 'journey_composer',
        status: currentJourney.status,
        countryCount: preferences.countries.length,
        hasDates: Boolean(preferences.startDate),
    });

    if (currentJourney.status !== 'ready') {
        emptyResult(results, currentJourney.message, currentJourney.requiredDays || '');
        return;
    }
    renderJourney(results, currentJourney);
}

export function initJourneyComposer() {
    const root = document.getElementById('journey-composer');
    const form = document.getElementById('journey-composer-form');
    const results = document.getElementById('journey-composer-results');
    const selectionStatus = document.getElementById('journey-country-status');
    if (!root || !form || !results || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';
    setForm(form, readStoredPreferences());
    syncCountryControls(form, selectionStatus);

    form.addEventListener('change', event => {
        if (event.target.name === 'countries') syncCountryControls(form, selectionStatus);
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        if (selectedCountries(form).length < 2) {
            emptyResult(results, 'Choose at least two countries to build a connected journey.');
            return;
        }
        runComposer(form, results);
    });

    root.addEventListener('click', event => {
        const daysButton = event.target.closest('[data-journey-days]');
        if (daysButton) {
            form.elements.days.value = daysButton.dataset.journeyDays;
            runComposer(form, results);
            return;
        }
        if (event.target.closest('[data-journey-edit]')) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            form.querySelector('input[name="countries"]:checked')?.focus();
            return;
        }
        const move = event.target.closest('[data-journey-move]');
        if (move && currentJourney?.status === 'ready') {
            const nextOrder = reorderJourneyCountries(
                currentJourney.countryOrder,
                move.dataset.journeyMove,
                move.dataset.journeyTarget,
            );
            applyCountryOrder(form, results, nextOrder);
            return;
        }
        if (event.target.closest('[data-journey-reset]')) {
            currentJourney = null;
            try { localStorage.removeItem(STORAGE_KEY); } catch { /* Nothing to clear. */ }
            setForm(form, DEFAULTS);
            syncCountryControls(form, selectionStatus);
            results.hidden = true;
            results.replaceChildren();
            destroyJourneyMap();
            form.querySelector('input[name="countries"]')?.focus();
            return;
        }
        if (event.target.closest('[data-journey-save]') && currentJourney?.status === 'ready') {
            const template = journeyToTripTemplate(currentJourney, currentJourney.preferences.startDate);
            const status = results.querySelector('.journey-result__status');
            if (!template) {
                if (status) status.textContent = 'This journey could not be saved. Please rebuild it.';
                return;
            }
            const trip = createTrip(template);
            trackProductEvent('journey_added_to_trip', {
                source: 'journey_composer',
                status: 'saved',
                countryCount: currentJourney.segments.length,
                hasDates: Boolean(template.startDate),
            });
            if (status) status.textContent = `${trip.name} is ready. Opening your editable itinerary…`;
            window.location.assign('/my-safari');
        }
    });

    root.addEventListener('change', event => {
        const input = event.target.closest('[data-transfer-departure]');
        if (!input || currentJourney?.status !== 'ready') return;
        const index = Number(input.dataset.transferDeparture);
        const crossing = currentJourney.crossings[index];
        const fromRoute = currentJourney.segments[index]?.route;
        const toRoute = currentJourney.segments[index + 1]?.route;
        if (!crossing || !fromRoute || !toRoute) return;
        const transfer = buildTransferPlan(fromRoute, crossing, toRoute, input.value);
        currentJourney.preferences.transferDepartures[transfer.key] = transfer.departureTime;
        currentJourney.transfers[index] = transfer;
        savePreferences(currentJourney.preferences);
        trackProductEvent('journey_transfer_time_updated', {
            source: 'journey_composer',
            status: transfer.arrival.status,
            countryCount: currentJourney.segments.length,
            hasDates: Boolean(currentJourney.preferences.startDate),
        });
        renderJourney(results, currentJourney, false);
        results.querySelector(`[data-transfer-departure="${index}"]`)?.focus({ preventScroll: true });
    });

    root.addEventListener('dragstart', event => {
        const item = event.target.closest('[data-journey-country]');
        if (!item || currentJourney?.status !== 'ready') return;
        draggedCountry = item.dataset.journeyCountry;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedCountry);
        item.classList.add('is-dragging');
    });
    root.addEventListener('dragover', event => {
        if (draggedCountry && event.target.closest('[data-journey-country]')) event.preventDefault();
    });
    root.addEventListener('drop', event => {
        const target = event.target.closest('[data-journey-country]');
        if (!target || !draggedCountry || currentJourney?.status !== 'ready') return;
        event.preventDefault();
        const targetIndex = currentJourney.countryOrder.indexOf(target.dataset.journeyCountry);
        const nextOrder = reorderJourneyCountries(currentJourney.countryOrder, draggedCountry, targetIndex);
        applyCountryOrder(form, results, nextOrder);
        draggedCountry = '';
    });
    root.addEventListener('dragend', event => {
        event.target.closest('[data-journey-country]')?.classList.remove('is-dragging');
        draggedCountry = '';
    });
}
