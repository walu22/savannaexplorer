import transport from '../../data/transport.json';
import crossBorder from '../../data/cross-border.json';
import practical from '../../data/practical.json';
import vehicleBorderFees from '../../data/vehicle-border-fees.json';
import vehicleRental from '../../data/vehicle-rental.json';
import vetImportRules from '../../data/vet-import-rules.json';

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

function renderCrossBorderGuides() {
    const el = document.getElementById('transport-crossborder-guides');
    if (!el) return;

    el.innerHTML = `
        <h3 class="transport-subheading">In-depth cross-border guides</h3>
        <p class="transport-panel-intro">${escapeHtml(crossBorder.meta.disclaimer)}</p>
        <div class="crossborder-guides-grid">
            ${crossBorder.guides.map(guide => {
                const facts = guide.facts.map(f =>
                    `<li><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(f.value)}</li>`
                ).join('');
                const sections = guide.sections.map(s => `
                    <div class="crossborder-guide-section">
                        <h5>${escapeHtml(s.heading)}</h5>
                        <p>${escapeHtml(s.body)}</p>
                        ${s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
                    </div>
                `).join('');
                return `
                    <article class="crossborder-guide-card" id="crossborder-${guide.id}">
                        <div class="crossborder-guide-head">
                            <span class="crossborder-guide-icon">${guide.icon}</span>
                            <div>
                                <h4>${escapeHtml(guide.title)}</h4>
                                <p class="crossborder-guide-summary">${escapeHtml(guide.summary)}</p>
                            </div>
                        </div>
                        <ul class="crossborder-guide-facts">${facts}</ul>
                        ${sections}
                        <a class="data-source-link" href="${guide.sourceUrl}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(guide.linkLabel)} · verified ${guide.lastVerified} <i class="fas fa-external-link-alt"></i>
                        </a>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderBorderFees() {
    const el = document.getElementById('transport-border-fees');
    if (!el) return;

    const rows = vehicleBorderFees.countries.map(country => {
        const feeLines = country.fees.map(f =>
            `<li><strong>${escapeHtml(f.type)}:</strong> ${escapeHtml(f.amount)} <span class="transport-fee-note">— ${escapeHtml(f.notes)}</span></li>`
        ).join('');
        return `
            <details class="transport-fee-country">
                <summary>${country.flag} ${escapeHtml(country.name)} <span class="transport-fee-currency">(${escapeHtml(country.currency)})</span></summary>
                <ul class="transport-fee-detail-list">${feeLines}</ul>
                <p class="transport-fee-note">${escapeHtml(country.tip)}</p>
            </details>
        `;
    }).join('');

    const insurance = vehicleBorderFees.insuranceNote;
    el.innerHTML = `
        <p class="hub-data-note">${escapeHtml(vehicleBorderFees.meta.disclaimer)}</p>
        ${rows}
        <p class="transport-fee-insurance"><strong>${escapeHtml(insurance.title)}</strong> — ${escapeHtml(insurance.body)}
            <a class="data-source-link" href="${insurance.sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(insurance.linkLabel)} <i class="fas fa-external-link-alt"></i></a>
        </p>
    `;
}

function renderVehicleFeesTable() {
    const el = document.getElementById('transport-vehicle-fees');
    if (!el) return;

    const cards = vehicleBorderFees.countries.map(country => {
        const feeRows = country.fees.map(f => `
            <tr>
                <td>${escapeHtml(f.type)}</td>
                <td>${escapeHtml(f.amount)}</td>
                <td class="transport-fee-note">${escapeHtml(f.notes)}</td>
            </tr>
        `).join('');
        return `
            <article class="vehicle-fee-card" id="vehicle-fees-${country.id}">
                <h4>${country.flag} ${escapeHtml(country.name)}</h4>
                <p class="transport-fee-currency">${escapeHtml(country.currency)} · verified ${country.lastVerified}</p>
                <table class="vehicle-fee-table">
                    <thead><tr><th>Fee type</th><th>Indicative amount</th><th>Notes</th></tr></thead>
                    <tbody>${feeRows}</tbody>
                </table>
                <p class="transport-fee-note">${escapeHtml(country.tip)}</p>
            </article>
        `;
    }).join('');

    el.innerHTML = `
        <h3 class="transport-subheading" id="transport-vehicle-fees-heading">Vehicle border fees by country</h3>
        <p class="transport-panel-intro">${escapeHtml(vehicleBorderFees.meta.disclaimer)}</p>
        <div class="vehicle-fee-grid">${cards}</div>
    `;
}

function renderVehicleRentalGuide() {
    const el = document.getElementById('transport-vehicle-rental-guide');
    if (!el) return;

    const types = vehicleRental.vehicleTypes.map(v => `
        <article class="vehicle-type-card">
            <h4>${v.icon} ${escapeHtml(v.type)}</h4>
            <p><strong>Best for:</strong> ${escapeHtml(v.bestFor)}</p>
            <p><strong>Avoid:</strong> ${escapeHtml(v.avoid)}</p>
            <p><strong>Typical cost:</strong> ${escapeHtml(v.typicalCost)}</p>
            <p class="transport-fee-note">${escapeHtml(v.notes)}</p>
        </article>
    `).join('');

    const countries = vehicleRental.countries.map(c => `
        <article class="transport-card transport-card--compact">
            <div class="transport-card-head">
                <span class="transport-flag">${c.flag}</span>
                <h4>${escapeHtml(c.title)}</h4>
            </div>
            <p class="transport-desc"><strong>Pick-up:</strong> ${escapeHtml(c.pickupHubs)}</p>
            <p class="transport-desc"><strong>Vehicle:</strong> ${escapeHtml(c.vehicleAdvice)}</p>
            <p class="transport-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(c.planningTip)}</p>
            <a class="data-source-link" href="${c.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.linkLabel)} <i class="fas fa-external-link-alt"></i></a>
        </article>
    `).join('');

    const letter = vehicleRental.crossBorderLetter;
    const waiver = vehicleRental.gravelWaiver;
    const kit = vehicleRental.kitList.map(item => `<li>${escapeHtml(item)}</li>`).join('');

    el.innerHTML = `
        <h3 class="transport-subheading">Self-drive rental &amp; overland guide</h3>
        <p class="transport-panel-intro">${escapeHtml(vehicleRental.intro)}</p>
        <p class="hub-data-note">${escapeHtml(vehicleRental.meta.disclaimer)}</p>
        <div class="vehicle-type-grid">${types}</div>
        <div class="vehicle-rental-columns">
            <article class="crossborder-guide-section">
                <h4>${escapeHtml(letter.title)}</h4>
                <p>${escapeHtml(letter.body)}</p>
                <ul>${letter.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
                <a class="data-source-link" href="${letter.sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(letter.linkLabel)} <i class="fas fa-external-link-alt"></i></a>
            </article>
            <article class="crossborder-guide-section">
                <h4>${escapeHtml(waiver.title)}</h4>
                <p>${escapeHtml(waiver.body)}</p>
                <ul>${waiver.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
            </article>
        </div>
        <h4 class="transport-aside-heading">Vehicle kit list</h4>
        <ul class="essentials-checklist vehicle-kit-list">${kit}</ul>
        <h4 class="transport-subheading">Rental by country</h4>
        <div class="transport-grid transport-grid--compact">${countries}</div>
    `;
}

function renderVetImportRules() {
    const el = document.getElementById('transport-vet-rules');
    if (!el) return;

    const severityClass = { strict: 'vet-severity--strict', moderate: 'vet-severity--moderate', light: 'vet-severity--light' };
    const cards = vetImportRules.countries.map(c => `
        <article class="vet-rule-card ${severityClass[c.severity] || ''}" id="vet-${c.id}">
            <h4>${c.flag} ${escapeHtml(c.name)} <span class="vet-severity-badge">${escapeHtml(c.severity)}</span></h4>
            <div class="vet-rule-columns">
                <div>
                    <h5>Not allowed / restricted</h5>
                    <ul>${c.banned.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
                </div>
                <div>
                    <h5>Usually tolerated if declared</h5>
                    <ul>${c.usuallyAllowed.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
                </div>
            </div>
            <p class="transport-fee-note"><strong>Borders:</strong> ${escapeHtml(c.borderPosts)} · <strong>Penalty:</strong> ${escapeHtml(c.penalty)}</p>
            <p class="transport-tip"><i class="fas fa-lightbulb"></i> ${escapeHtml(c.tip)}</p>
            <a class="data-source-link" href="${c.sourceUrl}" target="_blank" rel="noopener noreferrer">Official source · ${c.lastVerified} <i class="fas fa-external-link-alt"></i></a>
        </article>
    `).join('');

    const general = vetImportRules.generalRules.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    const resources = vetImportRules.resources.map(r => {
        const attrs = r.internal ? `href="${r.url}"` : `href="${r.url}" target="_blank" rel="noopener noreferrer"`;
        return `<a class="transport-resource-link" ${attrs}>${escapeHtml(r.label)}${r.internal ? '' : ' <i class="fas fa-external-link-alt"></i>'}</a>`;
    }).join('');

    el.innerHTML = `
        <h3 class="transport-subheading" id="transport-vet-rules-heading">Vet &amp; food import rules</h3>
        <p class="transport-panel-intro">${escapeHtml(vetImportRules.intro)}</p>
        <p class="hub-data-note">${escapeHtml(vetImportRules.meta.disclaimer)}</p>
        <ul class="essentials-checklist">${general}</ul>
        <div class="vet-rules-grid">${cards}</div>
        <div class="transport-resource-links">${resources}</div>
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

    function activateTab(target) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.transportTab === target));
        panels.forEach(panel => {
            const isActive = panel.id === `transport-panel-${target}`;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab.dataset.transportTab));
    });

    document.querySelectorAll('[data-open-transport-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.dataset.openTransportTab;
            if (!target) return;
            e.preventDefault();
            activateTab(target);
            document.getElementById('transport')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function renderTransportHub() {
    const gatewaysEl = document.getElementById('transport-gateways');
    const routesEl = document.getElementById('transport-routes');
    const busesEl = document.getElementById('transport-buses');
    const carEl = document.getElementById('transport-car-rental');
    const simEl = document.getElementById('transport-sim');

    if (gatewaysEl) gatewaysEl.innerHTML = transport.gateways.map(renderGatewayCard).join('');
    if (routesEl) routesEl.innerHTML = transport.domesticRoutes.map(renderRouteCard).join('');
    if (busesEl && transport.intercityBuses) {
        busesEl.innerHTML = transport.intercityBuses.map(renderRouteCard).join('');
    }
    if (carEl) carEl.innerHTML = transport.carRental.map(renderCarCard).join('');
    if (simEl) simEl.innerHTML = transport.mobileSim.map(renderSimCard).join('');

    renderCrossBorderChecklist();
    renderBorderStatusLinks();
    renderBorderFees();
    renderCrossBorderGuides();
    renderVehicleFeesTable();
    renderVehicleRentalGuide();
    renderVetImportRules();

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
