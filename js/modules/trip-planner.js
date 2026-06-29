import itineraries from '../../data/itineraries.json';
import packingData from '../../data/packing.json';
import practical from '../../data/practical.json';
import bordersData from '../../data/borders.json';
import { COUNTRY_META, COUNTRY_ORDER } from '../lib/country-meta.js';
import { getCountryResourcePack } from '../lib/country-resources.js';
import { getDefaultPassportId, getPassportMeta } from '../lib/visa-passport.js';
import {
    buildTripVisaBlock,
    buildTripVisaSummaryBlock,
    getActivePassportId,
} from './visa-passport-ui.js';
import { buildPrintBudgetHtml } from '../lib/itinerary-budget.js';
import { buildPrintExpenseHtml } from '../lib/print-expense.js';
import printCss from '../../css/print-checklist.css?inline';

const ITINERARY_COUNTRIES = {
    'desert-to-delta': ['namibia', 'botswana'],
    'coastal-explorer': ['south-africa', 'mozambique'],
    'falls-beyond': ['zambia', 'zimbabwe'],
    'kingdom-circuit': ['south-africa', 'lesotho', 'eswatini'],
    'lake-mountain': ['malawi', 'zambia'],
    'grand-safari': ['botswana', 'zimbabwe', 'zambia'],
    'namibia-essentials': ['namibia'],
    'south-africa-classic': ['south-africa'],
    'botswana-delta-focus': ['botswana'],
    'zambia-falls-safari': ['zambia'],
    'zimbabwe-wilderness': ['zimbabwe'],
    'mozambique-bush-beach': ['mozambique'],
    'malawi-lake-safari': ['malawi'],
    'lesotho-highlands': ['lesotho'],
    'eswatini-kingdom': ['eswatini'],
};

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getEmergency(countryId) {
    const name = COUNTRY_META[countryId]?.name;
    return practical.emergencies.find(row => row.country === name) || null;
}

function getRelevantBorders(countryIds) {
    const set = new Set(countryIds);
    return bordersData.filter(border => border.countries.every(id => set.has(id)));
}

function getSelectedCountries() {
    return [...document.querySelectorAll('#trip-country-picker input[type="checkbox"]:checked')]
        .map(input => input.value);
}

function getSelectedPackingItems() {
    return [...document.querySelectorAll('#trip-pack-list input[type="checkbox"]:checked')]
        .map(input => input.dataset.item);
}

function setCountrySelection(countryIds) {
    document.querySelectorAll('#trip-country-picker input[type="checkbox"]').forEach(input => {
        input.checked = countryIds.includes(input.value);
    });
}

function renderPackList(type) {
    const list = document.getElementById('trip-pack-list');
    if (!list) return;
    const items = packingData[type] || packingData.safari;
    list.innerHTML = items.map(item =>
        `<label class="hub-pack-item"><input type="checkbox" data-item="${escapeHtml(item)}" checked> <span>${escapeHtml(item)}</span></label>`
    ).join('');
}

