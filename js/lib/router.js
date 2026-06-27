import countries from '../../data/countries.json';
import parks from '../../data/parks.json';
import borders from '../../data/borders.json';
import itineraries from '../../data/itineraries.json';

export const COUNTRY_IDS = Object.keys(countries);

const parkIds = new Set(parks.map(p => p.id));
const borderIds = new Set(borders.map(b => b.id));
const itineraryIds = new Set(Object.keys(itineraries));

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
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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
