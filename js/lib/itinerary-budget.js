import budgetData from '../../data/itinerary-budgets.json';

/** Historical IDs are retained only to preserve saved expense-tracker selections. */
export function getBudgetBenchmark(benchmarkId) {
    return budgetData.budgets[benchmarkId] || null;
}
