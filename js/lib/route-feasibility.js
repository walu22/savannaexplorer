import {
    editorialLegFor,
    formatDriveMinutes,
    getEditorialLogistics,
    getRouteLogistics,
} from './route-logistics.js';

const VEHICLE_RANK = { standard: 0, suv: 1, '4x4': 2 };
const VEHICLE_LABELS = { standard: 'Standard car', suv: 'High-clearance SUV', '4x4': 'Experienced 4×4' };
const MONTHS = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function safeDays(value, fallback) {
    const days = Math.round(Number(value));
    return Number.isFinite(days) ? Math.max(1, Math.min(60, days)) : fallback;
}

function safeVehicle(value, fallback = 'standard') {
    return Object.hasOwn(VEHICLE_RANK, value) ? value : fallback;
}

function startMonth(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const month = Number(value.slice(5, 7));
    return month >= 1 && month <= 12 ? month : null;
}

function seasonMonths(label = '') {
    const matches = String(label).toLowerCase().match(/[a-z]+/g) || [];
    const start = MONTHS[matches[0]];
    const end = MONTHS[matches[1]];
    if (!start || !end) return [];
    if (start <= end) return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    return [...Array.from({ length: 13 - start }, (_, index) => start + index), ...Array.from({ length: end }, (_, index) => index + 1)];
}

function check(id, label, status, value, detail) {
    return { id, label, status, value, detail };
}

function drivingCheck(route) {
    const logistics = getRouteLogistics(route.id);
    const editorial = getEditorialLogistics(route.id);
    const legs = Array.isArray(logistics?.legs) ? logistics.legs : [];
    const estimates = legs.map(leg => {
        const reviewed = editorialLegFor(editorial, leg);
        if (reviewed?.distanceKm && reviewed?.driveMinutes) return Number(reviewed.driveMinutes);
        return leg.confidence === 'low' ? null : Number(leg.driveMinutes) || null;
    });
    const known = estimates.filter(Number.isFinite);
    const longestMinutes = known.length ? Math.max(...known) : 0;
    const unknownLegs = estimates.filter(value => value === null).length;
    if (!legs.length) return check('driving', 'Driving load', 'check', 'Route check needed', 'No reviewed drive legs are attached yet.');
    if (unknownLegs) {
        return check('driving', 'Driving load', 'check', `${unknownLegs} local check${unknownLegs === 1 ? '' : 's'}`, `${known.length} of ${legs.length} drive legs have usable planning estimates; confirm the remote legs locally.`);
    }
    if (longestMinutes > 420) {
        return check('driving', 'Driving load', 'check', `${formatDriveMinutes(longestMinutes)} longest leg`, 'At least one supported drive estimate exceeds seven hours. Plan an early start or a safe stopover.');
    }
    return check('driving', 'Driving load', 'ready', `${formatDriveMinutes(longestMinutes)} longest leg`, `All ${legs.length} drive legs have usable planning estimates and none exceeds seven hours.`);
}

export function normalizeFeasibilityPreferences(route, preferences = {}) {
    const minimumDays = Math.max(1, Number(route?.duration?.min) || 1);
    return {
        days: safeDays(preferences.days, minimumDays),
        vehicle: safeVehicle(preferences.vehicle, safeVehicle(route?.vehicle?.id)),
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(preferences.startDate || '') ? preferences.startDate : '',
    };
}

export function evaluateRouteFeasibility(route, preferences = {}) {
    if (!route?.id) return null;
    const normalized = normalizeFeasibilityPreferences(route, preferences);
    const minimumDays = Math.max(1, Number(route.duration?.min) || 1);
    const maximumDays = Math.max(minimumDays, Number(route.duration?.max) || minimumDays);
    const requiredVehicle = safeVehicle(route.vehicle?.id);
    const month = startMonth(normalized.startDate);
    const preferredMonths = seasonMonths(route.bestSeason?.label);
    const editorial = getEditorialLogistics(route.id);
    const countryCount = Array.isArray(route.countryIds) ? route.countryIds.length : 0;

    const duration = normalized.days < minimumDays
        ? check('duration', 'Trip duration', 'blocker', `${normalized.days} days available`, `This route needs at least ${minimumDays} days. Add ${minimumDays - normalized.days} day${minimumDays - normalized.days === 1 ? '' : 's'} or choose a shorter route.`)
        : normalized.days > maximumDays
            ? check('duration', 'Trip duration', 'check', `${normalized.days} days available`, `The researched pacing covers ${minimumDays}–${maximumDays} days. Use the extra time for rest days or extend the route after saving.`)
            : check('duration', 'Trip duration', 'ready', `${normalized.days} days available`, `Your window fits the researched ${minimumDays}–${maximumDays} day pacing.`);

    const vehicle = VEHICLE_RANK[normalized.vehicle] < VEHICLE_RANK[requiredVehicle]
        ? check('vehicle', 'Vehicle fit', 'blocker', VEHICLE_LABELS[normalized.vehicle], `${route.vehicle.label} is the minimum published vehicle guidance for this route.`)
        : check('vehicle', 'Vehicle fit', 'ready', VEHICLE_LABELS[normalized.vehicle], normalized.vehicle === requiredVehicle ? `Matches the published ${route.vehicle.label} guidance.` : `Meets or exceeds the published ${route.vehicle.label} guidance.`);

    const season = !month
        ? check('season', 'Season fit', 'check', 'Add a start date', `Choose a start date to compare your trip with the preferred ${route.bestSeason.label} window.`)
        : preferredMonths.includes(month)
            ? check('season', 'Season fit', 'ready', route.bestSeason.label, route.bestSeason.reason)
            : check('season', 'Season fit', 'check', `Outside ${route.bestSeason.label}`, `The route may still work, but conditions differ from the preferred window. ${route.bestSeason.reason}`);

    const borders = countryCount <= 1
        ? check('borders', 'Border load', 'ready', 'No land crossing', 'This route stays within one country, so no border day is required.')
        : check('borders', 'Border load', 'check', `${countryCount - 1} crossing${countryCount === 2 ? '' : 's'}`, 'Confirm the exact crossing, opening hours, vehicle papers and a realistic border day before saving.');

    const overnightCount = Array.isArray(editorial?.overnightAnchors) ? editorial.overnightAnchors.length : 0;
    const overnights = overnightCount >= 2
        ? check('overnights', 'Overnight structure', 'ready', `${overnightCount} reviewed anchors`, 'The route includes named overnight anchors to support its driving plan.')
        : check('overnights', 'Overnight structure', 'check', overnightCount ? '1 reviewed anchor' : 'No reviewed anchors', 'Confirm safe overnight positions before relying on the route pacing.');

    const checks = [duration, vehicle, season, drivingCheck(route), borders, overnights];
    const blockers = checks.filter(item => item.status === 'blocker');
    const cautions = checks.filter(item => item.status === 'check');
    const aligned = checks.filter(item => item.status === 'ready');
    const status = blockers.length ? 'blocker' : cautions.length ? 'check' : 'ready';
    const statusLabel = blockers.length ? 'Adjust before saving' : cautions.length ? 'Review before saving' : 'Strong trip fit';
    const summary = blockers.length
        ? `${blockers.length} trip fit blocker${blockers.length === 1 ? '' : 's'} must be resolved first.`
        : cautions.length
            ? `${aligned.length} of ${checks.length} checks align; review ${cautions.length} caution${cautions.length === 1 ? '' : 's'}.`
            : `All ${checks.length} checks align with the published route guidance.`;

    return { preferences: normalized, checks, alignedCount: aligned.length, blockerCount: blockers.length, cautionCount: cautions.length, status, statusLabel, summary };
}
