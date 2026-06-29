import budgetData from '../../data/itinerary-budgets.json';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function getItineraryBudget(itineraryId) {
    return budgetData.budgets[itineraryId] || null;
}

export function renderBudgetBreakdownHtml(itineraryId) {
    const budget = getItineraryBudget(itineraryId);
    if (!budget?.lines?.length) return '';

    const rows = budget.lines.map(line => `
        <tr>
            <td>${escapeHtml(line.category)}</td>
            <td>${escapeHtml(line.item)}${line.note ? `<span class="budget-line-note">${escapeHtml(line.note)}</span>` : ''}</td>
            <td class="budget-amount">USD ${line.amountPerPerson.toLocaleString()}</td>
        </tr>
    `).join('');

    const tips = budget.tips?.length
        ? `<ul class="budget-tips">${budget.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
        : '';

    return `
        <div class="itin-budget-breakdown">
            <h4><i class="fas fa-receipt"></i> Indicative budget breakdown</h4>
            <p class="itin-budget-basis">${escapeHtml(budget.basis)}</p>
            <table class="budget-breakdown-table">
                <thead>
                    <tr><th>Category</th><th>Item</th><th>Per person</th></tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Typical total (planning estimate)</strong></td>
                        <td class="budget-amount"><strong>USD ${budget.totalPerPerson.toLocaleString()}</strong></td>
                    </tr>
                </tfoot>
            </table>
            ${tips}
            <p class="budget-disclaimer">${escapeHtml(budgetData.meta.disclaimer)}</p>
        </div>
    `;
}

export function formatBudgetSummary(itineraryId) {
    const budget = getItineraryBudget(itineraryId);
    if (!budget) return '';
    return `From USD ${budget.totalPerPerson.toLocaleString()} pp · ${budget.durationDays} days · ${budget.travelers} travellers`;
}

export function buildPrintBudgetHtml(itineraryId) {
    const budget = getItineraryBudget(itineraryId);
    if (!budget?.lines?.length) return '';

    const rows = budget.lines.map(line => `
        <tr>
            <td>${escapeHtml(line.category)}</td>
            <td>${escapeHtml(line.item)}</td>
            <td>USD ${line.amountPerPerson.toLocaleString()}</td>
        </tr>
    `).join('');

    const tips = budget.tips?.length
        ? `<ul class="print-budget-tips">${budget.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
        : '';

    return `
        <section class="print-section print-budget">
            <h2>Indicative budget breakdown</h2>
            <p class="print-meta">${escapeHtml(budget.basis)}</p>
            <table class="print-budget-table">
                <thead><tr><th>Category</th><th>Item</th><th>Per person</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><td colspan="2"><strong>Typical total (planning estimate)</strong></td><td><strong>USD ${budget.totalPerPerson.toLocaleString()}</strong></td></tr></tfoot>
            </table>
            ${tips}
            <p class="print-note">${escapeHtml(budgetData.meta.disclaimer)}</p>
        </section>
    `;
}
