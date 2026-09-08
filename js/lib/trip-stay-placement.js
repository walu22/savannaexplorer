import { addBooking, removeBooking, updateBooking } from './trip-bookings.js';
import { addRouteStop, normalizeRouteDays } from './trip-route.js';
import { campsiteBooking } from './campsite-planner.js';

const COUNTRY_NAMES = {
    botswana: 'Botswana', eswatini: 'Eswatini', lesotho: 'Lesotho', malawi: 'Malawi',
    mozambique: 'Mozambique', namibia: 'Namibia', 'south-africa': 'South Africa',
    zambia: 'Zambia', zimbabwe: 'Zimbabwe',
};
const ACCESS_RANK = { standard: 1, 'high-clearance': 2, '4x4': 3 };

function linkedStop(stop, bookingId) {
    return stop.bookingId === bookingId;
}

function withoutLinkedStop(days, bookingId) {
    return normalizeRouteDays(days).map(day => ({
        ...day,
        stops: day.stops.filter(stop => !linkedStop(stop, bookingId)),
    }));
}

function stopInput(booking) {
    const access = booking.accessLabel || booking.accessLevel;
    return {
        type: 'stay',
        name: booking.provider,
        location: [booking.location, COUNTRY_NAMES[booking.country]].filter(Boolean).join(', '),
        notes: [access ? `${access} access` : '', booking.accessNote].filter(Boolean).join(' — '),
        bookingId: booking.id,
        sourceType: booking.sourceType,
        sourceId: booking.sourceId,
        sourceUrl: booking.sourceUrl,
    };
}

export function addCampsiteToTrip(trip, site, routeDayId = '') {
    const routeDays = normalizeRouteDays(trip?.routeDays);
    const day = routeDays.find(item => item.id === routeDayId) || null;
    const duplicate = (trip?.bookings || []).find(booking => (
        booking.sourceType === 'campsite' && booking.sourceId === site.id
    ) || (booking.type === 'stay' && booking.provider === site.name));
    if (duplicate) return { bookings: trip.bookings, routeDays, booking: duplicate, duplicate: true, placed: Boolean(duplicate.routeDayId) };

    const bookings = addBooking(trip?.bookings, campsiteBooking(site, day));
    const booking = bookings.at(-1);
    const nextDays = day ? addRouteStop(routeDays, day.id, stopInput(booking)) : routeDays;
    return { bookings, routeDays: nextDays, booking, duplicate: false, placed: Boolean(day) };
}

export function assignStayToDay(trip, bookingId, routeDayId = '') {
    const booking = (trip?.bookings || []).find(item => item.id === bookingId && item.type === 'stay');
    if (!booking) return { bookings: trip?.bookings || [], routeDays: normalizeRouteDays(trip?.routeDays), placed: false };
    const clearedDays = withoutLinkedStop(trip?.routeDays, bookingId);
    const day = clearedDays.find(item => item.id === routeDayId) || null;
    const bookings = updateBooking(trip.bookings, bookingId, {
        routeDayId: day?.id || '',
        date: day?.date || booking.date,
    });
    const updated = bookings.find(item => item.id === bookingId);
    return {
        bookings,
        routeDays: day ? addRouteStop(clearedDays, day.id, stopInput(updated)) : clearedDays,
        booking: updated,
        placed: Boolean(day),
    };
}

export function removeBookingAndPlacement(trip, bookingId) {
    return {
        bookings: removeBooking(trip?.bookings, bookingId),
        routeDays: withoutLinkedStop(trip?.routeDays, bookingId),
    };
}

export function buildStayPlacementAudit(trip) {
    const routeDays = normalizeRouteDays(trip?.routeDays);
    const stays = (trip?.bookings || []).filter(booking => booking.type === 'stay');
    const tripCountries = new Set((trip?.countries || []).map(String));
    const capability = trip?.operations?.vehicleCapability || '';
    const issues = [];

    stays.forEach(booking => {
        const day = routeDays.find(item => item.id === booking.routeDayId);
        const stop = routeDays.flatMap(item => item.stops).find(item => linkedStop(item, booking.id));
        const countryName = COUNTRY_NAMES[booking.country] || booking.country;
        if (!booking.routeDayId) {
            issues.push({ bookingId: booking.id, code: 'unplaced', severity: 'check', message: `${booking.provider} is not assigned to an itinerary day.` });
        } else if (!day || !stop) {
            issues.push({ bookingId: booking.id, code: 'broken-link', severity: 'blocker', message: `${booking.provider} is linked to a day that no longer exists. Place it again.` });
        } else if (booking.date && day.date && booking.date !== day.date) {
            issues.push({ bookingId: booking.id, code: 'date-mismatch', severity: 'blocker', message: `${booking.provider} has a booking date that does not match its itinerary day.` });
        }
        if (countryName && tripCountries.size && !tripCountries.has(countryName)) {
            issues.push({ bookingId: booking.id, code: 'country-mismatch', severity: 'blocker', message: `${booking.provider} is in ${countryName}, which is not in this trip’s country plan.` });
        }
        if (booking.accessLevel && !capability) {
            issues.push({ bookingId: booking.id, code: 'vehicle-unset', severity: 'check', message: `Set your vehicle capability to check access for ${booking.provider}.` });
        } else if (booking.accessLevel && (ACCESS_RANK[capability] || 0) < (ACCESS_RANK[booking.accessLevel] || 0)) {
            issues.push({ bookingId: booking.id, code: 'vehicle-mismatch', severity: 'blocker', message: `${booking.provider} is labelled ${booking.accessLabel || booking.accessLevel}, above your selected vehicle capability.` });
        }
    });

    return {
        stays: stays.length,
        placed: stays.filter(booking => routeDays.some(day => day.id === booking.routeDayId)).length,
        blockers: issues.filter(issue => issue.severity === 'blocker').length,
        checks: issues.filter(issue => issue.severity === 'check').length,
        vehicleCapability: capability,
        issues,
    };
}
