import test from 'node:test';
import assert from 'node:assert/strict';
import {
    addRouteDay,
    addRouteStop,
    createRouteDays,
    moveRouteStop,
    normalizeRouteDays,
    shiftRouteStop,
    updateRouteStop,
} from '../js/lib/trip-route.js';

test('route builder creates one dated day for every trip day', () => {
    const days = createRouteDays('2026-10-10', '2026-10-12');
    assert.deepEqual(days.map(day => day.date), ['2026-10-10', '2026-10-11', '2026-10-12']);
    assert.equal(addRouteDay(days).at(-1).date, '2026-10-13');
});

test('stops can be added, edited, reordered, and moved between days', () => {
    let days = createRouteDays('2026-10-10', '2026-10-11');
    days = addRouteStop(days, days[0].id, { type: 'park', name: 'Etosha gate', time: '07:30' });
    days = addRouteStop(days, days[0].id, { type: 'stay', name: 'Okaukuejo' });
    const [first, second] = days[0].stops;
    days = shiftRouteStop(days, second.id, -1);
    assert.equal(days[0].stops[0].id, second.id);
    days = updateRouteStop(days, first.id, { name: 'Andersson Gate', location: 'Etosha South' });
    days = moveRouteStop(days, first.id, days[1].id, 0);
    assert.equal(days[1].stops[0].name, 'Andersson Gate');
    assert.equal(days[1].stops[0].location, 'Etosha South');
});

test('route normalization limits unsafe or oversized values', () => {
    const days = normalizeRouteDays([{ id: 'day-1', stops: [{ id: 'stop-1', type: 'script', name: '<script>alert(1)</script>', time: '99:99' }] }]);
    assert.equal(days[0].stops[0].type, 'other');
    assert.equal(days[0].stops[0].time, '');
    assert.equal(days[0].stops[0].name, '<script>alert(1)</script>');
});
