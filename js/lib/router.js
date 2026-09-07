import { revealThroughSection } from '../modules/reveal.js';
import { HUB_SECTIONS, parseRouteShape } from './route-shape.js';

export const COUNTRY_IDS = [
    'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe',
    'mozambique', 'malawi', 'lesotho', 'eswatini',
];
export { HUB_SECTIONS };

function announceRouteChange() {
    window.dispatchEvent(new CustomEvent('savanna:routechange'));
}

export function countryPath(countryId) {
    return `/countries/${countryId}`;
}

export function parkPath(parkId) {
    return `/parks/${parkId}`;
}

export function borderPath(borderId) {
    return `/borders/${borderId}`;
}

export function routePath(routeId) {
    return `/routes/${routeId}`;
}

export function listingPath(itemOrId) {
    const item = typeof itemOrId === 'object' ? itemOrId : null;
    if (!item) return '/';
    const segment = item.kind === 'stay' ? 'stays' : 'operators';
    return `/${segment}/${item.id}`;
}

export function planningGuidePath(countryId) {
    return `/guides/planning/${countryId}`;
}

export function parseLocation(loc = window.location) {
    const route = parseRouteShape(loc);
    if (route.type === 'home' && COUNTRY_IDS.includes(route.sectionHash)) {
        return { type: 'legacy-country-hash', countryId: route.sectionHash };
    }
    return route;
}

export function navigateToCountry(countryId, { replace = false } = {}) {
    if (!COUNTRY_IDS.includes(countryId)) return;
    const url = countryPath(countryId);
    const state = { view: 'country', countryId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function navigateToPark(parkId, { replace = false } = {}) {
    if (!parkId) return;
    const url = parkPath(parkId);
    const state = { view: 'park', parkId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function navigateToBorder(borderId, { replace = false } = {}) {
    if (!borderId) return;
    const url = borderPath(borderId);
    const state = { view: 'border', borderId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function navigateToRoute(routeId, { replace = false } = {}) {
    if (!routeId) return;
    const url = routePath(routeId);
    const state = { view: 'route', routeId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function navigateToPlanningGuide(countryId, { replace = false } = {}) {
    if (!COUNTRY_IDS.includes(countryId)) return;
    const url = planningGuidePath(countryId);
    const state = { view: 'planning-guide', countryId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function navigateToListing(item, { replace = false } = {}) {
    if (!item) return;
    const url = listingPath(item);
    const state = { view: 'listing', listingId: item.id };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function navigateHome(sectionId = null, { replace = false } = {}) {
    const url = sectionId ? `/#${sectionId}` : '/';
    const state = { view: 'home', sectionId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
    announceRouteChange();
}

export function replaceWithCountryPath(countryId) {
    if (!COUNTRY_IDS.includes(countryId)) return;
    history.replaceState({ view: 'country', countryId }, '', countryPath(countryId));
    announceRouteChange();
}

export function scrollToSection(sectionId) {
    if (!sectionId) return;
    revealThroughSection(sectionId);
    const el = document.getElementById(sectionId);
    if (!el) return;

    const nav = document.getElementById('navbar');
    const offset = (nav?.offsetHeight || 76) + 12;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });

    if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '-1');
    }
    el.focus({ preventScroll: true });
}
