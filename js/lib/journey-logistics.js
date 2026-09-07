import transferData from '../../data/journey-transfer-logistics.json' with { type: 'json' };

const DEFAULT_DEPARTURE = '07:00';

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

export function parsePublishedHours(hours) {
    const value = String(hours || '').trim();
    if (/^24 hours$/i.test(value)) return { status: 'known', alwaysOpen: true, label: value };
    if (/season|side|confirm|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(value)) {
        return { status: 'partial', label: value };
    }
    const match = value.match(/(\d{2}):(\d{2})\s*[–—-]\s*(\d{2}):(\d{2})/);
    if (!match) return { status: 'unknown', label: value || 'Confirm current hours' };
    const open = Number(match[1]) * 60 + Number(match[2]);
    let close = Number(match[3]) * 60 + Number(match[4]);
    if (close === 0) close = 1440;
    return { status: 'known', alwaysOpen: false, open, close, label: value };
}

export function borderArrivalCheck(hours, departureTime, approachMinutes) {
    const schedule = parsePublishedHours(hours);
    const departure = timeMinutes(departureTime);
    if (!Number.isFinite(approachMinutes) || departure === null) {
        return { status: 'unknown', label: 'Arrival check needs a usable approach estimate.' };
    }
    const arrival = departure + approachMinutes;
    const arrivalTime = clockTime(arrival);
    if (schedule.status !== 'known') {
        return { status: 'unknown', arrivalTime, label: `Estimated arrival ${arrivalTime}; published hours need a local check.` };
    }
    if (schedule.alwaysOpen) {
        return { status: 'open', arrivalTime, label: `Estimated arrival ${arrivalTime}, within the published 24-hour schedule.` };
    }
    const minuteOfDay = arrival % 1440;
    const withinWindow = minuteOfDay >= schedule.open && minuteOfDay <= schedule.close && arrival < 1440;
    return withinWindow
        ? { status: 'open', arrivalTime, label: `Estimated arrival ${arrivalTime}, within published hours.` }
        : { status: 'closed', arrivalTime, label: `Estimated arrival ${arrivalTime} falls outside the published window.` };
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
    const arrival = borderArrivalCheck(border?.hours, departure, approach?.driveMinutes);
    return {
        key,
        status,
        confidence: status === 'estimated' ? cached.confidence : status === 'partial' ? 'partial' : 'withheld',
        departureTime: departure,
        approach,
        onward,
        totalDistanceKm,
        totalDriveMinutes,
        arrival,
        dayGuidance: dayGuidance(totalDriveMinutes),
        fuelGuidance: fuelGuidance(totalDistanceKm),
        capturedAt: JOURNEY_TRANSFER_META.generatedAt?.slice(0, 10) || '',
        source: JOURNEY_TRANSFER_META.source,
        disclaimer: JOURNEY_TRANSFER_META.disclaimer,
    };
}
