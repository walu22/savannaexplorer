import transferData from '../../data/journey-transfer-logistics.json' with { type: 'json' };

const DEFAULT_DEPARTURE = '07:00';
export const DEFAULT_BORDER_CLEARANCE_MINUTES = 90;

export const JOURNEY_TRANSFER_META = transferData.meta;

export function transferKey(fromRouteId, borderId, toRouteId) {
    return `${fromRouteId}__${borderId}__${toRouteId}`;
}

export function formatDriveMinutes(minutes) {
    const value = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(value / 60);
    const remaining = value % 60;
    if (!hours) return `${remaining} min`;
    return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

function timeMinutes(value) {
    if (!validTime(value)) return null;
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
}

function clockTime(totalMinutes) {
    const value = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function distanceKm(from, to) {
    if (![from?.lat, from?.lng, to?.lat, to?.lng].every(Number.isFinite)) return null;
    const radians = degrees => degrees * Math.PI / 180;
    const lat = radians(to.lat - from.lat);
    const lng = radians(to.lng - from.lng);
    const value = Math.sin(lat / 2) ** 2
        + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function parsePublishedHours(hours) {
    const value = String(hours || '').trim();
    if (/^24 hours$/i.test(value)) return { status: 'known', alwaysOpen: true, label: value };
    const match = value.match(/(\d{2}):(\d{2})\s*[–—-]\s*(\d{2}):(\d{2})/);
    const qualified = /season|side|confirm|reconfirm|published schedule|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(value);
    if (qualified) {
        if (!match) return { status: 'partial', label: value };
        const open = Number(match[1]) * 60 + Number(match[2]);
        let close = Number(match[3]) * 60 + Number(match[4]);
        if (close === 0) close = 1440;
        return { status: 'partial', alwaysOpen: false, open, close, label: value };
    }
    if (!match) return { status: 'unknown', label: value || 'Confirm current hours' };
    const open = Number(match[1]) * 60 + Number(match[2]);
    let close = Number(match[3]) * 60 + Number(match[4]);
    if (close === 0) close = 1440;
    return { status: 'known', alwaysOpen: false, open, close, label: value };
}

export function borderArrivalCheck(hours, departureTime, approachMinutes, clearanceMinutes = DEFAULT_BORDER_CLEARANCE_MINUTES) {
    const schedule = parsePublishedHours(hours);
    const departure = timeMinutes(departureTime);
    if (!Number.isFinite(approachMinutes) || departure === null) {
        return { status: 'unknown', label: 'Arrival check needs a usable approach estimate.' };
    }
    const arrival = departure + approachMinutes;
    const arrivalTime = clockTime(arrival);
    const clearance = Math.max(0, Number(clearanceMinutes) || 0);
    const clearanceTime = clockTime(arrival + clearance);
    if (schedule.status !== 'known') {
        return {
            status: 'unknown',
            arrivalTime,
            clearanceTime,
            safeWindow: false,
            latestDepartureTime: Number.isFinite(schedule.close) ? clockTime(schedule.close - clearance - approachMinutes) : '',
            label: `Estimated arrival ${arrivalTime}; the published window needs confirmation before this timing can be trusted.`,
        };
    }
    if (schedule.alwaysOpen) {
        return {
            status: 'open', arrivalTime, clearanceTime, safeWindow: true, latestDepartureTime: '',
            label: `Estimated arrival ${arrivalTime}; a ${clearance}-minute planning allowance ends around ${clearanceTime}.`,
        };
    }
    const minuteOfDay = arrival % 1440;
    const withinWindow = minuteOfDay >= schedule.open
        && minuteOfDay + clearance <= schedule.close
        && arrival + clearance < 1440;
    const latestDepartureTime = clockTime(schedule.close - clearance - approachMinutes);
    return withinWindow
        ? {
            status: 'open', arrivalTime, clearanceTime, safeWindow: true, latestDepartureTime,
            label: `Estimated arrival ${arrivalTime}; the ${clearance}-minute clearance allowance ends around ${clearanceTime}.`,
        }
        : {
            status: 'closed', arrivalTime, clearanceTime, safeWindow: false, latestDepartureTime,
            label: `This plan does not leave the full ${clearance}-minute clearance allowance inside published hours. Leave by ${latestDepartureTime} or revise the stopover.`,
        };
}

function breakBufferMinutes(driveMinutes) {
    if (!Number.isFinite(driveMinutes)) return 60;
    if (driveMinutes >= 600) return 90;
    if (driveMinutes >= 420) return 60;
    if (driveMinutes >= 240) return 30;
    return 15;
}

function dayGuidance(totalMinutes) {
    if (!Number.isFinite(totalMinutes)) return 'Confirm the complete transfer time locally before choosing the overnight stop.';
    if (totalMinutes > 600) return 'Do not treat this as one border day. Add an overnight before or after the crossing.';
    if (totalMinutes > 480) return 'This is a very long driving day. Split it with an overnight unless local advice confirms a safe daylight plan.';
    if (totalMinutes > 360) return 'Start early, protect daylight and keep the arrival day free of fixed activities.';
    return 'This can fit a border day on the cached estimate, with time still required for fuel, breaks and formalities.';
}

function fuelGuidance(distanceKm) {
    if (!Number.isFinite(distanceKm)) return 'Confirm fuel availability and range before departure.';
    if (distanceKm >= 600) return 'Start full, identify at least two reliable fuel stops and keep a conservative range reserve.';
    if (distanceKm >= 350) return 'Start with a full tank and confirm one reliable fuel stop before the border.';
    return 'Refuel before departure and do not rely on the border post for fuel.';
}

export function buildTransferPlan(fromRoute, border, toRoute, departureTime = DEFAULT_DEPARTURE) {
    const key = transferKey(fromRoute?.id, border?.id, toRoute?.id);
    const cached = transferData.transfers[key];
    const departure = validTime(departureTime) ? departureTime : DEFAULT_DEPARTURE;
    const cachedLegs = cached?.status === 'estimated' ? cached.legs || [] : [];
    const approach = cachedLegs.find(leg => leg.kind === 'approach' && leg.confidence !== 'low') || null;
    const onward = cachedLegs.find(leg => leg.kind === 'onward' && leg.confidence !== 'low') || null;
    const usableLegCount = [approach, onward].filter(Boolean).length;
    const status = usableLegCount === 2 ? 'estimated' : usableLegCount === 1 ? 'partial' : 'check-required';
    const totalDistanceKm = status === 'estimated' ? cached.totalDistanceKm : null;
    const totalDriveMinutes = status === 'estimated' ? cached.totalDriveMinutes : null;
    const geometricDistanceKm = [
        distanceKm(fromRoute?.stops?.at(-1), border?.coordinates),
        distanceKm(border?.coordinates, toRoute?.stops?.[0]),
    ].reduce((total, distance) => Number.isFinite(distance) ? total + distance : total, 0);
    const schedulingMinutes = Number.isFinite(totalDriveMinutes)
        ? totalDriveMinutes
        : geometricDistanceKm > 0 ? Math.ceil((geometricDistanceKm * 1.3 / 65) * 60) : 840;
    const borderBufferMinutes = DEFAULT_BORDER_CLEARANCE_MINUTES;
    const plannedBreakMinutes = breakBufferMinutes(schedulingMinutes);
    const totalPlanningMinutes = schedulingMinutes + borderBufferMinutes + plannedBreakMinutes;
    const arrival = borderArrivalCheck(border?.hours, departure, approach?.driveMinutes, borderBufferMinutes);
    const departureMinutes = timeMinutes(departure);
    const destinationArrivalTime = departureMinutes !== null && status === 'estimated'
        ? clockTime(departureMinutes + totalPlanningMinutes)
        : '';
    return {
        key,
        status,
        confidence: status === 'estimated' ? cached.confidence : status === 'partial' ? 'partial' : 'withheld',
        departureTime: departure,
        approach,
        onward,
        totalDistanceKm,
        totalDriveMinutes,
        schedulingMinutes,
        borderBufferMinutes,
        breakBufferMinutes: plannedBreakMinutes,
        totalPlanningMinutes,
        destinationArrivalTime,
        schedulingMethod: status === 'estimated' ? 'cached-road-estimate' : 'conservative-geographic-buffer',
        arrival,
        dayGuidance: status === 'estimated'
            ? dayGuidance(totalPlanningMinutes)
            : `Confirm the withheld road leg locally. ${dayGuidance(totalPlanningMinutes)}`,
        fuelGuidance: fuelGuidance(totalDistanceKm),
        capturedAt: JOURNEY_TRANSFER_META.generatedAt?.slice(0, 10) || '',
        source: JOURNEY_TRANSFER_META.source,
        disclaimer: JOURNEY_TRANSFER_META.disclaimer,
    };
}
