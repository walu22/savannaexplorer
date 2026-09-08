export const FOOD_FILTER_DEFAULTS = Object.freeze({ country: 'all', context: 'all', dietary: 'all' });

export function normalizeFoodFilters(filters = {}) {
    return {
        country: String(filters.country || 'all'),
        context: String(filters.context || 'all'),
        dietary: String(filters.dietary || 'all'),
    };
}

export function filterFoodCountries(countries = [], filters = {}) {
    const active = normalizeFoodFilters(filters);
    return countries.filter(country => (
        (active.country === 'all' || country.id === active.country)
        && (active.context === 'all' || country.contexts?.includes(active.context))
        && (active.dietary === 'all' || country.dietary?.includes(active.dietary))
    ));
}

export function foodFilterSummary(filters = {}, count = 0) {
    const active = normalizeFoodFilters(filters);
    const narrowed = [active.country, active.context, active.dietary].some(value => value !== 'all');
    if (!narrowed) return 'Showing all countries.';
    return `${count} ${count === 1 ? 'country matches' : 'countries match'} your planning questions.`;
}
