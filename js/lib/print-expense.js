import expenseConfig from '../../data/expense-tracker.json';
import { loadExpenses, amountInUsd } from '../modules/expense-tracker.js';
import { buildBudgetCompareModel } from './budget-expense-compare.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatUsd(value) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function categoryLabel(id) {
    return expenseConfig.categories.find(c => c.id === id)?.label || id;
}

function renderPrintCompareTable(model) {
    if (!model?.categoryRows?.length) return '';

    return `
        <table class="print-expense-table print-expense-compare-table">
            <thead>
                <tr>
                    <th>Area</th>
                    <th>Budget (pp)</th>
                    <th>Tracked</th>
                    <th>Remaining</th>
                </tr>
            </thead>
            <tbody>
                ${model.categoryRows.map(row => `
                    <tr>
                        <td>${escapeHtml(categoryLabel(row.expenseCat))}</td>
                        <td>USD ${formatUsd(row.budgetAmount)}</td>
                        <td>USD ${formatUsd(row.trackedAmount)}</td>
                        <td class="${row.delta < 0 ? 'print-expense-over' : ''}">USD ${formatUsd(row.delta)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/** Expense tracker block for trip planner print / preview (reads localStorage). */
export async function buildPrintExpenseHtml({ plannerRouteId = '' } = {}) {
    const data = loadExpenses();
    const hasExpenses = data.items.length > 0;
    const hasMeta = Boolean(data.tripName || data.linkedItineraryId);

    if (!hasExpenses && !hasMeta) return '';

    let totalUsd = 0;
    const rows = [];

    for (const item of data.items) {
        const usd = await amountInUsd(Number(item.amount) || 0, item.currency);
        totalUsd += usd;
        const cat = expenseConfig.categories.find(c => c.id === item.category);
        rows.push(`
            <tr>
                <td>${escapeHtml(cat?.icon || '')} ${escapeHtml(cat?.label || item.category)}</td>
                <td>${escapeHtml(item.currency)} ${Number(item.amount).toLocaleString()}</td>
                <td>USD ${formatUsd(usd)}</td>
                <td>${escapeHtml(item.note || '—')}</td>
            </tr>
        `);
    }

    const compareId = data.linkedItineraryId || plannerRouteId || '';
    let compareHtml = '';

    if (compareId && hasExpenses) {
        const model = await buildBudgetCompareModel(compareId, data.items, amountInUsd);
        if (model) {
            compareHtml = `
                <div class="print-expense-compare">
                    <h3>Budget comparison — ${escapeHtml(model.itineraryTitle)}</h3>
                    <p class="print-meta">${escapeHtml(model.basis)}</p>
                    <div class="print-expense-summary">
                        <span><strong>Budget (pp):</strong> USD ${formatUsd(model.budgetTotal)}</span>
                        <span><strong>Tracked:</strong> USD ${formatUsd(model.trackedTotal)}</span>
                        <span><strong>Remaining:</strong> <span class="${model.remaining < 0 ? 'print-expense-over' : ''}">USD ${formatUsd(model.remaining)}</span></span>
                        <span><strong>Used:</strong> ${model.percentUsed.toFixed(0)}%</span>
                    </div>
                    ${renderPrintCompareTable(model)}
                </div>
            `;
        }
    } else if (compareId && !data.linkedItineraryId && plannerRouteId) {
        compareHtml = '<p class="print-note">Link this route in the expense tracker to compare spending against its indicative budget.</p>';
    }

    const mismatchNote = data.linkedItineraryId && plannerRouteId && data.linkedItineraryId !== plannerRouteId
        ? '<p class="print-note">Expense tracker is linked to a different route than the planner template above.</p>'
        : '';

    const listHtml = rows.length
        ? `
            <table class="print-expense-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>USD est.</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>${rows.join('')}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Total (USD estimate)</strong></td>
                        <td colspan="2"><strong>USD ${formatUsd(totalUsd)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `
        : '<p class="print-note">No expenses logged yet — add items in the expense tracker on savannaexplorer.com.</p>';

    return `
        <section class="print-section print-expenses">
            <h2>Trip expenses${data.tripName ? `: ${escapeHtml(data.tripName)}` : ''}</h2>
            <p class="print-meta">Synced from your browser expense tracker · ${escapeHtml(expenseConfig.meta.disclaimer)}</p>
            ${mismatchNote}
            ${listHtml}
            ${compareHtml}
        </section>
    `;
}
