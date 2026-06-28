import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function loadJson(name) {
    return JSON.parse(readFileSync(resolve(root, 'data', name), 'utf8'));
}

const countries = loadJson('countries.json');
const countryDepth = loadJson('country-depth.json');
const parks = loadJson('parks.json');
const borders = loadJson('borders.json');
const itineraries = loadJson('itineraries.json');
const listings = loadJson('stays-operators.json');
const countryResources = loadJson('country-resources.json');
const siteLastReviewed = loadJson('about.json').meta?.lastReviewed || '2026-06';

const COUNTRY_META = {
    'south-africa': { name: 'South Africa', cardImage: '1547448415-e9f5b28e570d' },
    namibia: { name: 'Namibia', cardImage: '1772289093245-218447e77b64' },
    botswana: { name: 'Botswana', cardImage: '1547471080-7cc2caa01a7e' },
    zambia: { name: 'Zambia', cardImage: '1679713594549-ec393ce9c909' },
    zimbabwe: { name: 'Zimbabwe', cardImage: '1516026672322-bc52d61a55d5' },
    mozambique: { name: 'Mozambique', cardImage: '1505142468610-359e7d316be0' },
    malawi: { name: 'Malawi', cardImage: '1658221744192-00e3770b8625' },
    lesotho: { name: 'Lesotho', cardImage: '1541414779316-956a5084c0d4' },
    eswatini: { name: 'Eswatini', cardImage: '1518709766631-a6a7f45921c3' },
};

function getCountryMeta(countryId) {
    return COUNTRY_META[countryId] || { name: countryId, cardImage: '' };
}

function cardImageUrl(countryId) {
    const meta = getCountryMeta(countryId);
    if (meta.cardImage) {
        return `https://images.unsplash.com/photo-${meta.cardImage}?auto=format&fit=crop&q=80&w=800`;
    }
    return 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=800';
}

function getFullCountryData(countryId) {
    const base = countries[countryId];
    const ext = countryDepth[countryId];
    if (!base) return null;
    if (!ext) return { ...base, about: { ...base.about, summary: '', gettingThere: '', economy: '' } };

    const mergedSpots = [...base.spots];
    for (const spot of ext.additionalSpots || []) {
        const idx = mergedSpots.findIndex(s => s.name === spot.name);
        if (idx >= 0) mergedSpots[idx] = { ...mergedSpots[idx], ...spot };
        else mergedSpots.push(spot);
    }

    return {
        ...base,
        about: {
            ...base.about,
            summary: ext.summary || '',
            gettingThere: ext.gettingThere || '',
            economy: ext.economy || '',
            history: ext.historyOverride || base.about.history,
            geo: ext.geoOverride || base.about.geo,
            people: ext.peopleOverride || base.about.people,
        },
        spots: mergedSpots,
    };
}

const SITE_NAME = 'Savanna Explorer';

export function siteUrl(base) {
    return (base || 'https://savannaexplorer.com').replace(/\/$/, '');
}

function truncate(text, max = 155) {
    const t = (text || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function formatReviewDate(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return '';
    const [year, month] = ym.split('-');
    const idx = parseInt(month, 10) - 1;
    return `${MONTH_NAMES[idx]} ${year}`;
}

function reviewedLine(ym) {
    if (!ym) return '';
    const iso = /^\d{4}-\d{2}$/.test(ym) ? `${ym}-01` : ym;
    const label = formatReviewDate(ym);
    if (!label) return '';
    return `<p class="last-reviewed"><time datetime="${iso}">Last reviewed ${label}</time></p>`;
}

function isoReviewDate(ym) {
    return ym && /^\d{4}-\d{2}$/.test(ym) ? `${ym}-01` : undefined;
}

export function countryPages(baseUrl) {
    return Object.keys(countries).map(id => {
        const data = getFullCountryData(id);
        const path = `/countries/${id}`;
        const summary = data.about?.summary || data.tagline || '';
        const description = truncate(summary)
            || `Travel guide for ${data.name} — visas, parks, routes, and official planning links.`;
        const title = `${data.name} Travel Guide | ${SITE_NAME}`;
        const spots = data.spots.slice(0, 6).map(s => `<li><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.desc)}</li>`).join('');
        const reviewed = countryResources[id]?.lastVerified || siteLastReviewed;
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › ${escapeHtml(data.name)}</nav>
    <h1>${escapeHtml(data.name)} Travel Guide</h1>
    ${reviewedLine(reviewed)}
    <p class="seo-lead">${escapeHtml(data.tagline || summary)}</p>
    ${summary ? `<p>${escapeHtml(summary)}</p>` : ''}
    <h2>Landscapes &amp; geography</h2>
    <p>${escapeHtml(data.about?.geo || '')}</p>
    <h2>Top places to visit</h2>
    <ul>${spots}</ul>
    <p><a href="${path}">Open the full ${escapeHtml(data.name)} planning guide</a> — visas, borders, parks, and route templates.</p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: cardImageUrl(id),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'TouristDestination',
                name: data.name,
                description,
                url: `${siteUrl(baseUrl)}${path}`,
                touristType: 'Independent traveller',
                ...(isoReviewDate(reviewed) && { dateModified: isoReviewDate(reviewed) }),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: data.name, path },
            ],
            bodyHtml,
        };
    });
}

