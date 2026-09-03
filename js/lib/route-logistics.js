import routeLogistics from '../../data/route-logistics.json' with { type: 'json' };
import editorialLogistics from '../../data/route-logistics-editorial.json' with { type: 'json' };

export function getRouteLogistics(routeId) {
    return routeLogistics.routes?.[routeId] || null;
}

export function getEditorialLogistics(routeId) {
    return editorialLogistics.routes?.[routeId] || null;
}

export function editorialLegFor(editorial, leg) {
    return editorial?.legs?.find(item => item.fromStopId === leg.fromStopId && item.toStopId === leg.toStopId) || null;
}

export function routeLegPlan(routeId, fromStopId, toStopId) {
    const logistics = getRouteLogistics(routeId);
    const editorial = getEditorialLogistics(routeId);
    const leg = logistics?.legs?.find(item => item.fromStopId === fromStopId && item.toStopId === toStopId) || null;
    const reviewed = leg ? editorialLegFor(editorial, leg) : null;
    const officialEstimate = Boolean(reviewed?.distanceKm && reviewed?.driveMinutes);
    const usableEstimate = Boolean(leg && (leg.confidence !== 'low' || officialEstimate));
    const estimate = officialEstimate ? reviewed : usableEstimate ? leg : null;
    const fuelAnchors = Array.isArray(editorial?.fuelAnchors) ? editorial.fuelAnchors : [];
    const fuelReminder = fuelAnchors.length
        ? fuelAnchors.map(anchor => `${anchor.name}: ${anchor.note}`).join(' ')
        : fuelPlanningPrompt();
    const reviewedWarning = reviewed?.guidance || editorial?.gatePermitNotes?.[0] || '';

    return {
        distanceKm: estimate ? Number(estimate.distanceKm) : null,
        driveMinutes: estimate ? Number(estimate.driveMinutes) : null,
        estimateLabel: officialEstimate ? 'Official source estimate' : estimate ? 'Planning estimate' : 'Local route check required',
        confidence: officialEstimate ? 'official' : leg?.confidence || 'unknown',
        via: Array.isArray(reviewed?.via) ? reviewed.via : [],
        guidance: reviewedWarning,
        fuelReminder,
        reviewedAt: editorialLogistics.meta?.reviewedAt || '',
    };
}

export function formatDriveMinutes(minutes) {
    const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(safeMinutes / 60);
    const remainder = safeMinutes % 60;
    if (!hours) return `${remainder} min`;
    if (!remainder) return `${hours} hr`;
    return `${hours} hr ${remainder} min`;
}

export function routeLogisticsSummary(logistics, editorial = null) {
    const legs = Array.isArray(logistics?.legs) ? logistics.legs : [];
    const mappedLegs = legs.map(leg => {
        const reviewed = editorialLegFor(editorial, leg);
        if (leg.confidence !== 'low') return leg;
        if (reviewed?.distanceKm && reviewed?.driveMinutes) return { ...leg, ...reviewed, confidence: 'official' };
        return null;
    }).filter(Boolean);
    return {
        legCount: legs.length,
        mappedLegCount: mappedLegs.length,
        needsLocalCheck: mappedLegs.length !== legs.length,
        distanceKm: mappedLegs.reduce((total, leg) => total + (Number(leg.distanceKm) || 0), 0),
        driveMinutes: mappedLegs.reduce((total, leg) => total + (Number(leg.driveMinutes) || 0), 0),
    };
}

export function fuelPlanningPrompt(vehicleId) {
    if (vehicleId === '4x4') return 'Confirm full-tank range and carry approved reserve fuel where local operators advise.';
    if (vehicleId === 'suv') return 'Refuel in major towns and confirm the next reliable supply before remote sectors.';
    return 'Refuel in principal towns and avoid beginning a long leg below half a tank.';
}

export const routeLogisticsMeta = routeLogistics.meta;
export const editorialLogisticsMeta = editorialLogistics.meta;
