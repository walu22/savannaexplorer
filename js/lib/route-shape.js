export const HUB_SECTIONS = new Set([
    'parks', 'embassies', 'borders', 'transport', 'health', 'events',
    'book-direct', 'plan', 'guides', 'tourism-stats', 'destinations',
    'home', 'about', 'news', 'contact', 'cultures', 'gastronomy', 'faq',
    'experiences', 'top-destinations', 'travel-essentials', 'planning-checklist',
    'route-explorer', 'hub-my-safari', 'cost-estimator', 'packing-list',
    'phrasebook', 'campsites', 'safari-bingo',
    'editorial',
]);

const HUB_PATH_ALIASES = new Map([
    ['routes', 'route-explorer'],
    ['my-safari', 'hub-my-safari'],
    ['expenses', 'hub-expense-tracker'],
]);

/** Lightweight route classification for layout and feature loading. */
export function parseRouteShape(loc = window.location) {
    const pathname = loc.pathname || '/';
    const hash = (loc.hash || '').slice(1);
    let match = pathname.match(/^\/countries\/([a-z-]+)\/?$/);
    if (match) return { type: 'country', countryId: match[1] };
    match = pathname.match(/^\/parks\/([a-z0-9-]+)\/?$/);
    if (match) return { type: 'park', parkId: match[1] };
    match = pathname.match(/^\/borders\/([a-z0-9-]+)\/?$/);
    if (match) return { type: 'border', borderId: match[1] };
    match = pathname.match(/^\/routes\/([a-z0-9-]+)\/?$/);
    if (match) return { type: 'route', routeId: match[1] };
    match = pathname.match(/^\/(stays|operators)\/([a-z0-9-]+)\/?$/);
    if (match) return { type: 'listing', listingId: match[2] };
    match = pathname.match(/^\/guides\/planning\/([a-z-]+)\/?$/);
    if (match) return { type: 'planning-guide', countryId: match[1] };

    match = pathname.match(/^\/([a-z0-9-]+)\/?$/);
    if (match && HUB_PATH_ALIASES.has(match[1])) {
        return { type: 'home', sectionHash: HUB_PATH_ALIASES.get(match[1]) };
    }
    if (match && HUB_SECTIONS.has(match[1])) {
        return { type: 'home', sectionHash: match[1] === 'home' ? null : match[1] };
    }
    return { type: 'home', sectionHash: hash || null };
}
