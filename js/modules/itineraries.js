import itineraryData from '../../data/itineraries.json';
import { CONFIG } from '../config.js';

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
                <span><i class="fas fa-tag"></i> From ${data.priceFrom}</span>
            </div>
            <div class="itinerary-actions">
                <button type="button" class="btn btn-primary" data-action="view-itinerary" data-itinerary-id="${id}">View Route</button>
                <button type="button" class="btn btn-outline" data-action="inquire-journey" data-journey-name="${data.title}" data-journey-route="${data.countries}"><i class="fab fa-whatsapp"></i> Inquire</button>
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

export function inquireJourney(journeyName, route) {
    const msg = encodeURIComponent(
        `Hi! I'm interested in the "${journeyName}" journey (${route}) from Savanna Explorer. Could you help me plan this trip?`
    );
    window.open(`https://wa.me/${CONFIG.supportPhone}?text=${msg}`, '_blank');
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

function openItineraryDetail(id) {
    const data = itineraryData[id];
    if (!data) return;
    currentItineraryId = id;

    document.getElementById('itin-type').textContent = data.type;
    document.getElementById('itin-title').textContent = data.title;
    document.getElementById('itin-countries').textContent = data.countries;
    document.getElementById('itin-duration').innerHTML = `<i class="far fa-clock"></i> ${data.duration}`;
    document.getElementById('itin-price').innerHTML = `<i class="fas fa-tag"></i> From ${data.priceFrom}`;
    document.getElementById('itin-customizable').innerHTML = data.customizable
        ? '<i class="fas fa-sliders-h"></i> Fully Customizable'
        : '<i class="fas fa-lock"></i> Fixed Departure';
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

    document.getElementById('itin-included').innerHTML = data.included.map(i => `<li>${i}</li>`).join('');
    document.getElementById('itin-excluded').innerHTML = data.excluded.map(i => `<li>${i}</li>`).join('');

    document.getElementById('itinerary-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeItineraryModal() {
    document.getElementById('itinerary-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentItineraryId = null;
}

function requestItineraryQuote() {
    const data = itineraryData[currentItineraryId];
    closeItineraryModal();
    if (data) {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        const msg = document.getElementById('q-message');
        if (msg) msg.value = `I'm interested in the "${data.title}" itinerary (${data.duration}, ${data.countries}).`;
    }
}

export function initItineraries() {
    renderItineraryGrid();

    document.querySelectorAll('.itinerary-filter').forEach(btn => {
        btn.addEventListener('click', () => setScopeFilter(btn.dataset.scope));
    });

    document.querySelectorAll('.itin-close').forEach(btn => {
        btn.addEventListener('click', closeItineraryModal);
    });

    document.getElementById('itin-whatsapp-btn')?.addEventListener('click', () => {
        const data = itineraryData[currentItineraryId];
        if (data) inquireJourney(data.title, data.countries);
    });

    document.getElementById('itin-request-quote')?.addEventListener('click', requestItineraryQuote);

    document.getElementById('itinerary-modal')?.addEventListener('click', (e) => {
        const accordionBtn = e.target.closest('[data-accordion]');
        if (accordionBtn) toggleAccordion(accordionBtn);
    });

    document.querySelector('.itinerary-grid')?.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-action="view-itinerary"]');
        if (viewBtn) {
            openItineraryDetail(viewBtn.dataset.itineraryId);
            return;
        }
        const inquireBtn = e.target.closest('[data-action="inquire-journey"]');
        if (inquireBtn) {
            inquireJourney(inquireBtn.dataset.journeyName, inquireBtn.dataset.journeyRoute);
        }
    });
}
