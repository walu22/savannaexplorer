import eventsData from '../../data/events.json';
import wildlifeCalendar from '../../data/wildlife-calendar.json';
import { COUNTRY_META } from '../lib/country-meta.js';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TYPE_ICONS = {
    culture: 'fa-masks-theater',
    wildlife: 'fa-paw',
    music: 'fa-music',
    food: 'fa-utensils',
    nature: 'fa-mountain-sun',
    adventure: 'fa-person-hiking',
    travel: 'fa-route',
};

function renderWildlifeCalendar() {
    const el = document.getElementById('wildlife-calendar');
    if (!el) return;

    const cards = wildlifeCalendar.highlights.map(item => `
        <article class="wildlife-cal-card" data-months="${item.months.join(' ')}">
            <div class="wildlife-cal-top">
                <span class="wildlife-cal-icon">${item.icon}</span>
                <span class="wildlife-cal-when">${item.monthLabel}</span>
            </div>
            <h3>${item.title}</h3>
            <p class="wildlife-cal-region">${item.region}</p>
            <p class="wildlife-cal-desc">${item.description}</p>
        </article>
    `).join('');

    el.innerHTML = `
        <div class="wildlife-cal-header">
            <h3>Wildlife &amp; nature calendar</h3>
            <p>${wildlifeCalendar.meta.disclaimer}</p>
        </div>
        <div class="wildlife-cal-grid">${cards}</div>
    `;
}

function renderEventCard(event) {
    const meta = COUNTRY_META[event.country] || {};
    const icon = TYPE_ICONS[event.type] || 'fa-calendar';
    return `
        <article class="event-card" data-country="${event.country}" data-months="${event.months.join(' ')}">
            <div class="event-card-top">
                <span class="event-type"><i class="fas ${icon}"></i> ${event.type}</span>
                <span class="event-when">${event.when}</span>
            </div>
            <h3>${event.name}</h3>
            <p class="event-location">${meta.flag || ''} ${event.location}</p>
            <p class="event-desc">${event.description}</p>
        </article>
    `;
}

export function initEvents() {
    const grid = document.getElementById('events-grid');
    const monthFilter = document.getElementById('events-month-filter');
    const countryFilter = document.getElementById('events-country-filter');
    const disclaimer = document.getElementById('events-disclaimer');
    const countEl = document.getElementById('events-count');
    if (!grid) return;

    renderWildlifeCalendar();

    const events = eventsData.events;

    if (countEl) countEl.textContent = events.length;
    if (disclaimer) disclaimer.textContent = eventsData.meta.disclaimer;

    if (monthFilter) {
        monthFilter.innerHTML = MONTHS.map((m, i) =>
            `<option value="${i === 0 ? 'all' : i}">${m}</option>`
        ).join('');
    }

    if (countryFilter) {
        const countryIds = [...new Set(events.map(e => e.country))];
        countryFilter.innerHTML = `
            <option value="all">All countries</option>
            ${countryIds.map(id => {
                const m = COUNTRY_META[id];
                return `<option value="${id}">${m?.flag || ''} ${m?.name || id}</option>`;
            }).join('')}
        `;
    }

    grid.innerHTML = events.map(renderEventCard).join('');

    function applyFilters() {
        const month = monthFilter?.value || 'all';
        const country = countryFilter?.value || 'all';
        grid.querySelectorAll('.event-card').forEach(card => {
            const months = card.dataset.months || '';
            const monthMatch = month === 'all' || months.split(' ').includes(month);
            const countryMatch = country === 'all' || card.dataset.country === country;
            card.classList.toggle('hidden', !(monthMatch && countryMatch));
        });
    }

    monthFilter?.addEventListener('change', applyFilters);
    countryFilter?.addEventListener('change', applyFilters);
}
