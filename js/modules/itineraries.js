import itineraryData from '../../data/itineraries.json';
import { CONFIG } from '../config.js';

let currentItineraryId = null;

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
