import countries from '../../data/countries.json';
import routeCollection from '../../data/route-collections.json';
import parks from '../../data/parks.json';
import borders from '../../data/borders.json';
import planningGuides from '../../data/planning-guides.json';
import practical from '../../data/practical.json';
import { buildSiteSearchIndex, SEARCH_TYPES, searchCountryOptions, searchSiteIndex } from '../lib/site-search.js';
import { routeToTripTemplate } from '../lib/route-collection.js';
import { createTrip } from '../lib/trip-store.js';
import { createModalFocusManager } from '../lib/modal-focus.js';
import { trackProductEvent } from '../lib/product-analytics.js';

const TYPE_ICONS = {
    destination: 'fa-location-dot',
    route: 'fa-route',
    park: 'fa-tree',
    border: 'fa-passport',
    guide: 'fa-book-open',
    practical: 'fa-compass',
};

const index = buildSiteSearchIndex({
    countries,
    routes: routeCollection.routes,
    parks,
    borders,
    guides: planningGuides.guides,
    visaHealth: practical.visaHealth,
});
const countryOptions = searchCountryOptions(index, countries);
const routesById = new Map(routeCollection.routes.map(route => [route.id, route]));

let shell = null;
let focusManager = null;
let activeType = 'all';

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

function countryLabel(ids) {
    return ids.map(id => countries[id]?.name || id.replaceAll('-', ' ')).join(' · ');
}

function resultHtml(item) {
    const country = countryLabel(item.countryIds);
    return `
        <article class="site-search-result" data-search-result-type="${escapeHtml(item.type)}">
            <div class="site-search-result__icon" aria-hidden="true"><i class="fas ${TYPE_ICONS[item.type] || 'fa-compass'}"></i></div>
            <div class="site-search-result__body">
                <div class="site-search-result__eyebrow">
                    <span>${escapeHtml(item.typeLabel)}</span>
                    ${country ? `<span>${escapeHtml(country)}</span>` : ''}
                    ${item.reviewed ? `<span>Reviewed ${escapeHtml(item.reviewed)}</span>` : ''}
                </div>
                <h3><a href="${escapeHtml(item.href)}" data-search-result-link data-search-type="${escapeHtml(item.type)}">${escapeHtml(item.title)}</a></h3>
                <p>${escapeHtml(item.summary)}</p>
                ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ''}
            </div>
            <div class="site-search-result__actions">
                ${item.type === 'route' ? `<button type="button" data-search-add-route="${escapeHtml(item.sourceId)}"><i class="fas fa-plus" aria-hidden="true"></i> My Safari</button>` : ''}
                <a href="${escapeHtml(item.href)}" data-search-result-link data-search-type="${escapeHtml(item.type)}" aria-label="Open ${escapeHtml(item.title)}"><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </div>
        </article>
    `;
}

function createShell() {
    if (shell) return shell;
    const root = document.createElement('div');
    root.className = 'site-search-shell';
    root.hidden = true;
    root.setAttribute('aria-labelledby', 'site-search-title');
    root.innerHTML = `
        <div class="site-search-backdrop" data-site-search-close></div>
        <section class="site-search-dialog" aria-labelledby="site-search-title">
            <header class="site-search-head">
                <div><span>Explore Southern Africa</span><h2 id="site-search-title">Search Savanna Explorer</h2></div>
                <button type="button" class="site-search-close modal-close" data-site-search-close aria-label="Close search"><i class="fas fa-xmark" aria-hidden="true"></i></button>
            </header>
            <div class="site-search-box">
                <i class="fas fa-search" aria-hidden="true"></i>
                <label class="sr-only" for="site-search-input">Search destinations, routes and travel guidance</label>
                <input id="site-search-input" type="search" autocomplete="off" placeholder="Try “7-day Namibia self-drive” or “malaria near Kruger”">
                <kbd>Esc</kbd>
            </div>
            <div class="site-search-controls">
                <div class="site-search-types" aria-label="Filter search by content type">
                    <button type="button" class="is-active" data-search-type-filter="all" aria-pressed="true">All</button>
                    ${SEARCH_TYPES.map(item => `<button type="button" data-search-type-filter="${item.id}" aria-pressed="false">${escapeHtml(item.label)}s</button>`).join('')}
                </div>
                <label class="site-search-country"><span>Country</span><select id="site-search-country"><option value="all">All countries</option>${countryOptions.map(item => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('')}</select></label>
            </div>
            <div class="site-search-summary"><p id="site-search-count" aria-live="polite"></p><span><kbd>↑</kbd><kbd>↓</kbd> browse <kbd>Enter</kbd> open</span></div>
            <div class="site-search-results" id="site-search-results"></div>
            <p class="site-search-status" id="site-search-status" role="status" aria-live="polite"></p>
            <footer><span><i class="fas fa-shield-halved" aria-hidden="true"></i> Independent planning information</span><span>Verify changing requirements with linked official sources.</span></footer>
        </section>
    `;
    document.body.append(root);
    shell = root;
    focusManager = createModalFocusManager(shell);
    bindShell();
    return shell;
}

