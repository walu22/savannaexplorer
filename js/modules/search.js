import countriesData from '../../data/countries.json';
import parksData from '../../data/parks.json';
import bordersData from '../../data/borders.json';
import itinerariesData from '../../data/itineraries.json';
import marketplaceData from '../../data/marketplace.json';
import staysOperatorsData from '../../data/stays-operators.json';
import guidesData from '../../data/planning-guides.json';
import discoverData from '../../data/discover.json';
import { navigateToCountry, navigateToPark, navigateToBorder, navigateToItinerary, navigateToListing, navigateHome } from '../lib/router.js';

const index = [];

function buildIndex() {
    Object.entries(countriesData).forEach(([id, c]) => {
        index.push({
            type: 'country',
            id,
            title: c.name || id,
            subtitle: c.tagline || '',
            keywords: [c.name, id, c.tagline, ...(c.activities || []), ...(c.spots || [])].join(' '),
            url: `/countries/${id}`,
        });
    });

    parksData.forEach(p => {
        index.push({
            type: 'park',
            id: p.id,
            title: p.name,
            subtitle: p.country,
            keywords: [p.name, p.country, ...(p.tags || []), p.description].join(' '),
            url: `/parks/${p.id}`,
        });
    });

    bordersData.forEach(b => {
        index.push({
            type: 'border',
            id: b.id,
            title: b.name,
            subtitle: b.countries.join(' — '),
            keywords: [b.name, ...b.countries, b.route, b.tips].join(' '),
            url: `/borders/${b.id}`,
        });
    });

    Object.entries(itinerariesData).forEach(([id, it]) => {
        index.push({
            type: 'itinerary',
            id,
            title: it.title,
            subtitle: it.countries,
            keywords: [it.title, it.countries, it.type, it.description, ...(it.highlights || [])].join(' '),
            url: `/itineraries/${id}`,
        });
    });

    Object.values(marketplaceData).flat().forEach(item => {
        index.push({
            type: 'marketplace',
            id: item.id,
            title: item.title,
            subtitle: item.location,
            keywords: [item.title, item.location, item.category, item.description, ...(item.tags || [])].join(' '),
            url: `/stays/${item.id}`,
        });
    });

    staysOperatorsData.forEach(s => {
        index.push({
            type: 'listing',
            id: s.id,
            title: s.title,
            subtitle: s.country,
            keywords: [s.title, s.country, s.region, ...(s.tags || []), s.description].join(' '),
            url: s.kind === 'stay' ? `/stays/${s.id}` : `/operators/${s.id}`,
        });
    });

    const guides = guidesData.guides || {};
    Object.entries(guides).forEach(([countryId, guide]) => {
        index.push({
            type: 'guide',
            id: countryId,
            title: guide.title || `${countryId} planning guide`,
            subtitle: guide.country || countryId,
            keywords: [guide.title, guide.country, ...(guide.topics || []), ...(guide.sections || [])].join(' '),
            url: `/guides/planning/${countryId}`,
        });
    });

    (discoverData.topDestinations || []).forEach(d => {
        index.push({
            type: 'discover',
            id: d.name,
            title: d.name,
            subtitle: d.country,
            keywords: [d.name, d.country, d.region, d.desc, ...(d.mustVisit || [])].join(' '),
            url: `/countries/${d.country}`,
        });
    });

    (discoverData.facts || []).forEach(f => {
        index.push({
            type: 'discover',
            id: f.title,
            title: f.title,
            subtitle: f.country,
            keywords: [f.title, f.description, f.country].join(' '),
            url: `/countries/${f.country}`,
        });
    });

    (discoverData.travelNews || []).forEach(n => {
        index.push({
            type: 'discover',
            id: n.title,
            title: n.title,
            subtitle: n.country,
            keywords: [n.title, n.excerpt, n.country, n.category].join(' '),
            url: `/countries/${n.country}`,
        });
    });
}

function normalize(str) {
    return (str || '').toLowerCase().trim();
}

