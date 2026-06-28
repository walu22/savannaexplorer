import embassies from '../../data/embassies.json';
import passports from '../../data/visa-passport.json';
import { COUNTRY_META } from '../lib/country-meta.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderDirectoryLink(link) {
    return `
        <a class="embassy-link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
            <span class="embassy-link-body">
                <strong>${escapeHtml(link.title)}</strong>
                <span>${escapeHtml(link.description)}</span>
            </span>
            <span class="embassy-link-action">${escapeHtml(link.linkLabel)} <i class="fas fa-external-link-alt"></i></span>
        </a>
    `;
}

function renderDestinationCard(dest) {
    const meta = COUNTRY_META[dest.id] || {};
    const directories = dest.directories.map(renderDirectoryLink).join('');

    return `
        <article class="embassy-card" data-country="${dest.id}">
            <div class="embassy-card-header">
                <span class="embassy-flag">${meta.flag || '🌍'}</span>
                <div>
                    <h3>${escapeHtml(meta.name || dest.id)}</h3>
                    <p class="embassy-verified">Official directories · verified ${escapeHtml(dest.lastVerified || '—')}</p>
                </div>
            </div>
            <div class="embassy-link-list">${directories}</div>
            ${dest.emergencyNote ? `<p class="embassy-emergency"><i class="fas fa-phone-alt"></i> ${escapeHtml(dest.emergencyNote)}</p>` : ''}
        </article>
    `;
}

function renderTravelerCard(source) {
    const links = source.links.map(link => `
        <a class="embassy-traveler-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
            <strong>${escapeHtml(link.title)}</strong>
            <span>${escapeHtml(link.description)}</span>
            <em>${escapeHtml(link.linkLabel)} <i class="fas fa-external-link-alt"></i></em>
        </a>
    `).join('');

    return `
        <article class="embassy-traveler-card" data-passport="${source.id}" hidden>
            ${links}
        </article>
    `;
}

function initEmbassyTabs() {
    const tabs = document.querySelectorAll('[data-embassy-tab]');
    const panels = document.querySelectorAll('[data-embassy-panel]');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.getAttribute('data-embassy-tab');
            tabs.forEach(t => {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            panels.forEach(panel => {
                const match = panel.getAttribute('data-embassy-panel') === id;
                panel.hidden = !match;
                panel.classList.toggle('active', match);
            });
        });
    });
}

function initDestinationFilters() {
    const filtersEl = document.getElementById('embassies-country-filters');
    const grid = document.getElementById('embassies-destinations');
    if (!filtersEl || !grid) return;

    filtersEl.querySelectorAll('.embassy-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            filtersEl.querySelectorAll('.embassy-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            grid.querySelectorAll('.embassy-card').forEach(card => {
                const match = filter === 'all' || card.dataset.country === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}

function initPassportPicker() {
    const select = document.getElementById('embassies-passport-select');
    const cards = document.querySelectorAll('.embassy-traveler-card');
    if (!select) return;

    const showPassport = (id) => {
        cards.forEach(card => {
            card.hidden = card.dataset.passport !== id;
        });
    };

    select.addEventListener('change', () => showPassport(select.value));
    showPassport(select.value);
}

export function initEmbassies() {
    const destGrid = document.getElementById('embassies-destinations');
    const travelerGrid = document.getElementById('embassies-traveler-sources');
    const filtersEl = document.getElementById('embassies-country-filters');
    const passportSelect = document.getElementById('embassies-passport-select');
    const disclaimer = document.getElementById('embassies-disclaimer');

    if (!destGrid) return;

    if (disclaimer) disclaimer.textContent = embassies.meta.disclaimer;

    const countries = embassies.destinations;

    if (filtersEl) {
        filtersEl.innerHTML = `
            <button type="button" class="embassy-filter active" data-filter="all">All countries</button>
            ${countries.map(c => {
                const m = COUNTRY_META[c.id];
                return `<button type="button" class="embassy-filter" data-filter="${c.id}">${m?.flag || ''} ${escapeHtml(m?.name || c.id)}</button>`;
            }).join('')}
        `;
    }

    destGrid.innerHTML = countries.map(renderDestinationCard).join('');

    if (travelerGrid) {
        travelerGrid.innerHTML = embassies.travelerSources.map(renderTravelerCard).join('');
    }

    if (passportSelect) {
        const passportOptions = passports.passports.filter(p => p.id !== 'other' && p.id !== 'sadc');
        passportSelect.innerHTML = passportOptions.map(p =>
            `<option value="${p.id}">${escapeHtml(p.label)}</option>`
        ).join('');
    }

    initEmbassyTabs();
    initDestinationFilters();
    initPassportPicker();
}
