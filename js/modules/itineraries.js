import itineraryData from '../../data/itineraries.json';
import {
    formatBudgetDetail,
    formatBudgetLabel,
    getArrangeYourself,
    getPlanningNotes,
} from '../lib/planning-format.js';
import { renderBudgetBreakdownHtml } from '../lib/itinerary-budget.js';

let currentItineraryId = null;
let activeScopeFilter = 'all';

function renderItineraryGrid() {
    const grid = document.querySelector('.itinerary-grid');
    if (!grid) return;

    grid.innerHTML = Object.entries(itineraryData)
        .filter(([, data]) => {
            if (activeScopeFilter === 'all') return true;
            return data.scope === activeScopeFilter;
        })
        .map(([id, data]) => {
            const scopeLabel = data.scope === 'single' ? 'Single Country' : 'Cross-Border';
            const scopeClass = data.scope === 'single' ? 'itinerary-scope--single' : 'itinerary-scope--multi';
            const budgetLabel = formatBudgetLabel(data);
            return `
        <article class="itinerary-card" data-itinerary-id="${id}" data-scope="${data.scope || 'multi'}">
            <div class="itinerary-header">
                <span class="itinerary-type">${data.type}</span>
                <span class="itinerary-scope ${scopeClass}">${scopeLabel}</span>
                <span class="itinerary-tag">${data.duration}</span>
                <h3>${data.title}</h3>
                <p>${data.countries}</p>
            </div>
            <p class="itinerary-blurb">${data.description}</p>
            <div class="itinerary-meta">
                <span><i class="far fa-clock"></i> ${data.duration}</span>
                ${budgetLabel ? `<span><i class="fas fa-coins"></i> ${budgetLabel}</span>` : ''}
            </div>
            <p class="itinerary-template-note">Planning template — not a package or quote.</p>
            <div class="itinerary-actions">
                <button type="button" class="btn btn-primary" data-action="view-itinerary" data-itinerary-id="${id}">View Route</button>
            </div>
        </article>
    `;
        }).join('');
}

function setScopeFilter(scope) {
    activeScopeFilter = scope;
    document.querySelectorAll('.itinerary-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scope === scope);
    });
    renderItineraryGrid();
}

function openPlanningTools() {
    closeItineraryModal();
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleAccordion(btn) {
    const body = btn.nextElementSibling;
    const isOpen = body.classList.contains('open');
    btn.closest('.itin-accordion').querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
    btn.closest('.itin-accordion').querySelectorAll('.accordion-header').forEach(h => h.setAttribute('aria-expanded', 'false'));
    if (!isOpen) {
        body.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    }
}

export function openItineraryDetail(id) {
    const data = itineraryData[id];
    if (!data) return;
    currentItineraryId = id;

    document.getElementById('itin-type').textContent = data.type;
    document.getElementById('itin-title').textContent = data.title;
    document.getElementById('itin-countries').textContent = data.countries;
    document.getElementById('itin-duration').innerHTML = `<i class="far fa-clock"></i> ${data.duration}`;

    const budgetDetail = formatBudgetDetail(data);
    const priceEl = document.getElementById('itin-price');
    if (priceEl) {
        priceEl.innerHTML = budgetDetail
            ? `<i class="fas fa-coins"></i> ${budgetDetail}`
            : '';
    }

    const budgetNoteEl = document.getElementById('itin-budget-note');
    if (budgetNoteEl) {
        budgetNoteEl.textContent = budgetDetail
            ? 'Indicative budget for trip planning — not a price quote. Book transport, lodges, and activities directly.'
            : '';
        budgetNoteEl.hidden = !budgetDetail;
    }

    document.getElementById('itin-customizable').innerHTML = data.customizable
        ? '<i class="fas fa-sliders-h"></i> Adapt to your dates'
        : '<i class="fas fa-route"></i> Suggested pacing';
    document.getElementById('itin-description').textContent = data.description;

    const mapBlock = document.getElementById('itin-route-map');
    const mapImg = document.getElementById('itin-map-img');
    const mapCaption = document.getElementById('itin-map-caption');
    if (data.mapImage && mapBlock && mapImg) {
        mapImg.src = data.mapImage;
        mapImg.alt = `${data.title} route overview`;
        if (mapCaption) mapCaption.textContent = data.mapCaption || '';
        mapBlock.hidden = false;
    } else if (mapBlock) {
        mapBlock.hidden = true;
    }

    document.getElementById('itin-highlights').innerHTML = `
        <h4>Highlights</h4>
        <ul>${data.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    `;

    document.getElementById('itin-accordion').innerHTML = data.days.map((day, i) => `
        <div class="accordion-item">
            <button class="accordion-header" data-accordion aria-expanded="${i === 0}">
                <span class="accordion-day">${day.range}</span>
                <span class="accordion-title">${day.title}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="accordion-body${i === 0 ? ' open' : ''}">
                <p class="accordion-places"><i class="fas fa-map-marker-alt"></i> ${day.places}</p>
                <p>${day.narrative}</p>
            </div>
        </div>
    `).join('');

    document.getElementById('itin-planning-notes').innerHTML = getPlanningNotes(data).map(i => `<li>${i}</li>`).join('');
    document.getElementById('itin-arrange-yourself').innerHTML = getArrangeYourself(data).map(i => `<li>${i}</li>`).join('');

    const budgetEl = document.getElementById('itin-budget-breakdown');
    if (budgetEl) {
        budgetEl.innerHTML = renderBudgetBreakdownHtml(id);
        budgetEl.hidden = !budgetEl.innerHTML.trim();
    }

    document.getElementById('itinerary-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeItineraryModal() {
    document.getElementById('itinerary-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentItineraryId = null;
}

export function initItineraries() {
    renderItineraryGrid();

    document.querySelectorAll('.itinerary-filter').forEach(btn => {
        btn.addEventListener('click', () => setScopeFilter(btn.dataset.scope));
    });

    document.querySelectorAll('.itin-close').forEach(btn => {
        btn.addEventListener('click', closeItineraryModal);
    });

    document.getElementById('itin-plan-tools')?.addEventListener('click', openPlanningTools);

    document.getElementById('itinerary-modal')?.addEventListener('click', (e) => {
        const accordionBtn = e.target.closest('[data-accordion]');
        if (accordionBtn) toggleAccordion(accordionBtn);
    });

    document.querySelector('.itinerary-grid')?.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-action="view-itinerary"]');
        if (viewBtn) openItineraryDetail(viewBtn.dataset.itineraryId);
    });
}