export function parkPages(baseUrl) {
    return parks.map(park => {
        const meta = getCountryMeta(park.country);
        const path = `/parks/${park.id}`;
        const title = `${park.name} | ${SITE_NAME}`;
        const description = truncate(`${park.description} Best season: ${park.bestSeason}. Fees: ${park.fees}.`);
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/countries/${park.country}">${escapeHtml(meta.name)}</a> › ${escapeHtml(park.name)}</nav>
    <h1>${escapeHtml(park.name)}</h1>
    ${reviewedLine(park.lastVerified)}
    <p class="seo-lead">${escapeHtml(park.description)}</p>
    <ul>
      <li><strong>Country:</strong> ${escapeHtml(meta.name)}</li>
      <li><strong>Best season:</strong> ${escapeHtml(park.bestSeason)}</li>
      <li><strong>Fees:</strong> ${escapeHtml(park.fees)}</li>
      ${park.gateHours ? `<li><strong>Gate hours:</strong> ${escapeHtml(park.gateHours)}</li>` : ''}
    </ul>
    ${park.feeDetail ? `<p>${escapeHtml(park.feeDetail)}</p>` : ''}
    <p><a href="${path}">View ${escapeHtml(park.name)} on Savanna Explorer</a></p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: cardImageUrl(park.country),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'TouristAttraction',
                name: park.name,
                description: park.description,
                url: `${siteUrl(baseUrl)}${path}`,
                ...(isoReviewDate(park.lastVerified) && { dateModified: isoReviewDate(park.lastVerified) }),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: meta.name, path: `/countries/${park.country}` },
                { name: park.name, path },
            ],
            bodyHtml,
        };
    });
}

export function borderPages(baseUrl) {
    return borders.map(border => {
        const path = `/borders/${border.id}`;
        const countryNames = border.countries.map(id => getCountryMeta(id).name).join(' ↔ ');
        const title = `${border.name} Border Crossing | ${SITE_NAME}`;
        const description = truncate(`${border.name}: ${border.route}. Hours ${border.hours}. Wait ${border.typicalWait}. Documents and fees for ${countryNames}.`);
        const docs = border.documents.map(d => `<li>${escapeHtml(d)}</li>`).join('');
        const tips = border.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('');
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › Border crossings › ${escapeHtml(border.name)}</nav>
    <h1>${escapeHtml(border.name)}</h1>
    ${reviewedLine(border.lastVerified)}
    <p class="seo-lead">${escapeHtml(border.route)} — ${escapeHtml(countryNames)}</p>
    <ul>
      <li><strong>Hours:</strong> ${escapeHtml(border.hours)}</li>
      <li><strong>Typical wait:</strong> ${escapeHtml(border.typicalWait)}</li>
      <li><strong>Vehicle crossing:</strong> ${border.vehicleCrossing ? 'Yes' : 'Foot only'}</li>
      <li><strong>Fees:</strong> ${escapeHtml(border.fees)}</li>
    </ul>
    <h2>Documents required</h2>
    <ul>${docs}</ul>
    <h2>Local tips</h2>
    <ul>${tips}</ul>
    <p><a href="${path}">View ${escapeHtml(border.name)} crossing guide</a></p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: cardImageUrl(border.countries[0]),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: title,
                description,
                url: `${siteUrl(baseUrl)}${path}`,
                ...(isoReviewDate(border.lastVerified) && { dateModified: isoReviewDate(border.lastVerified) }),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: 'Border crossings', path: '/#borders' },
                { name: border.name, path },
            ],
            bodyHtml,
        };
    });
}

