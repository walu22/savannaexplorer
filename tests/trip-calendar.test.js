import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTripCalendar } from '../js/lib/trip-calendar.js';

const trip = {
    id: 'trip-namibia-1',
    name: 'Namibia, dunes & wildlife',
    startDate: '2026-10-10',
    endDate: '2026-10-12',
    countries: ['Namibia'],
    travellers: 2,
    notes: 'Carry water; verify park hours.',
    routeDays: [{
        id: 'day-1',
        date: '2026-10-10',
        title: 'Etosha arrival',
        stops: [
            { id: 'stop-1', type: 'park', name: 'Andersson Gate', location: 'Etosha South', time: '14:30', notes: 'Check in' },
            { id: 'stop-2', type: 'stay', name: 'Okaukuejo', location: '', time: '', notes: '' },
        ],
    }],
    bookings: [{ id: 'booking-1', type: 'stay', provider: 'Etosha Camp', reference: 'ET-42', date: '2026-10-11', status: 'confirmed' }],
};

test('calendar export includes the trip, route stops, bookings and readiness alerts', () => {
    const result = buildTripCalendar(trip, '2026-09-06T18:00:00.000Z');

    assert.equal(result.eventCount, 14);
    assert.equal(result.reminderCount, 10);
    assert.equal(result.filename, 'namibia-dunes-wildlife.ics');
    assert.match(result.content, /BEGIN:VCALENDAR\r\nVERSION:2\.0/);
    assert.match(result.content, /DTSTART;VALUE=DATE:20261010\r\nDTEND;VALUE=DATE:20261013/);
    assert.match(result.content, /DTSTART:20261010T143000\r\nDURATION:PT1H/);
    assert.match(result.content, /SUMMARY:Booking: Etosha Camp/);
    assert.doesNotMatch(result.content, /ET-42/);
    assert.doesNotMatch(result.content, /Carry water/);
    assert.match(result.content, /SUMMARY:Reminder: Verify entry rules for Namibia/);
    assert.match(result.content, /BEGIN:VALARM/);
    assert.match(result.content, /TRIGGER:-P7D/);
    assert.match(result.content, /SUMMARY:Namibia\\, dunes & wildlife · Savanna Explorer/);
    assert.ok(result.content.endsWith('END:VCALENDAR\r\n'));
});

test('calendar export rejects a trip with no dated content', () => {
    assert.throws(
        () => buildTripCalendar({ id: 'undated', name: 'Future safari', routeDays: [], bookings: [] }),
        /Add trip dates/,
    );
});

test('calendar text escapes control characters used by the format', () => {
    const result = buildTripCalendar({
        ...trip,
        name: 'Botswana; Delta',
        countries: ['Botswana, Delta'],
        routeDays: [],
        bookings: [],
    }, '2026-09-06T18:00:00.000Z');

    assert.match(result.content, /Botswana\\; Delta/);
    assert.match(result.content, /LOCATION:Botswana\\, Delta/);
});

test('calendar deadlines can be exported without alarms', () => {
    const result = buildTripCalendar({
        ...trip,
        routeDays: [],
        bookings: [],
        readiness: { calendarReminderDays: -1 },
    }, '2026-09-06T18:00:00.000Z');

    assert.equal(result.reminderCount, 10);
    assert.match(result.content, /SUMMARY:Reminder:/);
    assert.doesNotMatch(result.content, /BEGIN:VALARM/);
});
