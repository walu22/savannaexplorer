import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260906130000_editorial_workspace.sql', import.meta.url);

test('editorial workspace uses an explicit authenticated allowlist', async () => {
    const sql = await readFile(migrationUrl, 'utf8');

    assert.match(sql, /create table if not exists public\.editorial_members/i);
    assert.match(sql, /user_id uuid primary key references auth\.users\(id\)/i);
    assert.match(sql, /role in \('editor', 'approver', 'admin'\)/i);
    assert.match(sql, /create or replace function private\.current_editorial_role\(\)/i);
    assert.match(sql, /set search_path = ''/i);
    assert.match(sql, /where em\.user_id = \(select auth\.uid\(\)\) and em\.active/i);
    assert.doesNotMatch(sql, /create policy[^;]+to anon/is);
});

test('every editorial table has RLS and least-privilege grants', async () => {
    const sql = await readFile(migrationUrl, 'utf8');
    const tables = ['editorial_members', 'editorial_assignments', 'editorial_corrections', 'editorial_events'];

    for (const table of tables) {
        assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
        assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, 'i'));
    }
    assert.match(sql, /grant select on table public\.editorial_events to authenticated/i);
    assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]+editorial_events/i);
    assert.doesNotMatch(sql, /grant [^;]+ to anon/i);
});

test('editorial approval keeps ownership separate and validates publish state', async () => {
    const sql = await readFile(migrationUrl, 'utf8');

    assert.match(sql, /approver_id is null or approver_id <> owner_id/i);
    assert.match(sql, /status not in \('approved', 'published'\)[^;]+approved_at is not null/is);
    assert.match(sql, /status <> 'published' or published_at is not null/i);
    assert.match(sql, /Owners can submit work for review or mark it blocked/i);
    assert.match(sql, /Only the assigned independent approver can approve work or request changes/i);
    assert.match(sql, /Independent approval is required before publication/i);
    assert.match(sql, /Reset approval before changing assignment ownership/i);
    assert.match(sql, /Assignment owner must be an active editor or administrator/i);
    assert.match(sql, /Assignment approver must be an active approver or administrator/i);
    assert.match(sql, /Only an editorial administrator can change assignment ownership/i);
});

test('editorial corrections are owned and all workflow changes are audited', async () => {
    const sql = await readFile(migrationUrl, 'utf8');

    assert.match(sql, /owner_id uuid not null references public\.editorial_members\(user_id\)/i);
    assert.match(sql, /A correction resolution is required before closure/i);
    assert.match(sql, /create trigger audit_editorial_assignment/i);
    assert.match(sql, /create trigger audit_editorial_correction/i);
    assert.match(sql, /insert into public\.editorial_events/i);
    assert.match(sql, /revoke all on function private\.audit_editorial_assignment\(\) from public, anon, authenticated/i);
});
