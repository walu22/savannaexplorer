import onTheGround from '../../data/on-the-ground.json';
import { COUNTRY_META } from '../lib/country-meta.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderCountryCard(country) {
    const topics = country.topics.map(t => `
        <div class="on-ground-topic">
            <h4><span class="on-ground-topic-icon">${t.icon}</span> ${escapeHtml(t.title)}</h4>
            <p>${escapeHtml(t.body)}</p>
        </div>
    `).join('');

    return `
        <article class="on-ground-card" data-country="${country.id}">
            <div class="on-ground-card-head">
                <span class="on-ground-flag">${country.flag}</span>
                <h3>${escapeHtml(country.name)}</h3>
            </div>
            <div class="on-ground-topics">${topics}</div>
            <p class="on-ground-verified">Verified ${country.lastVerified}</p>
        </article>
    `;
}

export function initOnTheGround() {
    const grid = document.getElementById('on-ground-grid');
    const filters = document.getElementById('on-ground-filters');
    const disclaimer = document.getElementById('on-ground-disclaimer');
    if (!grid) return;

    const countries = onTheGround.countries;

    if (disclaimer) disclaimer.textContent = onTheGround.meta.disclaimer;

    if (filters) {
        filters.innerHTML = `
            <button type="button" class="on-ground-filter active" data-filter="all">All</button>
            ${countries.map(c => {
                const m = COUNTRY_META[c.id];
                return `<button type="button" class="on-ground-filter" data-filter="${c.id}">${m?.flag || c.flag} ${c.name}</button>`;
            }).join('')}
        `;
    }

    grid.innerHTML = countries.map(renderCountryCard).join('');

    filters?.querySelectorAll('.on-ground-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            filters.querySelectorAll('.on-ground-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            grid.querySelectorAll('.on-ground-card').forEach(card => {
                const match = filter === 'all' || card.dataset.country === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}
