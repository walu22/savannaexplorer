import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildFreshnessReport } from '../scripts/lib/editorial-freshness.mjs';
import { buildEditorialControlReport } from '../scripts/lib/editorial-workflow.mjs';

function loadJson(file) {
    return JSON.parse(readFileSync(resolve(process.cwd(), 'data', file), 'utf8'));
}

const freshnessReport = buildFreshnessReport({
    countries: loadJson('countries.json'),
    practical: loadJson('practical.json'),
    visaPassport: loadJson('visa-passport.json'),
    countryResources: loadJson('country-resources.json'),
    borders: loadJson('borders.json'),
    parks: loadJson('parks.json'),
    travelAdvisories: loadJson('travel-advisories.json'),
    editorialEvidence: loadJson('editorial-review-evidence.json'),
}, { asOf: '2026-09-06' });

const people = [
    { id: 'owner', name: 'Country editor', role: 'Owner', active: true },
    { id: 'approver', name: 'Safety editor', role: 'Approver', active: true },
];

function workflow(overrides = {}) {
    return {
        meta: { schemaVersion: 1 },
        people,
        assignments: [],
        corrections: [],
        events: [],
        ...overrides,
    };
}

function publishedAssignment(recordId) {
    return {
        recordId,
        ownerId: 'owner',
        approverId: 'approver',
        status: 'published',
        updatedAt: '2026-09-06',
        approvedAt: '2026-09-06',
    };
}

test('production control centre exposes legacy ownership gaps without inventing people', () => {
    const report = buildEditorialControlReport(freshnessReport, loadJson('editorial-workflow.json'));

    assert.equal(report.summary.total, 93);
    assert.equal(report.summary.evidenceComplete, 93);
    assert.equal(report.summary.ownershipGaps, 93);
    assert.equal(report.summary.publishedUnassigned, 93);
    assert.equal(report.summary.publishable, 0);
    assert.equal(report.summary.openCorrections, 0);
    assert.equal(report.people.length, 0);
    assert.ok(report.records.every(record => record.nextAction === 'assign-roles'));
    assert.ok(report.records.every(record => record.workflowStatus === 'published-unassigned'));
});

test('a fresh independently approved record passes every publication gate', () => {
    const recordId = freshnessReport.records[0].id;
    const report = buildEditorialControlReport(freshnessReport, workflow({
        assignments: [publishedAssignment(recordId)],
        events: [{
            id: 'published-1', recordId, actorId: 'approver', type: 'published',
            at: '2026-09-06', note: 'Approved evidence published.',
        }],
    }));
    const record = report.records.find(item => item.id === recordId);

    assert.equal(record.publishable, true);
    assert.equal(record.nextAction, 'none');
    assert.equal(record.owner.name, 'Country editor');
    assert.equal(record.approver.name, 'Safety editor');
    assert.equal(record.history[0].type, 'published');
    assert.equal(record.history[1].type, 'evidence-captured');
    assert.equal(report.summary.explicitlyPublished, 1);
    assert.equal(report.summary.publishable, 1);
});

test('an open correction blocks publication and becomes the first action', () => {
    const recordId = freshnessReport.records[0].id;
    const report = buildEditorialControlReport(freshnessReport, workflow({
        assignments: [publishedAssignment(recordId)],
        corrections: [{
            id: 'correction-1', recordId, status: 'investigating',
            openedAt: '2026-09-06', ownerId: 'owner', summary: 'Authority page changed.',
        }],
    }));
    const record = report.records.find(item => item.id === recordId);

    assert.equal(record.publishable, false);
    assert.equal(record.nextAction, 'resolve-correction');
    assert.equal(record.gates.corrections, false);
    assert.equal(report.summary.openCorrections, 1);
});

test('the same person cannot own and approve a record', () => {
    const recordId = freshnessReport.records[0].id;
    const assignment = { ...publishedAssignment(recordId), approverId: 'owner' };

    assert.throws(
        () => buildEditorialControlReport(freshnessReport, workflow({ assignments: [assignment] })),
        /owner and approver must be different people/,
    );
});

test('approval states require an approver and decision date', () => {
    const recordId = freshnessReport.records[0].id;
    const assignment = { ...publishedAssignment(recordId) };
    delete assignment.approvedAt;

    assert.throws(
        () => buildEditorialControlReport(freshnessReport, workflow({ assignments: [assignment] })),
        /requires an approver and approvedAt/,
    );
});

test('approval that predates fresh evidence returns to the approval queue', () => {
    const recordId = freshnessReport.records[0].id;
    const assignment = {
        ...publishedAssignment(recordId),
        updatedAt: '2026-09-07',
        approvedAt: '2026-09-05',
    };

    const report = buildEditorialControlReport(freshnessReport, workflow({ assignments: [assignment] }));
    const record = report.records.find(item => item.id === recordId);

    assert.equal(record.gates.approval, false);
    assert.equal(record.publishable, false);
    assert.equal(record.nextAction, 'approve-review');
});

test('workflow items cannot point at unknown records', () => {
    assert.throws(
        () => buildEditorialControlReport(freshnessReport, workflow({
            corrections: [{
                id: 'correction-unknown', recordId: 'visa:nowhere', status: 'open',
                openedAt: '2026-09-06', summary: 'Unknown record test.',
            }],
        })),
        /references unknown record visa:nowhere/,
    );
});

test('inactive assignees and blocked records remain actionable', () => {
    const recordId = freshnessReport.records[0].id;
    const inactiveReport = buildEditorialControlReport(freshnessReport, workflow({
        people: [
            { ...people[0], active: false },
            people[1],
        ],
        assignments: [publishedAssignment(recordId)],
    }));
    assert.equal(inactiveReport.records.find(item => item.id === recordId).nextAction, 'assign-roles');

    const blockedReport = buildEditorialControlReport(freshnessReport, workflow({
        assignments: [{
            ...publishedAssignment(recordId),
            status: 'blocked',
            approvedAt: undefined,
        }],
    }));
    assert.equal(blockedReport.records.find(item => item.id === recordId).nextAction, 'resolve-blocker');
});

test('corrections require a named owner', () => {
    const recordId = freshnessReport.records[0].id;

    assert.throws(
        () => buildEditorialControlReport(freshnessReport, workflow({
            corrections: [{
                id: 'correction-unowned', recordId, status: 'open',
                openedAt: '2026-09-06', summary: 'Needs an accountable owner.',
            }],
        })),
        /references unknown person \(missing\)/,
    );
});
