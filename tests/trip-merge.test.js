import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTripRecords } from '../js/lib/trip-merge.js';

function trip(id, updatedAt, name = id) {
    return { id, name, updatedAt };
}

test('cloud sync keeps the newest version of each trip', () => {
    const local = [trip('one', '2026-09-02T10:00:00Z', 'Local old'), trip('two', '2026-09-02T12:00:00Z', 'Local new')];
    const cloud = [
        { client_id: 'one', data: trip('one', '2026-09-02T11:00:00Z', 'Cloud new'), deleted_at: null },
        { client_id: 'two', data: trip('two', '2026-09-02T11:00:00Z', 'Cloud old'), deleted_at: null },
        { client_id: 'three', data: trip('three', '2026-09-02T09:00:00Z', 'Cloud only'), deleted_at: null },
    ];

    const merged = mergeTripRecords(local, cloud);
    assert.equal(merged.find(item => item.id === 'one').name, 'Cloud new');
    assert.equal(merged.find(item => item.id === 'two').name, 'Local new');
    assert.equal(merged.find(item => item.id === 'three').name, 'Cloud only');
});

test('newer cloud tombstones prevent deleted trips returning on another device', () => {
    const local = [trip('deleted', '2026-09-02T10:00:00Z')];
    const cloud = [{ client_id: 'deleted', data: local[0], deleted_at: '2026-09-02T11:00:00Z' }];
    assert.deepEqual(mergeTripRecords(local, cloud), []);
});

test('a trip edited after a remote deletion can be restored', () => {
    const local = [trip('restored', '2026-09-02T12:00:00Z')];
    const cloud = [{ client_id: 'restored', data: local[0], deleted_at: '2026-09-02T11:00:00Z' }];
    assert.equal(mergeTripRecords(local, cloud)[0].id, 'restored');
});
