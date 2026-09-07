import { routeToTripTemplate } from './route-collection.js';

export const JOURNEY_COUNTRIES = {
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

const VEHICLE_LEVEL = { standard: 1, suv: 2, '4x4': 3 };
const THEMES = new Set(['all', 'wildlife', 'landscapes', 'culture', 'coast', 'water', 'adventure', 'family']);
const MAX_COUNTRIES = 4;
const MAX_DAYS = 30;

function unique(values) {
    return [...new Set(values)];
}

function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
}

function addDays(value, amount) {
    if (!validDate(value)) return '';
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
}

function permutations(values) {
    if (values.length <= 1) return [values];
    return values.flatMap((value, index) => permutations(values.filter((_, itemIndex) => itemIndex !== index))
        .map(rest => [value, ...rest]));
}

function routeVehicleLevel(route) {
    return VEHICLE_LEVEL[route?.vehicle?.id] || 1;
}

function distanceKm(from, to) {
    if (![from?.lat, from?.lng, to?.lat, to?.lng].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
    const radians = degrees => degrees * Math.PI / 180;
    const lat = radians(to.lat - from.lat);
    const lng = radians(to.lng - from.lng);
    const a = Math.sin(lat / 2) ** 2
        + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bordersForPair(borders, fromCountry, toCountry) {
    return (Array.isArray(borders) ? borders : []).filter(border => border.vehicleCrossing !== false
        && border.countries?.includes(fromCountry)
        && border.countries?.includes(toCountry));
}

function bestBorder(borders, fromCountry, toCountry, fromRoute, toRoute) {
    const candidates = bordersForPair(borders, fromCountry, toCountry);
    const fromStop = fromRoute?.stops?.at(-1);
    const toStop = toRoute?.stops?.[0];
    return candidates.sort((a, b) => {
        const score = border => distanceKm(fromStop, border.coordinates) + distanceKm(border.coordinates, toStop);
        return score(a) - score(b) || String(b.lastVerified || '').localeCompare(String(a.lastVerified || ''));
    })[0] || null;
}

function cartesian(groups) {
    return groups.reduce((results, group) => results.flatMap(result => group.map(item => [...result, item])), [[]]);
}

function routeScore(route, preferences) {
    const available = VEHICLE_LEVEL[preferences.vehicle] || 1;
    const required = routeVehicleLevel(route);
    let score = route.readiness === 'green' ? 8 : 3;
    if (preferences.theme === 'all') score += 10;
    else score += route.themes?.includes(preferences.theme) ? 30 : 0;
    score += available >= required ? 24 - Math.max(0, available - required) * 3 : -70 * (required - available);
    score -= (Number(route.duration?.min) || 1) * 0.25;
    return score;
}

export function normalizeJourneyPreferences(value = {}) {
    const countries = unique((Array.isArray(value.countries) ? value.countries : [])
        .map(String)
        .filter(country => JOURNEY_COUNTRIES[country]))
        .slice(0, MAX_COUNTRIES);
    const startCountry = countries.includes(value.startCountry) ? value.startCountry : (countries[0] || '');
    const days = Math.max(7, Math.min(MAX_DAYS, Math.round(Number(value.days) || 18)));
    return {
        countries,
        startCountry,
        days,
        vehicle: VEHICLE_LEVEL[value.vehicle] ? value.vehicle : 'suv',
        theme: THEMES.has(value.theme) ? value.theme : 'wildlife',
        startDate: validDate(value.startDate),
    };
}

export function countryOrders(countries, borders, startCountry = '') {
    const selected = unique(countries).filter(country => JOURNEY_COUNTRIES[country]);
    return permutations(selected).filter(order => {
        if (startCountry && order[0] !== startCountry) return false;
        return order.every((country, index) => index === 0
            || bordersForPair(borders, order[index - 1], country).length > 0);
    });
}

function buildCandidate(order, selectedRoutes, borders, preferences) {
    const crossings = order.slice(0, -1).map((country, index) => bestBorder(
        borders,
        country,
        order[index + 1],
        selectedRoutes[index],
        selectedRoutes[index + 1],
    ));
    if (crossings.some(crossing => !crossing)) return null;

    const minimumDays = selectedRoutes.reduce((total, route) => total + (Number(route.duration?.min) || 1), 0)
        + crossings.length;
    const score = selectedRoutes.reduce((total, route) => total + routeScore(route, preferences), 0)
        - Math.abs(preferences.days - minimumDays) * 1.5;
    return { order, selectedRoutes, crossings, minimumDays, score };
}

function allocateDays(routes, totalDays, crossingCount) {
    const allocations = routes.map(route => Number(route.duration?.min) || 1);
    let remaining = totalDays - crossingCount - allocations.reduce((total, days) => total + days, 0);
    let cursor = 0;
    while (remaining > 0) {
        allocations[cursor % allocations.length] += 1;
        cursor += 1;
        remaining -= 1;
    }
    return allocations;
}

export function composeJourney(routes, borders, rawPreferences = {}) {
    const preferences = normalizeJourneyPreferences(rawPreferences);
    if (preferences.countries.length < 2) {
        return { status: 'needs-countries', preferences, message: 'Choose at least two countries to build a connected journey.' };
    }

    const orders = countryOrders(preferences.countries, borders, preferences.startCountry);
    if (!orders.length) {
        return {
            status: 'not-connected',
            preferences,
            message: 'These countries do not form a direct road sequence using the current border collection. Try a different starting country or add a connecting country.',
        };
    }

    const candidates = orders.flatMap(order => {
        const routeGroups = order.map(country => (Array.isArray(routes) ? routes : [])
            .filter(route => route.countryIds?.length === 1 && route.countryIds[0] === country));
        if (routeGroups.some(group => !group.length)) return [];
        return cartesian(routeGroups).map(selectedRoutes => buildCandidate(order, selectedRoutes, borders, preferences)).filter(Boolean);
    });

    if (!candidates.length) {
        return { status: 'unavailable', preferences, message: 'A complete route could not be assembled from the current reviewed collection.' };
    }

    const feasible = candidates.filter(candidate => candidate.minimumDays <= preferences.days);
    const best = (feasible.length ? feasible : candidates)
        .sort((a, b) => feasible.length
            ? b.score - a.score || a.minimumDays - b.minimumDays
            : a.minimumDays - b.minimumDays || b.score - a.score)[0];

    if (!feasible.length) {
        return {
            status: 'needs-more-days',
            preferences,
            requiredDays: best.minimumDays,
            message: `Allow at least ${best.minimumDays} days for the shortest reviewed combination, including border days.`,
        };
    }

    const dayAllocations = allocateDays(best.selectedRoutes, preferences.days, best.crossings.length);
    const segments = best.selectedRoutes.map((route, index) => ({
        countryId: best.order[index],
        countryName: JOURNEY_COUNTRIES[best.order[index]],
        route,
        days: dayAllocations[index],
        baseDays: Number(route.duration?.min) || 1,
        extraDays: dayAllocations[index] - (Number(route.duration?.min) || 1),
        themeMatch: preferences.theme === 'all' || route.themes?.includes(preferences.theme),
        vehicleFit: (VEHICLE_LEVEL[preferences.vehicle] || 1) >= routeVehicleLevel(route),
    }));

    return {
        status: 'ready',
        preferences,
        countryOrder: best.order,
        segments,
        crossings: best.crossings,
        totalDays: preferences.days,
        minimumDays: best.minimumDays,
        extraDays: preferences.days - best.minimumDays,
        warnings: unique(best.selectedRoutes.flatMap(route => route.warnings || [])).slice(0, 4),
    };
}

function prefixRouteDays(days, segmentIndex) {
    return days.map((day, dayIndex) => ({
        ...day,
        id: `journey-${segmentIndex + 1}-${dayIndex + 1}-${day.id}`,
        stops: day.stops.map((stop, stopIndex) => ({
            ...stop,
            id: `journey-${segmentIndex + 1}-${dayIndex + 1}-${stopIndex + 1}-${stop.id}`,
        })),
    }));
}

export function journeyToTripTemplate(journey, startDate = '') {
    if (journey?.status !== 'ready' || !journey.segments?.length) return null;
    const validStartDate = validDate(startDate || journey.preferences?.startDate);
    const routeDays = [];

    journey.segments.forEach((segment, segmentIndex) => {
        const segmentStartDate = addDays(validStartDate, routeDays.length);
        const routeTemplate = routeToTripTemplate(segment.route, segmentStartDate);
        routeDays.push(...prefixRouteDays(routeTemplate?.routeDays || [], segmentIndex));

        for (let extra = 0; extra < segment.extraDays; extra += 1) {
            const dayNumber = routeDays.length + 1;
            routeDays.push({
                id: `journey-flex-${segmentIndex + 1}-${extra + 1}`,
                date: addDays(validStartDate, dayNumber - 1),
                title: `Flexible day in ${segment.countryName}`,
                stops: [{
                    id: `journey-flex-stop-${segmentIndex + 1}-${extra + 1}`,
                    type: 'activity',
                    name: `Flexible day in ${segment.countryName}`,
                    location: segment.countryName,
                    time: '',
                    notes: 'Keep this day flexible for weather, rest, a longer stay or a locally verified activity.',
                }],
            });
        }

        const crossing = journey.crossings[segmentIndex];
        if (crossing) {
            const nextCountry = journey.segments[segmentIndex + 1].countryName;
            const dayNumber = routeDays.length + 1;
            routeDays.push({
                id: `journey-border-${segmentIndex + 1}-${crossing.id}`,
                date: addDays(validStartDate, dayNumber - 1),
                title: `${segment.countryName} to ${nextCountry}`,
                stops: [{
                    id: `journey-border-drive-${segmentIndex + 1}-${crossing.id}`,
                    type: 'drive',
                    name: `Drive to ${crossing.name}`,
                    location: crossing.route || `${segment.countryName} to ${nextCountry}`,
                    time: '',
                    notes: 'Confirm the approach, fuel stops and realistic daylight driving time before departure.',
                }, {
                    id: `journey-border-stop-${segmentIndex + 1}-${crossing.id}`,
                    type: 'border',
                    name: crossing.name,
                    location: `${segment.countryName} · ${nextCountry}`,
                    time: '',
                    notes: `${crossing.hours || 'Confirm current hours'}. ${crossing.fees || 'Confirm current fees and requirements'}. Last verified ${crossing.lastVerified || 'date unavailable'}.`,
                }],
            });
        }
    });

    routeDays.forEach((day, index) => { day.date = addDays(validStartDate, index); });
    const countryNames = journey.segments.map(segment => segment.countryName);
    return {
        name: `${countryNames.join(' · ')} journey`,
        startDate: validStartDate,
        endDate: addDays(validStartDate, routeDays.length - 1),
        countries: countryNames,
        templateRouteId: `journey:${journey.segments.map(segment => segment.route.id).join('|')}`.slice(0, 128),
        routeDays,
        notes: `Built from ${journey.segments.map(segment => segment.route.title).join(', ')}. Border, road, weather, permit and entry information must be rechecked before travel.`,
    };
}
