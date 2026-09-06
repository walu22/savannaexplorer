import countries from '../../data/countries.json';
import practical from '../../data/practical.json';
import visaPassport from '../../data/visa-passport.json';
import countryResources from '../../data/country-resources.json';
import borders from '../../data/borders.json';
import parks from '../../data/parks.json';
import travelAdvisories from '../../data/travel-advisories.json';
import editorialEvidence from '../../data/editorial-review-evidence.json';
import { isSupabaseConfigured } from '../config.js';
import { buildFreshnessReport } from '../../scripts/lib/editorial-freshness.mjs';
import { buildEditorialControlReport } from '../../scripts/lib/editorial-workflow.mjs';
import {
    allowedAssignmentStatuses,
    canManageCorrection,
    getEditorialSession,
    loadEditorialWorkspace,
    onEditorialAuthChange,
    openEditorialCorrection,
    saveEditorialAssignment,
    sendEditorialSignInLink,
    signOutEditorial,
    updateEditorialCorrection,
} from '../lib/editorial-cloud.js';

const app = () => document.getElementById('editorial-app');
const STATUS_LABELS = {
    draft: 'Draft',
    'in-review': 'In review',
    'changes-requested': 'Changes requested',
    approved: 'Approved',
    published: 'Published',
    blocked: 'Blocked',
};
const ACTION_LABELS = {
    'resolve-correction': 'Resolve correction',
    'refresh-record': 'Refresh record',
    'capture-evidence': 'Capture evidence',
    'assign-roles': 'Assign owner + approver',
    'submit-review': 'Submit for review',
    'address-changes': 'Address requested changes',
    'resolve-blocker': 'Resolve blocker',
    'approve-review': 'Approve or request changes',
    'publish-approved': 'Publish approved change',
    none: 'No action',
};

let initialized = false;
let accessState = null;
let reportState = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function setRobotsNoIndex() {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'robots';
        document.head.appendChild(meta);
    }
    meta.content = 'noindex,nofollow,noarchive';
}

function baseFreshnessReport() {
    return buildFreshnessReport({
        countries,
        practical,
        visaPassport,
        countryResources,
        borders,
        parks,
        travelAdvisories,
        editorialEvidence,
    });
}

function hero(account = '') {
    return `<header class="editorial-hero"><div><span class="editorial-eyebrow">Editorial control centre · restricted</span><h1 id="editorial-title">Every risky fact needs an owner.</h1><p>Review sources, assign accountable editors, separate approval from authorship and keep corrections visible until resolved.</p></div>${account ? `<div class="editorial-account">${account}</div>` : ''}</header>`;
}

function renderSignedOut(message = '') {
    accessState = null;
    reportState = null;
    app().innerHTML = `${hero()}<section class="editorial-auth-card"><h2>Sign in to continue</h2><p>This workspace is limited to explicitly approved editorial accounts. A normal traveller account cannot read editorial records.</p><form class="editorial-auth-form" id="editorial-signin-form"><label class="sr-only" for="editorial-email">Editorial email address</label><input id="editorial-email" type="email" name="email" autocomplete="email" placeholder="editor@example.com" required><button class="btn btn-primary" type="submit">Email secure link</button></form><p class="editorial-status" id="editorial-workspace-status" role="status" aria-live="polite">${escapeHtml(message)}</p></section>`;
}

function renderUnavailable() {
    app().innerHTML = `${hero()}<section class="editorial-auth-card"><h2>Workspace configuration required</h2><p>The public site remains available, but this restricted workspace needs the Supabase project URL and publishable key.</p><p class="editorial-status" data-kind="error">Editorial data was not requested.</p></section>`;
}

function renderDenied(session) {
    const email = session?.user?.email || 'Signed-in account';
    app().innerHTML = `${hero(`<strong>${escapeHtml(email)}</strong><span>Not an editorial member</span>`)}<section class="editorial-auth-card"><h2>Access not granted</h2><p>Your account is authenticated but is not on the active editorial allowlist. An editorial administrator must add the account in Supabase before any workflow data becomes readable.</p><button class="btn btn-outline" id="editorial-signout" type="button">Sign out</button><p class="editorial-status" role="status" aria-live="polite">No editorial records were loaded.</p></section>`;
}

function roleOptions(rows, selected, emptyLabel, roles) {
    return `<option value="">${escapeHtml(emptyLabel)}</option>${rows.filter(person => person.active && roles.includes(person.role)).map(person => `<option value="${escapeHtml(person.user_id)}"${person.user_id === selected ? ' selected' : ''}>${escapeHtml(person.display_name)} · ${escapeHtml(person.role)}</option>`).join('')}`;
}

function statusOptions(options, selected) {
    return options.map(status => `<option value="${status}"${status === selected ? ' selected' : ''}>${escapeHtml(STATUS_LABELS[status])}</option>`).join('');
}

