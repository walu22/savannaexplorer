import { parseRouteShape } from './route-shape.js';

const PRODUCT_EVENTS = new Set([
    'route_match_completed',
    'route_added_to_trip',
    'journey_composed',
    'journey_added_to_trip',
    'journey_reordered',
    'trip_created',
    'trip_details_updated',
    'readiness_task_added',
    'readiness_task_completed',
    'readiness_reminder_updated',
    'booking_record_added',
    'booking_record_updated',
    'booking_status_updated',
    'trip_calendar_exported',
    'trip_pack_exported',
    'site_search_opened',
    'site_search_result_selected',
    'trip_share_created',
    'collaboration_invite_created',
    'collaboration_invite_accepted',
    'newsletter_signup',
    'client_error',
]);

const SAFE_QUERY_KEYS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']);
const SAFE_VALUE = /^[a-z0-9_-]{1,40}$/i;

function clientType() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'unknown';
    return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
}

function safeLabel(value) {
    const label = String(value || '').trim().slice(0, 40);
    return SAFE_VALUE.test(label) ? label.toLowerCase() : null;
}

function pageType(loc) {
    const route = parseRouteShape(loc);
    if (route.type !== 'home') return safeLabel(route.type) || 'other';
    if (!route.sectionHash) return 'home';
    const section = String(route.sectionHash).replace(/^hub-/, '');
    return `hub_${safeLabel(section) || 'other'}`;
}

export function sanitizeAnalyticsUrl(value, base = 'https://savannaexplorer.com') {
    try {
        const url = new URL(value, base);
        const safeQuery = new URLSearchParams();
        for (const [key, item] of url.searchParams) {
            if (SAFE_QUERY_KEYS.has(key) && SAFE_VALUE.test(item)) safeQuery.set(key, item.slice(0, 40));
        }
        const query = safeQuery.toString();
        return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
    } catch {
        return base;
    }
}

export function buildProductEvent(eventType, properties = {}, loc = globalThis.location, appVersion = 'unknown') {
    if (!PRODUCT_EVENTS.has(eventType)) return null;
    const countryCount = Number(properties.countryCount);
    return {
        event_type: eventType,
        page_type: pageType(loc || { pathname: '/', hash: '' }),
        source: safeLabel(properties.source),
        status: safeLabel(properties.status),
        item_type: safeLabel(properties.itemType),
        country_count: Number.isFinite(countryCount) ? Math.max(0, Math.min(9, Math.round(countryCount))) : null,
        has_dates: typeof properties.hasDates === 'boolean' ? properties.hasDates : null,
        client: clientType(),
        app_version: String(appVersion || 'unknown').slice(0, 24),
    };
}

export function classifyClientError(value) {
    const message = String(value?.message || value?.reason?.message || value?.reason || value || '').toLowerCase();
    if (/loading chunk|dynamically imported module|failed to fetch.*module/.test(message)) return 'chunk_load';
    if (/failed to fetch|networkerror|network request/.test(message)) return 'network';
    if (/script error/.test(message)) return 'script';
    return value?.type === 'error' && value?.target !== globalThis.window ? 'resource' : 'runtime';
}
