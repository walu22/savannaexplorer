import test from 'node:test';
import assert from 'node:assert/strict';
import routeCollection from '../data/route-collections.json' with { type: 'json' };
import borders from '../data/borders.json' with { type: 'json' };
import journeyPresets from '../data/journey-presets.json' with { type: 'json' };
import { composeJourney } from '../js/lib/journey-composer.js';
import { assessJourneyFeasibility, vehiclePaperworkFor } from '../js/lib/journey-feasibility.js';

test('every preset receives one traceable feasibility check per crossing', () => {
    for (const preset of journeyPresets.presets) {
        const journey = composeJourney(routeCollection.routes, borders, preset);
        assert.equal(journey.status, 'ready', preset.id);
        assert.equal(journey.feasibility.checks.length, journey.crossings.length);
        assert.equal(journey.feasibility.paperworkCount, journey.crossings.length);
        journey.feasibility.checks.forEach(check => {
            assert.match(check.hours.sourceUrl, /^https:\/\//);
            assert.match(check.hours.lastVerified, /^2026-\d{2}-\d{2}$/);
            assert.ok(['ready', 'check', 'blocker'].includes(check.timing.status));
            assert.ok(['ready', 'check', 'blocker'].includes(check.accommodation.status));
        });
    }
});

test('unknown Ngoma and Mwanza hours remain explicit checks, not invented exact windows', () => {
    for (const presetId of ['desert-to-delta', 'lake-mountain']) {
        const preset = journeyPresets.presets.find(item => item.id === presetId);
        const journey = composeJourney(routeCollection.routes, borders, preset);
        assert.equal(journey.feasibility.exactHoursCount, 0);
        assert.equal(journey.feasibility.checks[0].hours.exact, false);
        assert.equal(journey.feasibility.checks[0].hours.status, 'check');
    }
});

test('vehicle paperwork adapts to rental, financed and borrowed vehicles', () => {
    const crossing = borders.find(item => item.id === 'maseru-bridge');
    assert.ok(vehiclePaperworkFor(crossing, 'rental').items.some(item => /rental-company cross-border authority/i.test(item)));
    assert.ok(vehiclePaperworkFor(crossing, 'financed').items.some(item => /finance house/i.test(item)));
    assert.ok(vehiclePaperworkFor(crossing, 'borrowed').items.some(item => /signed owner authorisation/i.test(item)));
});

test('crossing day and date account for preceding route and transfer days', () => {
    const preset = journeyPresets.presets.find(item => item.id === 'falls-beyond');
    const journey = composeJourney(routeCollection.routes, borders, { ...preset, startDate: '2026-10-01' });
    const [first, second] = journey.feasibility.checks;
    assert.equal(first.date, `2026-10-${String(first.dayNumber).padStart(2, '0')}`);
    assert.ok(second.dayNumber > first.dayNumber);
    assert.ok(second.date > first.date);
});

test('a required overnight without a researched corridor stay is a blocker', () => {
    const assessment = assessJourneyFeasibility({
        preferences: { startDate: '2026-10-01', vehicleArrangement: 'owned' },
        segments: [{ days: 5 }, { days: 5 }],
        crossings: [{ id: 'test', name: 'Test crossing', hours: '08:00–17:00', documents: [], sourceUrl: 'https://example.com', lastVerified: '2026-09-08' }],
        transfers: [{ status: 'estimated', arrival: { status: 'open' }, departureTime: '07:00' }],
        stopovers: [{ transferDays: 2, stopoverNights: 1, corridorStays: [] }],
    });
    assert.equal(assessment.status, 'blocker');
    assert.equal(assessment.checks[0].accommodation.status, 'blocker');
});
