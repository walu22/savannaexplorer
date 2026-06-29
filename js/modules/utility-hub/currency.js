import practical from '../../../data/practical.json';
import { fetchLiveCurrencyRates, apiCodeForCurrency } from '../transport-logistics.js';

/** @type {Record<string, Record<string, number>> | null} */
let liveRatesByBase = null;
let currencyBound = false;

function getStaticRate(from, toCode) {
    const row = practical.currency.rates.find(entry => entry.code === toCode);
    return row?.rates?.[from] ?? null;
}

function getExchangeRate(from, toCode) {
    const apiCode = apiCodeForCurrency(toCode);
    const live = liveRatesByBase?.[from]?.[apiCode];
    if (live) return live;
    return getStaticRate(from, toCode);
}

function formatCurrencyAmount(value, currencyCode = '') {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (['MWK', 'MZN'].includes(currencyCode) && abs >= 100) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    if (abs >= 1000) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatExchangeRate(rate) {
    if (!Number.isFinite(rate)) return '—';
    if (rate >= 100) {
        return rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return rate.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    });
}

function getHubRate(el, baseCode) {
    return parseFloat(el.getAttribute(`data-rate-${baseCode.toLowerCase()}`)) || 0;
}

function setHubRate(el, baseCode, rate) {
    el.setAttribute(`data-rate-${baseCode.toLowerCase()}`, String(rate));
}

function updateCurrencyPrimary() {
    const primary = document.getElementById('hub-currency-primary');
    if (!primary) return;

    const amount = parseFloat(document.getElementById('hub-amount')?.value) || 0;
    const from = document.getElementById('hub-from-currency')?.value || 'USD';
    const to = document.getElementById('hub-to-currency')?.value || 'ZAR';
    const meta = practical.currency.rates.find(row => row.code === to);
    const rate = getExchangeRate(from, to);
    const converted = rate ? amount * rate : null;

    if (!meta || converted == null || !rate) {
        primary.innerHTML = '<p class="hub-currency-primary-empty">Enter an amount to convert.</p>';
        return;
    }

    primary.innerHTML = `
        <span class="hub-currency-primary-flag">${meta.flag}</span>
        <div class="hub-currency-primary-body">
            <span class="hub-currency-primary-label">${from} ${formatCurrencyAmount(amount, from)} ≈</span>
            <strong class="hub-currency-primary-value">${to} ${formatCurrencyAmount(converted, to)}</strong>
            <span class="hub-currency-primary-name">${meta.name}</span>
            <span class="hub-currency-primary-rate">1 ${from} = ${formatExchangeRate(rate)} ${to}</span>
        </div>
    `;
}

function updateCurrency() {
    const amount = parseFloat(document.getElementById('hub-amount')?.value) || 0;
    const from = document.getElementById('hub-from-currency')?.value || 'USD';

    document.querySelectorAll('.hub-cur-row').forEach(row => {
        const code = row.dataset.currencyCode || '';
        const valEl = row.querySelector('.hub-cur-val');
        const rate = getExchangeRate(from, code);
        if (!valEl) return;

        if (rate) {
            setHubRate(valEl, from, rate);
            valEl.textContent = `${code} ${formatCurrencyAmount(amount * rate, code)}`;
        } else {
            valEl.textContent = '—';
        }
    });

    updateCurrencyPrimary();
}

function renderCurrency() {
    const select = document.getElementById('hub-from-currency');
    const toSelect = document.getElementById('hub-to-currency');
    const results = document.getElementById('hub-results');
    const note = document.getElementById('hub-currency-note');
    if (!select || !results) return;

    const { currency } = practical;
    select.innerHTML = currency.baseCurrencies.map(c =>
        `<option value="${c.code}">${c.label}</option>`
    ).join('');

    if (toSelect) {
        toSelect.innerHTML = currency.rates.map(row =>
            `<option value="${row.code}">${row.flag} ${row.code} — ${row.name}</option>`
        ).join('');
    }

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
            liveRatesByBase[base] = await fetchLiveCurrencyRates(base);
        } catch {
            /* keep static fallback rates for this base */
        }
    }

    updateCurrency();
    if (status && Object.keys(liveRatesByBase).length) {
        status.textContent = `Live mid-market rates loaded (${practical.currency.liveApiLabel}). Confirm with your bank before exchanging.`;
    }
}

function bindCurrencyEvents() {
    if (currencyBound) return;
    currencyBound = true;

    document.getElementById('hub-amount')?.addEventListener('input', updateCurrency);
    document.getElementById('hub-from-currency')?.addEventListener('change', updateCurrency);
    document.getElementById('hub-to-currency')?.addEventListener('change', updateCurrency);
}

export function initHubCurrency() {
    renderCurrency();
    bindCurrencyEvents();
    updateCurrency();
    loadLiveCurrencyRates();
}
