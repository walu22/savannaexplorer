/**
 * Post-build prerender: write per-route index.html with correct meta + crawlable content.
 * Run after `vite build` (see package.json postbuild).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { allSeoPages, hubPages, siteUrl } from './lib/seo-data.mjs';

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

function findElement(html, tag, matcher) {
    const openingTags = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    let opening;
    while ((opening = openingTags.exec(html))) {
        if (!matcher(opening[0])) continue;
        const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
        tags.lastIndex = opening.index;
        let depth = 0;
        let token;
        while ((token = tags.exec(html))) {
            if (token[0].startsWith(`</${tag}`)) depth -= 1;
            else depth += 1;
            if (depth === 0) return { start: opening.index, end: tags.lastIndex, html: html.slice(opening.index, tags.lastIndex) };
        }
    }
    return null;
}

function elementById(html, id, tag = 'section') {
    return findElement(html, tag, opening => new RegExp(`\\bid="${id}"`, 'i').test(opening));
}

function sectionByClass(html, className) {
    return findElement(html, 'section', opening => {
        const match = opening.match(/\bclass="([^"]*)"/i);
        return match?.[1].split(/\s+/).includes(className);
    });
}

function replaceAppMain(html, sections) {
    const mainStart = html.indexOf('<main id="main-content"');
    if (mainStart < 0) return html;
    const openingEnd = html.indexOf('>', mainStart) + 1;
    const mainEnd = html.indexOf('</main>', openingEnd);
    if (!openingEnd || mainEnd < 0) return html;
    return `${html.slice(0, openingEnd)}\n${sections.filter(Boolean).join('\n')}\n${html.slice(mainEnd)}`;
}

function removeElement(html, id, tag) {
    const element = elementById(html, id, tag);
    return element ? `${html.slice(0, element.start)}${html.slice(element.end)}` : html;
}

const HUB_SECTION_TARGETS = {
    routes: 'route-explorer',
    'my-safari': 'plan',
    expenses: 'plan',
};

function pruneHubHtml(html, path) {
    const sectionId = HUB_SECTION_TARGETS[path] || path;
    const section = elementById(html, sectionId)?.html;
    if (!section) return html;
    let output = replaceAppMain(html, [section]);
    output = removeElement(output, 'country-detail-view', 'section');
    if (path !== 'itineraries') output = removeElement(output, 'itinerary-modal', 'div');
    if (path !== 'gastronomy') output = removeElement(output, 'marketplace-modal', 'div');
    if (!['my-safari', 'plan'].includes(path)) output = removeElement(output, 'ai-planner-sidebar', 'div');
    return output;
}

function pruneHomepageHtml(html) {
    const sections = [
        elementById(html, 'route-explorer')?.html,
        elementById(html, 'destinations')?.html,
        sectionByClass(html, 'service-section')?.html,
        sectionByClass(html, 'home-my-safari')?.html,
        sectionByClass(html, 'home-essential-tools')?.html,
        sectionByClass(html, 'hub-notice')?.html,
        sectionByClass(html, 'newsletter')?.html,
    ];
    let output = replaceAppMain(html, sections);
    output = removeElement(output, 'country-detail-view', 'section');
    output = removeElement(output, 'itinerary-modal', 'div');
    output = removeElement(output, 'marketplace-modal', 'div');
    return output;
}

function buildPrivateEditorialHtml(baseHtml) {
    const title = 'Editorial Workspace | Savanna Explorer';
    const description = 'Restricted editorial workspace for Savanna Explorer content operations.';
    const canonical = `${baseUrl}/editorial`;
    let html = pruneHubHtml(baseHtml, 'editorial');
    html = setTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
    html = upsertMeta(html, 'name', 'description', description);
    html = upsertMeta(html, 'name', 'robots', 'noindex,nofollow,noarchive');
    html = upsertMeta(html, 'property', 'og:title', title, true);
    html = upsertMeta(html, 'property', 'og:description', description, true);
    html = upsertMeta(html, 'property', 'og:url', canonical, true);
    html = upsertMeta(html, 'name', 'twitter:title', title);
    html = upsertMeta(html, 'name', 'twitter:description', description);
    html = html.replace(
        /<link rel="canonical" id="canonical-link" href="[^"]*">/,
        `<link rel="canonical" id="canonical-link" href="${canonical}">`,
    );
    return removeElement(html, 'structured-data', 'script');
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

// Every public hub route gets a physical HTML entry before the SPA fallback.
const hubFallbackPages = hubPages(baseUrl);
for (const page of hubFallbackPages) {
    const section = page.path.replace(/^\//, '');
    const outPath = resolve(distDir, section, 'index.html');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, pruneHubHtml(buildPageHtml(template, page), section), 'utf8');
}
console.log(`Wrote ${hubFallbackPages.length} hub SPA fallbacks.`);

// The restricted workspace needs a physical SPA entry for direct loads, but it
// deliberately stays outside hubPages/allSeoPages so it never enters the sitemap.
const editorialPath = resolve(distDir, 'editorial', 'index.html');
mkdirSync(dirname(editorialPath), { recursive: true });
writeFileSync(editorialPath, buildPrivateEditorialHtml(template), 'utf8');
console.log('Wrote private, no-index editorial SPA fallback.');

writeFileSync(templatePath, pruneHomepageHtml(template), 'utf8');
console.log('Pruned the homepage to its seven visible sections.');
