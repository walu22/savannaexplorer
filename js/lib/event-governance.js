const DAY_MS = 86_400_000;

export function dateOnly(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day
        ? date
        : null;
}

export function toDateOnly(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function addDays(value, days) {
    const date = dateOnly(value);
    if (!date) return '';
    return toDateOnly(new Date(date.getTime() + (Number(days) * DAY_MS)));
}

export function isConfirmedEventValid(event) {
    const start = dateOnly(event?.startDate);
    const end = dateOnly(event?.endDate);
    const publishUntil = dateOnly(event?.publishUntil);
    return event?.status === 'confirmed'
        && Boolean(event?.id && event?.name && event?.country && event?.sourceLabel)
        && /^https:\/\//.test(String(event?.sourceUrl || ''))
        && Boolean(dateOnly(event?.sourceCheckedOn))
        && Boolean(start && end && publishUntil)
        && start <= end
        && end <= publishUntil;
}

export function eventIsCurrent(event, today = toDateOnly()) {
    if (!isConfirmedEventValid(event)) return false;
    const cutoff = dateOnly(event.publishUntil);
    const now = dateOnly(today);
    return Boolean(now && cutoff >= now);
}

export function dateRangesOverlap(startA, endA, startB, endB) {
    const aStart = dateOnly(startA);
    const aEnd = dateOnly(endA || startA);
    const bStart = dateOnly(startB);
    const bEnd = dateOnly(endB || startB);
    if (![aStart, aEnd, bStart, bEnd].every(Boolean)) return false;
    return aStart <= bEnd && bStart <= aEnd;
}

export function filterConfirmedEvents(events = [], filters = {}, today = toDateOnly()) {
    const start = filters.startDate || today;
    const end = filters.endDate || '9999-12-31';
    return events
        .filter(event => eventIsCurrent(event, today))
        .filter(event => dateRangesOverlap(event.startDate, event.endDate, start, end))
        .filter(event => !filters.country || filters.country === 'all' || event.country === filters.country)
        .filter(event => !filters.type || filters.type === 'all' || event.type === filters.type)
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
}

export function monthsInRange(startDate, endDate) {
    const start = dateOnly(startDate);
    const end = dateOnly(endDate || startDate);
    if (!start || !end || start > end) return [];
    const months = new Set();
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const final = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cursor <= final && months.size < 12) {
        months.add(cursor.getUTCMonth() + 1);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return [...months];
}

export function filterSeasonalHighlights(highlights = [], filters = {}) {
    const activeMonths = monthsInRange(filters.startDate, filters.endDate);
    return highlights.filter(item => (
        (!activeMonths.length || item.months.some(month => activeMonths.includes(month)))
        && (!filters.country || filters.country === 'all' || item.countryIds?.includes(filters.country))
    ));
}
