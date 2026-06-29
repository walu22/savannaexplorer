import countries from '../../data/countries.json';
import parks from '../../data/parks.json';
import borders from '../../data/borders.json';
import itineraries from '../../data/itineraries.json';
import listings from '../../data/stays-operators.json';
import { revealThroughSection } from '../modules/reveal.js';

export const COUNTRY_IDS = Object.keys(countries);

const parkIds = new Set(parks.map(p => p.id));
const borderIds = new Set(borders.map(b => b.id));
const itineraryIds = new Set(Object.keys(itineraries));
const listingById = new Map(listings.map(item => [item.id, item]));

/** Pathnames that map to homepage sections (SPA hub deep links). */
export const HUB_SECTIONS = new Set([
    'parks', 'embassies', 'borders', 'transport', 'health', 'events',
    'book-direct', 'plan', 'guides', 'tourism-stats', 'itineraries', 'destinations',
    'home', 'about', 'news', 'contact', 'cultures', 'gastronomy',
    'experiences', 'top-destinations',
]);

export function countryPath(countryId) {
    return `/countries/${countryId}`;
}

export function parkPath(parkId) {
    return `/parks/${parkId}`;
}

export function borderPath(borderId) {
    return `/borders/${borderId}`;
}

export function itineraryPath(itineraryId) {
    return `/itineraries/${itineraryId}`;
}

export function listingPath(itemOrId) {
    const item = typeof itemOrId === 'string' ? getListingById(itemOrId) : itemOrId;
    if (!item) return '/';
    const segment = item.kind === 'stay' ? 'stays' : 'operators';
    return `/${segment}/${item.id}`;
}

export function parseLocation(loc = window.location) {
    const { pathname, hash } = loc;

    const countryMatch = pathname.match(/^\/countries\/([a-z-]+)\/?$/);
    if (countryMatch && countries[countryMatch[1]]) {
        return { type: 'country', countryId: countryMatch[1] };
    }

    const parkMatch = pathname.match(/^\/parks\/([a-z0-9-]+)\/?$/);
    if (parkMatch && parkIds.has(parkMatch[1])) {
        return { type: 'park', parkId: parkMatch[1] };
    }

    const borderMatch = pathname.match(/^\/borders\/([a-z0-9-]+)\/?$/);
    if (borderMatch && borderIds.has(borderMatch[1])) {
        return { type: 'border', borderId: borderMatch[1] };
    }

    const itineraryMatch = pathname.match(/^\/itineraries\/([a-z0-9-]+)\/?$/);
    if (itineraryMatch && itineraryIds.has(itineraryMatch[1])) {
        return { type: 'itinerary', itineraryId: itineraryMatch[1] };
    }

    const stayMatch = pathname.match(/^\/stays\/([a-z0-9-]+)\/?$/);
    if (stayMatch && listingById.get(stayMatch[1])?.kind === 'stay') {
        return { type: 'listing', listingId: stayMatch[1] };
    }

    const operatorMatch = pathname.match(/^\/operators\/([a-z0-9-]+)\/?$/);
    if (operatorMatch && listingById.get(operatorMatch[1])?.kind === 'operator') {
        return { type: 'listing', listingId: operatorMatch[1] };
    }

    const hubMatch = pathname.match(/^\/([a-z0-9-]+)\/?$/);
    if (hubMatch && HUB_SECTIONS.has(hubMatch[1])) {
        return { type: 'home', sectionHash: hubMatch[1] === 'home' ? null : hubMatch[1] };
    }

    const hashId = hash.slice(1);
    if (hashId && countries[hashId]) {
        return { type: 'legacy-country-hash', countryId: hashId };
    }

    return { type: 'home', sectionHash: hashId || null };
}

export function navigateToCountry(countryId, { replace = false } = {}) {
    if (!countries[countryId]) return;
    const url = countryPath(countryId);
    const state = { view: 'country', countryId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
}

export function navigateToPark(parkId, { replace = false } = {}) {
    if (!parkIds.has(parkId)) return;
    const url = parkPath(parkId);
    const state = { view: 'park', parkId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
}

export function navigateToBorder(borderId, { replace = false } = {}) {
    if (!borderIds.has(borderId)) return;
    const url = borderPath(borderId);
    const state = { view: 'border', borderId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
}

export function navigateToItinerary(itineraryId, { replace = false } = {}) {
    if (!itineraryIds.has(itineraryId)) return;
    const url = itineraryPath(itineraryId);
    const state = { view: 'itinerary', itineraryId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
}

export function navigateToListing(listingId, { replace = false } = {}) {
    const item = getListingById(listingId);
    if (!item) return;
    const url = listingPath(item);
    const state = { view: 'listing', listingId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
}

export function navigateHome(sectionId = null, { replace = false } = {}) {
    const url = sectionId ? `/#${sectionId}` : '/';
    const state = { view: 'home', sectionId };
    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
}

export function replaceWithCountryPath(countryId) {
    if (!countries[countryId]) return;
    history.replaceState({ view: 'country', countryId }, '', countryPath(countryId));
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

export function getParkById(parkId) {
    return parks.find(p => p.id === parkId) || null;
}

export function getBorderById(borderId) {
    return borders.find(b => b.id === borderId) || null;
}

export function getItineraryById(itineraryId) {
    return itineraries[itineraryId] || null;
}

export function getListingById(listingId) {
    return listingById.get(listingId) || null;
}
