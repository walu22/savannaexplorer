import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('collaboration migration keeps invitations private and editor writes checked', async () => {
    const sql = await readFile(new URL('../supabase/migrations/20260903090000_trip_collaboration.sql', import.meta.url), 'utf8');
    assert.match(sql, /create table if not exists public\.trip_collaborators/i);
    assert.match(sql, /role in \('viewer', 'editor'\)/i);
    assert.match(sql, /expires_at timestamptz not null default \(now\(\) \+ interval '7 days'\)/i);
    assert.match(sql, /tc\.role = 'editor'/i);
    assert.match(sql, /p_data->>'id' is distinct from v_client_id/i);
    assert.match(sql, /revoke all on function public\.save_trip_collaboration\(uuid, jsonb\) from public, anon/i);
    assert.match(sql, /grant execute on function public\.save_trip_collaboration\(uuid, jsonb\) to authenticated/i);
    assert.doesNotMatch(sql, /grant execute[^;]+to anon/i);
});

test('collaboration activity and owner controls are enforced in database functions', async () => {
    const sql = await readFile(new URL('../supabase/migrations/20260903090000_trip_collaboration.sql', import.meta.url), 'utf8');
    assert.match(sql, /create table if not exists public\.trip_activity/i);
    assert.match(sql, /create or replace function public\.remove_trip_collaborator/i);
    assert.match(sql, /create or replace function public\.revoke_trip_collaboration_invite/i);
    assert.match(sql, /ut\.user_id = auth\.uid\(\)/i);
});

test('production permission patch denies anonymous collaboration RPC access', async () => {
    const sql = await readFile(new URL('../supabase/migrations/20260903093000_lock_collaboration_rpc.sql', import.meta.url), 'utf8');
    const revokes = sql.match(/from public, anon/gi) || [];
    assert.equal(revokes.length, 10);
    assert.doesNotMatch(sql, /grant execute/i);
});
