import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('product analytics migration is insert-only and excludes private traveller fields', async () => {
    const sql = await readFile(new URL('../supabase/migrations/20260905180000_product_analytics.sql', import.meta.url), 'utf8');
    assert.match(sql, /create table if not exists public\.product_events/i);
    assert.match(sql, /alter table public\.product_events enable row level security/i);
    assert.match(sql, /revoke all on table public\.product_events from anon, authenticated/i);
    assert.match(sql, /grant insert on table public\.product_events to anon, authenticated/i);
    const columns = sql.match(/create table if not exists public\.product_events \(([\s\S]*?)\n\);/i)?.[1] || '';
    assert.doesNotMatch(columns, /^\s*(email|trip_id|user_id|booking_reference|notes|destination)\s/mgi);
    assert.doesNotMatch(sql, /grant select/i);
});
