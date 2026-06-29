import practical from '../../data/practical.json';
import {
    getPassportMeta,
    getVisaForPassport,
    getVisaPassportLastVerified,
    needsVisaAction,
    summarizeAllCountries,
    summarizeTripVisas,
} from '../lib/visa-passport.js';
import { COUNTRY_META } from '../lib/country-meta.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** @type {string} */
let activePassportId = 'uk';

export function getActivePassportId() {
    return activePassportId;
}

function renderPassportSummary(passportId) {
    const summaryEl = document.getElementById('hub-visa-summary');
    if (!summaryEl) return;

    const summary = summarizeAllCountries(passportId);
    const passportLabel = summary.passport?.label || 'Your passport';
    const actionCount = summary.actionNeeded.length;
    const freeCount = summary.visaFree.length;

    let headline = `${passportLabel}: ${freeCount} visa-free, ${actionCount} need advance action or verification.`;
    if (actionCount === 0) {
        headline = `${passportLabel}: all nine countries visa-free or straightforward for tourism — still verify official sources.`;
    }

    const actionList = summary.actionNeeded.map(({ countryId, rule }) => {
        const meta = COUNTRY_META[countryId] || { flag: '🌍', name: countryId };
        return `<li>${escapeHtml(meta.flag)} ${escapeHtml(meta.name)} — <strong>${escapeHtml(rule.label)}</strong></li>`;
    }).join('');

    const kazaHtml = summary.kaza
        ? `<p class="hub-visa-kaza"><i class="fas fa-stamp"></i> <strong>${escapeHtml(summary.kaza.label)}:</strong> ${escapeHtml(summary.kaza.note)}</p>`
        : '';

    summaryEl.innerHTML = `
        <p class="hub-visa-summary-head">${headline}</p>
        ${actionList ? `<ul class="hub-visa-summary-list">${actionList}</ul>` : ''}
        ${kazaHtml}
        <p class="hub-visa-summary-meta">Passport rules verified ${escapeHtml(summary.lastVerified)} — planning only.</p>
    `;
    summaryEl.hidden = false;
}

function renderVisaMatrix(passportId) {
    const matrix = document.getElementById('hub-visa-matrix');
    const notes = document.getElementById('hub-visa-notes');
    if (!matrix) return;

    matrix.innerHTML = practical.visaHealth.map(row => {
        const passportVisa = getVisaForPassport(row.id, passportId);
        const visa = passportVisa || row.visa;
        const actionClass = passportVisa && needsVisaAction(passportVisa.status)
            ? ' hub-matrix-row--action' : '';

        return `
        <div class="hub-matrix-row${actionClass}" data-country="${row.name.toLowerCase()} ${row.id}" data-country-id="${row.id}">
            <span>${row.flag} ${row.name}</span>
            <span class="badge badge--${visa.badgeClass}">${visa.label}</span>
            <span class="badge badge--${row.health.badgeClass}">${row.health.label}</span>
            <span class="badge badge--${row.advisory.badgeClass}">${row.advisory.label}</span>
        </div>
    `;
    }).join('');

    if (notes) {
        notes.innerHTML = practical.visaHealth.map(row => {
            const passportVisa = getVisaForPassport(row.id, passportId);
            const noteText = passportVisa?.note || row.note;
            return `
            <details class="hub-visa-detail${passportVisa && needsVisaAction(passportVisa.status) ? ' hub-visa-detail--action' : ''}">
                <summary>${row.flag} ${row.name} — <a href="${row.sourceUrl}" target="_blank" rel="noopener noreferrer">Official source</a> · verified ${getVisaPassportLastVerified()}</summary>
                <p>${escapeHtml(noteText)}</p>
            </details>
        `;
        }).join('');
    }
}

export function applyPassportToVisaHub(passportId) {
    activePassportId = passportId;
    renderVisaMatrix(passportId);
    renderPassportSummary(passportId);

    const search = document.getElementById('hub-visa-search');
    if (search?.value) {
        search.dispatchEvent(new Event('input'));
    }
}

export function initPassportVisaHelper() {
    const passportId = document.getElementById('hub-passport-select')?.value || activePassportId;
    applyPassportToVisaHub(passportId);
}

export function buildTripVisaBlock(countryId, passportId) {
    const visa = practical.visaHealth.find(row => row.id === countryId);
    const passportVisa = getVisaForPassport(countryId, passportId);
    const passportMeta = getPassportMeta(passportId);
    if (!visa) return '';

    const visaLabel = passportVisa?.label || visa.visa.label;
    const noteText = passportVisa?.note || visa.note;

    return `
        <p class="print-meta"><strong>Visa (${escapeHtml(passportMeta?.short || passportMeta?.label || passportId)}):</strong> ${escapeHtml(visaLabel)} ·
        <strong>Health:</strong> ${escapeHtml(visa.health.label)} ·
        <strong>Advisory:</strong> ${escapeHtml(visa.advisory.label)}
        <span class="print-verified">(verified ${escapeHtml(getVisaPassportLastVerified())})</span></p>
        <p>${escapeHtml(noteText)}</p>
        <p class="print-source"><strong>Official immigration:</strong> ${escapeHtml(visa.sourceUrl)}</p>
    `;
}

export function buildTripVisaSummaryBlock(countryIds, passportId) {
    const summary = summarizeTripVisas(countryIds, passportId);
    if (!summary.passport) return '';

    const actionItems = summary.actionNeeded.map(({ countryId, rule }) => {
        const meta = COUNTRY_META[countryId] || { name: countryId, flag: '🌍' };
        return `<li>${escapeHtml(meta.flag)} ${escapeHtml(meta.name)}: ${escapeHtml(rule.label)}</li>`;
    }).join('');

    const kaza = summary.kaza
        ? `<p><strong>${escapeHtml(summary.kaza.label)}:</strong> ${escapeHtml(summary.kaza.note)}</p>`
        : '';

    return `
        <section class="print-section print-visa-summary">
            <h2>Visa summary — ${escapeHtml(summary.passport.label)}</h2>
            ${actionItems ? `<ul>${actionItems}</ul>` : '<p>No advance visa action flagged for this trip — verify official sources anyway.</p>'}
            ${kaza}
        </section>
    `;
}
