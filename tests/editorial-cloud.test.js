import test from 'node:test';
import assert from 'node:assert/strict';
import {
    allowedAssignmentStatuses,
    canManageCorrection,
    deferEditorialAuthCallback,
    workflowFromEditorialRows,
} from '../js/lib/editorial-cloud-model.js';

test('auth follow-up work is deferred until Supabase releases its cross-tab lock', () => {
    const calls = [];
    const scheduled = [];
    const callback = deferEditorialAuthCallback(
        value => calls.push(value),
        task => scheduled.push(task),
    );

    callback('session-ready');
    assert.deepEqual(calls, []);
    assert.equal(scheduled.length, 1);

    scheduled[0]();
    assert.deepEqual(calls, ['session-ready']);
});

test('cloud rows map to workflow data without retaining removed member identities', () => {
    const workflow = workflowFromEditorialRows({
        members: [{ user_id: 'member-1', display_name: 'Editor One', role: 'editor', active: true }],
        assignments: [{
            record_id: 'border:ngoma',
            owner_id: 'member-1',
            approver_id: null,
            status: 'in-review',
            approved_at: null,
            updated_at: '2026-09-06T09:15:00Z',
        }],
        corrections: [{
            id: 'correction-1',
            record_id: 'border:ngoma',
            owner_id: 'member-1',
            status: 'open',
            summary: 'Confirm the operating hours.',
            opened_at: '2026-09-05T08:00:00Z',
            closed_at: null,
        }],
        events: [{
            id: 41,
            record_id: 'border:ngoma',
            actor_id: 'removed-member',
            event_type: 'assignment-status-changed',
            detail: { previousStatus: 'draft', status: 'in-review' },
            created_at: '2026-09-06T09:15:00Z',
        }],
    });

    assert.equal(workflow.people[0].id, 'member-1');
    assert.equal(workflow.assignments[0].updatedAt, '2026-09-06');
    assert.equal(workflow.corrections[0].openedAt, '2026-09-05');
    assert.equal(workflow.events[0].actorId, undefined);
    assert.equal(workflow.events[0].actorName, 'Former editorial member');
    assert.equal(workflow.events[0].note, 'draft → in-review');
});

test('status choices preserve admin, owner, and independent approver responsibilities', () => {
    const assignment = { owner_id: 'owner-1', approver_id: 'approver-1', status: 'in-review' };

    assert.deepEqual(
        allowedAssignmentStatuses({ active: true, role: 'admin' }, null, 'admin-1').sort(),
        ['blocked', 'draft'].sort(),
    );
    assert.deepEqual(
        allowedAssignmentStatuses({ active: true, role: 'editor' }, assignment, 'owner-1'),
        ['draft', 'in-review', 'blocked'],
    );
    assert.deepEqual(
        allowedAssignmentStatuses({ active: true, role: 'admin' }, { ...assignment, status: 'approved' }, 'admin-1').sort(),
        ['approved', 'blocked', 'draft', 'in-review', 'published'].sort(),
    );
    assert.deepEqual(
        allowedAssignmentStatuses({ active: true, role: 'approver' }, assignment, 'approver-1'),
        ['approved', 'changes-requested', 'in-review'],
    );
    assert.deepEqual(allowedAssignmentStatuses({ active: true, role: 'editor' }, assignment, 'outsider'), []);
    assert.deepEqual(allowedAssignmentStatuses({ active: true, role: 'editor' }, assignment, 'approver-1'), []);
    assert.deepEqual(allowedAssignmentStatuses({ active: false, role: 'admin' }, assignment, 'admin-1'), []);
});

test('only active correction owners and administrators receive correction controls', () => {
    const correction = { ownerId: 'owner-1' };

    assert.equal(canManageCorrection({ active: true, role: 'editor' }, correction, 'owner-1'), true);
    assert.equal(canManageCorrection({ active: true, role: 'admin' }, correction, 'admin-1'), true);
    assert.equal(canManageCorrection({ active: true, role: 'approver' }, correction, 'approver-1'), false);
    assert.equal(canManageCorrection({ active: false, role: 'admin' }, correction, 'admin-1'), false);
});
