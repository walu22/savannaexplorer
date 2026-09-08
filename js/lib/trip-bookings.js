const BOOKING_TYPES = new Set(['stay', 'transport', 'activity', 'permit', 'other']);
const BOOKING_STATUSES = new Set(['planned', 'reserved', 'confirmed']);
const ACCESS_LEVELS = new Set(['standard', 'high-clearance', '4x4']);

function text(value, limit) {
    return String(value || '').trim().slice(0, limit);
}

function bookingId() {
    return `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function httpsUrl(value) {
    const result = text(value, 500);
    return /^https:\/\//i.test(result) ? result : '';
}

export function normalizeBookings(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 50).map((booking, index) => ({
        id: text(booking?.id, 128) || `booking-${index + 1}`,
        type: BOOKING_TYPES.has(booking?.type) ? booking.type : 'other',
        provider: text(booking?.provider, 100) || 'Untitled booking',
        reference: text(booking?.reference, 100),
        date: /^\d{4}-\d{2}-\d{2}$/.test(booking?.date || '') ? booking.date : '',
        status: BOOKING_STATUSES.has(booking?.status) ? booking.status : 'planned',
        routeDayId: text(booking?.routeDayId, 128),
        sourceType: text(booking?.sourceType, 40),
        sourceId: text(booking?.sourceId, 128),
        sourceUrl: httpsUrl(booking?.sourceUrl),
        country: text(booking?.country, 80),
        location: text(booking?.location, 160),
        accessLevel: ACCESS_LEVELS.has(booking?.accessLevel) ? booking.accessLevel : '',
        accessLabel: text(booking?.accessLabel, 80),
        accessNote: text(booking?.accessNote, 500),
    }));
}

export function addBooking(bookings, input) {
    return normalizeBookings([
        ...normalizeBookings(bookings),
        { id: bookingId(), ...input },
    ]);
}

export function updateBooking(bookings, bookingIdValue, patch) {
    return normalizeBookings(bookings).map(booking => booking.id === bookingIdValue
        ? { ...booking, ...patch, id: booking.id }
        : booking);
}

export function removeBooking(bookings, bookingIdValue) {
    return normalizeBookings(bookings).filter(booking => booking.id !== bookingIdValue);
}
