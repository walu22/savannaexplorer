import routeCollection from '../../data/route-collections.json';
import { filterRouteCollection, routeToTripTemplate } from '../lib/route-collection.js';
import { MAX_COMPARE_ROUTES, normalizeComparisonIds, routeCostSignal, toggleComparisonId } from '../lib/route-comparison.js';
import { DEFAULT_ROUTE_PREFERENCES, normalizeRoutePreferences, rankRouteMatches } from '../lib/route-matcher.js';
import { mountRouteCollectionMap, destroyRouteCollectionMap } from '../lib/itinerary-maps.js';
import { createTrip, updateTrip } from '../lib/trip-store.js';
import { trackProductEvent } from '../lib/product-analytics.js';
import { navigateHome, navigateToRoute, routePath, scrollToSection } from '../lib/router.js';
import { routeShareUrl } from '../lib/share.js';
import { setHomeMeta, setRouteMeta } from '../lib/page-meta.js';
import { renderShareBar } from './share.js';
import { initJourneyComposer } from './journey-composer.js';
import { evaluateRouteFeasibility, normalizeFeasibilityPreferences } from '../lib/route-feasibility.js';
import {
    formatDriveMinutes,
    editorialLegFor,
    fuelPlanningPrompt,
    getEditorialLogistics,
    getRouteLogistics,
    routeLogisticsMeta,
    routeLogisticsSummary,
} from '../lib/route-logistics.js';

const COUNTRY_LABELS = {
    namibia: 'Namibia',
    'south-africa': 'South Africa',
    botswana: 'Botswana',
    zambia: 'Zambia',
    zimbabwe: 'Zimbabwe',
    mozambique: 'Mozambique',
    malawi: 'Malawi',
    lesotho: 'Lesotho',
    eswatini: 'Eswatini',
};

const THEME_LABELS = {
    wildlife: 'Wildlife',
    landscapes: 'Landscapes',
    culture: 'Culture',
    coast: 'Coast',
    water: 'Rivers & lakes',
    adventure: 'Adventure',
    family: 'Family',
};

const routes = routeCollection.routes;
let filters = { country: 'all', duration: 'all', vehicle: 'all', theme: 'all' };
let selectedRouteId = routes[0]?.id || '';
let sectionIsNearViewport = false;
let visibilityObserver = null;
let explorerActivated = false;
let comparisonIds = [];
let comparisonOpen = false;
let matcherMatches = [];
const feasibilityPreferences = new Map();

const COMPARISON_STORAGE_KEY = 'se_route_comparison_v1';
const MATCHER_STORAGE_KEY = 'se_route_matcher_v1';

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function countryNames(route) {
    return route.countryIds.map(id => COUNTRY_LABELS[id] || id).join(' · ');
}

function googleMapsUrl(route) {
    return `https://www.google.com/maps/dir/${route.stops.map(stop => encodeURIComponent(`${stop.name}, ${countryNames(route)}`)).join('/')}`;
}

function routeFeasibilityMarkup(route) {
    const preferences = feasibilityPreferences.get(route.id) || normalizeFeasibilityPreferences(route);
    feasibilityPreferences.set(route.id, preferences);
    const assessment = evaluateRouteFeasibility(route, preferences);
    const vehicleOptions = [
        ['standard', 'Standard car'],
        ['suv', 'High-clearance SUV'],
        ['4x4', 'Experienced 4×4'],
    ].map(([value, label]) => `<option value="${value}"${preferences.vehicle === value ? ' selected' : ''}>${label}</option>`).join('');
    return `
        <section class="route-feasibility" aria-labelledby="route-feasibility-title">
            <div class="route-feasibility__heading">
                <div><span class="section-eyebrow">Before you save</span><h4 id="route-feasibility-title">Trip Fit Check</h4><p>Test this route against the time, vehicle and month you actually plan to use.</p></div>
                <span class="route-feasibility__status is-${assessment.status}"><i class="fas ${assessment.status === 'ready' ? 'fa-circle-check' : assessment.status === 'blocker' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}" aria-hidden="true"></i>${escapeHtml(assessment.statusLabel)}</span>
            </div>
            <div class="route-feasibility__controls">
                <label><span>Start date</span><input type="date" id="route-template-start-date" value="${escapeHtml(preferences.startDate)}" data-route-feasibility="startDate"></label>
                <label><span>Days available</span><input type="number" min="1" max="60" inputmode="numeric" value="${preferences.days}" data-route-feasibility="days"></label>
                <label><span>Vehicle you will use</span><select data-route-feasibility="vehicle">${vehicleOptions}</select></label>
            </div>
            <div id="route-feasibility-result">${routeFeasibilityResultMarkup(route, assessment)}</div>
        </section>`;
}

