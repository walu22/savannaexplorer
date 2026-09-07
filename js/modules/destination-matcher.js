import matcherData from '../../data/destination-matcher.json';
import weather from '../../data/country-weather.json';
import routeCollection from '../../data/route-collections.json';
import { cardImageUrl, getCountryMeta } from '../lib/country-meta.js';
import { countryPath, routePath } from '../lib/router.js';
import { createTrip } from '../lib/trip-store.js';
import { trackProductEvent } from '../lib/product-analytics.js';
import { destinationMatchSummary, normalizeDestinationPreferences, rankDestinations } from '../lib/destination-matcher.js';

const FIT_LABELS = ['Best fit', 'Strong alternative', 'Worth comparing'];

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

function preferenceInput(form) {
    const data = new FormData(form);
    return normalizeDestinationPreferences({
        month: data.get('month'),
        days: data.get('days'),
        budget: data.get('budget'),
        driving: data.get('driving'),
        pace: data.get('pace'),
        interests: data.getAll('interests'),
    });
}

function renderMatch(match, index) {
    const meta = getCountryMeta(match.countryId);
    const seasonClass = match.season.rating === 'ideal' ? 'ideal' : match.season.rating === 'avoid' ? 'caution' : 'shoulder';
    const interestReason = match.interestMatches.length
        ? `Strong for ${match.interestMatches.join(', ').replace(/-/g, ' ')}.`
        : 'Offers a contrasting option worth comparing.';
    const durationReason = match.preferences.days >= match.minDays
        ? `${match.preferences.days} days meets the recommended starting window.`
        : `A focused visit usually needs about ${match.minDays} days.`;
    const routeMarkup = match.route ? `
        <a class="destination-match-route" href="${routePath(match.route.id)}">
            <span>Matched route</span><strong>${escapeHtml(match.route.title)}</strong><small>${escapeHtml(match.route.duration.label)} <i class="fas fa-arrow-right" aria-hidden="true"></i></small>
        </a>` : '';

    return `
        <article class="destination-match-card" data-country="${escapeHtml(match.countryId)}">
            <div class="destination-match-card-image">
                <img src="${cardImageUrl(match.countryId)}" alt="${escapeHtml(meta.name)} travel landscape" loading="lazy">
                <span>${String(index + 1).padStart(2, '0')}</span>
                <strong>${FIT_LABELS[index]}</strong>
            </div>
            <div class="destination-match-card-body">
                <div class="destination-match-title"><span>${meta.flag}</span><div><small>${escapeHtml(match.strengths[0])}</small><h4>${escapeHtml(meta.name)}</h4></div></div>
                <div class="destination-match-season destination-match-season--${seasonClass}"><i class="fas fa-cloud-sun" aria-hidden="true"></i><p><strong>${escapeHtml(match.season.month)} outlook</strong>${escapeHtml(match.season.notes)}</p></div>
                <ul class="destination-match-reasons">
                    <li><i class="fas fa-check" aria-hidden="true"></i>${escapeHtml(interestReason)}</li>
                    <li><i class="fas fa-check" aria-hidden="true"></i>${escapeHtml(durationReason)}</li>
                    <li><i class="fas fa-check" aria-hidden="true"></i>${escapeHtml(match.strengths[1])}.</li>
                </ul>
                <p class="destination-match-tradeoff"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i><span><strong>Consider</strong>${escapeHtml(match.tradeoff)}</span></p>
                ${routeMarkup}
                <div class="destination-match-actions">
                    <a href="${countryPath(match.countryId)}">Open country guide</a>
                    <button type="button" data-start-country-trip="${escapeHtml(match.countryId)}" data-country-name="${escapeHtml(meta.name)}"><i class="fas fa-plus" aria-hidden="true"></i> Start this trip</button>
                </div>
            </div>
        </article>`;
}

function renderResults(form) {
    const preferences = preferenceInput(form);
    const matches = rankDestinations(matcherData.profiles, weather, routeCollection.routes, preferences).slice(0, 3);
    const grid = document.getElementById('destination-match-grid');
    const summary = document.getElementById('destination-match-summary');
    if (grid) grid.innerHTML = matches.map(renderMatch).join('');
    if (summary) summary.textContent = destinationMatchSummary(preferences);
}

export function initDestinationMatcher() {
    const form = document.getElementById('destination-matcher-form');
    if (!form) return;

    const month = form.querySelector('[name="month"]');
    if (month) month.value = String(new Date().getMonth());

    form.addEventListener('submit', event => {
        event.preventDefault();
        renderResults(form);
        document.getElementById('destination-match-results-title')?.focus({ preventScroll: true });
        document.querySelector('.destination-match-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('destination-match-grid')?.addEventListener('click', event => {
        const button = event.target.closest('[data-start-country-trip]');
        if (!button) return;
        const preferences = preferenceInput(form);
        const countryId = button.dataset.startCountryTrip;
        const countryName = button.dataset.countryName;
        createTrip({
            name: `${countryName} trip`,
            countries: [countryId],
            notes: `Started from the destination matcher: ${destinationMatchSummary(preferences)}.`,
        });
        trackProductEvent('trip_created', { source: 'destination_matcher', countryCount: 1, hasDates: false });
        window.location.assign('/my-safari');
    });

    renderResults(form);
}
