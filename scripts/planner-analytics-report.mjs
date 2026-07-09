/**
 * Summarize AI Safari Planner usage from Supabase.
 *
 * Prerequisites:
 *   1. Run supabase/migrate-planner-analytics.sql in the Supabase SQL Editor
 *   2. Add SUPABASE_SERVICE_ROLE_KEY to .env (Dashboard → API → secret key)
 *
 * Usage:
 *   npm run analytics:planner
 *   npm run analytics:planner -- --days 30
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
    const envPath = resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
}

function parseDays(argv) {
    const flag = argv.indexOf('--days');
    if (flag === -1) return 30;
    const value = Number(argv[flag + 1]);
    return Number.isFinite(value) && value > 0 ? value : 30;
}

function countBy(rows, key) {
    const counts = new Map();
    for (const row of rows) {
        const label = row[key] || '(not set)';
        counts.set(label, (counts.get(label) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function average(rows, key) {
    const values = rows.map((row) => row[key]).filter((value) => Number.isFinite(value));
    if (!values.length) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function printTop(title, entries, limit = 8) {
    console.log(`\n${title}`);
    if (!entries.length) {
        console.log('  (no data)');
        return;
    }
    for (const [label, count] of entries.slice(0, limit)) {
        console.log(`  ${String(count).padStart(4)}  ${label}`);
    }
}

loadEnv();

const days = parseDays(process.argv);
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const since = new Date();
since.setDate(since.getDate() - days);

const supabase = createClient(url, serviceKey);
const { data, error } = await supabase
    .from('ai_planner_events')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

if (error) {
    console.error('Query failed:', error.message);
    if (/ai_planner_events/.test(error.message)) {
        console.error('Run supabase/migrate-planner-analytics.sql in the Supabase SQL Editor first.');
    }
    process.exit(1);
}

const events = data || [];
const opens = events.filter((row) => row.event_type === 'open');
const generates = events.filter((row) => row.event_type === 'generate');
const successes = generates.filter((row) => row.status === 'success');
const failures = generates.filter((row) => row.status === 'error');

console.log(`AI Safari Planner usage — last ${days} days`);
console.log(`Window: ${since.toISOString().slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`);
console.log(`Total events: ${events.length}`);

console.log('\nFunnel');
console.log(`  Opens:              ${opens.length}`);
console.log(`  Generate attempts:  ${generates.length}`);
console.log(`  Successful:         ${successes.length}`);
console.log(`  Failed:             ${failures.length}`);
if (opens.length) {
    const conversion = ((generates.length / opens.length) * 100).toFixed(1);
    console.log(`  Open → generate:    ${conversion}%`);
}
if (generates.length) {
    const successRate = ((successes.length / generates.length) * 100).toFixed(1);
    console.log(`  Success rate:       ${successRate}%`);
}

const avgLatency = average(successes, 'latency_ms');
if (avgLatency != null) {
    console.log(`  Avg latency (ok):   ${avgLatency} ms`);
}

printTop('Top destinations (generations)', countBy(successes, 'country'));
printTop('Top themes (generations)', countBy(successes, 'category'));
printTop('Top budget tiers (generations)', countBy(successes, 'budget'));
printTop('Client (opens)', countBy(opens, 'client'));
printTop('Client (generations)', countBy(generates, 'client'));
printTop('Errors', countBy(failures, 'error_code'));

const durationBuckets = countBy(
    successes.map((row) => ({
        duration: row.duration != null ? `${row.duration} days` : '(not set)',
    })),
    'duration',
);
printTop('Trip length (successful generations)', durationBuckets);

const catalogAvg = average(successes, 'catalog_matches');
if (catalogAvg != null) {
    console.log(`\nAvg catalog matches per generation: ${catalogAvg}`);
}

if (events[0]) {
    console.log(`\nLatest event: ${events[0].created_at} (${events[0].event_type}${events[0].status ? ` / ${events[0].status}` : ''})`);
}
