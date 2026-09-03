import { formatDriveMinutes, routeLegPlan } from './route-logistics.js';

const COUNTRY_NAMES = {
    namibia: 'Namibia',
    'south-africa': 'South Africa',
    botswana: 'Botswana',
    zambia: 'Zambia',
    zimbabwe: 'Zimbabwe',
    mozambique: 'Mozambique',
    malawi: 'Malawi',
    lesotho: 'Lesotho',
    eswatini: 'Eswatini',
};

function isoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
}

function addDays(value, amount) {
    if (!isoDate(value)) return '';
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
}

export function durationBand(route) {
    const minimum = Number(route?.duration?.min) || 0;
    if (minimum <= 7) return 'short';
    if (minimum <= 12) return 'medium';
    return 'long';
}

export function filterRouteCollection(routes, filters = {}) {
    const country = String(filters.country || 'all');
    const duration = String(filters.duration || 'all');
    const vehicle = String(filters.vehicle || 'all');
    const theme = String(filters.theme || 'all');

    return (Array.isArray(routes) ? routes : []).filter(route => {
        if (country !== 'all' && !route.countryIds?.includes(country)) return false;
        if (duration !== 'all' && durationBand(route) !== duration) return false;
        if (vehicle !== 'all' && route.vehicle?.id !== vehicle) return false;
        if (theme !== 'all' && !route.themes?.includes(theme)) return false;
        return true;
    });
}

export function routeToTripTemplate(route, startDate = '') {
    if (!route?.id || !Array.isArray(route.phases)) return null;
    const totalDays = Math.max(1, Math.min(30, Number(route.duration?.min) || 1));
    const stopsById = new Map((route.stops || []).map(stop => [stop.id, stop]));
    const validStartDate = isoDate(startDate);
    const routeDays = Array.from({ length: totalDays }, (_, index) => ({
        id: `template-${route.id}-day-${index + 1}`,
        date: addDays(validStartDate, index),
        title: '',
        stops: [],
    }));

    let previousRouteStop = null;
    route.phases.forEach((phase, phaseIndex) => {
        const first = Math.max(1, Math.min(totalDays, Number(phase.dayStart) || 1));
        const last = Math.max(first, Math.min(totalDays, Number(phase.dayEnd) || first));
        for (let day = first; day <= last; day += 1) {
            const target = routeDays[day - 1];
            target.title = String(phase.title || `Route day ${day}`).slice(0, 80);
            const phaseStops = (phase.stopIds || []).map(id => stopsById.get(id)).filter(Boolean);
            if (day === first && phaseStops.length) {
                const plannedStops = [];
                phaseStops.forEach((stop, stopIndex) => {
                    if (previousRouteStop && previousRouteStop.id !== stop.id) {
                        const plan = routeLegPlan(route.id, previousRouteStop.id, stop.id);
                        const estimate = plan.distanceKm && plan.driveMinutes
                            ? `${plan.estimateLabel}: ${Math.round(plan.distanceKm)} km · ${formatDriveMinutes(plan.driveMinutes)}.`
                            : `${plan.estimateLabel}; distance and time withheld until the route is confirmed.`;
                        const via = plan.via.length ? ` Via: ${plan.via.join(' → ')}.` : '';
                        const guidance = plan.guidance ? ` Reviewed guidance: ${plan.guidance}` : '';
                        const reviewed = plan.reviewedAt ? ` Reviewed ${plan.reviewedAt}.` : '';
                        plannedStops.push({
                            id: `template-${route.id}-drive-${previousRouteStop.id}-${stop.id}`,
                            type: 'drive',
                            name: `Drive: ${previousRouteStop.name} → ${stop.name}`,
                            location: plan.via.length ? plan.via.join(' → ') : stop.region || COUNTRY_NAMES[route.countryIds?.[0]] || '',
                            time: '',
                            notes: `${estimate}${via}${guidance} Fuel plan: ${plan.fuelReminder}${reviewed}`,
                        });
                    }
                    plannedStops.push({
                        id: `template-${route.id}-${phaseIndex + 1}-${stopIndex + 1}`,
                        type: stop.type || 'other',
                        name: stop.name,
                        location: stop.region || COUNTRY_NAMES[route.countryIds?.[0]] || '',
                        time: '',
                        notes: stop.summary || phase.summary || '',
                    });
                    previousRouteStop = stop;
                });
                target.stops = plannedStops;
            } else {
                target.stops = [{
                    id: `template-${route.id}-${phaseIndex + 1}-day-${day}`,
                    type: 'activity',
                    name: phase.title,
                    location: phaseStops[0]?.region || COUNTRY_NAMES[route.countryIds?.[0]] || '',
                    time: '',
                    notes: phase.summary || '',
                }];
            }
        }
    });

    return {
        name: route.title,
        startDate: validStartDate,
        endDate: validStartDate ? addDays(validStartDate, totalDays - 1) : '',
        countries: (route.countryIds || []).map(id => COUNTRY_NAMES[id]).filter(Boolean),
        templateRouteId: route.id,
        routeDays,
        notes: `Started from the ${route.title} planning template. Check current road, weather, permit and opening information before travel.`,
    };
}

export function routeHasValidMap(route) {
    return Array.isArray(route?.stops)
        && route.stops.length >= 2
        && route.stops.every(stop => Number.isFinite(stop.lat) && stop.lat >= -90 && stop.lat <= 90
            && Number.isFinite(stop.lng) && stop.lng >= -180 && stop.lng <= 180);
}
