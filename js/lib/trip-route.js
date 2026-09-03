const MAX_DAYS = 30;
const MAX_STOPS_PER_DAY = 30;
const STOP_TYPES = new Set(['drive', 'park', 'stay', 'border', 'activity', 'meal', 'other']);

function id(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function text(value, limit) {
    return String(value || '').trim().slice(0, limit);
}

export function normalizeRouteDays(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, MAX_DAYS).map((day, dayIndex) => ({
        id: text(day?.id, 128) || `route-day-${dayIndex + 1}`,
        date: /^\d{4}-\d{2}-\d{2}$/.test(day?.date || '') ? day.date : '',
        title: text(day?.title, 80),
        stops: Array.isArray(day?.stops) ? day.stops.slice(0, MAX_STOPS_PER_DAY).map((stop, stopIndex) => ({
            id: text(stop?.id, 128) || `route-stop-${dayIndex + 1}-${stopIndex + 1}`,
            type: STOP_TYPES.has(stop?.type) ? stop.type : 'other',
            name: text(stop?.name, 100) || 'Untitled stop',
            location: text(stop?.location, 140),
            time: /^([01]\d|2[0-3]):[0-5]\d$/.test(stop?.time || '') ? stop.time : '',
            notes: text(stop?.notes, 500),
        })) : [],
    }));
}

export function createRouteDays(startDate, endDate) {
    const start = /^\d{4}-\d{2}-\d{2}$/.test(startDate || '') ? new Date(`${startDate}T12:00:00Z`) : null;
    const end = /^\d{4}-\d{2}-\d{2}$/.test(endDate || '') ? new Date(`${endDate}T12:00:00Z`) : null;
    const count = start && end && end >= start
        ? Math.min(MAX_DAYS, Math.floor((end - start) / 86400000) + 1)
        : 1;
    return Array.from({ length: count }, (_, index) => {
        const date = start ? new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10) : '';
        return { id: id('route-day'), date, title: '', stops: [] };
    });
}

export function addRouteDay(days) {
    const next = normalizeRouteDays(days);
    if (next.length >= MAX_DAYS) return next;
    const lastDate = next.at(-1)?.date;
    const date = lastDate
        ? new Date(new Date(`${lastDate}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10)
        : '';
    return [...next, { id: id('route-day'), date, title: '', stops: [] }];
}

export function addRouteStop(days, dayId, input) {
    return normalizeRouteDays(days).map(day => day.id === dayId && day.stops.length < MAX_STOPS_PER_DAY
        ? { ...day, stops: [...day.stops, {
            id: id('route-stop'),
            type: STOP_TYPES.has(input?.type) ? input.type : 'other',
            name: text(input?.name, 100) || 'Untitled stop',
            location: text(input?.location, 140),
            time: /^([01]\d|2[0-3]):[0-5]\d$/.test(input?.time || '') ? input.time : '',
            notes: text(input?.notes, 500),
        }] }
        : day);
}

export function updateRouteStop(days, stopId, patch) {
    return normalizeRouteDays(days).map(day => ({
        ...day,
        stops: day.stops.map(stop => stop.id === stopId ? {
            ...stop,
            type: STOP_TYPES.has(patch?.type) ? patch.type : stop.type,
            name: text(patch?.name ?? stop.name, 100) || 'Untitled stop',
            location: text(patch?.location ?? stop.location, 140),
            time: /^([01]\d|2[0-3]):[0-5]\d$/.test(patch?.time || '') ? patch.time : '',
            notes: text(patch?.notes ?? stop.notes, 500),
        } : stop),
    }));
}

export function removeRouteStop(days, stopId) {
    return normalizeRouteDays(days).map(day => ({ ...day, stops: day.stops.filter(stop => stop.id !== stopId) }));
}

export function moveRouteStop(days, stopId, targetDayId, targetIndex = Number.MAX_SAFE_INTEGER) {
    const next = normalizeRouteDays(days);
    const target = next.find(day => day.id === targetDayId);
    const source = next.find(day => day.stops.some(stop => stop.id === stopId));
    if (!target || !source || (target.id !== source.id && target.stops.length >= MAX_STOPS_PER_DAY)) return next;
    let moving = null;
    const without = next.map(day => ({
        ...day,
        stops: day.stops.filter(stop => {
            if (stop.id === stopId) {
                moving = stop;
                return false;
            }
            return true;
        }),
    }));
    if (!moving) return next;
    return without.map(day => {
        if (day.id !== targetDayId || day.stops.length >= MAX_STOPS_PER_DAY) return day;
        const index = Math.max(0, Math.min(Number(targetIndex) || 0, day.stops.length));
        const stops = [...day.stops];
        stops.splice(index, 0, moving);
        return { ...day, stops };
    });
}

export function shiftRouteStop(days, stopId, delta) {
    const next = normalizeRouteDays(days);
    const day = next.find(item => item.stops.some(stop => stop.id === stopId));
    if (!day) return next;
    const index = day.stops.findIndex(stop => stop.id === stopId);
    return moveRouteStop(next, stopId, day.id, Math.max(0, Math.min(day.stops.length - 1, index + delta)));
}
