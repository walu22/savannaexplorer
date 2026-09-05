/**
 * Verify that a Vercel deployment contains both the static product and API functions.
 *
 * Usage: npm run verify:deployment -- https://savannaexplorer.com
 */
import { readFile } from 'node:fs/promises';

const target = process.argv[2];

if (!target) {
    console.error('Usage: npm run verify:deployment -- https://deployment.example');
    process.exit(1);
}

let baseUrl;
try {
    baseUrl = new URL(target);
} catch {
    console.error('Deployment URL is invalid.');
    process.exit(1);
}

if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    console.error('Deployment URL must use HTTP or HTTPS.');
    process.exit(1);
}

const base = baseUrl.href.replace(/\/$/, '');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const expectedVersion = process.env.npm_package_version || packageJson.version;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = bypass ? { 'x-vercel-protection-bypass': bypass } : {};

async function readJson(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
        ...options,
        headers: { ...headers, ...options.headers },
    });
    const text = await response.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        throw new Error(`${path} returned ${response.status} with non-JSON content`);
    }
    return { response, body };
}

const version = await readJson('/version.json');
if (!version.response.ok || version.body.version !== expectedVersion) {
    throw new Error(`/version.json expected ${expectedVersion}, received ${version.response.status} ${version.body.version || 'unknown'}`);
}

const focusedPage = await fetch(`${base}/my-safari`, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
});
const focusedHtml = await focusedPage.text();
if (!focusedPage.ok || !focusedHtml.includes('My Safari Trip Planner')) {
    throw new Error(`/my-safari failed its content check (${focusedPage.status})`);
}

const api = await readJson('/api/itinerary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
});
if (api.response.status !== 400 || !api.body.error) {
    throw new Error(`/api/itinerary/generate expected a 400 validation response, received ${api.response.status}`);
}

console.log(JSON.stringify({
    status: 'ok',
    target: baseUrl.origin,
    version: version.body.version,
    checks: ['version', 'focused_route', 'api_function'],
}));
