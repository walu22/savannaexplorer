import test from 'node:test';
import assert from 'node:assert/strict';
import { addBooking, normalizeBookings, removeBooking, updateBooking } from '../js/lib/trip-bookings.js';

test('booking records are normalized, updated and removed safely', () => {
    const bookings = addBooking([], { type: 'stay', provider: 'Etosha Camp', reference: ' ET-42 ', date: '2026-10-10' });
    const bookingId = bookings[0].id;

    assert.equal(bookings[0].provider, 'Etosha Camp');
    assert.equal(bookings[0].reference, 'ET-42');
    assert.equal(bookings[0].status, 'planned');
    const updated = updateBooking(bookings, bookingId, { provider: 'Okaukuejo', reference: 'NEW-7', date: '2026-10-11', status: 'confirmed' })[0];
    assert.equal(updated.id, bookingId);
    assert.equal(updated.provider, 'Okaukuejo');
    assert.equal(updated.reference, 'NEW-7');
    assert.equal(updated.date, '2026-10-11');
    assert.equal(updated.status, 'confirmed');
    assert.deepEqual(removeBooking(bookings, bookingId), []);
});

test('invalid booking fields receive safe defaults', () => {
    const [booking] = normalizeBookings([{ id: 'one', type: 'unknown', provider: '', date: 'tomorrow', status: 'paid' }]);
    assert.equal(booking.type, 'other');
    assert.equal(booking.provider, 'Untitled booking');
    assert.equal(booking.date, '');
    assert.equal(booking.status, 'planned');
});
