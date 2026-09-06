import { getSupabaseClient } from './supabase.js';
import {
    ASSIGNMENT_STATUSES,
    CORRECTION_STATUSES,
    EDITORIAL_RECORD_ID,
    workflowFromEditorialRows,
} from './editorial-cloud-model.js';

export {
    allowedAssignmentStatuses,
    canManageCorrection,
    workflowFromEditorialRows,
} from './editorial-cloud-model.js';

function requireClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured for the editorial workspace.');
    return client;
}

async function requireEditorialAccess(client = requireClient()) {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sign in to access the editorial workspace.');

    const { data: member, error: memberError } = await client
        .from('editorial_members')
        .select('user_id,display_name,role,active')
        .eq('user_id', userData.user.id)
        .maybeSingle();
    if (memberError) throw memberError;
    if (!member?.active) return { user: userData.user, member: null };
    return { user: userData.user, member };
}

export async function getEditorialSession() {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
}

export function onEditorialAuthChange(callback) {
    const client = getSupabaseClient();
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
}

export async function sendEditorialSignInLink(email) {
    const client = requireClient();
    const redirectTo = `${window.location.origin}/editorial`;
    const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
}

export async function signOutEditorial() {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
}

export async function loadEditorialWorkspace() {
    const client = requireClient();
    const access = await requireEditorialAccess(client);
    if (!access.member) return { ...access, workflow: null, rows: null };

    const [members, assignments, corrections, events] = await Promise.all([
        client.from('editorial_members').select('user_id,display_name,role,active').order('display_name'),
        client.from('editorial_assignments').select('record_id,owner_id,approver_id,status,approved_at,published_at,updated_at').order('updated_at', { ascending: false }),
        client.from('editorial_corrections').select('id,record_id,owner_id,status,summary,resolution,opened_at,closed_at,updated_at').order('opened_at', { ascending: false }),
        client.from('editorial_events').select('id,record_id,actor_id,event_type,detail,created_at').order('created_at', { ascending: false }).limit(1000),
    ]);
    const error = members.error || assignments.error || corrections.error || events.error;
    if (error) throw error;
    const rows = {
        members: members.data || [],
        assignments: assignments.data || [],
        corrections: corrections.data || [],
        events: events.data || [],
    };
    return { ...access, rows, workflow: workflowFromEditorialRows(rows) };
}

export async function saveEditorialAssignment(input, access) {
    const client = requireClient();
    if (!access?.member?.active || !access?.user?.id) throw new Error('Editorial access required.');
    if (!EDITORIAL_RECORD_ID.test(input.recordId || '')) throw new Error('Choose a valid editorial record.');
    if (!ASSIGNMENT_STATUSES.has(input.status)) throw new Error('Choose a valid assignment state.');
    if (['approved', 'published'].includes(input.status) && !input.approverId && access.member.role === 'admin') {
        throw new Error('Approved work requires an independent approver.');
    }

    if (access.member.role === 'admin') {
        if (!input.ownerId) throw new Error('Choose a record owner.');
        if (input.ownerId === input.approverId) throw new Error('Owner and approver must be different people.');
        const current = access.rows?.assignments?.find(row => row.record_id === input.recordId);
        if (!current && !['draft', 'blocked'].includes(input.status)) {
            throw new Error('A new assignment must begin as draft or blocked.');
        }
        if (['approved', 'changes-requested'].includes(input.status) && input.approverId !== access.user.id) {
            throw new Error('Only the assigned independent approver can make that decision.');
        }
        if (input.status === 'published' && current?.status !== 'approved') {
            throw new Error('An administrator can publish only after independent approval.');
        }
        const { error } = await client.from('editorial_assignments').upsert({
            record_id: input.recordId,
            owner_id: input.ownerId,
            approver_id: input.approverId || null,
            status: input.status,
            updated_by: access.user.id,
        }, { onConflict: 'record_id' });
        if (error) throw error;
        return;
    }

    const { error } = await client
        .from('editorial_assignments')
        .update({ status: input.status })
        .eq('record_id', input.recordId);
    if (error) throw error;
}

export async function openEditorialCorrection({ recordId, summary }, access) {
    const client = requireClient();
    if (!access?.member?.active || !access?.user?.id) throw new Error('Editorial access required.');
    if (!EDITORIAL_RECORD_ID.test(recordId || '')) throw new Error('Choose a valid editorial record.');
    const note = String(summary || '').trim();
    if (note.length < 5 || note.length > 1000) throw new Error('Describe the correction in 5–1000 characters.');
    const { error } = await client.from('editorial_corrections').insert({
        record_id: recordId,
        owner_id: access.user.id,
        opened_by: access.user.id,
        summary: note,
    });
    if (error) throw error;
}

export async function updateEditorialCorrection({ id, status, resolution }, access) {
    const client = requireClient();
    if (!access?.member?.active || !access?.user?.id) throw new Error('Editorial access required.');
    if (!CORRECTION_STATUSES.has(status)) throw new Error('Choose a valid correction state.');
    const note = String(resolution || '').trim();
    if (['resolved', 'rejected'].includes(status) && (note.length < 5 || note.length > 2000)) {
        throw new Error('Explain the correction decision in 5–2000 characters.');
    }
    const { error } = await client
        .from('editorial_corrections')
        .update({
            status,
            resolution: ['resolved', 'rejected'].includes(status) ? note : null,
        })
        .eq('id', id);
    if (error) throw error;
}