function assignmentControls(record, assignment, access) {
    const options = allowedAssignmentStatuses(access.member, assignment, access.user.id);
    if (access.member.role === 'admin') {
        return `<form class="editorial-form editorial-assignment-form" data-record-id="${escapeHtml(record.id)}"><label>Owner<select name="owner">${roleOptions(access.rows.members, assignment?.owner_id || '', 'Choose owner', ['editor', 'admin'])}</select></label><label>Independent approver<select name="approver">${roleOptions(access.rows.members, assignment?.approver_id || '', 'Choose approver', ['approver', 'admin'])}</select></label><label>State<select name="status">${statusOptions(options, assignment?.status || 'draft')}</select></label><button class="btn btn-primary btn-sm" type="submit">Save assignment</button></form>`;
    }
    if (!options.length) return '<p><small>You can view this record but are not assigned to change its state.</small></p>';
    return `<form class="editorial-form editorial-assignment-form" data-record-id="${escapeHtml(record.id)}"><label>Move workflow to<select name="status">${statusOptions(options, assignment.status)}</select></label><button class="btn btn-primary btn-sm" type="submit">Update state</button></form>`;
}

function gate(label, passed) {
    return `<span class="editorial-gate${passed ? ' editorial-gate--pass' : ''}">${passed ? '✓' : '×'} ${escapeHtml(label)}</span>`;
}

function correctionControls(record, access) {
    if (!record.openCorrections.length) return '';
    return `<div class="editorial-corrections"><strong>Open corrections</strong>${record.openCorrections.map(correction => {
        const canManage = canManageCorrection(access.member, correction, access.user.id);
        const owner = access.workflow.people.find(person => person.id === correction.ownerId)?.name || 'Unassigned';
        const controls = canManage
            ? `<form class="editorial-form editorial-correction-update" data-correction-id="${escapeHtml(correction.id)}"><label>Decision<select name="status"><option value="open"${correction.status === 'open' ? ' selected' : ''}>Open</option><option value="investigating"${correction.status === 'investigating' ? ' selected' : ''}>Investigating</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option></select></label><label>Resolution<textarea name="resolution" rows="2" maxlength="2000" placeholder="Required when resolving or rejecting"></textarea></label><button class="btn btn-outline btn-sm" type="submit">Update correction</button></form>`
            : '<small>Only the correction owner or an administrator can update this item.</small>';
        return `<article class="editorial-correction"><p>${escapeHtml(correction.summary)}</p><small>Owned by ${escapeHtml(owner)} · opened ${escapeHtml(correction.openedAt)}</small>${controls}</article>`;
    }).join('')}</div>`;
}