function routeFeasibilityResultMarkup(route, assessment) {
    return `
        <div class="route-feasibility__summary"><strong>${escapeHtml(assessment.summary)}</strong><span>${assessment.alignedCount} / ${assessment.checks.length} aligned</span></div>
        <div class="route-feasibility__checks">${assessment.checks.map(item => `
            <article class="route-feasibility__check is-${item.status}">
                <i class="fas ${item.status === 'ready' ? 'fa-check' : item.status === 'blocker' ? 'fa-xmark' : 'fa-exclamation'}" aria-hidden="true"></i>
                <div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><p>${escapeHtml(item.detail)}</p></div>
            </article>`).join('')}</div>
        <footer><p>Planning guidance, not a road guarantee. Reconfirm weather, access and official requirements near departure.</p><button type="button" class="btn btn-primary" data-route-start="${escapeHtml(route.id)}"${assessment.blockerCount ? ' disabled' : ''}><i class="fas fa-route" aria-hidden="true"></i> ${assessment.blockerCount ? 'Resolve blockers to continue' : 'Build this trip in My Safari'}</button></footer>`;
}

function updateRouteFeasibility(route) {
    const result = document.getElementById('route-feasibility-result');
    if (!result) return;
    const assessment = evaluateRouteFeasibility(route, feasibilityPreferences.get(route.id));
    result.innerHTML = routeFeasibilityResultMarkup(route, assessment);
    const status = document.querySelector('.route-feasibility__status');
    if (status) {
        status.className = `route-feasibility__status is-${assessment.status}`;
        status.innerHTML = `<i class="fas ${assessment.status === 'ready' ? 'fa-circle-check' : assessment.status === 'blocker' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}" aria-hidden="true"></i>${escapeHtml(assessment.statusLabel)}`;
    }
}

