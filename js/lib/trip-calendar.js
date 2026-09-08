import { buildTripReadiness } from './trip-readiness.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function validDate(value) {
    return DATE_PATTERN.test(String(value || ''));
}

function compactDate(value) {
    return String(value).replaceAll('-', '');
}

function nextDate(value) {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
}

function calendarTimestamp(value = new Date()) {
    return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeCalendarText(value) {
    return String(value || '')
        .replaceAll('\\', '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replaceAll(';', '\\;')
        .replaceAll(',', '\\,');
}

function foldLine(line) {
    const encoder = new TextEncoder();
    const parts = [];
    let current = '';
    let limit = 75;

    for (const character of line) {
        if (encoder.encode(current + character).length > limit) {
            parts.push(current);
            current = ` ${character}`;
            limit = 75;
        } else {
            current += character;
        }
    }
    parts.push(current);
    return parts.join('\r\n');
}

function safeFilename(value) {
    const name = String(value || 'safari-trip')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
    return `${name || 'safari-trip'}.ics`;
}

function eventLines(event, stamp) {
    const lines = [
        'BEGIN:VEVENT',
        `UID:${escapeCalendarText(event.uid)}@savannaexplorer.com`,
        `DTSTAMP:${stamp}`,
    ];

    if (event.time) {
        lines.push(`DTSTART:${compactDate(event.date)}T${event.time.replace(':', '')}00`, 'DURATION:PT1H');
    } else {
        lines.push(`DTSTART;VALUE=DATE:${compactDate(event.date)}`);
        lines.push(`DTEND;VALUE=DATE:${compactDate(event.endDate || nextDate(event.date))}`);
    }

    lines.push(`SUMMARY:${escapeCalendarText(event.summary)}`);
    if (event.location) lines.push(`LOCATION:${escapeCalendarText(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeCalendarText(event.description)}`);
    if (event.alarmDays >= 0) {
        lines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:${escapeCalendarText(event.alarmDescription || event.summary)}`,
            `TRIGGER:${event.alarmDays === 0 ? 'PT0S' : `-P${event.alarmDays}D`}`,
            'END:VALARM',
        );
    }
    lines.push('END:VEVENT');
    return lines;
}

function tripEvents(trip, generatedAt) {
    const events = [];
    const tripId = String(trip?.id || 'trip').replace(/[^a-z0-9-]/gi, '-');
    const countries = Array.isArray(trip?.countries) ? trip.countries.filter(Boolean) : [];

    if (validDate(trip?.startDate)) {
        const finalDate = validDate(trip?.endDate) && trip.endDate >= trip.startDate
            ? trip.endDate
            : trip.startDate;
        events.push({
            uid: `${tripId}-overview`,
            date: trip.startDate,
            endDate: nextDate(finalDate),
            summary: `${trip.name || 'Safari trip'} · Savanna Explorer`,
            location: countries.join(', '),
            description: `${Number(trip.travellers) || 1} traveller${Number(trip.travellers) === 1 ? '' : 's'}`,
        });
    }

    (Array.isArray(trip?.routeDays) ? trip.routeDays : []).forEach((day, dayIndex) => {
        if (!validDate(day?.date)) return;
        const stops = Array.isArray(day.stops) ? day.stops : [];
        if (!stops.length && day.title) {
            events.push({
                uid: `${tripId}-day-${dayIndex + 1}`,
                date: day.date,
                summary: day.title,
                description: `Day ${dayIndex + 1} of ${trip.name || 'your safari'}`,
            });
        }
        stops.forEach((stop, stopIndex) => {
            const type = String(stop?.type || 'stop').replace(/^./, character => character.toUpperCase());
            events.push({
                uid: `${tripId}-day-${dayIndex + 1}-stop-${stopIndex + 1}`,
                date: day.date,
                time: TIME_PATTERN.test(stop?.time || '') ? stop.time : '',
                summary: stop?.name || `Safari stop ${stopIndex + 1}`,
                location: stop?.location || '',
                description: `${type}${day.title ? ` · ${day.title}` : ''}${stop?.notes ? `\n${stop.notes}` : ''}`,
            });
        });
    });

    (Array.isArray(trip?.bookings) ? trip.bookings : []).forEach((booking, index) => {
        if (!validDate(booking?.date)) return;
        const detail = [
            booking?.type ? `Type: ${booking.type}` : '',
            booking?.status ? `Status: ${booking.status}` : '',
            booking?.sourceUrl ? `Source: ${booking.sourceUrl}` : '',
        ].filter(Boolean).join('\n');
        events.push({
            uid: `${tripId}-booking-${String(booking?.id || index + 1).replace(/[^a-z0-9-]/gi, '-')}`,
            date: booking.date,
            summary: `Booking: ${booking.provider || 'Travel booking'}`,
            description: detail,
        });
    });

    const readiness = buildTripReadiness(trip, new Date(generatedAt));
    readiness.tasks
        .filter(item => !item.completed && validDate(item.dueDate?.slice(0, 10)))
        .forEach(item => {
            events.push({
                uid: `${tripId}-readiness-${String(item.id).replace(/[^a-z0-9-]/gi, '-')}`,
                date: item.dueDate.slice(0, 10),
                summary: `Reminder: ${item.title}`,
                description: item.description,
                alarmDays: readiness.reminderDays,
                alarmDescription: item.title,
                isReadinessReminder: true,
            });
        });

    return events;
}

export function buildTripCalendar(trip, generatedAt = new Date()) {
    const events = tripEvents(trip, generatedAt);
    if (!events.length) throw new Error('Add trip dates, dated route stops or booking dates before exporting a calendar.');

    const stamp = calendarTimestamp(generatedAt);
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Savanna Explorer//My Safari//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeCalendarText(trip?.name || 'My Safari')}`,
        ...events.flatMap(event => eventLines(event, stamp)),
        'END:VCALENDAR',
    ];

    return {
        content: `${lines.map(foldLine).join('\r\n')}\r\n`,
        eventCount: events.length,
        reminderCount: events.filter(event => event.isReadinessReminder).length,
        filename: safeFilename(trip?.name),
    };
}
