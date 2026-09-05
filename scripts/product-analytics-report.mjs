/**
 * Summarize privacy-safe product actions from Supabase.
 *
 * Usage:
 *   npm run analytics:product
 *   npm run analytics:product -- --days 30
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
    return Number.isFinite(value) && value > 0 ? Math.min(Math.round(value), 365) : 30;
}

function countBy(rows, key) {
    const counts = new Map();
    for (const row of rows) {
        const label = row[key] || '(not set)';
        counts.set(label, (counts.get(label) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function printCounts(title, entries, limit = 12) {
    console.log(`\n${title}`);
    if (!entries.length) {
        console.log('  (no data)');
        return;
    }
    for (const [label, count] of entries.slice(0, limit)) {
        console.log(`  ${String(count).padStart(5)}  ${label}`);
    }
}

function ratio(numerator, denominator) {
    return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : 'n/a';
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
    .from('product_events')
    .select('event_type,page_type,source,status,item_type,country_count,has_dates,client,app_version,created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

if (error) {
    console.error('Query failed:', error.message);
    if (/product_events/i.test(error.message)) {
        console.error('Run supabase/migrations/20260905180000_product_analytics.sql first.');
    }
    process.exit(1);
}

const events = data || [];
const total = type => events.filter(row => row.event_type === type).length;
const routeMatches = total('route_match_completed');
const routesAdded = total('route_added_to_trip');
const matcherRoutesAdded = events.filter(row => row.event_type === 'route_added_to_trip' && row.source === 'route_matcher').length;
const directTripsCreated = total('trip_created');
const tripStarts = directTripsCreated + routesAdded;
const readinessCompleted = events.filter(row => row.event_type === 'readiness_task_completed' && row.status === 'completed').length;
const bookingsAdded = total('booking_record_added');
const sharesCreated = total('trip_share_created');
const invitesCreated = total('collaboration_invite_created');
const invitesAccepted = total('collaboration_invite_accepted');
const clientErrors = events.filter(row => row.event_type === 'client_error');

console.log(`Savanna Explorer product actions — last ${days} days`);
console.log(`Window: ${since.toISOString().slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`);
console.log(`Total events: ${events.length}`);
console.log('\nAction funnel');
console.log(`  Route matches:             ${routeMatches}`);
console.log(`  Matcher routes added:      ${matcherRoutesAdded}  (${ratio(matcherRoutesAdded, routeMatches)} of matches)`);
console.log(`  All routes added:          ${routesAdded}`);
console.log(`  Direct trips created:      ${directTripsCreated}`);
console.log(`  Total trip starts:         ${tripStarts}`);
console.log(`  Readiness tasks completed: ${readinessCompleted}  (${ratio(readinessCompleted, tripStarts)} per trip start)`);
console.log(`  Booking records added:     ${bookingsAdded}  (${ratio(bookingsAdded, tripStarts)} per trip start)`);
console.log(`  Share links created:       ${sharesCreated}  (${ratio(sharesCreated, tripStarts)} per trip start)`);
console.log(`  Invitations created:       ${invitesCreated}`);
console.log(`  Invitations accepted:      ${invitesAccepted}  (${ratio(invitesAccepted, invitesCreated)} of invitations)`);
console.log('\nThese are aggregate action-volume ratios, not unique-user conversion rates.');

printCounts('All product actions', countBy(events, 'event_type'));
printCounts('Entry sources', countBy(events.filter(row => row.source), 'source'));
printCounts('Page types', countBy(events, 'page_type'));
printCounts('Clients', countBy(events, 'client'));
printCounts('Client error categories', countBy(clientErrors, 'status'));
printCounts('App versions', countBy(events, 'app_version'));

if (events[0]) console.log(`\nLatest event: ${events[0].created_at} (${events[0].event_type})`);
