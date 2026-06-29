import expenseConfig from '../../data/expense-tracker.json';
import practical from '../../data/practical.json';
import { fetchLiveCurrencyRates } from './transport-logistics.js';
import { syncPlannerExpenseRoute, updateSyncNotes } from '../lib/planner-expense-sync.js';
import {
    buildBudgetCompareModel,
    listBudgetItineraries,
    renderBudgetCompareHtml,
} from '../lib/budget-expense-compare.js';

const STORAGE_KEY = expenseConfig.meta.storageKey;

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loadExpenses() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { tripName: '', linkedItineraryId: '', items: [] };
        const data = JSON.parse(raw);
        return {
            tripName: data.tripName || '',
            linkedItineraryId: data.linkedItineraryId || '',
            items: Array.isArray(data.items) ? data.items : [],
        };
    } catch {
        return { tripName: '', linkedItineraryId: '', items: [] };
    }
}

function saveExpenses(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function staticRateToUsd(code) {
    const row = practical.currency.rates.find(r => r.code === code);
    if (!row?.rates?.USD) return null;
    return 1 / row.rates.USD;
}

/** @type {Record<string, number> | null} */
let liveUsdRates = null;

async function amountInUsd(amount, currency) {
    if (currency === 'USD') return amount;
    if (liveUsdRates?.[currency]) return amount / liveUsdRates[currency];
    const staticMult = staticRateToUsd(currency);
    if (staticMult) return amount * staticMult;
    return amount;
}

function formatUsd(value) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function categoryLabel(id) {
    return expenseConfig.categories.find(c => c.id === id)?.label || id;
}

function populateItinerarySelect(selectedId = '') {
    const select = document.getElementById('expense-itinerary');
    if (!select) return;

    const options = [
        '<option value="">Compare to route budget…</option>',
        ...listBudgetItineraries().map(({ id, title, totalPerPerson }) =>
            `<option value="${escapeHtml(id)}"${id === selectedId ? ' selected' : ''}>${escapeHtml(title)} (USD ${totalPerPerson.toLocaleString()} pp)</option>`
        ),
    ];
    select.innerHTML = options.join('');
}

function renderExpenseList(items, totalUsd) {
    const list = document.getElementById('expense-list');
    const totalEl = document.getElementById('expense-total');
    const countEl = document.getElementById('expense-count');
    if (!list) return;

    if (!items.length) {
        list.innerHTML = '<p class="expense-empty">No expenses yet — add fuel, park fees, or lodge deposits as you book.</p>';
    } else {
        list.innerHTML = items.map(item => {
            const cat = expenseConfig.categories.find(c => c.id === item.category);
            return `
                <div class="expense-row" data-id="${escapeHtml(item.id)}">
                    <span class="expense-row-icon">${cat?.icon || '📦'}</span>
                    <div class="expense-row-body">
                        <strong>${escapeHtml(cat?.label || item.category)}</strong>
                        <span>${escapeHtml(item.note || '')}</span>
                    </div>
                    <span class="expense-row-amount">${escapeHtml(item.currency)} ${Number(item.amount).toLocaleString()}</span>
                    <button type="button" class="expense-row-delete" data-delete="${escapeHtml(item.id)}" aria-label="Remove expense">&times;</button>
                </div>
            `;
        }).join('');
    }

    if (totalEl) totalEl.textContent = `USD ${formatUsd(totalUsd)}`;
    if (countEl) countEl.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
}

async function renderBudgetCompare(linkedItineraryId, items) {
    const root = document.getElementById('expense-budget-compare');
    if (!root) return;

    if (!linkedItineraryId) {
        root.innerHTML = renderBudgetCompareHtml(null, { formatUsd, getCategoryLabel: categoryLabel });
        return;
    }

    const model = await buildBudgetCompareModel(linkedItineraryId, items, amountInUsd);
    if (!model) {
        root.innerHTML = renderBudgetCompareHtml(null, { formatUsd, getCategoryLabel: categoryLabel });
        return;
    }

    root.innerHTML = renderBudgetCompareHtml(model, { formatUsd, getCategoryLabel: categoryLabel });
}

async function refreshTotals() {
    const data = loadExpenses();
    let total = 0;
    for (const item of data.items) {
        total += await amountInUsd(Number(item.amount) || 0, item.currency);
    }
    renderExpenseList(data.items, total);
    await renderBudgetCompare(data.linkedItineraryId, data.items);
    return total;
}

function populateFormSelects() {
    const cat = document.getElementById('expense-category');
    const cur = document.getElementById('expense-currency');
    if (cat) {
        cat.innerHTML = expenseConfig.categories.map(c =>
            `<option value="${c.id}">${c.icon} ${escapeHtml(c.label)}</option>`
        ).join('');
    }
    if (cur) {
        cur.innerHTML = expenseConfig.currencies.map(c =>
            `<option value="${c.code}">${c.label}</option>`
        ).join('');
    }
}

/** Link a route template from the itinerary modal and scroll to the tracker. */
export function linkItineraryToExpenseTracker(itineraryId) {
    return setExpenseLinkedItinerary(itineraryId || '', { refresh: true });
}

export async function setExpenseLinkedItinerary(itineraryId, { refresh = true } = {}) {
    const store = loadExpenses();
    store.linkedItineraryId = itineraryId || '';
    saveExpenses(store);

    const select = document.getElementById('expense-itinerary');
    if (select) select.value = store.linkedItineraryId;

    if (refresh) await refreshTotals();
}

export async function initExpenseTracker() {
    const root = document.getElementById('hub-expense-tracker');
    if (!root) return;

    populateFormSelects();

    const disclaimer = document.getElementById('expense-disclaimer');
    if (disclaimer) disclaimer.textContent = expenseConfig.meta.disclaimer;

    const data = loadExpenses();
    populateItinerarySelect(data.linkedItineraryId);

    const nameInput = document.getElementById('expense-trip-name');
    if (nameInput) nameInput.value = data.tripName;

    try {
        liveUsdRates = await fetchLiveCurrencyRates('USD');
    } catch {
        liveUsdRates = null;
    }

    await refreshTotals();
    updateSyncNotes(data.linkedItineraryId);

    document.getElementById('expense-itinerary')?.addEventListener('change', async (e) => {
        const store = loadExpenses();
        store.linkedItineraryId = e.target.value || '';
        saveExpenses(store);
        await syncPlannerExpenseRoute(store.linkedItineraryId, { source: 'expense' });
        await refreshTotals();
    });

    document.getElementById('expense-add-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('expense-category')?.value || 'other';
        const amount = parseFloat(document.getElementById('expense-amount')?.value || '0');
        const currency = document.getElementById('expense-currency')?.value || 'USD';
        const note = document.getElementById('expense-note')?.value?.trim() || '';
        if (!amount || amount <= 0) return;

        const store = loadExpenses();
        store.items.push({
            id: `exp-${Date.now()}`,
            category,
            amount,
            currency,
            note,
            added: new Date().toISOString(),
        });
        saveExpenses(store);
        e.target.reset();
        document.getElementById('expense-currency').value = currency;
        await refreshTotals();
    });

    document.getElementById('expense-list')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-delete]');
        if (!btn) return;
        const id = btn.dataset.delete;
        const store = loadExpenses();
        store.items = store.items.filter(item => item.id !== id);
        saveExpenses(store);
        await refreshTotals();
    });

    nameInput?.addEventListener('change', () => {
        const store = loadExpenses();
        store.tripName = nameInput.value.trim();
        saveExpenses(store);
    });

    document.getElementById('expense-clear')?.addEventListener('click', async () => {
        if (!confirm('Clear all tracked expenses for this trip?')) return;
        const store = loadExpenses();
        saveExpenses({ tripName: nameInput?.value?.trim() || '', linkedItineraryId: store.linkedItineraryId, items: [] });
        await refreshTotals();
    });

    document.getElementById('expense-export')?.addEventListener('click', async () => {
        const store = loadExpenses();
        let total = 0;
        const lines = [];
        for (const item of store.items) {
            const usd = await amountInUsd(Number(item.amount), item.currency);
            total += usd;
            const cat = expenseConfig.categories.find(c => c.id === item.category);
            lines.push(`${cat?.label || item.category}\t${item.currency} ${item.amount}\t~USD ${formatUsd(usd)}\t${item.note || ''}`);
        }

        let budgetLine = '';
        if (store.linkedItineraryId) {
            const model = await buildBudgetCompareModel(store.linkedItineraryId, store.items, amountInUsd);
            if (model) {
                budgetLine = [
                    '',
                    `Route budget (${model.itineraryTitle}): USD ${formatUsd(model.budgetTotal)} per person`,
                    `Tracked total: USD ${formatUsd(model.trackedTotal)} (${model.percentUsed.toFixed(0)}% of budget pp)`,
                    `Remaining vs budget: USD ${formatUsd(model.remaining)}`,
                ].join('\n');
            }
        }

        const text = [
            store.tripName || 'Savanna Explorer trip expenses',
            `Exported ${new Date().toLocaleDateString()}`,
            '',
            ...lines,
            '',
            `Total (USD estimate): ${formatUsd(total)}`,
            budgetLine,
            '',
            expenseConfig.meta.disclaimer,
        ].filter(Boolean).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'trip-expenses.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });
}

export { loadExpenses, amountInUsd };
