import { COUNTRY_META, COUNTRY_ORDER, cardImageUrl } from '../lib/country-meta.js';

const TAGLINES = {
    namibia: 'A Realm of Endless Horizons',
    'south-africa': 'A World in One Country',
    botswana: 'The Pristine Heart of the Wild',
    zambia: 'The Spirit of the Real Africa',
    zimbabwe: 'A World of Wonders',
    mozambique: 'Tropical Shores & Vibrant Fusion',
    malawi: 'The Warm Heart of Africa',
    lesotho: 'The Kingdom in the Sky',
    eswatini: 'Africa in a Nutshell',
};

function renderCountryCard(countryId) {
    const data = COUNTRY_META[countryId];
    if (!data) return '';
    const image = cardImageUrl(countryId);

    return `
        <a class="country-card" data-country-id="${countryId}" href="/countries/${countryId}">
            <div class="country-card-media">
                <img src="${image}" alt="${data.name}" loading="lazy">
                <span class="country-card-flag">${data.flag}</span>
            </div>
            <div class="country-card-body">
                <h3>${data.name}</h3>
                <p class="country-card-tagline">${TAGLINES[countryId]}</p>
                <p class="country-card-highlights">${data.highlights}</p>
                <span class="country-card-link">Explore country <i class="fas fa-arrow-right"></i></span>
            </div>
        </a>
    `;
}

export function initDestinations() {
    const grid = document.getElementById('destinations-grid');
    if (!grid) return;
    grid.innerHTML = COUNTRY_ORDER.map(renderCountryCard).join('');
}
