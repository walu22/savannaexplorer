/**
 * Notify search engines after deploy.
 * - IndexNow → Bing, Yandex, Naver, Seznam, etc.
 * - Google Search Console sitemap resubmit (optional, needs GSC_SERVICE_ACCOUNT_JSON)
 *
 * Usage: node scripts/submit-search-indexing.mjs [siteUrl]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    getGoogleAccessToken,
    parseServiceAccount,
    submitGoogleSitemap,
} from './lib/gsc-api.mjs';

const INDEXNOW_KEY = '1808bec069c7c448b094bee7156e9d57';
const BATCH_SIZE = 10000;

const PRIORITY_PATHS = [
    '/',
    '/countries/namibia',
    '/countries/south-africa',
    '/countries/botswana',
    '/parks/kruger',
    '/parks/etosha',
    '/borders/vioolsdrift',
    '/itineraries/desert-to-delta',
    '/stays/sanparks-reservations',
    '/guides/planning/namibia',
    '/guides/planning/south-africa',
    '/plan',
    '/guides',
];

function loadEnv() {
    const envPath = resolve(process.cwd(), '.env');
    try {
        for (const line of readFileSync(envPath, 'utf8').split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            const value = trimmed.slice(eq + 1).trim();
            if (!process.env[key]) process.env[key] = value;
        }
    } catch {
        // optional
    }
}

function siteOrigin(input) {
    return (input || process.env.VITE_SITE_URL || 'https://savannaexplorer.com').replace(/\/$/, '');
}

function parseSitemapUrls(xml, origin) {
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map(match => match[1].trim())
        .filter(url => url.startsWith(origin));
}

function uniqueUrls(urls) {
    return [...new Set(urls)];
}

async function submitIndexNow(origin, urls) {
    const host = new URL(origin).host;
    const keyLocation = `${origin}/${INDEXNOW_KEY}.txt`;
    const endpoints = [
        'https://api.indexnow.org/indexnow',
        'https://www.bing.com/indexnow',
    ];

    const results = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const payload = { host, key: INDEXNOW_KEY, keyLocation, urlList: batch };

        for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(payload),
            });
            results.push({
                endpoint,
                batch: `${i + 1}-${i + batch.length}`,
                status: response.status,
                ok: response.ok || response.status === 202,
            });
        }
    }

    return results;
}

async function submitGoogleSitemapFromEnv(origin, sitemapUrl) {
    const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        return { skipped: true, reason: 'GSC_SERVICE_ACCOUNT_JSON not set' };
    }

    const serviceAccount = parseServiceAccount(raw);
    const token = await getGoogleAccessToken(serviceAccount);
    const result = await submitGoogleSitemap(origin, sitemapUrl, token);
    return { skipped: false, status: result.status };
}

async function verifyIndexNowKey(origin) {
    const response = await fetch(`${origin}/${INDEXNOW_KEY}.txt`);
    if (!response.ok) {
        throw new Error(`IndexNow key file missing at ${origin}/${INDEXNOW_KEY}.txt (${response.status})`);
    }
    const body = (await response.text()).trim();
    if (body !== INDEXNOW_KEY) {
        throw new Error('IndexNow key file content mismatch');
    }
}

async function main() {
    loadEnv();
    const origin = siteOrigin(process.argv[2]);
    const sitemapUrl = `${origin}/sitemap.xml`;

    console.log(`Submitting search indexing for ${origin}`);

    await verifyIndexNowKey(origin);

    const sitemapXml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');
    const sitemapUrls = parseSitemapUrls(sitemapXml, origin);
    const priorityUrls = PRIORITY_PATHS.map(path => `${origin}${path === '/' ? '/' : path}`);
    const allUrls = uniqueUrls([...priorityUrls, ...sitemapUrls]);

    console.log(`IndexNow: submitting ${allUrls.length} URLs (${priorityUrls.length} priority)`);
    const indexNowResults = await submitIndexNow(origin, allUrls);
    for (const result of indexNowResults) {
        const label = result.ok ? 'OK' : 'FAIL';
        console.log(`  [${label}] ${result.endpoint} batch ${result.batch} → HTTP ${result.status}`);
    }

    const failed = indexNowResults.filter(r => !r.ok);
    if (failed.length) {
        throw new Error('IndexNow submission failed for one or more endpoints');
    }

    try {
        const gsc = await submitGoogleSitemapFromEnv(origin, sitemapUrl);
        if (gsc.skipped) {
            console.log(`GSC: skipped (${gsc.reason})`);
            console.log('GSC: run npm run setup:gsc -- --file ./gsc-key.json --github-secret');
        } else {
            console.log(`GSC: sitemap resubmitted → HTTP ${gsc.status}`);
        }
    } catch (error) {
        console.warn(`GSC: ${error.message}`);
    }

    console.log('Search indexing submission complete.');
}

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});
