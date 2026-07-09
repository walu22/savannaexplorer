import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderParkFeeTable } from '../../js/lib/park-fees.js';

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
const planningGuides = loadJson('planning-guides.json');
const siteLastReviewed = loadJson('about.json').meta?.lastReviewed || '2026-06';

export const HOME_OG_IMAGE = 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=1200';

export const HOME_META = {
    title: 'Savanna Explorer | Plan Your Southern Africa Trip',
    description: 'Free planning hub for nine Southern Africa countries — country guides, route templates, visa tools, border crossings, national parks, and printable planning guides. Book direct with official sources.',
};

const HUB_SECTIONS = [
    {
        id: 'plan',
        title: 'Travel Tools & Trip Planner',
        description: 'Visa matrix, packing lists, expense tracker, currency converter, and printable trip checklists for Southern Africa self-drive and safari trips.',
        priority: '0.85',
    },
    {
        id: 'guides',
        title: 'Southern Africa Planning Guides',
        description: 'In-depth country planning guides covering where to go, where to stay, best seasons, entry requirements, and self-drive tips — with printable PDFs.',
        priority: '0.85',
    },
    {
        id: 'parks',
        title: 'National Parks & Reserves',
        description: 'Park fees, seasons, gate hours, and official booking links for Kruger, Etosha, Chobe, Okavango, and more across Southern Africa.',
        priority: '0.8',
    },
    {
        id: 'borders',
        title: 'Border Crossings Guide',
        description: 'Documents, fees, hours, and wait times for major Southern Africa land borders — plan self-drive routes between nine countries.',
        priority: '0.8',
    },
    {
        id: 'book-direct',
        title: 'Book Direct — Stays & Operators',
        description: 'Official park reservations, lodge booking pages, and licensed tour operators — no middleman markups, plan and book yourself.',
        priority: '0.75',
    },
    {
        id: 'itineraries',
        title: 'Route Templates & Itineraries',
        description: 'Multi-country route templates with day-by-day planning notes for classic safari, desert, and overland circuits across Southern Africa.',
        priority: '0.8',
    },
    {
        id: 'health',
        title: 'Health & Safety Planning',
        description: 'Malaria zones, vaccinations, travel insurance tips, and emergency numbers for Southern Africa independent travellers.',
        priority: '0.7',
    },
    {
        id: 'transport',
        title: 'Transport & Logistics',
        description: 'Air gateways, self-drive tips, cross-border vehicle rules, and regional transport planning for Southern Africa trips.',
        priority: '0.7',
    },
    {
        id: 'travel-essentials',
        title: 'Travel Essentials',
        description: 'Insurance, road rules, tipping, SIM and data, permits, government advisories, common pitfalls, and packing lists for Southern Africa trips.',
        priority: '0.75',
    },
    {
        id: 'tourism-stats',
        title: 'Southern Africa Tourism Statistics',
        description: 'Visitor arrivals and tourism trends for Namibia, South Africa, Botswana, Zambia, Zimbabwe, and neighbouring countries.',
        priority: '0.65',
    },
];

const COUNTRY_META = {
    'south-africa': { name: 'South Africa', cardImage: '1755251418399-c56a9579858f' },
    namibia: { name: 'Namibia', cardImage: '1772289093245-218447e77b64' },
    botswana: { name: 'Botswana', cardImage: '1547471080-7cc2caa01a7e' },
    zambia: { name: 'Zambia', cardImage: '1679713594549-ec393ce9c909' },
    zimbabwe: { name: 'Zimbabwe', cardImage: '1759164882609-58b00ec3b09a' },
    mozambique: { name: 'Mozambique', cardImage: '1505142468610-359e7d316be0' },
    malawi: { name: 'Malawi', cardImage: '1658221744192-00e3770b8625' },
    lesotho: { name: 'Lesotho', cardImage: '1663527025647-0934ef6d06e5' },
    eswatini: { name: 'Eswatini', cardImage: '1500530855697-b586d89ba3ee' },
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
    const slice = t.slice(0, max - 1);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
    return `${cut}…`;
}

