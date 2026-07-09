import { CONFIG } from '../config.js';
import { getSupabaseClient } from './supabase.js';

function clientType() {
    return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
}

function normalizeErrorCode(error) {
    const message = error?.message || String(error || '');
    if (/status\s*5\d\d/i.test(message)) return 'relay_server_error';
    if (/status\s*4\d\d/i.test(message)) return 'relay_client_error';
    if (/empty response/i.test(message)) return 'empty_response';
    if (/failed to fetch|network/i.test(message)) return 'network_error';
    return 'generate_failed';
}

/**
 * Fire-and-forget planner usage event (Supabase). No-ops when Supabase is not configured.
 */
export function trackPlannerEvent(payload) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const row = {
        event_type: payload.eventType,
        country: payload.country ?? null,
        duration: payload.duration != null ? Number(payload.duration) : null,
        category: payload.category ?? null,
        budget: payload.budget ?? null,
        status: payload.status ?? null,
        catalog_matches: payload.catalogMatches ?? null,
        latency_ms: payload.latencyMs ?? null,
        generation_method: payload.generationMethod ?? null,
        error_code: payload.errorCode ?? null,
        client: clientType(),
        app_version: CONFIG.appVersion,
    };

    supabase.from('ai_planner_events').insert([row]).then(({ error }) => {
        if (error) {
            console.debug('Planner analytics:', error.message);
        }
    });

    if (typeof gtag === 'function') {
        if (payload.eventType === 'open') {
            gtag('event', 'ai_planner_open', { client: row.client });
        } else if (payload.eventType === 'generate') {
            gtag('event', 'ai_planner_generate', {
                country: row.country,
                category: row.category,
                budget: row.budget,
                status: row.status,
                duration: row.duration,
            });
        }
    }
}

export function trackPlannerOpen() {
    trackPlannerEvent({ eventType: 'open' });
}

export function trackPlannerGenerateSuccess({
    country,
    duration,
    category,
    budget,
    catalogMatches,
    latencyMs,
    generationMethod,
}) {
    trackPlannerEvent({
        eventType: 'generate',
        country,
        duration,
        category,
        budget,
        status: 'success',
        catalogMatches,
        latencyMs,
        generationMethod,
    });
}

export function trackPlannerGenerateError({
    country,
    duration,
    category,
    budget,
    catalogMatches,
    latencyMs,
    error,
}) {
    trackPlannerEvent({
        eventType: 'generate',
        country,
        duration,
        category,
        budget,
        status: 'error',
        catalogMatches,
        latencyMs,
        errorCode: normalizeErrorCode(error),
    });
}
