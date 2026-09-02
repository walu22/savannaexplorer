import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('trip cloud migration enforces owner RLS and token-only public sharing', async () => {
    const sql = await readFile(new URL('../supabase/migrate-trip-cloud.sql', import.meta.url), 'utf8');
    assert.match(sql, /alter table public\.user_trips enable row level security/i);
    assert.match(sql, /auth\.uid\(\)\) = user_id/i);
    assert.match(sql, /security definer/i);
    assert.match(sql, /where ut\.share_token = p_token/i);
    assert.match(sql, /revoke all on function public\.get_shared_trip\(uuid\) from public/i);
    assert.doesNotMatch(sql, /create policy[^;]+using \(true\)/is);
});
