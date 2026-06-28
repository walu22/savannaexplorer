import transport from '../../data/transport.json';
import practical from '../../data/practical.json';

const LIVE_CURRENCY_API = 'https://open.er-api.com/v6/latest/';
const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

/** ISO codes used by ExchangeRate-API where our display code differs */
const CURRENCY_API_CODES = {
    ZIG: 'ZWG',
};

const WEATHER_ICONS = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌦️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function weatherIcon(code) {
    if (WEATHER_ICONS[code] !== undefined) return WEATHER_ICONS[code];
    if (code >= 56 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    return '⛅';
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderGatewayCard(gateway) {
    return `
        <article class="transport-card transport-card--compact">
            <div class="transport-card-head">
                <span class="transport-flag">${gateway.flag}</span>
                <div>
                    <h4>${escapeHtml(gateway.city)} <span class="transport-code">${gateway.code}</span></h4>
                    <p class="transport-meta">${escapeHtml(gateway.role)}</p>
                </div>
            </div>
            <a class="data-source-link" href="${gateway.url}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(gateway.linkLabel)} <i class="fas fa-external-link-alt"></i>
            </a>
        </article>
    `;
}

function renderRouteCard(route) {
    return `
        <article class="transport-card">
            <h4>${escapeHtml(route.title)}</h4>
            <p class="transport-region">${escapeHtml(route.region)}</p>
            <p class="transport-desc">${escapeHtml(route.description)}</p>
            <p class="transport-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(route.planningTip)}</p>
            <a class="data-source-link data-source-link--primary" href="${route.url}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(route.linkLabel)} <i class="fas fa-external-link-alt"></i>
            </a>
        </article>
    `;
}

function renderCarCard(item) {
    return `
        <article class="transport-card">
            <div class="transport-card-head">
                <span class="transport-flag">${item.flag}</span>
                <h4>${escapeHtml(item.title)}</h4>
            </div>
            <p class="transport-desc">${escapeHtml(item.description)}</p>
            <p class="transport-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(item.planningTip)}</p>
            <a class="data-source-link data-source-link--primary" href="${item.url}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(item.linkLabel)} <i class="fas fa-external-link-alt"></i>
            </a>
        </article>
    `;
}

function renderSimCard(item) {
    return `
        <article class="transport-card transport-card--compact">
            <div class="transport-card-head">
                <span class="transport-flag">${item.flag}</span>
                <div>
                    <h4>${escapeHtml(item.operator)}</h4>
                    <p class="transport-desc">${escapeHtml(item.description)}</p>
                </div>
            </div>
            <p class="transport-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(item.planningTip)}</p>
            <a class="data-source-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(item.linkLabel)} <i class="fas fa-external-link-alt"></i>
            </a>
        </article>
    `;
}

function renderCrossBorderChecklist() {
    const { vehicleCrossBorder: vb } = transport;
    const list = document.getElementById('transport-crossborder-list');
    const resources = document.getElementById('transport-crossborder-resources');
    if (!list) return;

    list.innerHTML = vb.items.map(item =>
        `<label class="hub-pack-item transport-check-item"><input type="checkbox"> <span>${escapeHtml(item)}</span></label>`
    ).join('');

    if (resources) {
        resources.innerHTML = vb.resources.map(res => {
            const attrs = res.internal
                ? `href="${res.url}"`
                : `href="${res.url}" target="_blank" rel="noopener noreferrer"`;
            return `<a class="transport-resource-link" ${attrs}>${escapeHtml(res.label)}${res.internal ? '' : ' <i class="fas fa-external-link-alt"></i>'}</a>`;
        }).join('');
    }
}

function updateCrossBorderProgress() {
    const total = document.querySelectorAll('#transport-crossborder-list input[type="checkbox"]').length;
    const checked = document.querySelectorAll('#transport-crossborder-list input[type="checkbox"]:checked').length;
    const text = document.getElementById('transport-crossborder-progress');
    if (text) text.textContent = `${checked} of ${total} ready`;
}

function renderBorderStatusLinks() {
    const el = document.getElementById('transport-border-links');
    if (!el) return;

    el.innerHTML = transport.borderStatus.links.map(link => {
        const attrs = link.internal
            ? `href="${link.url}"`
            : `href="${link.url}" target="_blank" rel="noopener noreferrer"`;
        return `
            <div class="transport-border-row">
                <a ${attrs}><strong>${escapeHtml(link.name)}</strong></a>
                <span>${escapeHtml(link.note)}</span>
            </div>
        `;
    }).join('');
}

function initTransportTabs() {
    const tabs = document.querySelectorAll('.transport-tab');
    const panels = document.querySelectorAll('.transport-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.transportTab;
            tabs.forEach(t => t.classList.toggle('active', t === tab));
            panels.forEach(panel => {
                const isActive = panel.id === `transport-panel-${target}`;
                panel.classList.toggle('active', isActive);
                panel.hidden = !isActive;
            });
        });
    });
}

function renderTransportHub() {
    const gatewaysEl = document.getElementById('transport-gateways');
    const routesEl = document.getElementById('transport-routes');
    const carEl = document.getElementById('transport-car-rental');
    const simEl = document.getElementById('transport-sim');

    if (gatewaysEl) gatewaysEl.innerHTML = transport.gateways.map(renderGatewayCard).join('');
    if (routesEl) routesEl.innerHTML = transport.domesticRoutes.map(renderRouteCard).join('');
    if (carEl) carEl.innerHTML = transport.carRental.map(renderCarCard).join('');
    if (simEl) simEl.innerHTML = transport.mobileSim.map(renderSimCard).join('');

    renderCrossBorderChecklist();
    renderBorderStatusLinks();

    const disclaimer = document.getElementById('transport-disclaimer');
    if (disclaimer) disclaimer.textContent = transport.meta.disclaimer;
}

export async function fetchLiveCurrencyRates(baseCode = 'USD') {
    const url = `${LIVE_CURRENCY_API}${encodeURIComponent(baseCode)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Currency API ${response.status}`);
    const data = await response.json();
    if (data.result !== 'success' || !data.rates) throw new Error('Invalid currency response');
    return data.rates;
}

export function apiCodeForCurrency(code) {
    return CURRENCY_API_CODES[code] || code;
}

export async function fetchCityWeather(lat, lon) {
    const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: 'temperature_2m,weather_code',
        timezone: 'auto',
    });
    const response = await fetch(`${OPEN_METEO_API}?${params}`);
    if (!response.ok) throw new Error(`Weather API ${response.status}`);
    const data = await response.json();
    const current = data.current;
    if (!current) throw new Error('No current weather');
    return {
        temp: Math.round(current.temperature_2m),
        icon: weatherIcon(current.weather_code),
        live: true,
    };
}

export function initTransportLogistics() {
    renderTransportHub();
    initTransportTabs();

    document.getElementById('transport-crossborder-list')?.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) updateCrossBorderProgress();
    });
    updateCrossBorderProgress();
}

export { weatherIcon };
