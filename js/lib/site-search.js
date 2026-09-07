const TYPE_LABELS = {
    destination: 'Destination',
    route: 'Route',
    park: 'Park',
    border: 'Border',
    guide: 'Guide',
    practical: 'Practical',
};

const QUERY_ALIASES = {
    visa: ['passport', 'entry', 'immigration'],
    passport: ['visa', 'entry', 'immigration'],
    malaria: ['health', 'mosquito'],
    family: ['families', 'children', 'kids'],
    kids: ['family', 'children'],
    drive: ['road', 'self-drive', 'vehicle'],
    driving: ['road', 'self-drive', 'vehicle'],
    '4x4': ['four-wheel-drive', 'suv', 'vehicle'],
    wildlife: ['safari', 'animals'],
    cheap: ['budget', 'cost'],
    money: ['budget', 'currency', 'cost'],
    itinerary: ['planner', 'route', 'journey'],
    multicountry: ['cross-border', 'journey', 'route'],
};

export const SEARCH_TYPES = Object.entries(TYPE_LABELS).map(([id, label]) => ({ id, label }));

export function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function flatten(values) {
    return values.flat(Infinity).filter(Boolean).map(String);
}

function searchDocument(input) {
    const title = String(input.title || '').trim();
    const summary = String(input.summary || '').trim();
    const keywords = flatten(input.keywords || []);
    const titleText = normalizeSearchText(title);
    const summaryText = normalizeSearchText(summary);
    const keywordText = normalizeSearchText(keywords.join(' '));
    return {
        ...input,
        title,
        summary,
        typeLabel: TYPE_LABELS[input.type] || 'Guide',
        countryIds: [...new Set(flatten(input.countryIds || []))],
        _titleText: titleText,
        _summaryText: summaryText,
        _keywordText: keywordText,
        _allText: `${titleText} ${summaryText} ${keywordText}`,
    };
}

