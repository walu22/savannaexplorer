import packingData from '../../data/packing.json';
import practical from '../../data/practical.json';
import { fetchLiveCurrencyRates, fetchCityWeather, apiCodeForCurrency } from './transport-logistics.js';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const SEASON_CLASS = { peak: 's-peak', shoulder: 's-shoulder', off: 's-off' };

/** @type {Record<string, number> | null} */
let liveRatesByBase = null;

function updatePackProgress() {
    const total = document.querySelectorAll('#hub-pack-list input[type="checkbox"]').length;
    const checked = document.querySelectorAll('#hub-pack-list input[type="checkbox"]:checked').length;
    const fill = document.getElementById('pack-progress');
    const text = document.getElementById('pack-progress-text');
    if (fill) fill.style.width = total ? `${(checked / total) * 100}%` : '0%';
    if (text) text.textContent = `${checked} of ${total} packed`;
}

function renderPackList(type) {
    const list = document.getElementById('hub-pack-list');
    if (!list) return;
    const items = packingData[type] || packingData.safari;
    list.innerHTML = items.map(item =>
        `<label class="hub-pack-item"><input type="checkbox"> <span>${item}</span></label>`
    ).join('');
    updatePackProgress();
}

function renderCurrency() {
    const select = document.getElementById('hub-from-currency');
    const results = document.getElementById('hub-results');
    const note = document.getElementById('hub-currency-note');
    if (!select || !results) return;

    const { currency } = practical;
    select.innerHTML = currency.baseCurrencies.map(c =>
        `<option value="${c.code}">${c.label}</option>`
    ).join('');

    results.innerHTML = currency.rates.map(row => {
        const attrs = Object.entries(row.rates)
            .map(([code, rate]) => `data-rate-${code.toLowerCase()}="${rate}"`)
            .join(' ');
        return `<div class="hub-cur-row" data-currency-code="${row.code}"><span class="hub-flag">${row.flag}</span><span class="hub-cur-name">${row.name}</span><span class="hub-cur-val" ${attrs}>—</span></div>`;
    }).join('');

    if (note) {
        note.innerHTML = `<span id="hub-currency-status">${currency.note}</span> · Verified <time datetime="${currency.lastVerified}">${currency.lastVerified}</time> · <a href="${currency.sourceUrl}" target="_blank" rel="noopener noreferrer">${currency.sourceLabel}</a>`;
    }
}

async function loadLiveCurrencyRates() {
    const status = document.getElementById('hub-currency-status');
    const bases = practical.currency.baseCurrencies.map(c => c.code);
    liveRatesByBase = {};

    for (const base of bases) {
        try {
            const rates = await fetchLiveCurrencyRates(base);
            liveRatesByBase[base] = rates;

            document.querySelectorAll('.hub-cur-row').forEach(row => {
                const targetCode = apiCodeForCurrency(row.dataset.currencyCode);
                const rate = rates[targetCode];
                if (rate) {
                    row.querySelector('.hub-cur-val')?.setAttribute(`data-rate-${base.toLowerCase()}`, String(rate));
                }
            });
        } catch {
            // keep static fallback rates for this base
        }
    }

    updateCurrency();
    if (status && Object.keys(liveRatesByBase).length) {
        status.textContent = `Live mid-market rates loaded (${practical.currency.liveApiLabel}). Confirm with your bank before exchanging.`;
    }
}

function renderVisaMatrix() {
    const matrix = document.getElementById('hub-visa-matrix');
    const notes = document.getElementById('hub-visa-notes');
    if (!matrix) return;

    matrix.innerHTML = practical.visaHealth.map(row => `
        <div class="hub-matrix-row" data-country="${row.name.toLowerCase()} ${row.id}">
            <span>${row.flag} ${row.name}</span>
            <span class="badge badge--${row.visa.badgeClass}">${row.visa.label}</span>
            <span class="badge badge--${row.health.badgeClass}">${row.health.label}</span>
            <span class="badge badge--${row.advisory.badgeClass}">${row.advisory.label}</span>
        </div>
    `).join('');

    if (notes) {
        notes.innerHTML = practical.visaHealth.map(row => `
            <details class="hub-visa-detail">
                <summary>${row.flag} ${row.name} — <a href="${row.sourceUrl}" target="_blank" rel="noopener noreferrer">Official source</a> · verified ${row.lastVerified}</summary>
                <p>${row.note}</p>
            </details>
        `).join('');
    }
}

