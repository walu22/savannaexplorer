import practical from '../../../data/practical.json';
import { fetchCityWeather } from '../transport-logistics.js';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const SEASON_CLASS = { peak: 's-peak', shoulder: 's-shoulder', off: 's-off' };

let weatherLoaded = false;

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
    if (weatherLoaded) return;
    weatherLoaded = true;

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
            /* keep static fallback */
        }
    }));

    if (status && liveCount > 0) {
        status.textContent = `Live now at ${liveCount} capitals (${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`;
    }
}

export function initHubSeasonsWeather() {
    renderSeasons();
    renderWeather();
    loadLiveWeather();
}
