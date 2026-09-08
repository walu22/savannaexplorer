import eventsData from '../../data/events.json';
import wildlifeCalendar from '../../data/wildlife-calendar.json';
import { COUNTRY_META } from '../lib/country-meta.js';
import { addDays, filterConfirmedEvents, filterSeasonalHighlights, toDateOnly } from '../lib/event-governance.js';

const TYPE_LABELS = { festival: 'Festival', expo: 'Regional event', 'public-holiday': 'Public holiday' };

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(value) {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month - 1, day)));
}

function formatRange(event) {
    return event.startDate === event.endDate ? formatDate(event.startDate) : `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`;
}

function renderEventCard(event) {
    const meta = COUNTRY_META[event.country] || {};
    return `
        <article class="verified-event-card">
            <div class="verified-event-card__date">
                <time datetime="${event.startDate}">${formatRange(event)}</time>
                <span>${escapeHtml(TYPE_LABELS[event.type] || event.type)}</span>
            </div>
            <div class="verified-event-card__body">
                <span class="verified-event-card__country">${meta.flag || ''} ${escapeHtml(meta.name || event.country)}</span>
                <h3>${escapeHtml(event.name)}</h3>
                <p class="verified-event-card__location"><i class="fas fa-location-dot" aria-hidden="true"></i> ${escapeHtml(event.location)}</p>
                <p>${escapeHtml(event.description)}</p>
                <div class="verified-event-card__note"><i class="fas fa-compass" aria-hidden="true"></i><span>${escapeHtml(event.planningNote)}</span></div>
            </div>
            <footer>
                <span><i class="fas fa-circle-check" aria-hidden="true"></i> Date source checked ${formatDate(event.sourceCheckedOn)}</span>
                <a href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.sourceLabel)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
            </footer>
        </article>`;
}

function renderWatchItem(item) {
    const meta = COUNTRY_META[item.country] || {};
    const status = item.status === 'postponed' ? 'Postponed' : 'Dates pending';
    return `
        <article class="event-watch-card event-watch-card--${escapeHtml(item.status)}">
            <div><span>${meta.flag || ''} ${escapeHtml(meta.name || item.country)}</span><strong>${status}</strong></div>
            <h3>${escapeHtml(item.name)}</h3>
            <p class="event-watch-card__timing">${escapeHtml(item.timing)}</p>
            <p>${escapeHtml(item.description)}</p>
            <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Check the source <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
        </article>`;
}

function renderSeasonalItem(item) {
    return `
        <article class="seasonal-event-card">
            <div><span aria-hidden="true">${item.icon}</span><strong>${escapeHtml(item.monthLabel)}</strong></div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="seasonal-event-card__region">${escapeHtml(item.region)}</p>
            <p>${escapeHtml(item.description)}</p>
            ${item.sourceUrl ? `<a class="seasonal-event-card__source" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.sourceLabel || 'Planning source')} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>` : ''}
        </article>`;
}

function fillSelects(events, countrySelect, typeSelect) {
    const countries = [...new Set(events.map(event => event.country))];
    countrySelect.innerHTML = `<option value="all">All listed countries</option>${countries.map(id => {
        const meta = COUNTRY_META[id];
        return `<option value="${id}">${meta?.flag || ''} ${escapeHtml(meta?.name || id)}</option>`;
    }).join('')}`;
    typeSelect.innerHTML = `<option value="all">All event types</option>${[...new Set(events.map(event => event.type))].map(type => `<option value="${type}">${TYPE_LABELS[type] || type}</option>`).join('')}`;
}

export function initEvents() {
    const grid = document.getElementById('events-grid');
    const form = document.getElementById('events-filter-form');
    if (!grid || !form) return;

    const startInput = document.getElementById('events-start-date');
    const endInput = document.getElementById('events-end-date');
    const countrySelect = document.getElementById('events-country-filter');
    const typeSelect = document.getElementById('events-type-filter');
    const count = document.getElementById('events-count');
    const summary = document.getElementById('events-results-summary');
    const empty = document.getElementById('events-empty-state');
    const seasonalGrid = document.getElementById('wildlife-calendar');
    const today = toDateOnly();

    startInput.min = today;
    endInput.min = today;
    startInput.value = today;
    endInput.value = addDays(today, eventsData.meta.defaultWindowDays);
    fillSelects(eventsData.events, countrySelect, typeSelect);
    document.getElementById('events-watchlist').innerHTML = eventsData.watchlist.map(renderWatchItem).join('');
    document.getElementById('events-disclaimer').textContent = `${eventsData.meta.disclaimer} Calendar reviewed ${formatDate(eventsData.meta.lastUpdated)}.`;

    const render = () => {
        if (endInput.value && startInput.value && endInput.value < startInput.value) endInput.value = startInput.value;
        endInput.min = startInput.value || today;
        const filters = { startDate: startInput.value, endDate: endInput.value, country: countrySelect.value, type: typeSelect.value };
        const matches = filterConfirmedEvents(eventsData.events, filters, today);
        const seasonal = filterSeasonalHighlights(wildlifeCalendar.highlights, filters);
        grid.innerHTML = matches.map(renderEventCard).join('');
        seasonalGrid.innerHTML = seasonal.map(renderSeasonalItem).join('');
        count.textContent = String(matches.length);
        summary.textContent = matches.length
            ? `${matches.length} confirmed ${matches.length === 1 ? 'event overlaps' : 'events overlap'} your selected dates.`
            : 'No confirmed event currently overlaps your selected dates.';
        grid.hidden = matches.length === 0;
        empty.hidden = matches.length !== 0;
        document.getElementById('seasonal-result-count').textContent = String(seasonal.length);
    };

    form.addEventListener('change', render);
    form.addEventListener('reset', () => window.setTimeout(() => {
        startInput.value = today;
        endInput.value = addDays(today, eventsData.meta.defaultWindowDays);
        render();
    }, 0));
    form.querySelectorAll('[data-event-window]').forEach(button => button.addEventListener('click', () => {
        const days = button.dataset.eventWindow;
        startInput.value = today;
        endInput.value = days === 'all' ? '2027-12-31' : addDays(today, Number(days));
        render();
    }));
    render();
}