function lastmodFromYm(ym) {
    if (ym && /^\d{4}-\d{2}$/.test(ym)) return `${ym}-01`;
    return new Date().toISOString().slice(0, 10);
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
    ${renderParkFeeTable(park)}
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

export function planningGuidePages(baseUrl) {
    return Object.entries(planningGuides.guides).map(([countryId, guide]) => {
        const meta = getCountryMeta(countryId);
        const path = `/guides/planning/${countryId}`;
        const intro = guide.sections?.[0]?.body || '';
        const description = truncate(intro)
            || `${guide.title} — ${guide.readTime} planning reference for ${meta.name}. Visas, seasons, routes, and official sources.`;
        const title = `${guide.title} | ${SITE_NAME}`;
        const topics = (guide.topics || []).map(t => `<li>${escapeHtml(t)}</li>`).join('');
        const sectionSummaries = (guide.sections || []).slice(0, 4).map(section => {
            const firstPara = section.body.split('\n\n')[0] || '';
            return `<h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(truncate(firstPara, 280))}</p>`;
        }).join('');
        const reviewed = guide.lastVerified || siteLastReviewed;
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/guides">Planning guides</a> › ${escapeHtml(meta.name)}</nav>
    <h1>${escapeHtml(guide.title)}</h1>
    ${reviewedLine(reviewed)}
    <p class="seo-lead">${escapeHtml(guide.readTime)} read · ${escapeHtml(meta.name)} · ${(guide.topics || []).length} topics</p>
    <h2>Topics covered</h2>
    <ul>${topics}</ul>
    ${sectionSummaries}
    <p><a href="${path}">Open the full ${escapeHtml(guide.title)}</a> on Savanna Explorer — printable PDF available.</p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: cardImageUrl(countryId),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: guide.title,
                description,
                url: `${siteUrl(baseUrl)}${path}`,
                about: meta.name,
                ...(isoReviewDate(reviewed) && { dateModified: isoReviewDate(reviewed) }),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: 'Planning guides', path: '/guides' },
                { name: guide.title, path },
            ],
            bodyHtml,
        };
    });
}

export function hubPages(baseUrl) {
    return HUB_SECTIONS.map(hub => {
        const path = `/${hub.id}`;
        const title = `${hub.title} | ${SITE_NAME}`;
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › ${escapeHtml(hub.title)}</nav>
    <h1>${escapeHtml(hub.title)}</h1>
    ${reviewedLine(siteLastReviewed)}
    <p class="seo-lead">${escapeHtml(hub.description)}</p>
    <p><a href="${path}">Open ${escapeHtml(hub.title)}</a> on Savanna Explorer.</p>
  </article>
</main>`;

        return {
            path,
            title,
            description: hub.description,
            ogType: 'website',
            image: HOME_OG_IMAGE,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: hub.title,
                description: hub.description,
                url: `${siteUrl(baseUrl)}${path}`,
                ...(isoReviewDate(siteLastReviewed) && { dateModified: isoReviewDate(siteLastReviewed) }),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: hub.title, path },
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
        ...planningGuidePages(baseUrl),
        ...hubPages(baseUrl),
    ];
}

export function sitemapEntries(baseUrl) {
    const origin = siteUrl(baseUrl);
    const today = new Date().toISOString().slice(0, 10);
    const entry = (loc, priority, changefreq = 'monthly', lastmod = today) => ({ loc, priority, changefreq, lastmod });

    return [
        entry(`${origin}/`, '1.0', 'weekly', lastmodFromYm(siteLastReviewed)),
        ...Object.keys(countries).map(id => entry(
            `${origin}/countries/${id}`,
            '0.9',
            'monthly',
            lastmodFromYm(countryResources[id]?.lastVerified || siteLastReviewed),
        )),
        ...parks.map(p => entry(`${origin}/parks/${p.id}`, '0.8', 'monthly', lastmodFromYm(p.lastVerified))),
        ...borders.map(b => entry(`${origin}/borders/${b.id}`, '0.8', 'monthly', lastmodFromYm(b.lastVerified))),
        ...Object.keys(itineraries).map(id => entry(`${origin}/itineraries/${id}`, '0.8', 'monthly', lastmodFromYm(siteLastReviewed))),
        ...listings.map(item => {
            const segment = item.kind === 'stay' ? 'stays' : 'operators';
            return entry(`${origin}/${segment}/${item.id}`, '0.75', 'monthly', lastmodFromYm(item.lastVerified));
        }),
        ...Object.entries(planningGuides.guides).map(([id, guide]) => entry(
            `${origin}/guides/planning/${id}`,
            '0.85',
            'monthly',
            lastmodFromYm(guide.lastVerified || siteLastReviewed),
        )),
        ...HUB_SECTIONS.map(hub => entry(
            `${origin}/${hub.id}`,
            hub.priority || '0.7',
            'weekly',
            lastmodFromYm(siteLastReviewed),
        )),
    ];
}