function currentResults() {
    const query = shell.querySelector('#site-search-input').value;
    const country = shell.querySelector('#site-search-country').value;
    return searchSiteIndex(index, query, { type: activeType, country, limit: 24 });
}

function renderResults() {
    const results = currentResults();
    const query = shell.querySelector('#site-search-input').value.trim();
    const root = shell.querySelector('#site-search-results');
    const count = shell.querySelector('#site-search-count');
    count.textContent = query
        ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query}”`
        : `${results.length} recommended planning resources`;
    root.innerHTML = results.length
        ? results.map(resultHtml).join('')
        : `<div class="site-search-empty"><i class="fas fa-binoculars" aria-hidden="true"></i><h3>No matching travel guidance</h3><p>Try a country, destination, route, park, border or a broader travel topic.</p><button type="button" data-search-reset>Clear filters</button></div>`;
}

function closeSearch() {
    if (!shell || shell.hidden) return;
    shell.classList.remove('active');
    shell.hidden = true;
    document.body.classList.remove('site-search-open');
    focusManager.close();
}

function setType(type) {
    activeType = type;
    shell.querySelectorAll('[data-search-type-filter]').forEach(button => {
        const selected = button.dataset.searchTypeFilter === activeType;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    renderResults();
}

function addRouteToSafari(routeId) {
    const route = routesById.get(routeId);
    const template = routeToTripTemplate(route);
    const status = shell.querySelector('#site-search-status');
    if (!route || !template) {
        status.textContent = 'This route could not be added to My Safari.';
        return;
    }
    const trip = createTrip(template);
    trackProductEvent('route_added_to_trip', { source: 'site_search', countryCount: route.countryIds.length, hasDates: false });
    status.textContent = `${trip.name} is ready in My Safari.`;
    window.location.assign('/my-safari');
}

function moveResultFocus(direction) {
    const links = [...shell.querySelectorAll('.site-search-result h3 a')];
    if (!links.length) return;
    const current = links.indexOf(document.activeElement);
    const next = current < 0
        ? (direction > 0 ? 0 : links.length - 1)
        : (current + direction + links.length) % links.length;
    links[next].focus();
}

function bindShell() {
    const input = shell.querySelector('#site-search-input');
    input.addEventListener('input', renderResults);
    shell.querySelector('#site-search-country').addEventListener('change', renderResults);
    shell.addEventListener('click', event => {
        if (event.target.closest('[data-site-search-close]')) {
            closeSearch();
            return;
        }
        const type = event.target.closest('[data-search-type-filter]');
        if (type) {
            setType(type.dataset.searchTypeFilter);
            return;
        }
        if (event.target.closest('[data-search-reset]')) {
            input.value = '';
            shell.querySelector('#site-search-country').value = 'all';
            setType('all');
            input.focus();
            return;
        }
        const addRoute = event.target.closest('[data-search-add-route]');
        if (addRoute) {
            addRouteToSafari(addRoute.dataset.searchAddRoute);
            return;
        }
        const resultLink = event.target.closest('[data-search-result-link]');
        if (resultLink) {
            trackProductEvent('site_search_result_selected', { source: 'site_search', itemType: resultLink.dataset.searchType });
            closeSearch();
        }
    });
    shell.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeSearch();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveResultFocus(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveResultFocus(-1);
        }
    });
}

export function openSiteSearch(source = 'nav') {
    createShell();
    activeType = 'all';
    shell.querySelector('#site-search-input').value = '';
    shell.querySelector('#site-search-country').value = 'all';
    shell.querySelector('#site-search-status').textContent = '';
    setType('all');
    shell.hidden = false;
    shell.classList.add('active');
    document.body.classList.add('site-search-open');
    focusManager.open();
    requestAnimationFrame(() => shell.querySelector('#site-search-input').focus());
    trackProductEvent('site_search_opened', { source });
}
