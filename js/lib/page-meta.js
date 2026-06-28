import countries from '../../data/countries.json';
import { CONFIG } from '../config.js';
import { getFullCountryData } from './merge-country.js';
import { cardImageUrl, getCountryMeta } from './country-meta.js';
import {
    borderPath,
    countryPath,
    getBorderById,
    getItineraryById,
    getListingById,
    getParkById,
    itineraryPath,
    listingPath,
    parkPath,
} from './router.js';
import { getCountryLastReviewed, getSiteLastReviewed, toIsoReviewDate } from './content-meta.js';

const SITE_NAME = 'Savanna Explorer';

const HOME_META = {
    title: 'Savanna Explorer | Southern Africa, Endless Horizons',
    description: 'Independent planning reference for Southern Africa — country guides, route templates, border and park info, and official booking links. We do not sell tours or take payments.',
    path: '/',
};

function siteOrigin() {
    if (CONFIG.siteUrl) return CONFIG.siteUrl.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
}

function absoluteUrl(path) {
    return `${siteOrigin()}${path}`;
}

function truncate(text, max = 155) {
    const t = (text || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

function upsertMeta(attr, key, content, isProperty = false) {
    const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
    let el = document.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        if (isProperty) el.setAttribute('property', key);
        else el.setAttribute('name', key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertCanonical(href) {
    let el = document.getElementById('canonical-link');
    if (!el) {
        el = document.createElement('link');
        el.id = 'canonical-link';
        el.rel = 'canonical';
        document.head.appendChild(el);
    }
    el.href = href;
}

function upsertJsonLd(data) {
    let el = document.getElementById('structured-data');
    if (!el) {
        el = document.createElement('script');
        el.id = 'structured-data';
        el.type = 'application/ld+json';
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
}

function breadcrumbJsonLd(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

function applyMeta({ title, description, path, image, type = 'website' }) {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title, true);
    upsertMeta('property', 'og:description', description, true);
    upsertMeta('property', 'og:type', type, true);
    upsertMeta('property', 'og:url', absoluteUrl(path), true);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    if (image) {
        upsertMeta('property', 'og:image', image, true);
        upsertMeta('name', 'twitter:image', image);
    }
    upsertCanonical(absoluteUrl(path));
}

export function setHomeMeta() {
    const image = absoluteUrl('/images/wildlife.png');
    applyMeta({ ...HOME_META, image });
    upsertJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        description: HOME_META.description,
        url: absoluteUrl('/'),
    });
}

export function setCountryMeta(countryId) {
    const data = getFullCountryData(countryId) || countries[countryId];
    if (!data) {
        setHomeMeta();
        return;
    }

    const path = countryPath(countryId);
    const summary = data.about?.summary || data.tagline || '';
    const description = truncate(summary)
        || `Travel guide for ${data.name} — visas, parks, routes, and official planning links.`;

    applyMeta({
        title: `${data.name} Travel Guide | ${SITE_NAME}`,
        description,
        path,
        image: cardImageUrl(countryId),
        type: 'article',
    });

    upsertJsonLd([
        {
            '@context': 'https://schema.org',
            '@type': 'TouristDestination',
            name: data.name,
            description,
            url: absoluteUrl(path),
            touristType: 'Independent traveller',
            ...(toIsoReviewDate(getCountryLastReviewed(countryId)) && {
                dateModified: toIsoReviewDate(getCountryLastReviewed(countryId)),
            }),
        },
        breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: data.name, path },
        ]),
    ]);
}

export function setParkMeta(parkId) {
    const park = getParkById(parkId);
    if (!park) {
        setHomeMeta();
        return;
    }

    const meta = getCountryMeta(park.country);
    const path = parkPath(parkId);
    const description = truncate(`${park.description} Best season: ${park.bestSeason}. Fees: ${park.fees}.`);

    applyMeta({
        title: `${park.name} | ${SITE_NAME}`,
        description,
        path,
        image: cardImageUrl(park.country),
        type: 'article',
    });

    upsertJsonLd([
        {
            '@context': 'https://schema.org',
            '@type': 'TouristAttraction',
            name: park.name,
            description: park.description,
            url: absoluteUrl(path),
            ...(toIsoReviewDate(park.lastVerified) && { dateModified: toIsoReviewDate(park.lastVerified) }),
        },
        breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: meta.name, path: countryPath(park.country) },
            { name: park.name, path },
        ]),
    ]);
}

export function setBorderMeta(borderId) {
    const border = getBorderById(borderId);
    if (!border) {
        setHomeMeta();
        return;
    }

    const path = borderPath(borderId);
    const countryNames = border.countries.map(id => getCountryMeta(id).name).join(' ↔ ');
    const description = truncate(`${border.name}: ${border.route}. Hours ${border.hours}. Wait ${border.typicalWait}. Documents and fees for ${countryNames}.`);

    applyMeta({
        title: `${border.name} Border Crossing | ${SITE_NAME}`,
        description,
        path,
        image: cardImageUrl(border.countries[0]),
        type: 'article',
    });

    upsertJsonLd([
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${border.name} Border Crossing`,
            description,
            url: absoluteUrl(path),
            ...(toIsoReviewDate(border.lastVerified) && { dateModified: toIsoReviewDate(border.lastVerified) }),
        },
        breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Border crossings', path: '/#borders' },
            { name: border.name, path },
        ]),
    ]);
}

export function setItineraryMeta(itineraryId) {
    const data = getItineraryById(itineraryId);
    if (!data) {
        setHomeMeta();
        return;
    }

    const path = itineraryPath(itineraryId);
    const description = truncate(`${data.description} ${data.duration}. ${data.countries}.`);

    applyMeta({
        title: `${data.title} Route Template | ${SITE_NAME}`,
        description,
        path,
        image: 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=1200',
        type: 'article',
    });

    upsertJsonLd([
        {
            '@context': 'https://schema.org',
            '@type': 'Trip',
            name: data.title,
            description: data.description,
            url: absoluteUrl(path),
            ...(toIsoReviewDate(getSiteLastReviewed()) && { dateModified: toIsoReviewDate(getSiteLastReviewed()) }),
        },
        breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Route templates', path: '/#itineraries' },
            { name: data.title, path },
        ]),
    ]);
}

export function setListingMeta(itemOrId) {
    const item = typeof itemOrId === 'string' ? getListingById(itemOrId) : itemOrId;
    if (!item) {
        setHomeMeta();
        return;
    }

    const meta = getCountryMeta(item.country);
    const path = listingPath(item);
    const kindLabel = item.kind === 'stay' ? 'Stay & lodge directory' : 'Licensed operator directory';
    const description = truncate(`${item.description} ${kindLabel} for ${meta.name}. Verified ${item.lastVerified}.`);

    applyMeta({
        title: `${item.title} | ${SITE_NAME}`,
        description,
        path,
        image: cardImageUrl(item.country),
        type: 'article',
    });

    upsertJsonLd([
        {
            '@context': 'https://schema.org',
            '@type': item.kind === 'stay' ? 'LodgingBusiness' : 'TravelAgency',
            name: item.title,
            description: item.description,
            url: absoluteUrl(path),
            sameAs: item.url,
            ...(toIsoReviewDate(item.lastVerified) && { dateModified: toIsoReviewDate(item.lastVerified) }),
        },
        breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Book direct', path: '/#book-direct' },
            { name: item.title, path },
        ]),
    ]);
}

export function initPageMeta() {
    setHomeMeta();
}