export function itineraryPages(baseUrl) {
    return Object.entries(itineraries).map(([id, data]) => {
        const path = `/itineraries/${id}`;
        const title = `${data.title} Route Template | ${SITE_NAME}`;
        const description = truncate(`${data.description} ${data.duration}. ${data.countries}.`);
        const highlights = (data.highlights || []).slice(0, 5).map(h => `<li>${escapeHtml(h)}</li>`).join('');
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › Route templates › ${escapeHtml(data.title)}</nav>
    <h1>${escapeHtml(data.title)}</h1>
    ${reviewedLine(siteLastReviewed)}
    <p class="seo-lead">${escapeHtml(data.type)} · ${escapeHtml(data.duration)} · ${escapeHtml(data.countries)}</p>
    <p>${escapeHtml(data.description)}</p>
    <h2>Highlights</h2>
    <ul>${highlights}</ul>
    <p><em>Planning template — not a package or quote.</em></p>
    <p><a href="${path}">View full ${escapeHtml(data.title)} itinerary</a></p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=1200',
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Trip',
                name: data.title,
                description: data.description,
                url: `${siteUrl(baseUrl)}${path}`,
                ...(isoReviewDate(siteLastReviewed) && { dateModified: isoReviewDate(siteLastReviewed) }),
                itinerary: (data.days || []).map(day => ({
                    '@type': 'ItemList',
                    name: day.title,
                    description: day.narrative,
                })),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: 'Route templates', path: '/#itineraries' },
                { name: data.title, path },
            ],
            bodyHtml,
        };
    });
}

export function listingPages(baseUrl) {
    return listings.map(item => {
        const segment = item.kind === 'stay' ? 'stays' : 'operators';
        const path = `/${segment}/${item.id}`;
        const meta = getCountryMeta(item.country);
        const kindLabel = item.kind === 'stay' ? 'Stay & lodge directory' : 'Licensed operator directory';
        const title = `${item.title} | ${SITE_NAME}`;
        const description = truncate(`${item.description} ${kindLabel} for ${meta.name}. Verified ${item.lastVerified}.`);
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/#book-direct">Book direct</a> › ${escapeHtml(item.title)}</nav>
    <h1>${escapeHtml(item.title)}</h1>
    ${reviewedLine(item.lastVerified)}
    <p class="seo-lead">${escapeHtml(item.region)} · ${escapeHtml(meta.name)}</p>
    <p>${escapeHtml(item.description)}</p>
    <p><strong>Planning tip:</strong> ${escapeHtml(item.planningTip)}</p>
    <p><a href="${item.url}" rel="noopener">Official link: ${escapeHtml(item.linkLabel)}</a></p>
    <p><a href="${path}">View on Savanna Explorer</a></p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: cardImageUrl(item.country),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': item.kind === 'stay' ? 'LodgingBusiness' : 'TravelAgency',
                name: item.title,
                description: item.description,
                url: `${siteUrl(baseUrl)}${path}`,
                sameAs: item.url,
                ...(isoReviewDate(item.lastVerified) && { dateModified: isoReviewDate(item.lastVerified) }),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: 'Book direct', path: '/#book-direct' },
                { name: item.title, path },
            ],
            bodyHtml,
        };
    });
}

export function allSeoPages(baseUrl) {
    return [
        ...countryPages(baseUrl),
        ...parkPages(baseUrl),
        ...borderPages(baseUrl),
        ...itineraryPages(baseUrl),
        ...listingPages(baseUrl),
    ];
}

export function sitemapEntries(baseUrl) {
    const origin = siteUrl(baseUrl);
    const today = new Date().toISOString().slice(0, 10);
    const entry = (loc, priority, changefreq = 'monthly') => ({ loc, priority, changefreq, lastmod: today });

    return [
        entry(`${origin}/`, '1.0', 'weekly'),
        ...Object.keys(countries).map(id => entry(`${origin}/countries/${id}`, '0.9')),
        ...parks.map(p => entry(`${origin}/parks/${p.id}`, '0.8')),
        ...borders.map(b => entry(`${origin}/borders/${b.id}`, '0.8')),
        ...Object.keys(itineraries).map(id => entry(`${origin}/itineraries/${id}`, '0.8')),
        ...listings.map(item => {
            const segment = item.kind === 'stay' ? 'stays' : 'operators';
            return entry(`${origin}/${segment}/${item.id}`, '0.75');
        }),
    ];
}
