/**
 * Post-build prerender: write per-route index.html with correct meta + crawlable content.
 * Run after `vite build` (see package.json postbuild).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { allSeoPages, siteUrl } from './lib/seo-data.mjs';

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
        // optional .env
    }
}

loadEnv();

const baseUrl = siteUrl(process.env.VITE_SITE_URL);
const distDir = resolve(process.cwd(), 'dist');
const templatePath = resolve(distDir, 'index.html');
const template = readFileSync(templatePath, 'utf8');

function setTag(html, pattern, replacement) {
    return html.replace(pattern, replacement);
}

function upsertMeta(html, attr, key, content, isProperty = false) {
    const attrName = isProperty ? 'property' : 'name';
    const re = new RegExp(`<meta ${attrName}="${key}"[^>]*>`, 'i');
    const tag = `<meta ${attrName}="${key}" content="${content.replace(/"/g, '&quot;')}">`;
    if (re.test(html)) return html.replace(re, tag);
    return html.replace('</head>', `    ${tag}\n</head>`);
}

function buildPageHtml(baseHtml, page) {
    const canonical = `${baseUrl}${page.path}`;
    let html = baseHtml;

    html = setTag(html, /<title>[^<]*<\/title>/, `<title>${page.title.replace(/</g, '&lt;')}</title>`);
    html = upsertMeta(html, 'name', 'description', page.description);
    html = upsertMeta(html, 'property', 'og:title', page.title, true);
    html = upsertMeta(html, 'property', 'og:description', page.description, true);
    html = upsertMeta(html, 'property', 'og:type', page.ogType || 'article', true);
    html = upsertMeta(html, 'property', 'og:url', canonical, true);
    html = upsertMeta(html, 'name', 'twitter:title', page.title);
    html = upsertMeta(html, 'name', 'twitter:description', page.description);
    if (page.image) {
        html = upsertMeta(html, 'property', 'og:image', page.image, true);
        html = upsertMeta(html, 'name', 'twitter:image', page.image);
    }

    html = html.replace(
        /<link rel="canonical" id="canonical-link" href="[^"]*">/,
        `<link rel="canonical" id="canonical-link" href="${canonical}">`,
    );

    const breadcrumbLd = page.breadcrumb ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: page.breadcrumb.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: `${baseUrl}${item.path}`,
        })),
    } : null;

    const jsonLd = breadcrumbLd
        ? [page.jsonLd, breadcrumbLd]
        : [page.jsonLd];

    const ldScript = `<script type="application/ld+json" id="structured-data">${JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd)}</script>`;
    if (html.includes('id="structured-data"')) {
        html = html.replace(/<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/, ldScript);
    } else {
        html = html.replace('</head>', `    ${ldScript}\n</head>`);
    }

    html = html.replace('<body class="site-v2">', `<body class="site-v2">\n${page.bodyHtml}`);

    return html;
}

const pages = allSeoPages(baseUrl);
let written = 0;

for (const page of pages) {
    const outPath = resolve(distDir, page.path.replace(/^\//, ''), 'index.html');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, buildPageHtml(template, page), 'utf8');
    written += 1;
}

console.log(`Prerendered ${written} SEO pages into dist/ (${baseUrl})`);
