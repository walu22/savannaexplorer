import routeCollection from '../../data/route-collections.json';
import borders from '../../data/borders.json';
import {
    JOURNEY_COUNTRIES,
    composeJourney,
    journeyToTripTemplate,
    normalizeJourneyPreferences,
} from '../lib/journey-composer.js';
import { createTrip } from '../lib/trip-store.js';
import { trackProductEvent } from '../lib/product-analytics.js';

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
    root.hidden = false;
    root.innerHTML = `<div class="journey-composer-empty">
        <span class="journey-composer-empty__icon" aria-hidden="true"><i class="fas fa-route"></i></span>
        <div><h4 tabindex="-1">This plan needs one adjustment</h4><p>${escapeHtml(message)}</p>
        ${action ? `<button type="button" class="btn btn-outline btn-sm" data-journey-days="${escapeHtml(action)}">Use ${escapeHtml(action)} days</button>` : ''}</div>
    </div>`;
    root.querySelector('h4')?.focus({ preventScroll: true });
}

function segmentReason(segment, theme) {
    const reasons = [];
    if (theme !== 'all' && segment.themeMatch) reasons.push(`strong ${theme} fit`);
    reasons.push(segment.vehicleFit ? 'fits your vehicle comfort' : `requires ${segment.route.vehicle.label}`);
    if (segment.extraDays) reasons.push(`${segment.extraDays} flexible day${segment.extraDays === 1 ? '' : 's'}`);
    return reasons.join(' · ');
}

function renderJourney(root, journey) {
    let day = 1;
    const timeline = journey.segments.map((segment, index) => {
        const startDay = day;
        const endDay = day + segment.days - 1;
        day = endDay + 1;
        const crossing = journey.crossings[index];
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
        const crossingDay = day;
        day += 1;
        return `${routeMarkup}<article class="journey-step journey-step--border">
            <div class="journey-step__marker"><i class="fas fa-passport" aria-hidden="true"></i></div>
            <div class="journey-step__body">
                <div class="journey-step__meta"><span>Border day</span><span>Day ${crossingDay}</span></div>
                <h5>${escapeHtml(crossing.name)}</h5>
                <p>${escapeHtml(crossing.route)} · ${escapeHtml(crossing.hours)}</p>
                <div class="journey-step__reason"><i class="fas fa-shield-halved" aria-hidden="true"></i>Reviewed ${escapeHtml(crossing.lastVerified)} · reconfirm before travel</div>
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
        <div><span>Border days</span><strong>${journey.crossings.length}</strong></div>
        <div><span>Flexible days</span><strong>${journey.extraDays}</strong></div>
    </div>
    ${vehicleWarnings.length ? `<div class="journey-result__warning"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i><p><strong>Vehicle check:</strong> ${escapeHtml(vehicleWarnings.map(segment => `${segment.route.title} needs ${segment.route.vehicle.label}`).join('; '))}.</p></div>` : ''}
    <div class="journey-timeline" aria-label="Day-by-day route structure">${timeline}</div>
    <details class="journey-checks"><summary>Important checks before booking</summary><ul>${journey.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}<li>Recheck border hours, entry rules, vehicle paperwork and regional travel advice close to departure.</li></ul></details>
    <p class="journey-result__note"><i class="fas fa-circle-info" aria-hidden="true"></i> This is a planning sequence, not live navigation. Saving creates an editable itinerary; it does not make bookings.</p>
    <p class="journey-result__status" role="status" aria-live="polite"></p>`;
    root.querySelector('h4')?.focus({ preventScroll: true });
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
        if (event.target.closest('[data-journey-reset]')) {
            currentJourney = null;
            try { localStorage.removeItem(STORAGE_KEY); } catch { /* Nothing to clear. */ }
            setForm(form, DEFAULTS);
            syncCountryControls(form, selectionStatus);
            results.hidden = true;
            results.replaceChildren();
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
}