function recordMarkup(record, assignment, access) {
    const search = `${record.subject} ${record.country} ${record.id} ${record.owner?.name || ''} ${record.approver?.name || ''}`.toLowerCase();
    const openCorrections = record.openCorrections.length
        ? `<p><span class="editorial-badge editorial-badge--bad">${record.openCorrections.length} open correction${record.openCorrections.length === 1 ? '' : 's'}</span></p>` : '';
    const links = record.sourceUrls.map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Source ${index + 1} ↗</a>`).join(' · ');
    return `<article class="editorial-record" data-search="${escapeHtml(search)}" data-action="${escapeHtml(record.nextAction)}" data-category="${escapeHtml(record.category)}"><div><span class="editorial-badge${record.nextAction === 'none' ? ' editorial-badge--good' : ''}">${escapeHtml(ACTION_LABELS[record.nextAction])}</span><h3>${escapeHtml(record.subject)}</h3><p>${escapeHtml(record.country)}</p><small><code>${escapeHtml(record.id)}</code></small>${openCorrections}</div><div class="editorial-roles"><span>Owner</span><strong>${escapeHtml(record.owner?.name || 'Unassigned')}</strong><span>Approver</span><strong>${escapeHtml(record.approver?.name || 'Unassigned')}</strong><span>Freshness</span><strong>${escapeHtml(record.status === 'due-soon' ? `Due in ${record.daysUntilDue} days` : record.status)}</strong><div class="editorial-gates">${gate('Source', record.gates.source)}${gate('Evidence', record.gates.evidence)}${gate('Fresh', record.gates.freshness)}${gate('Ownership', record.gates.ownership)}${gate('Approval', record.gates.approval)}${gate('Corrections', record.gates.corrections)}</div></div><div><strong>Evidence and history</strong><p>${links || 'No source captured'}</p><p><small>${record.history.length} history ${record.history.length === 1 ? 'entry' : 'entries'} · reviewed ${escapeHtml(record.reviewedOn || 'unknown')}</small></p></div><div>${assignmentControls(record, assignment, access)}</div>${correctionControls(record, access)}</article>`;
}

function renderDashboard(access) {
    const report = buildEditorialControlReport(baseFreshnessReport(), access.workflow);
    reportState = report;
    const assignmentMap = new Map(access.rows.assignments.map(item => [item.record_id, item]));
    const account = `<strong>${escapeHtml(access.member.display_name)}</strong><span>${escapeHtml(access.member.role)} · ${escapeHtml(access.user.email || '')}</span><button class="btn btn-outline btn-sm" id="editorial-signout" type="button">Sign out</button>`;
    const recordOptions = report.records.map(record => `<option value="${escapeHtml(record.id)}">${escapeHtml(record.country)} · ${escapeHtml(record.subject)}</option>`).join('');
    const categoryOptions = Object.entries(report.policies).map(([id, policy]) => `<option value="${escapeHtml(id)}">${escapeHtml(policy.label)}</option>`).join('');
    const actionOptions = Object.entries(ACTION_LABELS).filter(([id]) => id !== 'none').map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join('');
    const records = report.records.map(record => recordMarkup(record, assignmentMap.get(record.id), access)).join('');
    app().innerHTML = `${hero(account)}<section class="editorial-metrics" aria-label="Editorial workflow summary"><article class="editorial-metric editorial-metric--alert"><span>Need action</span><strong>${report.summary.needsAction}</strong><small>of ${report.summary.total} records</small></article><article class="editorial-metric editorial-metric--alert"><span>Ownership gaps</span><strong>${report.summary.ownershipGaps}</strong><small>owner + approver required</small></article><article class="editorial-metric"><span>Awaiting decision</span><strong>${report.summary.awaitingApproval}</strong><small>review or publication</small></article><article class="editorial-metric editorial-metric--alert"><span>Open corrections</span><strong>${report.summary.openCorrections}</strong><small>must close before publish</small></article><article class="editorial-metric"><span>Explicitly published</span><strong>${report.summary.explicitlyPublished}</strong><small>${report.summary.publishedUnassigned} legacy records</small></article><article class="editorial-metric"><span>All gates pass</span><strong>${report.summary.publishable}</strong><small>safe to publish</small></article></section><section class="editorial-notice"><strong>Database authorization is active.</strong><p>Browser controls improve the workflow, but Supabase RLS and database triggers make the final authorization decision.</p></section><section class="editorial-panel"><form class="editorial-form editorial-form--correction" id="editorial-correction-form"><label>Record<select name="record">${recordOptions}</select></label><label>Correction summary<textarea name="summary" rows="2" minlength="5" maxlength="1000" required placeholder="Describe the suspected error and where it was reported."></textarea></label><button class="btn btn-outline" type="submit">Open correction</button></form><div class="editorial-toolbar"><input id="editorial-search" type="search" placeholder="Search fact, country, record or owner" aria-label="Search editorial records"><select id="editorial-action" aria-label="Filter by next action"><option value="">All next actions</option>${actionOptions}</select><select id="editorial-category" aria-label="Filter by category"><option value="">All categories</option>${categoryOptions}</select><button class="btn btn-outline" id="editorial-refresh" type="button">Refresh</button></div><div class="editorial-count" id="editorial-count">Showing ${report.records.length} records</div><div class="editorial-records" id="editorial-records">${records}</div><p class="editorial-empty" id="editorial-empty" hidden>No records match these filters.</p></section><p class="editorial-status" id="editorial-workspace-status" role="status" aria-live="polite"></p>`;
}

function workspaceStatus(message, kind = '') {
    const element = document.getElementById('editorial-workspace-status');
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
}

function filterRecords() {
    if (!reportState) return;
    const query = document.getElementById('editorial-search')?.value.trim().toLowerCase() || '';
    const action = document.getElementById('editorial-action')?.value || '';
    const category = document.getElementById('editorial-category')?.value || '';
    let visible = 0;
    document.querySelectorAll('.editorial-record').forEach(record => {
        const show = (!query || record.dataset.search.includes(query))
            && (!action || record.dataset.action === action)
            && (!category || record.dataset.category === category);
        record.hidden = !show;
        if (show) visible += 1;
    });
    const count = document.getElementById('editorial-count');
    if (count) count.textContent = `Showing ${visible} of ${reportState.records.length} records`;
    const empty = document.getElementById('editorial-empty');
    if (empty) empty.hidden = visible > 0;
}

function safeWorkspaceError(error) {
    console.error('[Editorial] Workspace request failed', error);
    const missingSetup = ['42P01', 'PGRST205'].includes(error?.code);
    const message = missingSetup
        ? 'The editorial database migration has not been applied yet.'
        : 'The editorial workspace could not be loaded securely. Try again or contact an administrator.';
    app().innerHTML = `${hero()}<section class="editorial-auth-card"><h2>Workspace unavailable</h2><p>${escapeHtml(message)}</p><button class="btn btn-outline" id="editorial-signout" type="button">Sign out</button><p class="editorial-status" data-kind="error">No editorial data is displayed.</p></section>`;
}

async function refreshWorkspace() {
    if (!isSupabaseConfigured()) {
        renderUnavailable();
        return;
    }
    const session = await getEditorialSession();
    if (!session) {
        renderSignedOut();
        return;
    }
    app().innerHTML = `${hero(`<strong>${escapeHtml(session.user.email || 'Signed in')}</strong><span>Checking editorial membership…</span>`)}<section class="editorial-auth-card"><h2>Authorizing workspace</h2><p class="editorial-status" role="status" aria-live="polite">Loading only the records your account is permitted to see.</p></section>`;
    try {
        const access = await loadEditorialWorkspace();
        if (!access.member) {
            renderDenied(session);
            return;
        }
        accessState = access;
        renderDashboard(access);
    } catch (error) {
        safeWorkspaceError(error);
    }
}

async function handleSubmit(event) {
    if (event.target.id === 'editorial-signin-form') {
        event.preventDefault();
        const email = new FormData(event.target).get('email')?.toString().trim();
        workspaceStatus('Sending secure sign-in link…');
        try {
            await sendEditorialSignInLink(email);
            workspaceStatus('Check your email for the secure sign-in link.', 'success');
        } catch (error) {
            console.error('[Editorial] Sign-in failed', error);
            workspaceStatus('The sign-in link could not be sent. Check the address and try again.', 'error');
        }
        return;
    }

    if (event.target.matches('.editorial-assignment-form')) {
        event.preventDefault();
        const form = event.target;
        const values = new FormData(form);
        workspaceStatus('Saving assignment…');
        try {
            await saveEditorialAssignment({
                recordId: form.dataset.recordId,
                ownerId: values.get('owner')?.toString() || '',
                approverId: values.get('approver')?.toString() || '',
                status: values.get('status')?.toString() || '',
            }, accessState);
            await refreshWorkspace();
            workspaceStatus('Assignment saved and audit history updated.', 'success');
        } catch (error) {
            console.error('[Editorial] Assignment save failed', error);
            workspaceStatus(error?.message || 'The assignment could not be saved.', 'error');
        }
        return;
    }

    if (event.target.id === 'editorial-correction-form') {
        event.preventDefault();
        const values = new FormData(event.target);
        workspaceStatus('Opening correction…');
        try {
            await openEditorialCorrection({
                recordId: values.get('record')?.toString(),
                summary: values.get('summary')?.toString(),
            }, accessState);
            await refreshWorkspace();
            workspaceStatus('Correction opened and assigned to you.', 'success');
        } catch (error) {
            console.error('[Editorial] Correction save failed', error);
            workspaceStatus(error?.message || 'The correction could not be opened.', 'error');
        }
        return;
    }

    if (event.target.matches('.editorial-correction-update')) {
        event.preventDefault();
        const values = new FormData(event.target);
        workspaceStatus('Updating correction…');
        try {
            await updateEditorialCorrection({
                id: event.target.dataset.correctionId,
                status: values.get('status')?.toString(),
                resolution: values.get('resolution')?.toString(),
            }, accessState);
            await refreshWorkspace();
            workspaceStatus('Correction updated and audit history recorded.', 'success');
        } catch (error) {
            console.error('[Editorial] Correction update failed', error);
            workspaceStatus(error?.message || 'The correction could not be updated.', 'error');
        }
    }
}

async function handleClick(event) {
    if (event.target.closest('#editorial-signout')) {
        try {
            await signOutEditorial();
            renderSignedOut('Signed out.');
        } catch (error) {
            console.error('[Editorial] Sign-out failed', error);
            workspaceStatus('Sign-out failed. Try again.', 'error');
        }
    } else if (event.target.closest('#editorial-refresh')) {
        workspaceStatus('Refreshing…');
        await refreshWorkspace();
    }
}

export function initEditorialWorkspace() {
    if (initialized || !app()) return;
    initialized = true;
    setRobotsNoIndex();
    app().addEventListener('submit', handleSubmit);
    app().addEventListener('click', event => handleClick(event).catch(error => safeWorkspaceError(error)));
    app().addEventListener('input', event => {
        if (event.target.matches('#editorial-search,#editorial-action,#editorial-category')) filterRecords();
    });
    app().addEventListener('change', event => {
        if (event.target.matches('#editorial-action,#editorial-category')) filterRecords();
    });
    onEditorialAuthChange(() => refreshWorkspace().catch(error => safeWorkspaceError(error)));
    refreshWorkspace().catch(error => safeWorkspaceError(error));
}
