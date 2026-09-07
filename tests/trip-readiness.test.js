import test from 'node:test';
import assert from 'node:assert/strict';
import { addReadinessTask, buildTripReadiness, normalizeReadiness, removeReadinessTask, setReadinessReminderDays, setReadinessTask } from '../js/lib/trip-readiness.js';

test('readiness plan adapts to destinations and trip dates', () => {
    const plan = buildTripReadiness({
        startDate: '2026-10-10',
        countries: ['Namibia', 'Botswana'],
        readiness: { completedTaskIds: ['entry-rules'] },
    }, new Date('2026-05-01T12:00:00'));

    assert.equal(plan.totalCount, 11);
    assert.equal(plan.completedCount, 1);
    assert.equal(plan.score, 9);
    assert.equal(plan.hasDates, true);
    assert.equal(plan.tasks.find(item => item.id === 'entry-rules').completed, true);
    assert.equal(plan.tasks.find(item => item.id === 'entry-rules').dueLabel, 'Completed');
    assert.match(plan.tasks.find(item => item.id === 'entry-rules').title, /Namibia and Botswana/);
    assert.ok(plan.tasks.some(item => item.id === 'border-documents'));
    assert.ok(plan.tasks.every(item => item.dueDate));
});

test('single-country readiness does not add cross-border work', () => {
    const plan = buildTripReadiness({ countries: ['Lesotho'] });

    assert.equal(plan.totalCount, 10);
    assert.equal(plan.hasDates, false);
    assert.equal(plan.tasks.some(item => item.id === 'border-documents'), false);
    assert.ok(plan.tasks.every(item => item.dueState === 'unscheduled'));
});

test('readiness completion is normalized and can be reopened', () => {
    const completed = setReadinessTask({ completedTaskIds: ['entry-rules', 'entry-rules', ''] }, 'health-plan', true);
    assert.deepEqual(completed.completedTaskIds, ['entry-rules', 'health-plan']);

    const reopened = setReadinessTask(completed, 'entry-rules', false);
    assert.deepEqual(reopened.completedTaskIds, ['health-plan']);
    assert.deepEqual(normalizeReadiness(null), { completedTaskIds: [], customTasks: [], calendarReminderDays: 7 });
});

test('personal readiness tasks keep their deadline and completion state', () => {
    const readiness = addReadinessTask(null, { title: 'Download offline maps', category: 'road', dueDate: '2026-10-01' });
    const taskId = readiness.customTasks[0].id;
    const completed = setReadinessTask(readiness, taskId, true);
    const plan = buildTripReadiness({ countries: ['Namibia'], readiness: completed }, new Date('2026-09-01T12:00:00'));

    assert.equal(plan.totalCount, 11);
    assert.equal(plan.tasks.find(item => item.id === taskId).dueDate.slice(0, 10), '2026-10-01');
    assert.equal(plan.tasks.find(item => item.id === taskId).completed, true);
    assert.deepEqual(removeReadinessTask(completed, taskId), { completedTaskIds: [], customTasks: [], calendarReminderDays: 7 });
});

test('calendar reminder timing is validated and preserved across readiness changes', () => {
    const readiness = setReadinessReminderDays(null, 14);
    const completed = setReadinessTask(readiness, 'health-plan', true);
    const withTask = addReadinessTask(completed, { title: 'Confirm airport transfer' });

    assert.equal(buildTripReadiness({ countries: ['Namibia'], readiness: withTask }).reminderDays, 14);
    assert.equal(removeReadinessTask(withTask, withTask.customTasks[0].id).calendarReminderDays, 14);
    assert.equal(setReadinessReminderDays(readiness, 2).calendarReminderDays, 7);
    assert.equal(setReadinessReminderDays(readiness, -1).calendarReminderDays, -1);
});
