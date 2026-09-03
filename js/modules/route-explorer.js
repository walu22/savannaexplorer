import routeCollection from '../../data/route-collections.json';
import { filterRouteCollection, routeToTripTemplate } from '../lib/route-collection.js';
import { mountRouteCollectionMap, destroyRouteCollectionMap } from '../lib/itinerary-maps.js';
import { createTrip } from '../lib/trip-store.js';
import { navigateHome, navigateToRoute, routePath, scrollToSection } from '../lib/router.js';
import { routeShareUrl } from '../lib/share.js';
import { setHomeMeta, setRouteMeta } from '../lib/page-meta.js';
import { renderShareBar } from './share.js';
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
}

function filteredRoutes() {
    return filterRouteCollection(routes, filters);
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
        <article class="route-explorer-card${route.id === selectedRouteId ? ' is-selected' : ''}">
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
            <a class="btn btn-outline btn-sm" href="${escapeHtml(routePath(route.id))}" data-route-select="${escapeHtml(route.id)}" aria-current="${route.id === selectedRouteId ? 'page' : 'false'}">Explore route</a>
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
                <label>Optional start date<input type="date" id="route-template-start-date"></label>
                <button type="button" class="btn btn-primary" data-route-start="${escapeHtml(route.id)}"><i class="fas fa-route"></i> Start in My Safari</button>
            </div>
        </div>
        <div class="route-detail-facts" aria-label="Route planning facts">
            <div><span>Vehicle</span><strong>${escapeHtml(route.vehicle.label)}</strong></div>
            <div><span>Best season</span><strong>${escapeHtml(route.bestSeason.label)}</strong><small>${escapeHtml(route.bestSeason.reason)}</small></div>
            <div><span>Best for</span><strong>${escapeHtml(route.travellerTypes.join(' · '))}</strong></div>
            <div><span>Reviewed</span><strong>${escapeHtml(route.lastReviewed)}</strong></div>
        </div>
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

function startRoute(routeId) {
    const route = routes.find(item => item.id === routeId);
    const startDate = document.getElementById('route-template-start-date')?.value || '';
    const template = routeToTripTemplate(route, startDate);
    const status = document.getElementById('route-explorer-status');
    if (!template || !route) {
        if (status) status.textContent = 'This route could not be added.';
        return;
    }
    const trip = createTrip(template);
    if (status) status.textContent = `${trip.name} is ready in My Safari. Opening your editable plan…`;
    navigateHome('hub-my-safari');
    setTimeout(() => document.getElementById('hub-my-safari')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

export function initRouteExplorer() {
    const section = document.getElementById('route-explorer');
    if (!section) return;
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
        const select = event.target.closest('[data-route-filter]');
        if (!select) return;
        filters = { ...filters, [select.dataset.routeFilter]: select.value };
        render();
        if (selectedRouteId) {
            navigateToRoute(selectedRouteId, { replace: true });
            setRouteMeta(selectedRouteId);
        } else {
            navigateHome('route-explorer', { replace: true });
            setHomeMeta();
        }
    });

    section.addEventListener('click', event => {
        const select = event.target.closest('[data-route-select]');
        const start = event.target.closest('[data-route-start]');
        if (select) {
            event.preventDefault();
            selectedRouteId = select.dataset.routeSelect;
            navigateToRoute(selectedRouteId);
            setRouteMeta(selectedRouteId);
            render();
            document.querySelector('#route-explorer-detail h3')?.focus({ preventScroll: true });
        } else if (start) {
            startRoute(start.dataset.routeStart);
        } else if (event.target.closest('[data-route-print]')) {
            window.print();
        }
    });
}
