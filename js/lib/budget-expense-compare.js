import budgetData from '../../data/itinerary-budgets.json';
import itineraryData from '../../data/itineraries.json';
import { getItineraryBudget } from './itinerary-budget.js';

/** Map expense-tracker category ids to budget line category labels. */
export const EXPENSE_TO_BUDGET_LABELS = {
    fuel: ['Fuel'],
    vehicle: ['Vehicle'],
    parks: ['Park fees', 'Park & conservation fees'],
    lodging: ['Accommodation'],
    food: ['Food & supplies'],
    activities: ['Activities'],
    flights: ['Flights', 'Activities'],
    border: ['Border & insurance', 'Visas & border fees'],
    insurance: ['Border & insurance', 'Insurance'],
    other: ['Contingency', 'Other'],
};

export function listBudgetItineraries() {
    return Object.keys(budgetData.budgets)
        .filter(id => itineraryData[id])
        .map(id => ({
            id,
            title: itineraryData[id].title,
            totalPerPerson: budgetData.budgets[id].totalPerPerson,
        }))
        .sort((a, b) => a.title.localeCompare(b.title));
}

function sumBudgetByLabels(budget, labels) {
    const set = new Set(labels.map(l => l.toLowerCase()));
    return budget.lines.reduce((sum, line) => {
        if (set.has(line.category.toLowerCase())) {
            return sum + line.amountPerPerson;
        }
        return sum;
    }, 0);
}

function sumTrackedByExpenseCategory(items, expenseCategory, amountInUsdFn) {
    const labels = EXPENSE_TO_BUDGET_LABELS[expenseCategory] || [];
    return items
        .filter(item => item.category === expenseCategory)
        .reduce(async (promise, item) => {
            const acc = await promise;
            const usd = await amountInUsdFn(Number(item.amount) || 0, item.currency);
            return acc + usd;
        }, Promise.resolve(0));
}

export async function buildBudgetCompareModel(linkedItineraryId, items, amountInUsd) {
    const budget = getItineraryBudget(linkedItineraryId);
    if (!budget) return null;

    let trackedTotal = 0;
    for (const item of items) {
        trackedTotal += await amountInUsd(Number(item.amount) || 0, item.currency);
    }

    const budgetTotal = budget.totalPerPerson;
    const remaining = budgetTotal - trackedTotal;
    const percentUsed = budgetTotal > 0 ? (trackedTotal / budgetTotal) * 100 : 0;

    const categoryRows = [];
    const usedExpenseCats = Object.keys(EXPENSE_TO_BUDGET_LABELS);

    for (const expenseCat of usedExpenseCats) {
        const budgetAmount = sumBudgetByLabels(budget, EXPENSE_TO_BUDGET_LABELS[expenseCat]);
        if (budgetAmount <= 0) continue;

        let trackedAmount = 0;
        for (const item of items.filter(i => i.category === expenseCat)) {
            trackedAmount += await amountInUsd(Number(item.amount) || 0, item.currency);
        }

        if (trackedAmount > 0 || budgetAmount > 0) {
            categoryRows.push({
                expenseCat,
                budgetAmount,
                trackedAmount,
                delta: budgetAmount - trackedAmount,
            });
        }
    }

    categoryRows.sort((a, b) => b.budgetAmount - a.budgetAmount);

    return {
        itineraryId: linkedItineraryId,
        itineraryTitle: itineraryData[linkedItineraryId]?.title || linkedItineraryId,
        basis: budget.basis,
        budgetTotal,
        trackedTotal,
        remaining,
        percentUsed,
        categoryRows,
    };
}

export function renderBudgetCompareHtml(model, { formatUsd, getCategoryLabel = id => id }) {
    if (!model) {
        return '<p class="expense-compare-empty">Select a route template to compare your tracked spending against its indicative budget.</p>';
    }

    const statusClass = model.percentUsed > 100
        ? 'expense-compare--over'
        : model.percentUsed > 85
            ? 'expense-compare--warn'
            : 'expense-compare--ok';

    const barWidth = Math.min(model.percentUsed, 100);

    const categoryTable = model.categoryRows.length
        ? `<table class="expense-compare-table">
            <thead><tr><th>Area</th><th>Budget (pp)</th><th>Tracked</th><th>Left</th></tr></thead>
            <tbody>${model.categoryRows.map(row => `
                <tr>
                    <td>${getCategoryLabel(row.expenseCat)}</td>
                    <td>USD ${formatUsd(row.budgetAmount)}</td>
                    <td>USD ${formatUsd(row.trackedAmount)}</td>
                    <td class="${row.delta < 0 ? 'expense-compare-negative' : ''}">USD ${formatUsd(row.delta)}</td>
                </tr>
            `).join('')}</tbody>
           </table>`
        : '';

    return `
        <div class="expense-compare-panel ${statusClass}">
            <div class="expense-compare-header">
                <div>
                    <span class="expense-compare-eyebrow">Budget comparison</span>
                    <strong>${model.itineraryTitle}</strong>
                    <p class="expense-compare-basis">${model.basis}</p>
                </div>
                <div class="expense-compare-totals">
                    <div><span>Budget (pp)</span><strong>USD ${formatUsd(model.budgetTotal)}</strong></div>
                    <div><span>Tracked (USD est.)</span><strong>USD ${formatUsd(model.trackedTotal)}</strong></div>
                    <div><span>Remaining</span><strong class="${model.remaining < 0 ? 'expense-compare-negative' : ''}">USD ${formatUsd(model.remaining)}</strong></div>
                </div>
            </div>
            <div class="expense-compare-bar" role="progressbar" aria-valuenow="${Math.round(model.percentUsed)}" aria-valuemin="0" aria-valuemax="100">
                <div class="expense-compare-bar-fill" style="width: ${barWidth}%"></div>
            </div>
            <p class="expense-compare-note">${model.percentUsed.toFixed(0)}% of indicative per-person budget used · Budget is per person; tracker total is your actual spend.</p>
            ${categoryTable}
        </div>
    `;
}
