import { parseReviewedDate } from './editorial-freshness.mjs';

export const WORKFLOW_STATUSES = Object.freeze([
    'draft',
    'in-review',
    'changes-requested',
    'approved',
    'published',
    'blocked',
]);

export const CORRECTION_STATUSES = Object.freeze([
    'open',
    'investigating',
    'resolved',
    'rejected',
]);

const ACTION_ORDER = Object.freeze({
    'resolve-correction': 0,
    'refresh-record': 1,
    'capture-evidence': 2,
    'assign-roles': 3,
    'submit-review': 4,
    'address-changes': 5,
    'resolve-blocker': 6,
    'approve-review': 7,
    'publish-approved': 8,
    none: 9,
});

function uniqueById(items, label) {
    const map = new Map();
    for (const item of items || []) {
        if (!item?.id || map.has(item.id)) {
            throw new Error(`${label} entries require unique non-empty ids`);
        }
        map.set(item.id, item);
    }
    return map;
}

function validIsoDate(value) {
    return Boolean(parseReviewedDate(value) && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function requireKnownRecord(recordIds, recordId, label) {
    if (!recordIds.has(recordId)) throw new Error(`${label} references unknown record ${recordId || '(missing)'}`);
}

function requireKnownPerson(people, personId, label, { optional = false } = {}) {
    if (!personId && optional) return;
    if (!people.has(personId)) throw new Error(`${label} references unknown person ${personId || '(missing)'}`);
}

function validateWorkflow(freshnessReport, workflow) {
    if (workflow?.meta?.schemaVersion !== 1) {
        throw new Error('Editorial workflow schemaVersion must be 1');
    }

    const recordMap = new Map(freshnessReport.records.map(record => [record.id, record]));
    const recordIds = new Set(recordMap.keys());
    const people = uniqueById(workflow.people, 'People');
    const assignments = uniqueById((workflow.assignments || []).map(item => ({ ...item, id: item.recordId })), 'Assignment');
    const corrections = uniqueById(workflow.corrections, 'Correction');
    const events = uniqueById(workflow.events, 'Event');

    for (const person of people.values()) {
        if (!person.name || !person.role) throw new Error(`Person ${person.id} requires a name and role`);
        if (person.active !== undefined && typeof person.active !== 'boolean') {
            throw new Error(`Person ${person.id} active must be boolean`);
        }
    }

    for (const assignment of assignments.values()) {
        requireKnownRecord(recordIds, assignment.recordId, 'Assignment');
        requireKnownPerson(people, assignment.ownerId, `Assignment ${assignment.recordId}`);
        requireKnownPerson(people, assignment.approverId, `Assignment ${assignment.recordId}`, { optional: true });
        if (!WORKFLOW_STATUSES.includes(assignment.status)) {
            throw new Error(`Assignment ${assignment.recordId} has invalid status ${assignment.status}`);
        }
        if (!validIsoDate(assignment.updatedAt)) {
            throw new Error(`Assignment ${assignment.recordId} requires updatedAt as YYYY-MM-DD`);
        }
        if (assignment.ownerId === assignment.approverId) {
            throw new Error(`Assignment ${assignment.recordId} owner and approver must be different people`);
        }
        if (['approved', 'published'].includes(assignment.status)) {
            if (!assignment.approverId || !validIsoDate(assignment.approvedAt)) {
                throw new Error(`Assignment ${assignment.recordId} requires an approver and approvedAt before ${assignment.status}`);
            }
            if (assignment.approvedAt > assignment.updatedAt) {
                throw new Error(`Assignment ${assignment.recordId} updatedAt cannot predate its approval`);
            }
        }
    }

    for (const correction of corrections.values()) {
        requireKnownRecord(recordIds, correction.recordId, `Correction ${correction.id}`);
        if (!CORRECTION_STATUSES.includes(correction.status)) {
            throw new Error(`Correction ${correction.id} has invalid status ${correction.status}`);
        }
        if (!correction.summary || !validIsoDate(correction.openedAt)) {
            throw new Error(`Correction ${correction.id} requires a summary and openedAt as YYYY-MM-DD`);
        }
        requireKnownPerson(people, correction.ownerId, `Correction ${correction.id}`);
        if (['resolved', 'rejected'].includes(correction.status) && !validIsoDate(correction.closedAt)) {
            throw new Error(`Correction ${correction.id} requires closedAt when ${correction.status}`);
        }
        if (correction.closedAt && correction.closedAt < correction.openedAt) {
            throw new Error(`Correction ${correction.id} cannot close before it opens`);
        }
    }

    for (const event of events.values()) {
        requireKnownRecord(recordIds, event.recordId, `Event ${event.id}`);
        requireKnownPerson(people, event.actorId, `Event ${event.id}`, { optional: true });
        if ((!event.actorId && !event.actorName) || !event.type || !event.note || !validIsoDate(event.at)) {
            throw new Error(`Event ${event.id} requires an actor, type, note and at as YYYY-MM-DD`);
        }
    }

    return { people, assignments, corrections, events };
}

function displayPerson(people, id) {
    if (!id) return null;
    const person = people.get(id);
    return person ? { id: person.id, name: person.name, role: person.role, active: person.active !== false } : null;
}

function baseHistory(record) {
    if (!record.review) return [];
    return [{
        id: `evidence:${record.id}:${record.review.reviewedAt}`,
        type: 'evidence-captured',
        at: record.review.reviewedAt,
        actor: record.review.reviewer,
        note: record.review.outcome,
        detail: record.review.evidence,
    }];
}

function nextAction({ record, assignment, owner, approver, approvalCurrent, openCorrections }) {
    if (openCorrections.length) return 'resolve-correction';
    if (['overdue', 'unknown'].includes(record.status)) return 'refresh-record';
    if (!record.evidenceComplete) return 'capture-evidence';
    if (!owner?.active || !approver?.active) return 'assign-roles';
    if (['approved', 'published'].includes(assignment.status) && !approvalCurrent) return 'approve-review';
    if (assignment.status === 'draft') return 'submit-review';
    if (assignment.status === 'changes-requested') return 'address-changes';
    if (assignment.status === 'blocked') return 'resolve-blocker';
    if (assignment.status === 'in-review') return 'approve-review';
    if (assignment.status === 'approved') return 'publish-approved';
    return 'none';
}

function workflowStatus(record, assignment) {
    if (assignment) return assignment.status;
    if (record.evidenceComplete && ['current', 'due-soon'].includes(record.status)) return 'published-unassigned';
    return 'unmanaged';
}

function recordSort(left, right) {
    return ACTION_ORDER[left.nextAction] - ACTION_ORDER[right.nextAction]
        || (left.daysUntilDue ?? -Infinity) - (right.daysUntilDue ?? -Infinity)
        || left.country.localeCompare(right.country)
        || left.subject.localeCompare(right.subject);
}

export function buildEditorialControlReport(freshnessReport, workflow) {
    const validated = validateWorkflow(freshnessReport, workflow);
    const eventList = [...validated.events.values()];
    const correctionList = [...validated.corrections.values()];

    const records = freshnessReport.records.map(record => {
        const assignment = validated.assignments.get(record.id) || null;
        const corrections = correctionList.filter(item => item.recordId === record.id);
        const openCorrections = corrections.filter(item => ['open', 'investigating'].includes(item.status));
        const explicitHistory = eventList
            .filter(item => item.recordId === record.id)
            .map(item => ({
                ...item,
                actor: displayPerson(validated.people, item.actorId)?.name || item.actorName || 'Editorial system',
            }));
        const history = [...baseHistory(record), ...explicitHistory]
            .sort((left, right) => right.at.localeCompare(left.at) || right.id.localeCompare(left.id));
        const owner = displayPerson(validated.people, assignment?.ownerId);
        const approver = displayPerson(validated.people, assignment?.approverId);
        const approvalCurrent = Boolean(
            assignment
            && ['approved', 'published'].includes(assignment.status)
            && assignment.approvedAt
            && record.reviewedOn
            && assignment.approvedAt >= record.reviewedOn,
        );
        const gates = {
            source: record.hasPrimarySource,
            evidence: record.evidenceComplete,
            freshness: ['current', 'due-soon'].includes(record.status),
            ownership: Boolean(owner?.active && approver?.active && owner.id !== approver.id),
            approval: approvalCurrent,
            corrections: openCorrections.length === 0,
        };
        const nextActionValue = nextAction({ record, assignment, owner, approver, approvalCurrent, openCorrections });

        return {
            ...record,
            workflowStatus: workflowStatus(record, assignment),
            nextAction: nextActionValue,
            owner,
            approver,
            workflowUpdatedAt: assignment?.updatedAt || null,
            approvedAt: assignment?.approvedAt || null,
            openCorrections,
            corrections,
            history,
            gates,
            publishable: Object.values(gates).every(Boolean),
        };
    }).sort(recordSort);

    const count = predicate => records.filter(predicate).length;
    const activeCorrections = records.reduce((total, record) => total + record.openCorrections.length, 0);

    return {
        generatedAt: freshnessReport.generatedAt,
        asOf: freshnessReport.asOf,
        policies: freshnessReport.policies,
        workflowSchemaVersion: workflow.meta.schemaVersion,
        summary: {
            total: records.length,
            needsAction: count(record => record.nextAction !== 'none'),
            ownershipGaps: count(record => !record.gates.ownership),
            awaitingApproval: count(record => ['in-review', 'approved'].includes(record.workflowStatus)),
            explicitlyPublished: count(record => record.workflowStatus === 'published'),
            publishedUnassigned: count(record => record.workflowStatus === 'published-unassigned'),
            publishable: count(record => record.publishable),
            openCorrections: activeCorrections,
            evidenceComplete: count(record => record.evidenceComplete),
            stale: count(record => !record.gates.freshness),
        },
        people: [...validated.people.values()],
        records,
    };
}
