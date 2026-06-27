const COST_BAND_LABELS = {
    $: 'Budget',
    $$: 'Moderate',
    $$$: 'Premium',
    $$$$: 'Luxury',
};

const DEFAULT_BUDGET_NOTE = 'Per person planning estimate — excludes international flights';

const BUDGET_NOTES_BY_TYPE = {
    'Self-Drive Route': 'Per person, mid-range self-drive — excludes international flights',
    'Guided & Self-Drive': 'Per person mix of guided activities and self-drive — excludes flights',
    'Mountain & Culture Route': 'Per person budget trip — guesthouses, camps, and park fees extra',
    'Adventure Route': 'Per person active travel — mixed camping and lodges',
    'Signature Safari': 'Per person fly-in safari estimate — lodge rates vary by season',
    'Single-Country Route': DEFAULT_BUDGET_NOTE,
};

export function formatTypicalBudget(itinerary) {
    const amount = itinerary.typicalBudget || itinerary.priceFrom;
    if (!amount) return null;
    const note = itinerary.budgetNote || BUDGET_NOTES_BY_TYPE[itinerary.type] || DEFAULT_BUDGET_NOTE;
    return { amount, note };
}

export function formatBudgetLabel(itinerary) {
    const budget = formatTypicalBudget(itinerary);
    if (!budget) return '';
    return `Typical budget ≈ ${budget.amount}`;
}

export function formatBudgetDetail(itinerary) {
    const budget = formatTypicalBudget(itinerary);
    if (!budget) return '';
    return `${budget.amount} · ${budget.note}`;
}

export function getPlanningNotes(itinerary) {
    return itinerary.planningNotes || itinerary.included || [];
}

export function getArrangeYourself(itinerary) {
    return itinerary.arrangeYourself || itinerary.excluded || [];
}

export function formatCostBand(priceRange) {
    if (!priceRange) return '';
    const label = COST_BAND_LABELS[priceRange] || 'Varies';
    return `${label} (${priceRange})`;
}
