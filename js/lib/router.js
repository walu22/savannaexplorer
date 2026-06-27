import countries from '../../data/countries.json';

export const COUNTRY_IDS = Object.keys(countries);

export function countryPath(countryId) {
    return `/countries/${countryId}`;
}

export function parseLocation(loc = window.location) {
    const { pathname, hash } = loc;
    const countryMatch = pathname.match(/^\/countries\/([a-z-]+)\/?$/);
    if (countryMatch && countries[countryMatch[1]]) {
        return { type: 'country', countryId: countryMatch[1] };
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
