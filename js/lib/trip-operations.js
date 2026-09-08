import routeCollection from '../../data/route-collections.json' with { type: 'json' };
import corridorCollection from '../../data/border-corridor-stays.json' with { type: 'json' };
import {
    getEditorialLogistics,
    getRouteLogistics,
    routeLogisticsSummary,
} from './route-logistics.js';
import { buildTripActionCentre } from './trip-action-centre.js';
import { buildStayPlacementAudit } from './trip-stay-placement.js';

function uniqueBy(items, key) {
    const seen = new Set();
    return items.filter(item => {
        const value = key(item);
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

function routeIds(templateRouteId = '') {
    const value = String(templateRouteId || '');
    if (!value) return [];
    return value.startsWith('journey:')
        ? value.slice('journey:'.length).split('|').filter(Boolean)
        : [value];
}

function routeSource(source, route) {
    return { ...source, routeTitle: route.title };
}

export function buildTripOperationsBrief(trip) {
    const requestedRouteIds = routeIds(trip?.templateRouteId);
    const routes = requestedRouteIds
        .map(id => routeCollection.routes.find(route => route.id === id))
        .filter(Boolean);
    const actionCentre = buildTripActionCentre(trip);
    const stayPlan = buildStayPlacementAudit(trip);
    const crossings = uniqueBy(actionCentre.selectedCrossings, crossing => crossing.id)
        .map(crossing => ({
            ...crossing,
            stays: corridorCollection.stays.filter(stay => stay.borderId === crossing.id),
        }));

    const routeDetails = routes.map(route => {
        const logistics = getRouteLogistics(route.id);
        const editorial = getEditorialLogistics(route.id);
        return {
            route,
            logistics,
            editorial,
            summary: routeLogisticsSummary(logistics, editorial),
        };
    });
    const road = routeDetails.reduce((result, item) => ({
        legCount: result.legCount + item.summary.legCount,
        mappedLegCount: result.mappedLegCount + item.summary.mappedLegCount,
        distanceKm: result.distanceKm + item.summary.distanceKm,
        driveMinutes: result.driveMinutes + item.summary.driveMinutes,
    }), { legCount: 0, mappedLegCount: 0, distanceKm: 0, driveMinutes: 0 });
    road.needsLocalCheck = road.mappedLegCount !== road.legCount;

    const fuelAnchors = uniqueBy(routeDetails.flatMap(({ editorial, route }) =>
        (editorial?.fuelAnchors || []).map(anchor => ({ ...anchor, routeTitle: route.title }))), anchor => anchor.name);
    const overnightAnchors = [...new Set(routeDetails.flatMap(({ editorial }) => editorial?.overnightAnchors || []))];
    const accessNotes = uniqueBy(routeDetails.flatMap(({ editorial, route }) => [
        ...(editorial?.gatePermitNotes || []).map(note => ({ text: note, routeTitle: route.title })),
        ...(route.warnings || []).map(note => ({ text: note, routeTitle: route.title })),
    ]), item => item.text);
    const sources = uniqueBy(routeDetails.flatMap(({ editorial, route }) => [
        ...(editorial?.sources || []).map(source => routeSource(source, route)),
        ...(route.officialSources || []).map(source => routeSource(source, route)),
    ]), source => source.url);

    const bookings = Array.isArray(trip?.bookings) ? trip.bookings : [];
    const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
    const confirmedStays = confirmedBookings.filter(booking => booking.type === 'stay').length;
    const countries = Array.isArray(trip?.countries) ? trip.countries.filter(Boolean) : [];
    const actions = [];
    if (!trip?.startDate || !trip?.endDate) actions.push('Set travel dates so time-sensitive checks have real deadlines.');
    if (!routes.length) actions.push('Choose or save a researched route to unlock route-specific fuel and access guidance.');
    if (requestedRouteIds.length > routes.length) actions.push('Part of this saved journey no longer matches the reviewed route collection; rebuild that segment.');
    if (road.needsLocalCheck) actions.push(`${road.legCount - road.mappedLegCount} road leg${road.legCount - road.mappedLegCount === 1 ? '' : 's'} still need a local route or operator check.`);
    if (countries.length > 1 && !actionCentre.allSelected) actions.push('Select the exact land crossing between countries so hours and vehicle documents can be checked.');
    if (actionCentre.pairs.length && !actionCentre.vehicleContext) actions.push('Choose whether the vehicle is owned, financed or rented to complete the paperwork list.');
    if (actionCentre.totalCount > actionCentre.completedCount) actions.push(`${actionCentre.totalCount - actionCentre.completedCount} document check${actionCentre.totalCount - actionCentre.completedCount === 1 ? '' : 's'} still need confirmation or packing.`);
    if (actionCentre.routeUpdateRequired) actions.push('The chosen crossing differs from the saved driving itinerary; rebuild the transfer before relying on its road times.');
    if (crossings.some(crossing => !crossing.stays.length)) actions.push('Choose a locally verified overnight for every long border transfer.');
    if (!confirmedStays && overnightAnchors.length) actions.push('Record at least the key overnight confirmations for this route.');
    if (stayPlan.blockers) actions.push(`${stayPlan.blockers} stay placement conflict${stayPlan.blockers === 1 ? '' : 's'} must be resolved before relying on the itinerary.`);
    else if (stayPlan.checks) actions.push(`${stayPlan.checks} stay planning check${stayPlan.checks === 1 ? '' : 's'} still need attention.`);

    return {
        routeCount: routes.length,
        routeTitles: routes.map(route => route.title),
        countries,
        crossings,
        road,
        vehicleLabels: [...new Set(routes.map(route => route.vehicle?.label).filter(Boolean))],
        fuelAnchors,
        overnightAnchors,
        accessNotes,
        sources,
        bookings: {
            total: bookings.length,
            confirmed: confirmedBookings.length,
            confirmedStays,
        },
        stayPlan,
        actions,
        actionCentre,
        status: !routes.length || actions.length >= 3 ? 'planning' : actions.length ? 'check' : 'ready',
        statusLabel: !routes.length || actions.length >= 3 ? 'Planning needed' : actions.length ? 'Needs confirmation' : 'Ready for final checks',
        reviewedAt: routeDetails.map(({ editorial, route }) => editorial?.lastReviewed || route.lastReviewed).filter(Boolean).sort().at(-1) || '',
    };
}
