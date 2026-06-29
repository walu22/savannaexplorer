import healthData from '../../data/health.json';
import { COUNTRY_META } from '../lib/country-meta.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderVaccinations() {
    const el = document.getElementById('health-vaccines');
    const v = healthData.vaccinations;
    if (!el || !v) return;

    const rec = v.recommended.map(item =>
        `<li><strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.note)}</li>`
    ).join('');
    const trip = v.tripSpecific.map(item =>
        `<li><strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.note)}</li>`
    ).join('');
    const checklist = v.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join('');

    el.innerHTML = `
        <div class="health-vaccines-panel">
            <h3>${escapeHtml(v.title)}</h3>
            <div class="health-vaccines-grid">
                <div>
                    <h4>Routine &amp; recommended</h4>
                    <ul>${rec}</ul>
                </div>
                <div>
                    <h4>Trip-specific</h4>
                    <ul>${trip}</ul>
                </div>
                <div>
                    <h4>Clinic checklist</h4>
                    <ul>${checklist}</ul>
                </div>
            </div>
            <a class="data-source-link" href="${v.sourceUrl}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(v.sourceLabel)} · verified ${v.lastVerified} <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;
}

function renderYellowFeverRouting() {
    const el = document.getElementById('health-yellow-fever');
    const yf = healthData.yellowFeverRouting;
    if (!el || !yf) return;

    const rules = yf.rules.map(r => `
        <tr>
            <td>${escapeHtml(r.scenario)}</td>
            <td>${escapeHtml(r.requirement)}</td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div class="health-yellow-panel">
            <h3>${escapeHtml(yf.title)}</h3>
            <p>${escapeHtml(yf.summary)}</p>
            <table class="health-routing-table">
                <thead><tr><th>Scenario</th><th>Certificate required?</th></tr></thead>
                <tbody>${rules}</tbody>
            </table>
            <p class="health-yellow-note">${escapeHtml(yf.note)}</p>
            <a class="data-source-link" href="${yf.sourceUrl}" target="_blank" rel="noopener noreferrer">
                WHO reference · verified ${yf.lastVerified} <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;
}

const RISK_CLASS = { low: 'risk-low', moderate: 'risk-moderate', high: 'risk-high', 'very low': 'risk-low' };

function riskClass(level) {
    const key = (level || '').toLowerCase();
    if (key.includes('high')) return 'risk-high';
    if (key.includes('moderate') || key.includes('medium')) return 'risk-moderate';
    if (key.includes('very low') || key === 'none') return 'risk-low';
    if (key.includes('low')) return 'risk-low';
    return 'risk-moderate';
}

function renderHealthCard(country) {
    const zones = country.zones.map(z => `
        <tr>
            <td>${z.region}</td>
            <td><span class="health-risk ${riskClass(z.malaria)}">${z.malaria}</span></td>
            <td>${z.notes}</td>
        </tr>
    `).join('');

    const other = country.otherRisks.map(r => `<li>${r}</li>`).join('');

    return `
        <article class="health-card" data-country="${country.id}">
            <div class="health-card-header">
                <span class="health-flag">${country.flag}</span>
                <div>
                    <h3>${country.name}</h3>
                    <span class="health-risk-badge health-risk-badge--${country.malariaRisk}">Malaria: ${country.malariaRisk}</span>
                </div>
            </div>
            <p class="health-summary">${country.malariaSummary}</p>
            <div class="health-facts">
                <p><strong>Yellow fever:</strong> ${country.yellowFever}</p>
            </div>
            <table class="health-zones-table">
                <thead><tr><th>Region</th><th>Malaria</th><th>Notes</th></tr></thead>
                <tbody>${zones}</tbody>
            </table>
            <ul class="health-other">${other}</ul>
            <a class="data-source-link" href="${country.sourceUrl}" target="_blank" rel="noopener noreferrer">Health source · verified ${country.lastVerified}</a>
        </article>
    `;
}

export function initHealth() {
    const grid = document.getElementById('health-grid');
    const filtersEl = document.getElementById('health-filters');
    const disclaimer = document.getElementById('health-disclaimer');
    if (!grid) return;

    renderVaccinations();
    renderYellowFeverRouting();

    const countries = healthData.countries;

    if (disclaimer) {
        disclaimer.textContent = healthData.meta.disclaimer;
    }

    if (filtersEl) {
        filtersEl.innerHTML = `
            <button class="health-filter active" data-filter="all">All Countries</button>
            ${countries.map(c => {
                const m = COUNTRY_META[c.id];
                return `<button class="health-filter" data-filter="${c.id}">${m?.flag || ''} ${c.name}</button>`;
            }).join('')}
        `;
    }

    grid.innerHTML = countries.map(renderHealthCard).join('');

    filtersEl?.querySelectorAll('.health-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            filtersEl.querySelectorAll('.health-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            grid.querySelectorAll('.health-card').forEach(card => {
                const match = filter === 'all' || card.dataset.country === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}
