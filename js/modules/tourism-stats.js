import statsData from '../../data/tourism-stats.json';
import { COUNTRY_META } from '../lib/country-meta.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderStatRow(country) {
    const sources = country.topSources.map(s => escapeHtml(s)).join(' · ');
    return `
        <article class="tourism-stat-row" data-country="${country.id}">
            <div class="tourism-stat-head">
                <span class="tourism-stat-flag">${country.flag}</span>
                <div>
                    <strong>${escapeHtml(country.name)}</strong>
                    <span class="tourism-stat-year">${country.year}</span>
                </div>
                <div class="tourism-stat-arrivals">
                    <span class="tourism-stat-number">${escapeHtml(country.arrivals)}</span>
                    <span class="tourism-stat-label">${escapeHtml(country.arrivalsLabel)}</span>
                </div>
            </div>
            <p class="tourism-stat-trend">${escapeHtml(country.trend)}</p>
            <p class="tourism-stat-context">${escapeHtml(country.context)}</p>
            <p class="tourism-stat-sources"><strong>Top sources:</strong> ${sources}</p>
            <a class="data-source-link" href="${country.sourceUrl}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(country.sourceLabel)} <i class="fas fa-external-link-alt"></i>
            </a>
        </article>
    `;
}

export function initTourismStats() {
    const grid = document.getElementById('tourism-stats-grid');
    const summary = document.getElementById('tourism-stats-summary');
    const disclaimer = document.getElementById('tourism-stats-disclaimer');
    const filters = document.getElementById('tourism-stats-filters');
    if (!grid) return;

    const countries = statsData.countries;

    if (summary && statsData.regional) {
        summary.textContent = statsData.regional.summary;
    }
    if (disclaimer) {
        disclaimer.textContent = statsData.meta.disclaimer;
    }

    if (filters) {
        filters.innerHTML = `
            <button type="button" class="tourism-stat-filter active" data-filter="all">All</button>
            ${countries.map(c => {
                const m = COUNTRY_META[c.id];
                return `<button type="button" class="tourism-stat-filter" data-filter="${c.id}">${m?.flag || c.flag}</button>`;
            }).join('')}
        `;
    }

    grid.innerHTML = countries.map(renderStatRow).join('');

    filters?.querySelectorAll('.tourism-stat-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            filters.querySelectorAll('.tourism-stat-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            grid.querySelectorAll('.tourism-stat-row').forEach(row => {
                const match = filter === 'all' || row.dataset.country === filter;
                row.classList.toggle('hidden', !match);
            });
        });
    });
}

export { statsData };
