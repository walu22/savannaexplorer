const BOOKING_TYPES = new Set(['stay', 'transport', 'activity', 'permit', 'other']);
const BOOKING_STATUSES = new Set(['planned', 'reserved', 'confirmed']);

function text(value, limit) {
    return String(value || '').trim().slice(0, limit);
}

function bookingId() {
    return `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
