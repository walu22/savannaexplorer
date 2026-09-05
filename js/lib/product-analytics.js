import { inject, track as trackVercel } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { CONFIG, isSupabaseConfigured } from '../config.js';
import {
    buildProductEvent as buildCoreProductEvent,
    classifyClientError,
    sanitizeAnalyticsUrl,
} from './product-analytics-core.js';

export { classifyClientError, sanitizeAnalyticsUrl } from './product-analytics-core.js';

let initialized = false;
const reportedErrors = new Set();

export function buildProductEvent(eventType, properties = {}, loc = globalThis.location) {
    return buildCoreProductEvent(eventType, properties, loc, CONFIG.appVersion);
}

function isProductionTelemetryHost() {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname.toLowerCase();
    return hostname === 'savannaexplorer.com' || hostname === 'www.savannaexplorer.com';
}

function publicEventProperties(row) {
    const entries = [
        ['source', row.source],
        ['status', row.status],
    ].filter(([, value]) => value !== null);
    return Object.fromEntries(entries.slice(0, 2));
}

function sendSupabaseEvent(row) {
    if (!isSupabaseConfigured()) return;
    const endpoint = `${CONFIG.supabase.url.replace(/\/$/, '')}/rest/v1/product_events`;
    fetch(endpoint, {
        method: 'POST',
        headers: {
            apikey: CONFIG.supabase.anonKey,
            Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
        keepalive: true,
    }).then(response => {
        if (!response.ok) console.debug('[Analytics] Product event unavailable:', response.status);
    }).catch(() => {
        // Analytics must never interrupt a traveller action.
    });
}

export function trackProductEvent(eventType, properties = {}) {
    const row = buildProductEvent(eventType, properties);
    if (!row) return null;

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('savanna:product-event', { detail: row }));
    }

    if (!isProductionTelemetryHost()) return row;

    try {
        trackVercel(eventType, publicEventProperties(row));
    } catch {
        // Analytics must never interrupt a traveller action.
    }

    if (typeof gtag === 'function') {
        gtag('event', eventType, publicEventProperties(row));
    }

    sendSupabaseEvent(row);
    return row;
}

function reportClientError(event, source) {
    const errorType = classifyClientError(event);
    const key = `${window.location.pathname}:${source}:${errorType}`;
    if (reportedErrors.has(key)) return;
    reportedErrors.add(key);
    trackProductEvent('client_error', { source, status: errorType });
}

export function initProductObservability() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;
    window.addEventListener('error', event => reportClientError(event, 'window'));
    window.addEventListener('unhandledrejection', event => reportClientError(event, 'promise'));

    if (!isProductionTelemetryHost()) return;
    const beforeSend = event => ({ ...event, url: sanitizeAnalyticsUrl(event.url, window.location.origin) });
    inject({ debug: false, beforeSend });
    injectSpeedInsights({
        sampleRate: 1,
        debug: false,
        beforeSend,
    });
}