function scoreMatch(item, query) {
    const q = normalize(query);
    const title = normalize(item.title);
    const subtitle = normalize(item.subtitle);
    const keywords = normalize(item.keywords);

    if (title === q) return 100;
    if (title.startsWith(q)) return 90;
    if (title.includes(q)) return 70;
    if (subtitle.includes(q)) return 40;
    if (keywords.includes(q)) return 20;

    const qWords = q.split(/\s+/).filter(w => w.length > 1);
    let matchCount = 0;
    for (const w of qWords) {
        if (title.includes(w) || keywords.includes(w)) matchCount++;
    }
    if (matchCount > 0) return 10 + matchCount * 10;

    return 0;
}

function renderResult(item) {
    const typeLabels = {
        country: 'Country',
        park: 'Park',
        border: 'Border',
        itinerary: 'Itinerary',
        marketplace: 'Experience',
        listing: item.kind === 'stay' ? 'Stay' : 'Operator',
        guide: 'Guide',
        discover: 'Discover',
    };
    const label = typeLabels[item.type] || item.type;
    const typeClass = `search-result__type--${item.type}`;

    return `
        <a href="${item.url}" class="search-result" data-search-result>
            <span class="search-result__type ${typeClass}">${label}</span>
            <span class="search-result__title">${item.title}</span>
            ${item.subtitle ? `<span class="search-result__subtitle">${item.subtitle}</span>` : ''}
        </a>
    `;
}

let searchOpen = false;
let searchInput = null;
let searchResults = null;
let searchOverlay = null;
let searchDebounce = null;

function openSearch() {
    if (!searchOverlay) return;
    searchOpen = true;
    searchOverlay.classList.add('is-open');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.focus();
    document.body.style.overflow = 'hidden';
}

function closeSearch() {
    if (!searchOverlay) return;
    searchOpen = false;
    searchOverlay.classList.remove('is-open');
    searchInput.value = '';
    searchResults.innerHTML = '';
    document.body.style.overflow = '';
}

function performSearch(query) {
    if (!query.trim()) {
        searchResults.innerHTML = '<div class="search-result__empty">Type to search across countries, parks, itineraries, and more.</div>';
        return;
    }

    const q = normalize(query);
    const scored = index
        .map(item => ({ item, score: scoreMatch(item, q) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

    if (scored.length === 0) {
        searchResults.innerHTML = `<div class="search-result__empty">No results for "${escapeHtml(query)}".</div>`;
        return;
    }

    searchResults.innerHTML = scored.map(({ item }) => renderResult(item)).join('');
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function handleSearchKeydown(e) {
    if (e.key === 'Escape') {
        closeSearch();
        return;
    }
    if (e.key === 'Enter') {
        const firstResult = searchResults.querySelector('[data-search-result]');
        if (firstResult) {
            firstResult.click();
        }
    }
}

function handleOverlayClick(e) {
    if (e.target === searchOverlay) {
        closeSearch();
    }
}

function handleTriggerClick(e) {
    e.preventDefault();
    if (searchOpen) {
        closeSearch();
    } else {
        openSearch();
    }
}

export function initSearch() {
    buildIndex();

    searchOverlay = document.getElementById('search-overlay');
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');
    const searchTrigger = document.getElementById('open-search');
    const searchClose = document.getElementById('close-search');

    if (!searchOverlay || !searchInput || !searchResults) return;

    if (searchTrigger) {
        searchTrigger.addEventListener('click', handleTriggerClick);
    }

    if (searchClose) {
        searchClose.addEventListener('click', closeSearch);
    }

    searchOverlay.addEventListener('click', handleOverlayClick);

    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            performSearch(searchInput.value);
        }, 150);
    });

    searchInput.addEventListener('keydown', handleSearchKeydown);

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchOpen) {
                closeSearch();
            } else {
                openSearch();
            }
        }
        if (e.key === '/' && !searchOpen && document.activeElement === document.body) {
            e.preventDefault();
            openSearch();
        }
    });
}