async function buildChecklistHtml({ countryIds, routeId, packType, packingItems, passportId }) {
    const route = routeId ? itineraries[routeId] : null;
    const passportMeta = getPassportMeta(passportId) || { label: passportId };
    const generated = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    const countryBlocks = countryIds.map(countryId => {
        const meta = COUNTRY_META[countryId] || { name: countryId, flag: '🌍' };
        const resources = getCountryResourcePack(countryId);
        const emergency = getEmergency(countryId);

        const linksHtml = (resources?.links || []).slice(0, 4).map(link => `
            <li><strong>${escapeHtml(link.label)}</strong> — ${escapeHtml(link.url)}</li>
        `).join('');

        return `
            <section class="print-country">
                <h2>${escapeHtml(meta.flag)} ${escapeHtml(meta.name)}</h2>
                ${buildTripVisaBlock(countryId, passportId)}
                ${resources?.planningNote ? `<p class="print-tip"><strong>Planning tip:</strong> ${escapeHtml(resources.planningNote)}</p>` : ''}
                ${linksHtml ? `<ul class="print-links">${linksHtml}</ul>` : ''}
                ${emergency ? `<p class="print-emergency"><strong>Emergency:</strong> ${escapeHtml(emergency.numbers)}</p>` : ''}
            </section>
        `;
    }).join('');

    const borders = getRelevantBorders(countryIds);
    const bordersHtml = borders.length ? `
        <section class="print-section">
            <h2>Border crossings on this route</h2>
            <ul class="print-borders">
                ${borders.slice(0, 10).map(border => `
                    <li>
                        <strong>${escapeHtml(border.name)}</strong> — ${escapeHtml(border.route)} ·
                        ${escapeHtml(border.hours)} · typical wait ${escapeHtml(border.typicalWait)}
                        ${border.sourceUrl ? `<br><span class="print-source">${escapeHtml(border.sourceUrl)}</span>` : ''}
                    </li>
                `).join('')}
            </ul>
        </section>
    ` : '';

    const routeHtml = route ? `
        <section class="print-section print-route">
            <h2>Route template: ${escapeHtml(route.title)}</h2>
            <p class="print-meta">${escapeHtml(route.duration)} · ${escapeHtml(route.countries)}</p>
            <p>${escapeHtml(route.description)}</p>
            ${route.highlights?.length ? `
                <h3>Highlights</h3>
                <ul>${route.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
            ` : ''}
            <p class="print-note">Template only — not a quote. Adapt dates and bookings yourself.</p>
        </section>
        ${routeId ? buildPrintBudgetHtml(routeId) : ''}
    ` : '';

    const packingHtml = packingItems.length ? `
        <section class="print-section">
            <h2>Packing checklist (${escapeHtml(packType)})</h2>
            <ul class="print-checklist">
                ${packingItems.map(item => `<li><span class="print-box" aria-hidden="true"></span> ${escapeHtml(item)}</li>`).join('')}
            </ul>
        </section>
    ` : '';

    const countryNames = countryIds.map(id => COUNTRY_META[id]?.name || id).join(', ');

    const visaSummaryHtml = buildTripVisaSummaryBlock(countryIds, passportId);
    const expenseHtml = await buildPrintExpenseHtml({ plannerRouteId: routeId || '' });

    return `
        <article class="print-checklist-doc">
            <header class="print-header">
                <div class="print-header-bar" aria-hidden="true"></div>
                <p class="print-brand">Savanna Explorer</p>
                <h1>Trip Planning Checklist</h1>
                <p class="print-subtitle">${escapeHtml(countryNames || 'Southern Africa')}</p>
                <div class="print-meta-row">
                    <span><strong>Passport:</strong> ${escapeHtml(passportMeta.label)}</span>
                    ${route ? `<span><strong>Route:</strong> ${escapeHtml(route.title)}</span>` : ''}
                    <span><strong>Countries:</strong> ${countryIds.length}</span>
                </div>
                <p class="print-generated">Generated ${escapeHtml(generated)} · savannaexplorer.com · Planning reference only</p>
            </header>
            ${visaSummaryHtml}
            ${routeHtml}
            ${countryBlocks}
            ${bordersHtml}
            ${packingHtml}
            ${expenseHtml}
            <footer class="print-footer">
                <p><strong>Not a booking or quote.</strong> ${escapeHtml(practical.meta.disclaimer)}</p>
                <p>Savanna Explorer is an independent planning hub — we do not sell tours, take payments, or act as a travel agent.</p>
            </footer>
        </article>
    `;
}

function collectPlannerState() {
    const countryIds = getSelectedCountries();
    const routeId = document.getElementById('trip-route-select')?.value || '';
    const packType = document.querySelector('#trip-planner .hub-tab.active')?.dataset.pack || 'safari';
    const packingItems = getSelectedPackingItems();
    const passportId = document.getElementById('hub-passport-select')?.value
        || getActivePassportId()
        || getDefaultPassportId();

    return { countryIds, routeId, packType, packingItems, passportId };
}

function validateState(state) {
    if (!state.countryIds.length) {
        return 'Select at least one country to build your checklist.';
    }
    return null;
}

function renderPreview(html) {
    const preview = document.getElementById('trip-planner-preview');
    const panel = document.getElementById('trip-planner-preview-panel');
    if (!preview || !panel) return;
    preview.innerHTML = html;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function printChecklist(html) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Trip checklist print preview');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: '0',
        opacity: '0',
        pointerEvents: 'none',
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Savanna Explorer — Trip Checklist</title>
    <style>${printCss.replace(/<\/style/gi, '<\\/style')}</style>
</head>
<body>${html}</body>
</html>`);
    doc.close();

    const win = iframe.contentWindow;
    const cleanup = () => {
        iframe.remove();
    };

    win.addEventListener('afterprint', cleanup, { once: true });

    const triggerPrint = () => {
        win.focus();
        win.print();
        setTimeout(cleanup, 8000);
    };

    if (doc.readyState === 'complete') {
        setTimeout(triggerPrint, 150);
    } else {
        win.addEventListener('load', () => setTimeout(triggerPrint, 150), { once: true });
    }
}

export function initTripPlanner() {
    const picker = document.getElementById('trip-country-picker');
    const routeSelect = document.getElementById('trip-route-select');
    if (!picker || !routeSelect) return;

    picker.innerHTML = COUNTRY_ORDER.map(id => {
        const meta = COUNTRY_META[id];
        return `
            <label class="trip-country-chip">
                <input type="checkbox" name="trip-country" value="${escapeHtml(id)}">
                <span>${escapeHtml(meta.flag)} ${escapeHtml(meta.name)}</span>
            </label>
        `;
    }).join('');

    const routeOptions = Object.entries(itineraries).map(([id, route]) =>
        `<option value="${escapeHtml(id)}">${escapeHtml(route.title)} (${escapeHtml(route.duration)})</option>`
    ).join('');
    routeSelect.innerHTML = `<option value="">No route template</option>${routeOptions}`;

    renderPackList('safari');

    routeSelect.addEventListener('change', () => {
        const ids = ITINERARY_COUNTRIES[routeSelect.value];
        if (ids?.length) setCountrySelection(ids);
    });

    document.querySelectorAll('#trip-planner .hub-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('#trip-planner .hub-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderPackList(this.dataset.pack);
        });
    });

    document.getElementById('trip-preview-btn')?.addEventListener('click', async () => {
        const state = collectPlannerState();
        const error = validateState(state);
        const feedback = document.getElementById('trip-planner-feedback');
        if (error) {
            if (feedback) {
                feedback.textContent = error;
                feedback.hidden = false;
            }
            return;
        }
        if (feedback) feedback.hidden = true;
        renderPreview(await buildChecklistHtml(state));
    });

    document.getElementById('trip-print-btn')?.addEventListener('click', async () => {
        const state = collectPlannerState();
        const error = validateState(state);
        const feedback = document.getElementById('trip-planner-feedback');
        if (error) {
            if (feedback) {
                feedback.textContent = error;
                feedback.hidden = false;
            }
            return;
        }
        if (feedback) feedback.hidden = true;
        const html = await buildChecklistHtml(state);
        renderPreview(html);
        printChecklist(html);
    });
}
