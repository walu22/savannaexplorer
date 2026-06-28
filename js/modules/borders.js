import borders from '../../data/borders.json';
import { COUNTRY_META, getCountryMeta } from '../lib/country-meta.js';

function countryLabel(countryId) {
    const meta = getCountryMeta(countryId);
    return `${meta.flag} ${meta.name}`;
}

function renderBorderCard(border) {
    const flags = border.countries.map(id => getCountryMeta(id).flag).join(' ');
    const route = border.countries.map(countryLabel).join(' ↔ ');
    const docs = border.documents.map(d => `<li>${d}</li>`).join('');
    const tips = border.tips.map(t => `<li>${t}</li>`).join('');

    return `
        <article class="border-card" id="border-${border.id}" data-countries="${border.countries.join(' ')}">
            <div class="border-card-header">
                <span class="border-flags">${flags}</span>
                <h3>${border.name}</h3>
                <p class="border-route">${border.route}</p>
            </div>
            <div class="border-card-body">
                <div class="border-stats">
                    <span><i class="fa-solid fa-clock"></i> ${border.hours}</span>
                    <span><i class="fa-solid fa-hourglass-half"></i> ${border.typicalWait}</span>
                    <span><i class="fa-solid fa-car"></i> ${border.vehicleCrossing ? 'Vehicle OK' : 'Foot only'}</span>
                    <span><i class="fa-solid fa-coins"></i> ${border.fees}</span>
                </div>
                <div class="border-docs">
                    <h4>Documents</h4>
                    <ul>${docs}</ul>
                </div>
                <div class="border-tips">
                    <h4>Local tips</h4>
                    <ul>${tips}</ul>
                </div>
                ${border.sourceUrl ? `<a class="data-source-link" href="${border.sourceUrl}" target="_blank" rel="noopener noreferrer">Border info source · verified ${border.lastVerified || '—'}</a>` : ''}
            </div>
        </article>
    `;
}

export function initBorders() {
    const gridEl = document.getElementById('borders-grid');
    const searchEl = document.getElementById('borders-search');
    const countEl = document.getElementById('borders-count');
    if (!gridEl) return;

    gridEl.innerHTML = borders.map(renderBorderCard).join('');
    if (countEl) countEl.textContent = borders.length;

    const filtersEl = document.getElementById('borders-filters');
    if (filtersEl) {
        const countryIds = [...new Set(borders.flatMap(b => b.countries))];
        filtersEl.innerHTML = `
            <button class="border-filter active" data-filter="all">All Crossings</button>
            ${countryIds.map(id => {
                const m = getCountryMeta(id);
                return `<button class="border-filter" data-filter="${id}">${m.flag} ${m.name}</button>`;
            }).join('')}
        `;

        filtersEl.querySelectorAll('.border-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                filtersEl.querySelectorAll('.border-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyFilters(btn.getAttribute('data-filter'), searchEl?.value || '');
            });
        });
    }

    function applyFilters(countryFilter, query) {
        const q = query.toLowerCase().trim();
        gridEl.querySelectorAll('.border-card').forEach(card => {
            const countries = card.getAttribute('data-countries') || '';
            const text = card.textContent.toLowerCase();
            const countryMatch = countryFilter === 'all' || countries.includes(countryFilter);
            const searchMatch = !q || text.includes(q);
            card.classList.toggle('hidden', !(countryMatch && searchMatch));
        });
    }

    searchEl?.addEventListener('input', () => {
        const active = filtersEl?.querySelector('.border-filter.active');
        applyFilters(active?.getAttribute('data-filter') || 'all', searchEl.value);
    });
}
