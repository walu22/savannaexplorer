/**
 * Notify search engines after deploy.
 * - IndexNow → Bing, Yandex, Naver, Seznam, etc.
 * - Google Search Console sitemap resubmit (optional, needs GSC_SERVICE_ACCOUNT_JSON)
 *
 * Usage: node scripts/submit-search-indexing.mjs [siteUrl]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSign } from 'node:crypto';

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

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

async function getGoogleAccessToken(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64url(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/webmasters',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }));
    const unsigned = `${header}.${claim}`;
    const signer = createSign('RSA-SHA256');
    signer.update(unsigned);
    signer.end();
    const signature = signer.sign(serviceAccount.private_key);
    const jwt = `${unsigned}.${base64url(signature)}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google token exchange failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.access_token;
}

async function submitGoogleSitemap(origin, sitemapUrl) {
    const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        return { skipped: true, reason: 'GSC_SERVICE_ACCOUNT_JSON not set' };
    }

    const serviceAccount = JSON.parse(raw);
    const token = await getGoogleAccessToken(serviceAccount);
    const siteParam = encodeURIComponent(`${origin}/`);
    const feedpath = encodeURIComponent(sitemapUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${siteParam}/sitemaps/${feedpath}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GSC sitemap submit failed (${response.status}): ${text}`);
    }

    return { skipped: false, status: response.status };
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
        const gsc = await submitGoogleSitemap(origin, sitemapUrl);
        if (gsc.skipped) {
            console.log(`GSC: skipped (${gsc.reason})`);
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
