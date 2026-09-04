import { MAX_COMPARE_ROUTES } from './route-comparison.js';

const VEHICLE_LEVEL = { standard: 1, suv: 2, '4x4': 3 };
const COUNTRY_IDS = new Set(['all', 'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe', 'mozambique', 'malawi', 'lesotho', 'eswatini']);
const THEME_IDS = new Set(['all', 'wildlife', 'landscapes', 'culture', 'coast', 'water', 'adventure', 'family']);

export const DEFAULT_ROUTE_PREFERENCES = {
    country: 'all',
    days: 10,
    vehicle: 'suv',
    theme: 'wildlife',
};

export function normalizeRoutePreferences(value = {}) {
    const days = Math.max(3, Math.min(30, Math.round(Number(value.days) || DEFAULT_ROUTE_PREFERENCES.days)));
    const country = String(value.country || DEFAULT_ROUTE_PREFERENCES.country);
    const theme = String(value.theme || DEFAULT_ROUTE_PREFERENCES.theme);
    return {
        country: COUNTRY_IDS.has(country) ? country : DEFAULT_ROUTE_PREFERENCES.country,
        days,
        vehicle: VEHICLE_LEVEL[value.vehicle] ? value.vehicle : DEFAULT_ROUTE_PREFERENCES.vehicle,
        theme: THEME_IDS.has(theme) ? theme : DEFAULT_ROUTE_PREFERENCES.theme,
    };
}

function durationScore(route, days, reasons, cautions) {
    const minimum = Number(route.duration?.min) || 1;
    const maximum = Number(route.duration?.max) || minimum;
    if (days >= minimum && days <= maximum) {
        reasons.push(`Fits your ${days}-day window`);
        return 45;
    }
    if (days < minimum) {
        const gap = minimum - days;
        cautions.push(`Allow at least ${minimum} days, ${gap} more than selected`);
        return Math.max(-20, 25 - gap * 12);
    }
    reasons.push(`${route.duration.label} leaves room for extra stops`);
    return Math.max(10, 32 - (days - maximum) * 3);
}

function vehicleScore(route, available, reasons, cautions) {
    const required = VEHICLE_LEVEL[route.vehicle?.id] || 1;
    const comfort = VEHICLE_LEVEL[available] || 1;
    if (comfort >= required) {
        reasons.push(`${route.vehicle.label} fits your driving comfort`);
        return comfort === required ? 25 : 20;
    }
    cautions.push(`Requires ${route.vehicle.label}`);
    return -35 * (required - comfort);
}

export function scoreRouteMatch(route, rawPreferences = {}) {
    const preferences = normalizeRoutePreferences(rawPreferences);
    const reasons = [];
    const cautions = [];
    let score = 0;

    if (preferences.country !== 'all') {
        if (!route.countryIds?.includes(preferences.country)) return null;
        reasons.push('In your preferred country');
        score += 20;
    }

    score += durationScore(route, preferences.days, reasons, cautions);
    score += vehicleScore(route, preferences.vehicle, reasons, cautions);

    if (preferences.theme === 'all') {
        score += 10;
    } else if (route.themes?.includes(preferences.theme)) {
        reasons.push(`Strong ${preferences.theme} fit`);
        score += 25;
    } else {
        cautions.push(`${preferences.theme} is not a main route theme`);
    }

    if (route.readiness === 'green') score += 5;
    const label = score >= 90 ? 'Excellent match' : score >= 65 ? 'Strong match' : 'Closest match';
    return { route, score, label, reasons: reasons.slice(0, 4), cautions: cautions.slice(0, 2) };
}

export function rankRouteMatches(routes, preferences, limit = MAX_COMPARE_ROUTES) {
    return (Array.isArray(routes) ? routes : [])
        .map(route => scoreRouteMatch(route, preferences))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.route.title.localeCompare(b.route.title))
        .slice(0, limit);
}
