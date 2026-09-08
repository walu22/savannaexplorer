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
const listings = loadJson('stays-operators.json');
const countryResources = loadJson('country-resources.json');
const planningGuides = loadJson('planning-guides.json');
const routeCollection = loadJson('route-collections.json');
const siteLastReviewed = loadJson('about.json').meta?.lastReviewed || '2026-06';

function latestReviewed(values, fallback = siteLastReviewed) {
    return values.filter(Boolean).sort().at(-1) || fallback;
}

const hubLastReviewed = {
    parks: latestReviewed(parks.map(park => park.lastVerified)),
    borders: latestReviewed(borders.map(border => border.lastVerified)),
};

export const HOME_OG_IMAGE = 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=1200';

export const HOME_META = {
    title: 'Savanna Explorer | Plan Your Southern Africa Trip',
    description: 'Free planning hub for nine Southern Africa countries — country guides, route templates, visa tools, border crossings, national parks, and printable planning guides. Book direct with official sources.',
};

const HUB_SECTIONS = [
    {
        id: 'routes',
        title: 'Southern Africa Route Explorer',
        description: 'Compare researched road-trip and safari routes across nine Southern Africa countries, then save a route to your personal trip workspace.',
        priority: '0.9',
    },
    {
        id: 'my-safari',
        title: 'My Safari Trip Planner',
        description: 'Build your Southern Africa trip in one place with saved routes, dates, countries, notes, checklists, and planning progress.',
        priority: '0.85',
    },
    {
        id: 'cost-estimator',
        title: 'Southern Africa Trip Cost Estimator',
        description: 'Estimate accommodation, transport, park fees, food, and other costs for an independent Southern Africa journey.',
        priority: '0.7',
    },
    { id: 'expenses', title: 'Safari Expense Tracker', description: 'Track accommodation, transport, park, food, fuel, and activity spending against your selected My Safari trip.', priority: '0.65' },
    { id: 'destinations', title: 'Southern Africa Destinations', description: 'Explore nine Southern Africa countries with practical travel highlights, route ideas, wildlife areas, and independent planning guides.', priority: '0.85' },
    { id: 'top-destinations', title: 'Where Should I Go in Southern Africa?', description: 'Compare nine Southern African countries by travel month, interests, trip length, budget, pace, driving comfort, and researched route coverage.', priority: '0.75' },
    { id: 'experiences', title: 'Southern Africa Experience Finder', description: 'Compare wildlife, landscape, coast, active, cultural, food, and road-trip ideas across nine Southern African countries without paid rankings or invented ratings.', priority: '0.7' },
    { id: 'cultures', title: 'Responsible Community Travel in Southern Africa', description: 'Plan respectful local experiences with practical guidance on community benefit, consent, photography, language, and registered local guides.', priority: '0.7' },
    { id: 'gastronomy', title: 'Southern Africa Food & Market Planner', description: 'Plan food experiences across nine Southern African countries with dietary questions, market etiquette, safer-food guidance, route ideas, and official sources.', priority: '0.65' },
    { id: 'news', title: 'Verified Southern Africa Travel Updates', description: 'Current, source-linked entry-rule and event updates for Southern Africa, each with a review date and automatic expiry.', priority: '0.65' },
    { id: 'embassies', title: 'Embassies & Foreign Missions', description: 'Find foreign-mission and consular planning information for travellers across Southern Africa.', priority: '0.65' },
    { id: 'events', title: 'Southern Africa Events & Seasonal Planner', description: 'Find source-checked festivals and regional events by trip date, plus clearly separated seasonal wildlife planning across Southern Africa.', priority: '0.65' },
    { id: 'packing-list', title: 'Safari Packing List Builder', description: 'Build a practical Southern Africa packing list based on your travel month and trip style.', priority: '0.7' },
    { id: 'phrasebook', title: 'Essential Southern Africa Phrasebook', description: 'Learn useful greetings and travel phrases for connecting respectfully with people across Southern Africa.', priority: '0.65' },
    { id: 'campsites', title: 'Southern Africa Campsite & Overlander Planner', description: 'Compare reviewed campsites across nine Southern African countries by road access, vehicle needs, setting, facilities and booking source.', priority: '0.7' },
    { id: 'safari-bingo', title: 'Southern Africa Safari Bingo', description: 'Track wildlife sightings and make family safari drives more engaging with a printable safari bingo game.', priority: '0.6' },
    { id: 'about', title: 'About Savanna Explorer', description: 'Learn how Savanna Explorer researches, reviews, and presents independent Southern Africa travel-planning information.', priority: '0.5' },
    { id: 'faq', title: 'Southern Africa Travel FAQ', description: 'Answers to common questions about visas, seasons, safety, routes, parks, and independent travel in Southern Africa.', priority: '0.6' },
    { id: 'contact', title: 'Contact Savanna Explorer', description: 'Contact Savanna Explorer with corrections, research leads, partnership questions, or feedback about the travel-planning site.', priority: '0.4' },
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
        description: 'Reviewed hours, document guidance, official sources, and practical cautions for major Southern Africa land borders across nine countries.',
        priority: '0.8',
    },
    {
        id: 'book-direct',
        title: 'Book Direct — Stays & Operators',
        description: 'Official park reservations, lodge booking pages, and licensed tour operators — no middleman markups, plan and book yourself.',
        priority: '0.75',
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
        description: 'Air gateways, self-drive rentals, ZINARA and RTSA border fees, vet import rules, cross-border letters, and regional transport planning for Southern Africa trips.',
        priority: '0.7',
    },
    {
        id: 'travel-essentials',
        title: 'Travel Essentials',
        description: 'Insurance, road rules, tipping, SIM and data, permits, government advisories, common pitfalls, and packing lists for Southern Africa trips.',
        priority: '0.75',
    },
    {
        id: 'planning-checklist',
        title: 'Free Self-Drive Planning Checklist',
        description: 'Download a printable Southern Africa cross-border checklist with safari packing essentials and official resource links — free PDF for independent travellers.',
        priority: '0.8',
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
    if (ym && /^\d{4}-\d{2}-\d{2}$/.test(ym)) return ym;
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

function formatReviewDate(value) {
    if (!value || !/^\d{4}-\d{2}(?:-\d{2})?$/.test(value)) return '';
    const [year, month, day] = value.split('-');
    const idx = parseInt(month, 10) - 1;
    if (idx < 0 || idx > 11) return '';
    return day
        ? `${MONTH_NAMES[idx]} ${parseInt(day, 10)}, ${year}`
        : `${MONTH_NAMES[idx]} ${year}`;
}

function reviewedLine(ym) {
    if (!ym) return '';
    const iso = /^\d{4}-\d{2}$/.test(ym) ? `${ym}-01` : ym;
    const label = formatReviewDate(ym);
    if (!label) return '';
    return `<p class="last-reviewed"><time datetime="${iso}">Last reviewed ${label}</time></p>`;
}

function isoReviewDate(value) {
    if (value && /^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
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

export function routePages(baseUrl) {
    return routeCollection.routes.map(route => {
        const path = `/routes/${route.id}`;
        const countries = route.countryIds.map(id => getCountryMeta(id).name).join(', ');
        const title = `${route.title} Road Trip | ${SITE_NAME}`;
        const description = truncate(`${route.promise} ${route.duration.label}. ${route.vehicle.label}. Best season: ${route.bestSeason.label}.`);
        const stops = route.stops.map((stop, index) => `<li><strong>${index + 1}. ${escapeHtml(stop.name)}</strong> — ${escapeHtml(stop.summary)}</li>`).join('');
        const phases = route.phases.map(phase => `<li><strong>${escapeHtml(phase.dayStart === phase.dayEnd ? `Day ${phase.dayStart}` : `Days ${phase.dayStart}–${phase.dayEnd}`)}: ${escapeHtml(phase.title)}</strong> — ${escapeHtml(phase.summary)}</li>`).join('');
        const warnings = route.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('');
        const sources = route.officialSources.map(source => `<li><a href="${escapeHtml(source.url)}" rel="noopener">${escapeHtml(source.label)}</a></li>`).join('');
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/#route-explorer">Route Explorer</a> › ${escapeHtml(route.title)}</nav>
    <h1>${escapeHtml(route.title)}</h1>
    ${reviewedLine(route.lastReviewed)}
    <p class="seo-lead">${escapeHtml(countries)} · ${escapeHtml(route.duration.label)} · ${escapeHtml(route.vehicle.label)}</p>
    <p>${escapeHtml(route.promise)}</p>
    <p><strong>Best season:</strong> ${escapeHtml(route.bestSeason.label)} — ${escapeHtml(route.bestSeason.reason)}</p>
    <h2>Ordered route stops</h2>
    <ol>${stops}</ol>
    <h2>Suggested pacing</h2>
    <ol>${phases}</ol>
    <h2>Check before travel</h2>
    <ul>${warnings}</ul>
    <h2>Official planning sources</h2>
    <ul>${sources}</ul>
    <p><em>${escapeHtml(routeCollection.meta.disclaimer)}</em></p>
    <p><a href="${path}">Open the interactive ${escapeHtml(route.title)} route planner</a></p>
  </article>
</main>`;

        return {
            path,
            title,
            description,
            ogType: 'article',
            image: cardImageUrl(route.countryIds[0]),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Trip',
                name: route.title,
                description: route.promise,
                url: `${siteUrl(baseUrl)}${path}`,
                touristType: route.travellerTypes,
                ...(isoReviewDate(route.lastReviewed) && { dateModified: isoReviewDate(route.lastReviewed) }),
                itinerary: route.stops.map((stop, index) => ({
                    '@type': 'TouristDestination',
                    position: index + 1,
                    name: stop.name,
                    description: stop.summary,
                    geo: {
                        '@type': 'GeoCoordinates',
                        latitude: stop.lat,
                        longitude: stop.lng,
                    },
                })),
            },
            breadcrumb: [
                { name: 'Home', path: '/' },
                { name: 'Route Explorer', path: '/#route-explorer' },
                { name: route.title, path },
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
        const reviewed = hubLastReviewed[hub.id] || siteLastReviewed;
        const bodyHtml = `
<main id="seo-prerender" class="seo-prerender">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> › ${escapeHtml(hub.title)}</nav>
    <h1>${escapeHtml(hub.title)}</h1>
    ${reviewedLine(reviewed)}
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
                ...(isoReviewDate(reviewed) && { dateModified: isoReviewDate(reviewed) }),
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
        ...routePages(baseUrl),
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
        ...routeCollection.routes.map(route => entry(`${origin}/routes/${route.id}`, '0.85', 'monthly', lastmodFromYm(route.lastReviewed))),
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
