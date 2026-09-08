import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    addDays,
    dateOnly,
    dateRangesOverlap,
    filterConfirmedEvents,
    filterSeasonalHighlights,
    isConfirmedEventValid,
} from '../js/lib/event-governance.js';

const events = JSON.parse(readFileSync(new URL('../data/events.json', import.meta.url), 'utf8'));
const wildlife = JSON.parse(readFileSync(new URL('../data/wildlife-calendar.json', import.meta.url), 'utf8'));

test('confirmed events have valid dates, sources and publication cutoffs', () => {
    assert.ok(events.events.length > 0);
    events.events.forEach(event => assert.equal(isConfirmedEventValid(event), true, event.id));
    assert.equal(dateOnly('2026-02-31'), null);
});

test('expired events disappear even when their dates overlap the query', () => {
    const current = filterConfirmedEvents(events.events, {
        startDate: '2026-09-08',
        endDate: addDays('2026-09-08', 90),
    }, '2026-09-08');
    assert.deepEqual(current.map(event => event.id), [
        'botswana-day-2026',
        'hermanus-whale-festival-2026',
        'keetmanshoop-expo-2026',
        'rundu-trade-fair-2026',
    ]);

    const expired = filterConfirmedEvents(events.events, {
        startDate: '2026-09-30',
        endDate: '2026-10-01',
    }, '2026-10-03');
    assert.equal(expired.some(event => event.id === 'botswana-day-2026'), false);
});

test('date, country and type filtering remain deterministic', () => {
    assert.equal(dateRangesOverlap('2026-10-02', '2026-10-04', '2026-10-04', '2026-10-05'), true);
    const namibiaExpos = filterConfirmedEvents(events.events, {
        startDate: '2026-10-01',
        endDate: '2026-11-01',
        country: 'namibia',
        type: 'expo',
    }, '2026-09-08');
    assert.deepEqual(namibiaExpos.map(event => event.id), ['keetmanshoop-expo-2026', 'rundu-trade-fair-2026']);
});

test('watchlist records cannot masquerade as confirmed events', () => {
    events.watchlist.forEach(item => {
        assert.match(item.sourceUrl, /^https:\/\//);
        assert.ok(dateOnly(item.sourceCheckedOn), item.id);
        assert.ok(dateOnly(item.reviewBy), item.id);
        assert.equal(item.startDate, undefined);
        assert.notEqual(item.status, 'confirmed');
    });
});

test('seasonal guidance is source-linked and filters by date and country', () => {
    wildlife.highlights.forEach(item => {
        assert.ok(item.countryIds.length, item.id);
        assert.match(item.sourceUrl, /^https:\/\//, item.id);
    });
    const results = filterSeasonalHighlights(wildlife.highlights, {
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        country: 'zambia',
    });
    assert.deepEqual(results.map(item => item.id), ['bat-migration', 'birding-emerald']);
});