function countryName(countryId, countries) {
    return countries?.[countryId]?.name || String(countryId || '').replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

const PRACTICAL_PAGES = [
    { id: 'visa', title: 'Visa and passport planner', summary: 'Compare passport-dependent entry guidance and open official immigration sources.', href: '/plan', keywords: ['visa', 'passport', 'entry', 'immigration', 'evisa'] },
    { id: 'health', title: 'Health and safety guidance', summary: 'Review malaria, yellow fever and destination health preparation.', href: '/health', keywords: ['malaria', 'yellow fever', 'vaccination', 'medical', 'safety'] },
    { id: 'borders', title: 'Border crossing planner', summary: 'Find crossing hours, vehicle documents and cross-border preparation.', href: '/borders', keywords: ['border', 'customs', 'vehicle documents', 'crossing'] },
    { id: 'transport', title: 'Transport and road logistics', summary: 'Plan driving, fuel, rental vehicles, transfers and road conditions.', href: '/transport', keywords: ['self drive', 'rental car', 'fuel', 'road', '4x4'] },
    { id: 'packing', title: 'Safari packing list', summary: 'Build a practical packing checklist for your season and travel style.', href: '/packing-list', keywords: ['pack', 'luggage', 'clothes', 'equipment', 'gear'] },
    { id: 'budget', title: 'Trip budget and expenses', summary: 'Estimate costs and keep trip expenses together in My Safari.', href: '/expenses', keywords: ['money', 'currency', 'budget', 'cost', 'cheap'] },
    { id: 'phrasebook', title: 'Essential phrasebook', summary: 'Carry useful greetings and travel phrases for Southern Africa.', href: '/phrasebook', keywords: ['language', 'phrases', 'speak', 'local', 'greeting'] },
    { id: 'my-safari', title: 'My Safari trip workspace', summary: 'Save routes, bookings, readiness checks, budgets and offline trip packs.', href: '/my-safari', keywords: ['planner', 'itinerary', 'calendar', 'offline', 'booking'] },
    { id: 'journey-builder', title: 'Multi-country journey builder', summary: 'Connect researched routes through reviewed land borders and save one editable itinerary.', href: '/routes#journey-composer', keywords: ['multi country', 'multicountry', 'cross border', 'road trip', 'route planner', 'itinerary'] },
];

export function buildSiteSearchIndex({ countries = {}, routes = [], parks = [], borders = [], guides = {}, visaHealth = [] } = {}) {
    const documents = [];

    Object.entries(countries).forEach(([id, country]) => {
        documents.push(searchDocument({
            id: `destination-${id}`,
            type: 'destination',
            title: country.name,
            summary: country.tagline || country.about?.geo || '',
            href: `/countries/${id}`,
            countryIds: [id],
            priority: 90,
            keywords: [
                country.about?.geo,
                country.about?.people,
                (country.spots || []).map(item => [item.name, item.desc]),
                (country.activities || []).map(item => [item.name, item.desc]),
                (country.routes || []).map(item => [item.name, item.desc]),
            ],
        }));
    });

    routes.forEach(route => documents.push(searchDocument({
        id: `route-${route.id}`,
        sourceId: route.id,
        type: 'route',
        title: route.title,
        summary: route.promise,
        href: `/routes/${route.id}`,
        countryIds: route.countryIds,
        priority: 80,
        meta: [route.duration?.label, route.vehicle?.label].filter(Boolean).join(' · '),
        reviewed: route.lastReviewed,
        keywords: [route.themes, route.travellerTypes, route.highlights, route.stops?.map(stop => [stop.name, stop.region, stop.summary]), route.bestSeason?.label],
    })));

    parks.forEach(park => documents.push(searchDocument({
        id: `park-${park.id}`,
        sourceId: park.id,
        type: 'park',
        title: park.name,
        summary: park.description,
        href: `/parks/${park.id}`,
        countryIds: [park.country],
        priority: 70,
        meta: [park.bestSeason, park.difficulty].filter(Boolean).join(' · '),
        reviewed: park.lastVerified,
        keywords: [park.tags, park.feeDetail, park.gateHours],
    })));

    borders.forEach(border => documents.push(searchDocument({
        id: `border-${border.id}`,
        sourceId: border.id,
        type: 'border',
        title: border.name,
        summary: border.route || 'Cross-border travel reference',
        href: `/borders/${border.id}`,
        countryIds: border.countries,
        priority: 65,
        meta: border.hours,
        reviewed: border.lastVerified,
        keywords: [border.documents, border.tips, border.fees, border.vehicleCrossing ? 'vehicle crossing' : 'pedestrian crossing'],
    })));

    Object.entries(guides).forEach(([id, guide]) => documents.push(searchDocument({
        id: `guide-${id}`,
        sourceId: id,
        type: 'guide',
        title: guide.title,
        summary: (guide.topics || []).slice(0, 4).join(' · '),
        href: `/guides/planning/${id}`,
        countryIds: [guide.country || id],
        priority: 60,
        meta: guide.readTime,
        reviewed: guide.lastVerified,
        keywords: [guide.topics, guide.sections?.map(section => [section.title, section.body, section.bullets])],
    })));

    visaHealth.forEach(item => documents.push(searchDocument({
        id: `practical-entry-${item.id}`,
        type: 'practical',
        title: `${item.name} visa and health snapshot`,
        summary: item.note,
        href: '/plan',
        countryIds: [item.id],
        priority: 55,
        reviewed: item.visaLastVerified || item.lastVerified,
        keywords: [item.visa?.label, item.health?.label, item.advisory?.label, 'passport entry immigration malaria health'],
    })));

    PRACTICAL_PAGES.forEach(item => documents.push(searchDocument({
        ...item,
        id: `practical-${item.id}`,
        type: 'practical',
        countryIds: [],
        priority: 50,
    })));

    return documents;
}

function queryTerms(query) {
    const primary = normalizeSearchText(query).split(' ').filter(term => term.length > 1);
    const expanded = new Set(primary);
    primary.forEach(term => (QUERY_ALIASES[term] || []).forEach(alias => expanded.add(normalizeSearchText(alias))));
    return { phrase: normalizeSearchText(query), primary, expanded: [...expanded] };
}

function termScore(document, term) {
    const titleWords = document._titleText.split(' ');
    const keywordWords = document._keywordText.split(' ');
    if (titleWords.includes(term)) return 24;
    if (titleWords.some(word => word.startsWith(term))) return 16;
    if (document._titleText.includes(term)) return 11;
    if (keywordWords.includes(term)) return 8;
    if (keywordWords.some(word => word.startsWith(term))) return 5;
    if (document._summaryText.includes(term)) return 3;
    if (document._allText.includes(term)) return 1;
    return 0;
}

export function searchSiteIndex(index, query, { type = 'all', country = 'all', limit = 24 } = {}) {
    const filtered = (Array.isArray(index) ? index : []).filter(document =>
        (type === 'all' || document.type === type)
        && (country === 'all' || document.countryIds.includes(country))
    );
    const { phrase, primary, expanded } = queryTerms(query);

    if (!primary.length) {
        return filtered
            .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.title.localeCompare(b.title))
            .slice(0, limit);
    }

    return filtered.map(document => {
        let score = document._titleText === phrase ? 120 : 0;
        if (phrase && document._titleText.includes(phrase)) score += 70;
        else if (phrase && document._allText.includes(phrase)) score += 24;
        const primaryScores = primary.map(term => termScore(document, term));
        expanded.forEach(term => { score += termScore(document, term); });
        if (primaryScores.every(Boolean)) score += 28;
        return { document, score };
    })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score || (b.document.priority || 0) - (a.document.priority || 0) || a.document.title.localeCompare(b.document.title))
        .slice(0, limit)
        .map(result => result.document);
}

export function searchCountryOptions(index, countries = {}) {
    const used = new Set((Array.isArray(index) ? index : []).flatMap(document => document.countryIds));
    return [...used]
        .map(id => ({ id, label: countryName(id, countries) }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
