import countries from '../../data/countries.json';
import { CONFIG } from '../config.js';
import { getFullCountryData } from './merge-country.js';
import { cardImageUrl } from './country-meta.js';
import { countryPath } from './router.js';

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
        name: 'Savanna Explorer',
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
    const description = `${summary.slice(0, 155)}${summary.length > 155 ? '…' : ''}`.trim()
        || `Travel guide for ${data.name} — visas, parks, routes, and official planning links.`;

    applyMeta({
        title: `${data.name} Travel Guide | Savanna Explorer`,
        description,
        path,
        image: cardImageUrl(countryId),
        type: 'article',
    });

    upsertJsonLd({
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: data.name,
        description,
        url: absoluteUrl(path),
        touristType: 'Independent traveller',
    });
}

export function initPageMeta() {
    setHomeMeta();
}
