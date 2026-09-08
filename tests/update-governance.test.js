import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterCurrentUpdates, isCurrentUpdate, isDateOnly, isGovernedUpdate } from '../js/lib/update-governance.js';

const data = JSON.parse(readFileSync(new URL('../data/travel-updates.json', import.meta.url), 'utf8'));

test('every published travel update has a complete governance envelope', () => {
    assert.ok(data.updates.length > 0);
    data.updates.forEach(update => assert.equal(isGovernedUpdate(update), true, update.id));
    assert.equal(isDateOnly('2026-02-31'), false);
});

test('future and expired updates are suppressed automatically', () => {
    const example = data.updates[0];
    assert.equal(isCurrentUpdate(example, '2026-09-08'), true);
    assert.equal(isCurrentUpdate(example, '2027-07-01'), false);
    assert.equal(isCurrentUpdate({ ...example, reviewedOn: '2026-10-01' }, '2026-09-08'), false);
});

test('current updates filter by country and category', () => {
    const results = filterCurrentUpdates(data.updates, {
        country: 'namibia',
        category: 'entry-rule',
    }, '2026-09-08');
    assert.deepEqual(results.map(update => update.id), ['namibia-visa-on-arrival-check']);
});
