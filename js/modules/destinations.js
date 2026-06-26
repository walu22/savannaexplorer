import countries from '../../data/countries.json';
import { COUNTRY_ORDER, cardImageUrl } from '../lib/country-meta.js';

function renderCountryCard(countryId) {
    const data = countries[countryId];
    if (!data) return '';
    const meta = cardImageUrl(countryId);

    return `
        <article class="country-card" data-country-id="${countryId}">
            <div class="country-card-media">
                <img src="${meta}" alt="${data.name}" loading="lazy">
                <span class="country-card-flag">${getFlag(countryId)}</span>
            </div>
            <div class="country-card-body">
                <h3>${data.name}</h3>
                <p class="country-card-tagline">${data.tagline}</p>
                <p class="country-card-highlights">${getHighlights(countryId)}</p>
                <span class="country-card-link">Explore country <i class="fas fa-arrow-right"></i></span>
            </div>
        </article>
    `;
}

function getFlag(countryId) {
    const flags = {
        'south-africa': '🇿🇦', namibia: '🇳🇦', botswana: '🇧🇼', zambia: '🇿🇲',
        zimbabwe: '🇿🇼', mozambique: '🇲🇿', malawi: '🇲🇼', lesotho: '🇱🇸', eswatini: '🇸🇿',
    };
    return flags[countryId] || '🌍';
}

function getHighlights(countryId) {
    const fromMeta = {
        'south-africa': 'Kruger Park • Cape Town • Garden Route • Drakensberg • Winelands',
        namibia: 'Sossusvlei • Etosha • Fish River Canyon • Skeleton Coast • Swakopmund',
        botswana: 'Okavango Delta • Chobe • Moremi • Makgadikgadi • Central Kalahari',
        zambia: 'Victoria Falls • South Luangwa • Lower Zambezi • Kafue • Lake Kariba',
        zimbabwe: 'Victoria Falls • Hwange • Mana Pools • Lake Kariba • Matobo Hills',
        mozambique: 'Bazaruto • Tofo Beach • Gorongosa • Maputo • Ibo Island',
        malawi: 'Lake Malawi • Mount Mulanje • Liwonde • Majete • Nyika Plateau',
        lesotho: 'Maletsunyane Falls • Sani Pass • Sehlabathebe • Thaba Bosiu • Katse Dam',
        eswatini: 'Hlane Royal Park • Mlilwane • Mantenga Village • Mkhaya • Ezulwini',
    };
    if (fromMeta[countryId]) return fromMeta[countryId];
    const data = countries[countryId];
    return data?.spots?.slice(0, 4).map(s => s.name).join(' • ') || '';
}

export function initDestinations() {
    const grid = document.getElementById('destinations-grid');
    if (!grid) return;
    grid.innerHTML = COUNTRY_ORDER.map(renderCountryCard).join('');
}