function renderRouteLogistics(route) {
    const logistics = getRouteLogistics(route.id);
    if (!logistics) return '';
    const editorial = getEditorialLogistics(route.id);
    const summary = routeLogisticsSummary(logistics, editorial);
    const stopsById = new Map(route.stops.map(stop => [stop.id, stop]));
    const coverage = summary.needsLocalCheck
        ? `${summary.mappedLegCount} of ${summary.legCount} legs mapped`
        : `${summary.distanceKm.toLocaleString()} km estimated`;
    const timeLabel = summary.needsLocalCheck ? 'Mapped driving time' : 'Estimated driving time';

    return `
        <section class="route-logistics" aria-labelledby="route-logistics-title">
            <div class="route-logistics__heading">
                <div>
                    <span>Route logistics · planning estimates</span>
                    <h4 id="route-logistics-title">Drive legs and fuel readiness</h4>
                </div>
                <button type="button" class="btn btn-outline btn-sm route-print-btn" data-route-print><i class="fas fa-print" aria-hidden="true"></i> Print / save PDF</button>
            </div>
            <div class="route-logistics__summary">
                <div><span>Road coverage</span><strong>${escapeHtml(coverage)}</strong></div>
                <div><span>${escapeHtml(timeLabel)}</span><strong>${escapeHtml(formatDriveMinutes(summary.driveMinutes))}</strong></div>
                <div><span>Fuel preparation</span><strong>${escapeHtml(fuelPlanningPrompt(route.vehicle.id))}</strong></div>
            </div>
            <ol class="route-logistics__legs">
                ${logistics.legs.map((leg, index) => {
                    const from = stopsById.get(leg.fromStopId)?.name || leg.fromStopId;
                    const to = stopsById.get(leg.toStopId)?.name || leg.toStopId;
                    const reviewed = editorialLegFor(editorial, leg);
                    const officialEstimate = reviewed?.distanceKm && reviewed?.driveMinutes;
                    const needsCheck = leg.confidence === 'low' && !officialEstimate;
                    const detail = officialEstimate
                        ? `${Number(reviewed.distanceKm).toLocaleString()} km · ${formatDriveMinutes(reviewed.driveMinutes)} · official route guidance`
                        : needsCheck
                            ? reviewed?.guidance || 'Remote or off-road leg — confirm the route and driving time locally'
                            : `${Number(leg.distanceKm).toLocaleString()} km · ${formatDriveMinutes(leg.driveMinutes)}`;
                    return `<li>
                        <span class="route-logistics__number">${index + 1}</span>
                        <div><strong>${escapeHtml(from)} <i class="fas fa-arrow-right" aria-hidden="true"></i> ${escapeHtml(to)}</strong><small>${escapeHtml(detail)}${reviewed?.via?.length ? `<br><b>Route via:</b> ${escapeHtml(reviewed.via.join(' · '))}` : ''}</small></div>
                        <span class="route-logistics__confidence route-logistics__confidence--${needsCheck ? 'check' : officialEstimate ? 'official' : leg.confidence}">${needsCheck ? 'Check locally' : officialEstimate ? 'Official estimate' : `${escapeHtml(leg.confidence)} confidence`}</span>
                    </li>`;
                }).join('')}
            </ol>
            ${editorial ? `<div class="route-logistics__field-notes">
                <section><h5>Fuel and supplies</h5><ul>${editorial.fuelAnchors.map(anchor => `<li><strong>${escapeHtml(anchor.name)}</strong> — ${escapeHtml(anchor.note)}</li>`).join('')}</ul></section>
                <section><h5>Gate and permit checks</h5><ul>${editorial.gatePermitNotes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></section>
                <section><h5>Overnight anchors</h5><p>${escapeHtml(editorial.overnightAnchors.join(' · '))}</p></section>
                <section><h5>Reviewed sources</h5>${editorial.sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`).join('')}</section>
            </div>` : ''}
            <p class="route-logistics__note"><strong>Captured ${escapeHtml(logistics.capturedAt)}.</strong> ${escapeHtml(routeLogisticsMeta.disclaimer)} Estimates use OpenStreetMap road data; a leg is withheld when a remote stop is too far from the mapped road.</p>
        </section>
    `;
}

function renderFilters() {
    const country = document.getElementById('route-filter-country');
    if (country && country.options.length <= 1) {
        country.insertAdjacentHTML('beforeend', Object.entries(COUNTRY_LABELS)
            .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join(''));
    }
    const matcherCountry = document.getElementById('route-match-country');
    if (matcherCountry && matcherCountry.options.length <= 1) {
        matcherCountry.insertAdjacentHTML('beforeend', Object.entries(COUNTRY_LABELS)
            .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join(''));
    }
}

function filteredRoutes() {
    return filterRouteCollection(routes, filters);
}

function restoreComparison() {
    try {
        comparisonIds = normalizeComparisonIds(JSON.parse(localStorage.getItem(COMPARISON_STORAGE_KEY) || '[]'), routes);
    } catch {
        comparisonIds = [];
    }
}

function saveComparison() {
    try {
        localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(comparisonIds));
    } catch {
        // Comparison remains available for the current page when storage is unavailable.
    }
}

function comparisonRoutes() {
    return comparisonIds.map(id => routes.find(route => route.id === id)).filter(Boolean);
}

function setMatcherForm(preferences) {
    const normalized = normalizeRoutePreferences(preferences);
    const form = document.getElementById('route-matcher-form');
    if (!form) return;
    form.elements.country.value = normalized.country;
    form.elements.days.value = String(normalized.days);
    form.elements.vehicle.value = normalized.vehicle;
    form.elements.theme.value = normalized.theme;
}

function readMatcherForm() {
    const form = document.getElementById('route-matcher-form');
    if (!form) return DEFAULT_ROUTE_PREFERENCES;
    return normalizeRoutePreferences({
        country: form.elements.country.value,
        days: form.elements.days.value,
        vehicle: form.elements.vehicle.value,
        theme: form.elements.theme.value,
    });
}

function saveMatcher(preferences) {
    try {
        localStorage.setItem(MATCHER_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
        // Recommendations still work when storage is unavailable.
    }
}

function renderRouteMatches() {
    const root = document.getElementById('route-matcher-results');
    if (!root) return;
    if (!matcherMatches.length) {
        root.hidden = true;
        root.innerHTML = '';
        return;
    }
    root.hidden = false;
    root.innerHTML = `
        <div class="route-matcher-results__heading">
            <div><span class="section-eyebrow">Your strongest options</span><h4 tabindex="-1">Recommended routes</h4></div>
            <button type="button" class="btn btn-outline btn-sm" data-match-compare-all><i class="fas fa-scale-balanced" aria-hidden="true"></i> Compare these routes</button>
        </div>
        <div class="route-matcher-results__grid">
            ${matcherMatches.map((match, index) => `
                <article class="route-match-card">
                    <div class="route-match-card__top"><span>#${index + 1}</span><strong>${escapeHtml(match.label)}</strong></div>
                    <h5>${escapeHtml(match.route.title)}</h5>
                    <p>${escapeHtml(countryNames(match.route))} · ${escapeHtml(match.route.duration.label)} · ${escapeHtml(match.route.vehicle.label)}</p>
                    <ul class="route-match-card__reasons">${match.reasons.map(reason => `<li><i class="fas fa-check" aria-hidden="true"></i>${escapeHtml(reason)}</li>`).join('')}</ul>
                    ${match.cautions.length ? `<ul class="route-match-card__cautions">${match.cautions.map(caution => `<li><i class="fas fa-triangle-exclamation" aria-hidden="true"></i>${escapeHtml(caution)}</li>`).join('')}</ul>` : ''}
                    <div class="route-match-card__actions">
                        <a class="btn btn-outline btn-sm" href="${escapeHtml(routePath(match.route.id))}" data-route-select="${escapeHtml(match.route.id)}">Explore</a>
                        <a class="btn btn-primary btn-sm" href="${escapeHtml(routePath(match.route.id))}" data-route-select="${escapeHtml(match.route.id)}">Check trip fit</a>
                    </div>
                </article>
            `).join('')}
        </div>
    `;
}

function runRouteMatcher(preferences, { focus = true } = {}) {
    const normalized = normalizeRoutePreferences(preferences);
    setMatcherForm(normalized);
    saveMatcher(normalized);
    matcherMatches = rankRouteMatches(routes, normalized);
    renderRouteMatches();
    if (focus) document.querySelector('#route-matcher-results h4')?.focus({ preventScroll: true });
}

function restoreRouteMatcher() {
    try {
        const saved = localStorage.getItem(MATCHER_STORAGE_KEY);
        if (!saved) {
            setMatcherForm(DEFAULT_ROUTE_PREFERENCES);
            return;
        }
        runRouteMatcher(JSON.parse(saved), { focus: false });
    } catch {
        setMatcherForm(DEFAULT_ROUTE_PREFERENCES);
    }
}

function renderComparison() {
    const root = document.getElementById('route-comparison');
    if (!root) return;
    const selected = comparisonRoutes();
    if (!comparisonOpen || selected.length < 2) {
        root.hidden = true;
        root.innerHTML = '';
        return;
    }

    const row = (label, renderValue) => `<tr><th scope="row">${escapeHtml(label)}</th>${selected.map(route => `<td>${renderValue(route)}</td>`).join('')}</tr>`;
    const logisticsFor = route => routeLogisticsSummary(getRouteLogistics(route.id), getEditorialLogistics(route.id));
    root.hidden = false;
    root.innerHTML = `
        <div class="route-comparison__heading">
            <div><span class="section-eyebrow">Side-by-side decision</span><h3 id="route-comparison-title" tabindex="-1">Which route fits your trip?</h3></div>
            <button type="button" class="route-comparison__close" data-compare-close aria-label="Close route comparison">&times;</button>
        </div>
        <p class="route-comparison__intro">The cost level is a relative planning signal based on duration, vehicle and route complexity—not a live price quote.</p>
        <div class="route-comparison__scroll" tabindex="0" aria-label="Scrollable route comparison table">
            <table>
                <thead><tr><th scope="col">Compare</th>${selected.map(route => `<th scope="col"><a href="${escapeHtml(routePath(route.id))}" data-route-select="${escapeHtml(route.id)}">${escapeHtml(route.title)}</a></th>`).join('')}</tr></thead>
                <tbody>
                    ${row('Countries', route => escapeHtml(countryNames(route)))}
                    ${row('Trip length', route => `<strong>${escapeHtml(route.duration.label)}</strong>`)}
                    ${row('Relative cost planning', route => { const signal = routeCostSignal(route); return `<strong class="route-cost-signal route-cost-signal--${signal.level.toLowerCase()}">${escapeHtml(signal.level)}</strong><small>${escapeHtml(signal.reasons.join(' · '))}</small>`; })}
                    ${row('Vehicle', route => `<strong>${escapeHtml(route.vehicle.label)}</strong>`)}
                    ${row('Road planning', route => { const summary = logisticsFor(route); return `<strong>${summary.needsLocalCheck ? `${summary.mappedLegCount} of ${summary.legCount} legs mapped` : `${summary.distanceKm.toLocaleString()} km estimated`}</strong><small>${escapeHtml(formatDriveMinutes(summary.driveMinutes))} mapped driving · ${route.readiness === 'green' ? 'map ready' : 'check conditions'}</small>`; })}
                    ${row('Stops', route => `<strong>${route.stops.length}</strong>`)}
                    ${row('Best season', route => `<strong>${escapeHtml(route.bestSeason.label)}</strong><small>${escapeHtml(route.bestSeason.reason)}</small>`)}
                    ${row('Best for', route => escapeHtml(route.travellerTypes.join(' · ')))}
                    ${row('Highlights', route => `<ul>${route.highlights.slice(0, 3).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)}
                    ${row('Main planning check', route => escapeHtml(route.warnings[0]))}
                    ${row('Choose route', route => `<a class="btn btn-primary btn-sm" href="${escapeHtml(routePath(route.id))}" data-route-select="${escapeHtml(route.id)}">Review trip fit</a>`)}
                </tbody>
            </table>
        </div>
    `;
}

function renderCompareTray(message = '') {
    const tray = document.getElementById('route-compare-tray');
    const chips = document.getElementById('route-compare-chips');
    const summary = document.getElementById('route-compare-summary');
    const open = document.getElementById('route-compare-open');
    if (!tray || !chips || !summary || !open) return;
    const selected = comparisonRoutes();
    tray.hidden = selected.length === 0;
    chips.innerHTML = selected.map(route => `<button type="button" data-compare-remove="${escapeHtml(route.id)}" aria-label="Remove ${escapeHtml(route.title)} from comparison">${escapeHtml(route.title)} <span aria-hidden="true">&times;</span></button>`).join('');
    open.disabled = selected.length < 2;
    summary.textContent = message || (selected.length < 2
        ? 'Choose one more route to compare.'
        : `${selected.length} routes selected. You can compare up to ${MAX_COMPARE_ROUTES}.`);
    if (selected.length < 2) comparisonOpen = false;
    renderComparison();
}

function toggleRouteComparison(routeId) {
    const result = toggleComparisonId(comparisonIds, routeId, routes);
    comparisonIds = result.ids;
    saveComparison();
    renderCards(filteredRoutes());
    renderDetail(routes.find(route => route.id === selectedRouteId));
    const route = routes.find(item => item.id === routeId);
    const message = result.outcome === 'limit'
        ? `You can compare up to ${MAX_COMPARE_ROUTES} routes. Remove one before adding another.`
        : result.outcome === 'added'
            ? `${route?.title || 'Route'} added to your comparison.`
            : result.outcome === 'removed'
                ? `${route?.title || 'Route'} removed from your comparison.`
                : 'That route could not be added.';
    renderCompareTray(message);
}

function renderCards(visible) {
    const grid = document.getElementById('route-explorer-results');
    const count = document.getElementById('route-explorer-count');
    if (!grid || !count) return;
    count.textContent = `${visible.length} route${visible.length === 1 ? '' : 's'}`;
    if (!visible.length) {
        grid.innerHTML = '<p class="route-explorer-empty">No routes match these filters. Try broadening one selection.</p>';
        return;
    }
    grid.innerHTML = visible.map(route => `
        <article class="route-explorer-card${route.id === selectedRouteId ? ' is-selected' : ''}${comparisonIds.includes(route.id) ? ' is-comparing' : ''}">
            <div class="route-explorer-card__top">
                <span>${escapeHtml(countryNames(route))}</span>
                <span class="route-readiness route-readiness--${escapeHtml(route.readiness)}">${route.readiness === 'green' ? 'Map ready' : 'Check conditions'}</span>
            </div>
            <h3>${escapeHtml(route.title)}</h3>
            <p>${escapeHtml(route.promise)}</p>
            <div class="route-explorer-card__meta">
                <span><i class="far fa-clock"></i> ${escapeHtml(route.duration.label)}</span>
                <span><i class="fas fa-car"></i> ${escapeHtml(route.vehicle.label)}</span>
                <span><i class="fas fa-location-dot"></i> ${route.stops.length} stops</span>
            </div>
            <div class="route-explorer-card__actions">
                <a class="btn btn-outline btn-sm" href="${escapeHtml(routePath(route.id))}" data-route-select="${escapeHtml(route.id)}" aria-current="${route.id === selectedRouteId ? 'page' : 'false'}">Explore route</a>
                <button type="button" class="route-compare-toggle" data-route-compare="${escapeHtml(route.id)}" aria-pressed="${comparisonIds.includes(route.id)}"><i class="fas fa-scale-balanced" aria-hidden="true"></i> ${comparisonIds.includes(route.id) ? 'Selected' : 'Compare'}</button>
            </div>
        </article>
    `).join('');
}

function renderDetail(route) {
    const root = document.getElementById('route-explorer-detail');
    if (!root) return;
    if (!route) {
        destroyRouteCollectionMap();
        root.innerHTML = '<p class="route-explorer-empty">Choose a broader filter to see route details.</p>';
        return;
    }

    root.innerHTML = `
        <div class="route-detail-heading">
            <div>
                <span class="section-eyebrow">${escapeHtml(countryNames(route))} · ${escapeHtml(route.duration.label)}</span>
                <h3 tabindex="-1">${escapeHtml(route.title)}</h3>
                <p>${escapeHtml(route.promise)}</p>
            </div>
            <div class="route-detail-actions">
                <button type="button" class="btn btn-outline" data-route-compare="${escapeHtml(route.id)}" aria-pressed="${comparisonIds.includes(route.id)}"><i class="fas fa-scale-balanced" aria-hidden="true"></i> ${comparisonIds.includes(route.id) ? 'Selected for comparison' : 'Add to comparison'}</button>
            </div>
        </div>
        <div class="route-detail-facts" aria-label="Route planning facts">
            <div><span>Vehicle</span><strong>${escapeHtml(route.vehicle.label)}</strong></div>
            <div><span>Best season</span><strong>${escapeHtml(route.bestSeason.label)}</strong><small>${escapeHtml(route.bestSeason.reason)}</small></div>
            <div><span>Best for</span><strong>${escapeHtml(route.travellerTypes.join(' · '))}</strong></div>
            <div><span>Reviewed</span><strong>${escapeHtml(route.lastReviewed)}</strong></div>
        </div>
        ${routeFeasibilityMarkup(route)}
        <div class="route-detail-map-wrap">
            <div id="route-explorer-map" class="route-explorer-map" role="img" aria-label="Map showing the ordered stops for ${escapeHtml(route.title)}"></div>
            <ol class="route-detail-stops" tabindex="0" aria-label="Ordered route stops">${route.stops.map((stop, index) => `<li><span>${index + 1}</span><div><strong>${escapeHtml(stop.name)}</strong><small>${escapeHtml(stop.region)}</small><p>${escapeHtml(stop.summary)}</p></div></li>`).join('')}</ol>
        </div>
        ${renderRouteLogistics(route)}
        <div class="route-detail-grid">
            <section><h4>Suggested pacing</h4><ol class="route-detail-days">${route.phases.map(phase => `<li><strong>${phase.dayStart === phase.dayEnd ? `Day ${phase.dayStart}` : `Days ${phase.dayStart}–${phase.dayEnd}`}: ${escapeHtml(phase.title)}</strong><p>${escapeHtml(phase.summary)}</p></li>`).join('')}</ol></section>
            <section><h4>Why choose this route</h4><ul>${route.highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul><h4 class="route-warning-title">Check before travel</h4><ul class="route-warning-list">${route.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        </div>
        <div class="route-detail-footer">
            <div><strong>Official planning sources</strong>${route.officialSources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} <i class="fas fa-arrow-up-right-from-square"></i></a>`).join('')}</div>
            <a class="btn btn-outline btn-sm" href="${escapeHtml(googleMapsUrl(route))}" target="_blank" rel="noopener noreferrer">Open stops in Google Maps</a>
        </div>
        <div class="route-detail-share">${renderShareBar({
            url: routeShareUrl(route.id),
            title: `${route.title} road trip`,
            text: `${route.promise} Explore the stops, timing and planning notes on Savanna Explorer.`,
            compact: true,
        })}</div>
        <p class="route-detail-disclaimer">${escapeHtml(routeCollection.meta.disclaimer)}</p>
        <p id="route-explorer-status" class="route-explorer-status" role="status" aria-live="polite"></p>
    `;

    if (!sectionIsNearViewport) {
        destroyRouteCollectionMap();
        return;
    }

    mountRouteCollectionMap(route).catch(() => {
        const map = document.getElementById('route-explorer-map');
        if (map) {
            map.removeAttribute('aria-busy');
            map.innerHTML = '<p>Interactive map unavailable. The ordered stop list remains available.</p>';
        }
    });
}

function render() {
    const visible = filteredRoutes();
    if (!visible.some(route => route.id === selectedRouteId)) selectedRouteId = visible[0]?.id || '';
    renderCards(visible);
    renderDetail(visible.find(route => route.id === selectedRouteId));
    renderCompareTray();
}

export function openRouteExplorer(routeId) {
    const route = routes.find(item => item.id === routeId);
    if (!route) return false;
    explorerActivated = true;
    renderFilters();
    filters = { country: 'all', duration: 'all', vehicle: 'all', theme: 'all' };
    selectedRouteId = routeId;
    document.querySelectorAll('[data-route-filter]').forEach(select => { select.value = 'all'; });
    render();
    requestAnimationFrame(() => scrollToSection('route-explorer'));
    return true;
}

function startRoute(routeId, source = 'route_explorer') {
    const route = routes.find(item => item.id === routeId);
    const startDate = document.getElementById('route-template-start-date')?.value || '';
    const preferences = feasibilityPreferences.get(routeId) || normalizeFeasibilityPreferences(route, { startDate });
    const template = routeToTripTemplate(route, startDate);
    const status = document.getElementById('route-explorer-status');
    if (!template || !route) {
        if (status) status.textContent = 'This route could not be added.';
        return;
    }
    const trip = createTrip(template);
    updateTrip(trip.id, {
        operations: {
            ...trip.operations,
            vehicleCapability: preferences.vehicle === 'suv' ? 'high-clearance' : preferences.vehicle,
        },
    });
    trackProductEvent('route_added_to_trip', {
        source,
        countryCount: route.countryIds.length,
        hasDates: Boolean(startDate),
    });
    if (status) status.textContent = `${trip.name} is ready in My Safari. Opening your editable plan…`;
    window.location.assign('/my-safari');
}

export function initRouteExplorer() {
    const section = document.getElementById('route-explorer');
    if (!section) return;
    initJourneyComposer();
    restoreComparison();
    renderFilters();
    restoreRouteMatcher();
    const shouldActivateImmediately = window.location.pathname.startsWith('/routes/')
        || window.location.hash === '#route-explorer';
    if (shouldActivateImmediately) {
        explorerActivated = true;
        renderFilters();
        render();
    }

    if ('IntersectionObserver' in window) {
        visibilityObserver?.disconnect();
        visibilityObserver = new IntersectionObserver(entries => {
            sectionIsNearViewport = entries.some(entry => entry.isIntersecting);
            if (sectionIsNearViewport) {
                if (!explorerActivated) {
                    explorerActivated = true;
                    renderFilters();
                    render();
                } else {
                    const selected = routes.find(route => route.id === selectedRouteId);
                    if (selected) renderDetail(selected);
                }
            } else {
                destroyRouteCollectionMap();
            }
        }, { rootMargin: '80px 0px', threshold: 0 });
        visibilityObserver.observe(section);
    } else {
        sectionIsNearViewport = true;
        explorerActivated = true;
        renderFilters();
        render();
    }

    section.addEventListener('change', event => {
        const feasibilityInput = event.target.closest('[data-route-feasibility]');
        if (feasibilityInput) {
            const route = routes.find(item => item.id === selectedRouteId);
            if (!route) return;
            const current = feasibilityPreferences.get(route.id) || normalizeFeasibilityPreferences(route);
            feasibilityPreferences.set(route.id, normalizeFeasibilityPreferences(route, {
                ...current,
                [feasibilityInput.dataset.routeFeasibility]: feasibilityInput.value,
            }));
            updateRouteFeasibility(route);
            return;
        }
        const select = event.target.closest('[data-route-filter]');
        if (!select) return;
        filters = { ...filters, [select.dataset.routeFilter]: select.value };
        render();
        if (selectedRouteId) {
            navigateToRoute(selectedRouteId, { replace: true });
            setRouteMeta(routes.find(route => route.id === selectedRouteId));
        } else {
            navigateHome('route-explorer', { replace: true });
            setHomeMeta();
        }
    });

    section.addEventListener('submit', event => {
        if (event.target.id !== 'route-matcher-form') return;
        event.preventDefault();
        if (!event.target.reportValidity()) return;
        runRouteMatcher(readMatcherForm());
        trackProductEvent('route_match_completed', { source: 'route_explorer', status: 'matched' });
    });

    section.addEventListener('click', event => {
        const select = event.target.closest('[data-route-select]');
        const start = event.target.closest('[data-route-start]');
        const compare = event.target.closest('[data-route-compare]');
        const removeCompare = event.target.closest('[data-compare-remove]');
        const compareMatches = event.target.closest('[data-match-compare-all]');
        if (select) {
            event.preventDefault();
            selectedRouteId = select.dataset.routeSelect;
            navigateToRoute(selectedRouteId);
            setRouteMeta(routes.find(route => route.id === selectedRouteId));
            render();
            document.querySelector('#route-explorer-detail h3')?.focus({ preventScroll: true });
        } else if (start) {
            const source = start.closest('#route-matcher-results') ? 'route_matcher' : 'route_explorer';
            startRoute(start.dataset.routeStart, source);
        } else if (compare) {
            toggleRouteComparison(compare.dataset.routeCompare);
        } else if (removeCompare) {
            toggleRouteComparison(removeCompare.dataset.compareRemove);
        } else if (compareMatches) {
            comparisonIds = normalizeComparisonIds(matcherMatches.map(match => match.route.id), routes);
            comparisonOpen = true;
            saveComparison();
            renderCards(filteredRoutes());
            renderDetail(routes.find(route => route.id === selectedRouteId));
            renderCompareTray('Your recommended routes are ready to compare.');
            document.getElementById('route-comparison-title')?.focus({ preventScroll: true });
            document.getElementById('route-comparison')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (event.target.closest('#route-matcher-reset')) {
            matcherMatches = [];
            try { localStorage.removeItem(MATCHER_STORAGE_KEY); } catch { /* No stored preferences to clear. */ }
            setMatcherForm(DEFAULT_ROUTE_PREFERENCES);
            renderRouteMatches();
            document.getElementById('route-match-country')?.focus();
        } else if (event.target.closest('#route-compare-open')) {
            comparisonOpen = true;
            renderComparison();
            document.getElementById('route-comparison-title')?.focus({ preventScroll: true });
            document.getElementById('route-comparison')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (event.target.closest('#route-compare-clear')) {
            comparisonIds = [];
            comparisonOpen = false;
            saveComparison();
            renderCards(filteredRoutes());
            renderDetail(routes.find(route => route.id === selectedRouteId));
            renderCompareTray();
        } else if (event.target.closest('[data-compare-close]')) {
            comparisonOpen = false;
            renderComparison();
            document.getElementById('route-compare-open')?.focus();
        } else if (event.target.closest('[data-route-print]')) {
            window.print();
        }
    });
}
