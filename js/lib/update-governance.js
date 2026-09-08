const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value) {
    if (!DATE_PATTERN.test(String(value || ''))) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

export function isGovernedUpdate(update) {
    return Boolean(
        update?.id
        && update?.title
        && update?.summary
        && update?.category
        && update?.status
        && update?.sourceLabel
        && /^https:\/\//.test(update?.sourceUrl || '')
        && isDateOnly(update?.publishedOn)
        && isDateOnly(update?.reviewedOn)
        && isDateOnly(update?.validUntil)
        && update.publishedOn <= update.reviewedOn
        && update.reviewedOn <= update.validUntil,
    );
}

export function isCurrentUpdate(update, today) {
    return isGovernedUpdate(update) && update.reviewedOn <= today && update.validUntil >= today;
}

export function filterCurrentUpdates(updates, filters = {}, today = new Date().toISOString().slice(0, 10)) {
    return updates
        .filter(update => isCurrentUpdate(update, today))
        .filter(update => !filters.country || filters.country === 'all' || update.country === filters.country)
        .filter(update => !filters.category || filters.category === 'all' || update.category === filters.category)
        .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
}
