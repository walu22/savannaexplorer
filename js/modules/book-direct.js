import listings from '../../data/stays-operators.json';
import { COUNTRY_META, getCountryMeta } from '../lib/country-meta.js';
import {
    getListingById,
    listingPath,
    navigateToListing,
    scrollToSection,
} from '../lib/router.js';
import { dismissSeoPrerender } from '../lib/seo-prerender.js';
import { setListingMeta } from '../lib/page-meta.js';

let activeKind = 'all';
let activeCountry = 'all';

function kindLabel(kind) {
    return kind === 'stay' ? 'Stay / lodge' : 'Operator';
}

function renderListingCard(item) {
    const meta = getCountryMeta(item.country);
    const tags = item.tags.map(tag => `<span><i class="fa-solid fa-tag"></i> ${tag}</span>`).join('');
    const path = listingPath(item);

    return `
        <article class="book-card" id="book-${item.id}" data-kind="${item.kind}" data-country="${item.country}">
            <div class="book-card-header">
                <span class="book-badge book-badge--${item.kind}">${kindLabel(item.kind)}</span>
                <span class="book-flag">${meta.flag || '🌍'}</span>
                <h3><a href="${path}">${item.title}</a></h3>
                <p class="book-region">${item.region} · ${meta.name}</p>
            </div>
            <p class="book-desc">${item.description}</p>
            <div class="book-meta">${tags}</div>
            <p class="book-tip"><i class="fa-solid fa-lightbulb"></i> ${item.planningTip}</p>
            <div class="book-links">
                <a class="data-source-link data-source-link--primary" href="${item.url}" target="_blank" rel="noopener noreferrer">
                    ${item.linkLabel} <i class="fas fa-external-link-alt"></i>
                </a>
                <span class="book-verified">Verified ${item.lastVerified}</span>
            </div>
        </article>
    `;
}

function applyFilters() {
    document.querySelectorAll('.book-card').forEach(card => {
        const kindMatch = activeKind === 'all' || card.dataset.kind === activeKind;
        const countryMatch = activeCountry === 'all' || card.dataset.country === activeCountry;
        card.classList.toggle('hidden', !(kindMatch && countryMatch));
    });

    const visible = document.querySelectorAll('.book-card:not(.hidden)').length;
    const countEl = document.getElementById('book-count-visible');
    if (countEl) countEl.textContent = visible;
}

export function initBookDirect() {
    const gridEl = document.getElementById('book-grid');
    const kindFiltersEl = document.getElementById('book-kind-filters');
    const countryFiltersEl = document.getElementById('book-country-filters');
    if (!gridEl) return;

    const stays = listings.filter(l => l.kind === 'stay');
    const operators = listings.filter(l => l.kind === 'operator');
    const countries = [...new Set(listings.map(l => l.country))];

    gridEl.innerHTML = listings.map(renderListingCard).join('');

    const countEl = document.getElementById('book-count');
    if (countEl) countEl.textContent = listings.length;

    if (kindFiltersEl) {
        kindFiltersEl.innerHTML = `
            <button type="button" class="book-filter active" data-kind="all">All (${listings.length})</button>
            <button type="button" class="book-filter" data-kind="stay">Stays &amp; lodges (${stays.length})</button>
            <button type="button" class="book-filter" data-kind="operator">Operators (${operators.length})</button>
        `;
    }

    if (countryFiltersEl) {
        countryFiltersEl.innerHTML = `
            <button type="button" class="book-filter active" data-country="all">All countries</button>
            ${countries.map(id => {
                const m = COUNTRY_META[id] || getCountryMeta(id);
                return `<button type="button" class="book-filter" data-country="${id}">${m.flag} ${m.name}</button>`;
            }).join('')}
        `;
    }

    kindFiltersEl?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-kind]');
        if (!btn) return;
        activeKind = btn.dataset.kind;
        kindFiltersEl.querySelectorAll('.book-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
    });

    countryFiltersEl?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-country]');
        if (!btn) return;
        activeCountry = btn.dataset.country;
        countryFiltersEl.querySelectorAll('.book-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
    });

    applyFilters();
}

export function openListingPage(id, { replace = false } = {}) {
    const item = getListingById(id);
    if (!item) return;
    navigateToListing(id, { replace });
    handleListingRoute({ type: 'listing', listingId: id });
}

export function handleListingRoute(route) {
    const item = getListingById(route.listingId);
    if (!item) return;

    dismissSeoPrerender();
    setListingMeta(item);
    activeKind = item.kind;
    activeCountry = item.country;

    document.querySelectorAll('#book-kind-filters .book-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.kind === item.kind || (item.kind && btn.dataset.kind === 'all'));
    });
    document.querySelectorAll('#book-country-filters .book-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.country === item.country || btn.dataset.country === 'all');
    });

    applyFilters();
    scrollToSection('book-direct');
    requestAnimationFrame(() => {
        document.querySelectorAll('.seo-highlight').forEach(el => el.classList.remove('seo-highlight'));
        document.getElementById(`book-${item.id}`)?.classList.add('seo-highlight');
        document.getElementById(`book-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

export function getListingsForCountry(countryId) {
    return listings.filter(l => l.country === countryId);
}

export function renderCountryBookRows(items) {
    if (!items.length) return '';
    return items.map(item => `
        <div class="official-resource-card">
            <div class="official-resource-icon"><i class="fas ${item.kind === 'stay' ? 'fa-bed' : 'fa-compass'}"></i></div>
            <div class="official-resource-body">
                <strong>${item.title}</strong>
                <p>${item.description}</p>
                <a class="data-source-link" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.linkLabel} · verified ${item.lastVerified}</a>
            </div>
        </div>
    `).join('');
}
