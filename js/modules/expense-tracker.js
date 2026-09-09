import expenseConfig from '../../data/expense-tracker.json';
import practical from '../../data/practical.json';
import { fetchLiveCurrencyRates } from './transport-logistics.js';
import {
    buildBudgetCompareModel,
    listBudgetBenchmarks,
    renderBudgetCompareHtml,
} from '../lib/budget-expense-compare.js';
import { TRIP_CHANGE_EVENT, getActiveTrip, updateActiveTrip } from '../lib/trip-store.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loadExpenses() {
    const activeTrip = getActiveTrip();
    if (activeTrip) {
        return {
            tripName: activeTrip.name,
            linkedItineraryId: activeTrip.expenses.linkedItineraryId || '',
            items: Array.isArray(activeTrip.expenses.items) ? activeTrip.expenses.items : [],
        };
    }
    return { tripName: '', linkedItineraryId: '', items: [] };
}

function saveExpenses(data) {
    if (!getActiveTrip()) return false;
    updateActiveTrip({
        expenses: {
            linkedItineraryId: data.linkedItineraryId || '',
            items: Array.isArray(data.items) ? data.items : [],
        },
    });
    return true;
}

function renderWorkspaceState() {
    const activeTrip = getActiveTrip();
    const title = document.getElementById('expense-workspace-title');
    const copy = document.getElementById('expense-workspace-copy');
    const controls = document.querySelectorAll('#hub-expense-tracker input, #hub-expense-tracker select, #hub-expense-tracker button');

    controls.forEach(control => {
        control.disabled = !activeTrip;
    });
    if (title) title.textContent = activeTrip ? `Editing ${activeTrip.name}` : 'Open a My Safari trip first';
    if (copy) copy.textContent = activeTrip
        ? 'Every expense and route benchmark is saved with this trip.'
        : 'Expenses are stored only inside your active trip. The cost estimator remains available for a quick no-sign-in estimate.';
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
        ...listBudgetBenchmarks().map(({ id, title, totalPerPerson }) =>
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

export async function initExpenseTracker() {
    const root = document.getElementById('hub-expense-tracker');
    if (!root) return;

    populateFormSelects();

    const disclaimer = document.getElementById('expense-disclaimer');
    if (disclaimer) disclaimer.textContent = expenseConfig.meta.disclaimer;

    const data = loadExpenses();
    populateItinerarySelect(data.linkedItineraryId);
    renderWorkspaceState();

    try {
        liveUsdRates = await fetchLiveCurrencyRates('USD');
    } catch {
        liveUsdRates = null;
    }

    await refreshTotals();
    document.getElementById('expense-itinerary')?.addEventListener('change', async (e) => {
        const store = loadExpenses();
        store.linkedItineraryId = e.target.value || '';
        saveExpenses(store);
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

    document.getElementById('expense-clear')?.addEventListener('click', async () => {
        if (!confirm('Clear all tracked expenses for this trip?')) return;
        const store = loadExpenses();
        saveExpenses({ linkedItineraryId: store.linkedItineraryId, items: [] });
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

    window.addEventListener(TRIP_CHANGE_EVENT, async () => {
        const current = loadExpenses();
        populateItinerarySelect(current.linkedItineraryId);
        renderWorkspaceState();
        await refreshTotals();
    });
}

export { loadExpenses, amountInUsd };
