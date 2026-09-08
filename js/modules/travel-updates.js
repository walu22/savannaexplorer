import updatesData from '../../data/travel-updates.json';
import { COUNTRY_META } from '../lib/country-meta.js';
import { filterCurrentUpdates } from '../lib/update-governance.js';

const CATEGORY_LABELS = {
    'entry-rule': 'Entry rule',
    'event-change': 'Event change',
    'event-date': 'Event date',
};

const STATUS_LABELS = {
    attention: 'Action needed',
    confirmed: 'Confirmed',
    'verify-before-travel': 'Verify before travel',
};

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month - 1, day)));
}

function renderUpdate(update) {
    const country = COUNTRY_META[update.country] || {};
    return `
        <article class="travel-update-card travel-update-card--${escapeHtml(update.status)}">
            <header>
                <span class="travel-update-card__country">${country.flag || ''} ${escapeHtml(country.name || update.country)}</span>
                <span class="travel-update-card__status">${escapeHtml(STATUS_LABELS[update.status] || update.status)}</span>
            </header>
            <div class="travel-update-card__body">
                <span class="travel-update-card__category">${escapeHtml(CATEGORY_LABELS[update.category] || update.category)}</span>
                <h3>${escapeHtml(update.title)}</h3>
                <p>${escapeHtml(update.summary)}</p>
            </div>
            <footer>
                <div>
                    <span>Reviewed ${formatDate(update.reviewedOn)}</span>
                    <span>Recheck by ${formatDate(update.validUntil)}</span>
                </div>
                <a href="${escapeHtml(update.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(update.sourceLabel)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
                <a class="travel-update-card__action" href="${escapeHtml(update.actionHref)}">${escapeHtml(update.actionLabel)} <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            </footer>
        </article>`;
}

function fillFilters(updates, countrySelect, categorySelect) {
    const countries = [...new Set(updates.map(update => update.country))];
    countrySelect.innerHTML = `<option value="all">All countries</option>${countries.map(id => {
        const country = COUNTRY_META[id];
        return `<option value="${id}">${country?.flag || ''} ${escapeHtml(country?.name || id)}</option>`;
    }).join('')}`;
    const categories = [...new Set(updates.map(update => update.category))];
    categorySelect.innerHTML = `<option value="all">All update types</option>${categories.map(category => `<option value="${category}">${CATEGORY_LABELS[category] || category}</option>`).join('')}`;
}

export function initTravelUpdates() {
    const grid = document.getElementById('travel-updates-grid');
    const form = document.getElementById('travel-updates-filter-form');
    if (!grid || !form) return;

    const countrySelect = document.getElementById('travel-updates-country');
    const categorySelect = document.getElementById('travel-updates-category');
    const count = document.getElementById('travel-updates-count');
    const empty = document.getElementById('travel-updates-empty');
    const today = new Date().toISOString().slice(0, 10);

    fillFilters(updatesData.updates, countrySelect, categorySelect);
    document.getElementById('travel-updates-reviewed').textContent = `Editorial review completed ${formatDate(updatesData.meta.lastReviewed)}.`;
    document.getElementById('travel-updates-disclaimer').textContent = updatesData.meta.disclaimer;
    empty.querySelector('p').textContent = updatesData.meta.emptyMessage;

    const render = () => {
        const matches = filterCurrentUpdates(updatesData.updates, {
            country: countrySelect.value,
            category: categorySelect.value,
        }, today);
        grid.innerHTML = matches.map(renderUpdate).join('');
        count.textContent = String(matches.length);
        grid.hidden = matches.length === 0;
        empty.hidden = matches.length !== 0;
    };

    form.addEventListener('change', render);
    form.addEventListener('reset', () => window.setTimeout(render, 0));
    render();
}