function renderSeasons() {
    const grid = document.getElementById('hub-season-grid');
    if (!grid) return;

    const head = `<div class="season-head"><span></span>${MONTH_LABELS.map(m => `<span>${m}</span>`).join('')}</div>`;
    const rows = practical.seasons.countries.map(country => `
        <div class="season-row">
            <span>${country.label}</span>
            ${country.months.map(m => `<span class="${SEASON_CLASS[m] || ''}"></span>`).join('')}
        </div>
    `).join('');

    grid.innerHTML = head + rows;
}

function renderWeather() {
    const grid = document.getElementById('hub-weather-grid');
    const note = document.getElementById('hub-weather-note');
    if (!grid) return;

    const { weather } = practical;
    grid.innerHTML = weather.cities.map((city, index) => `
        <div class="weather-city" data-weather-index="${index}">
            <span class="weather-flag">${city.flag}</span>
            <span class="weather-name">${city.name}</span>
            <span class="weather-temp">${city.temp}</span>
            <span class="weather-icon">${city.icon}</span>
        </div>
    `).join('');

    if (note) {
        note.innerHTML = `<span id="hub-weather-status">${weather.label}</span> · Verified ${weather.lastVerified} · <a href="${weather.sourceUrl}" target="_blank" rel="noopener noreferrer">${weather.sourceLabel}</a>`;
    }
}

async function loadLiveWeather() {
    const { weather } = practical;
    const status = document.getElementById('hub-weather-status');
    let liveCount = 0;

    await Promise.all(weather.cities.map(async (city, index) => {
        if (city.lat == null || city.lon == null) return;
        try {
            const live = await fetchCityWeather(city.lat, city.lon);
            const el = document.querySelector(`.weather-city[data-weather-index="${index}"]`);
            if (!el) return;
            el.querySelector('.weather-temp').textContent = `${live.temp}°C`;
            el.querySelector('.weather-icon').textContent = live.icon;
            el.classList.add('weather-city--live');
            liveCount += 1;
        } catch {
            // keep static fallback
        }
    }));

    if (status && liveCount > 0) {
        status.textContent = `Live now at ${liveCount} capitals (${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`;
    }
}

function renderEmergencies() {
    const list = document.getElementById('hub-emergency-list');
    if (!list) return;

    list.innerHTML = practical.emergencies.map(row => `
        <div class="emg-row">
            <span class="emg-flag">${row.flag}</span>
            <span class="emg-country">${row.country}</span>
            <span class="emg-nums">${row.numbers}</span>
            <a class="emg-source" href="${row.sourceUrl}" target="_blank" rel="noopener noreferrer" title="Official source · verified ${row.lastVerified}">Source</a>
        </div>
    `).join('');
}

function renderDisclaimer() {
    const el = document.getElementById('hub-disclaimer');
    if (el) el.textContent = practical.meta.disclaimer;
}

function updateCurrency() {
    const amount = parseFloat(document.getElementById('hub-amount')?.value) || 0;
    const from = document.getElementById('hub-from-currency')?.value || 'USD';
    const rateKey = `rate${from.toLowerCase()}`;

    document.querySelectorAll('.hub-cur-val').forEach(el => {
        const rate = parseFloat(el.dataset[rateKey]) || 0;
        const result = amount * rate;
        el.textContent = result.toLocaleString('en-US', {
            minimumFractionDigits: result > 1000 ? 0 : 2,
            maximumFractionDigits: result > 1000 ? 0 : 2,
        });
    });
}

export function initUtilityHub() {
    renderCurrency();
    renderVisaMatrix();
    renderSeasons();
    renderWeather();
    renderEmergencies();
    renderDisclaimer();
    renderPackList('safari');
    updateCurrency();
    loadLiveCurrencyRates();
    loadLiveWeather();

    document.getElementById('hub-amount')?.addEventListener('input', updateCurrency);
    document.getElementById('hub-from-currency')?.addEventListener('change', updateCurrency);

    document.getElementById('hub-visa-search')?.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        document.querySelectorAll('.hub-matrix-row').forEach(row => {
            const country = row.getAttribute('data-country') || '';
            row.style.display = country.includes(q) ? '' : 'none';
        });
        document.querySelectorAll('.hub-visa-detail').forEach(detail => {
            const text = detail.textContent.toLowerCase();
            detail.style.display = !q || text.includes(q) ? '' : 'none';
        });
    });

    document.getElementById('hub-pack-list')?.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) updatePackProgress();
    });

    document.querySelectorAll('.hub-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderPackList(this.dataset.pack);
        });
    });
}
