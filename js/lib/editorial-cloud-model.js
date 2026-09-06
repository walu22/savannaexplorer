export const ASSIGNMENT_STATUSES = new Set(['draft', 'in-review', 'changes-requested', 'approved', 'published', 'blocked']);
export const CORRECTION_STATUSES = new Set(['open', 'investigating', 'resolved', 'rejected']);
export const EDITORIAL_RECORD_ID = /^(visa-summary|visa-matrix|border|park-fee|emergency|travel-advisory):[a-z0-9-]+$/;

function dateOnly(value) {
    return typeof value === 'string' ? value.slice(0, 10) : null;
}

function eventNote(row) {
    if (row.detail?.note) return String(row.detail.note);
    const previous = row.detail?.previousStatus;
    const status = row.detail?.status;
    if (previous && status) return `${previous} → ${status}`;
    if (status) return `Status: ${status}`;
    return row.event_type.replaceAll('-', ' ');
}

export function workflowFromEditorialRows({ members = [], assignments = [], corrections = [], events = [] } = {}) {
    const memberIds = new Set(members.map(row => row.user_id));
    return {
        meta: { schemaVersion: 1 },
        people: members.map(row => ({
            id: row.user_id,
            name: row.display_name,
            role: row.role,
            active: row.active,
        })),
        assignments: assignments.map(row => ({
            recordId: row.record_id,
            ownerId: row.owner_id,
            approverId: row.approver_id,
            status: row.status,
            updatedAt: dateOnly(row.updated_at),
            approvedAt: dateOnly(row.approved_at),
        })),
        corrections: corrections.map(row => ({
            id: row.id,
            recordId: row.record_id,
            ownerId: row.owner_id,
            status: row.status,
            summary: row.summary,
            resolution: row.resolution,
            openedAt: dateOnly(row.opened_at),
            closedAt: dateOnly(row.closed_at),
        })),
        events: events.map(row => ({
            id: String(row.id),
            recordId: row.record_id,
            actorId: memberIds.has(row.actor_id) ? row.actor_id : undefined,
            actorName: memberIds.has(row.actor_id) ? undefined : 'Former editorial member',
            type: row.event_type,
            at: dateOnly(row.created_at),
            note: eventNote(row),
        })),
    };
}

export function allowedAssignmentStatuses(member, assignment, userId) {
    if (!member?.active) return [];
    if (!assignment) return member.role === 'admin' ? ['draft', 'blocked'] : [];
    const statuses = new Set();
    if (member.role === 'admin' || (member.role === 'editor' && assignment.owner_id === userId)) {
        ['draft', 'in-review', 'blocked'].forEach(status => statuses.add(status));
    }
    if (['approver', 'admin'].includes(member.role) && assignment.approver_id === userId) {
        ['approved', 'changes-requested'].forEach(status => statuses.add(status));
    }
    if (statuses.size === 0) return [];
    if (member.role === 'admin' && assignment.status === 'approved') statuses.add('published');
    if (ASSIGNMENT_STATUSES.has(assignment.status)) statuses.add(assignment.status);
    return [...statuses];
}

export function canManageCorrection(member, correction, userId) {
    return Boolean(member?.active && correction && (
        member.role === 'admin' || correction.ownerId === userId
    ));
}
