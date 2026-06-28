/**
 * Editorial freshness dates for trust signals and SEO.
 */
import countryResources from '../../data/country-resources.json';
import about from '../../data/about.json';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatReviewDate(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return '';
    const [year, month] = ym.split('-');
    const idx = parseInt(month, 10) - 1;
    if (idx < 0 || idx > 11) return ym;
    return `${MONTH_NAMES[idx]} ${year}`;
}

export function toIsoReviewDate(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return undefined;
    return `${ym}-01`;
}

export function getSiteLastReviewed() {
    return about.meta?.lastReviewed || '2026-06';
}

export function getCountryLastReviewed(countryId) {
    return countryResources[countryId]?.lastVerified || getSiteLastReviewed();
}

export function lastReviewedLabel(ym) {
    const formatted = formatReviewDate(ym);
    return formatted ? `Last reviewed ${formatted}` : '';
}

export function lastReviewedHtml(ym, className = 'last-reviewed') {
    const iso = toIsoReviewDate(ym);
    const label = lastReviewedLabel(ym);
    if (!label) return '';
    return `<p class="${className}"><time datetime="${iso}">${label}</time></p>`;
}
