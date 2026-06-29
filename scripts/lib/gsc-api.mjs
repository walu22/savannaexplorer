import { createSign } from 'node:crypto';

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters';

export function parseServiceAccount(raw) {
    if (!raw?.trim()) {
        throw new Error('Service account JSON is empty');
    }

    const serviceAccount = JSON.parse(raw);
    for (const field of ['client_email', 'private_key', 'token_uri']) {
        if (!serviceAccount[field]) {
            throw new Error(`Service account JSON missing "${field}"`);
        }
    }

    return serviceAccount;
}

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

export async function getGoogleAccessToken(serviceAccount, scope = WEBMASTERS_SCOPE) {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64url(JSON.stringify({
        iss: serviceAccount.client_email,
        scope,
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

export async function listSearchConsoleSites(token) {
    const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GSC sites.list failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data.siteEntry || [];
}

export async function submitGoogleSitemap(origin, sitemapUrl, token) {
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

    return { status: response.status };
}

export async function getGoogleSitemap(origin, sitemapUrl, token) {
    const siteParam = encodeURIComponent(`${origin}/`);
    const feedpath = encodeURIComponent(sitemapUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${siteParam}/sitemaps/${feedpath}`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GSC sitemap get failed (${response.status}): ${text}`);
    }

    return response.json();
}

export function siteHasAccess(sites, origin) {
    const normalized = `${origin.replace(/\/$/, '')}/`;
    return sites.some(site => site.siteUrl === normalized || site.siteUrl === origin);
}
