import campsiteData from '../../data/campsites.json';
import { COUNTRY_META } from '../lib/country-meta.js';
import { campsiteBooking, campsiteCoverage, filterCampsites, sortCampsites } from '../lib/campsite-planner.js';
import { addBooking } from '../lib/trip-bookings.js';
import { getActiveTrip, updateTrip } from '../lib/trip-store.js';

const ACCESS_LABELS = {
    standard: 'Standard vehicle',
    'high-clearance': 'Higher clearance',
    '4x4': '4×4 access',
};

const SETTING_LABELS = {
    'inside-park': 'Inside a park',
    wilderness: 'Remote wilderness',
    'park-gateway': 'Park gateway',
    lakeside: 'Lakeside',
    'community-base': 'Community base',
    'wildlife-sanctuary': 'Wildlife sanctuary',
};

const FACILITY_LABELS = {
    ablutions: 'Ablutions', power: 'Power', pool: 'Pool', shop: 'Shop', restaurant: 'Restaurant', fuel: 'Fuel',
    braai: 'Fire / braai', 'communal-kitchen': 'Communal kitchen', 'water-point': 'Water point',
    'hot-showers': 'Hot showers', 'waste-disposal': 'Waste disposal', wifi: 'Wi-Fi',
};

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month - 1, day)));
}

function optionList(values, labels, initialLabel) {
    return `<option value="all">${initialLabel}</option>${values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(labels[value] || value)}</option>`).join('')}`;
}

function siteCard(site, savedProviders) {
    const country = COUNTRY_META[site.country] || {};
    const saved = savedProviders.has(site.name);
    return `
        <article class="camp-planner-card camp-planner-card--${escapeHtml(site.accessLevel)}">
            <header>
                <span class="camp-planner-card__country">${country.flag || ''} ${escapeHtml(country.name || site.country)}</span>
                <span class="camp-planner-card__access"><i class="fas fa-road" aria-hidden="true"></i> ${escapeHtml(site.accessLabel)}</span>
            </header>
            <div class="camp-planner-card__body">
                <span class="camp-planner-card__setting">${escapeHtml(SETTING_LABELS[site.setting] || site.setting)} · ${escapeHtml(site.area)}</span>
                <h3>${escapeHtml(site.name)}</h3>
                <dl>
                    <div><dt>Road &amp; vehicle</dt><dd>${escapeHtml(site.accessNote)}</dd></div>
                    <div><dt>Season</dt><dd>${escapeHtml(site.seasonNote)}</dd></div>
                    <div><dt>Safety / supplies</dt><dd>${escapeHtml(site.safetyNote)}</dd></div>
                </dl>
                <div class="camp-planner-card__facilities" aria-label="Facilities listed by the source">
                    ${site.facilities.length ? site.facilities.map(item => `<span>${escapeHtml(FACILITY_LABELS[item] || item)}</span>`).join('') : '<span class="is-unknown">Facilities not detailed — ask first</span>'}
                </div>
            </div>
            <footer>
                <div class="camp-planner-card__source">
                    <span>Source checked ${formatDate(site.reviewedOn)}</span>
                    <a href="${escapeHtml(site.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(site.sourceLabel)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
                </div>
                <button type="button" class="camp-planner-card__save" data-save-campsite="${escapeHtml(site.id)}" ${saved ? 'disabled' : ''}>
                    <i class="fas ${saved ? 'fa-check' : 'fa-bookmark'}" aria-hidden="true"></i> ${saved ? 'In My Safari' : 'Shortlist in My Safari'}
                </button>
            </footer>
        </article>`;
}

export function initCampsites() {
    const app = document.getElementById('campsites-app');
    const form = document.getElementById('camp-planner-filter-form');
    if (!app || !form) return;

    const countrySelect = document.getElementById('camp-planner-country');
    const settingSelect = document.getElementById('camp-planner-setting');
    const accessSelect = document.getElementById('camp-planner-access');
    const facilitySelect = document.getElementById('camp-planner-facility');
    const status = document.getElementById('camp-planner-status');
    const summary = document.getElementById('camp-planner-summary');
    const empty = document.getElementById('camp-planner-empty');
    const coverage = campsiteCoverage(campsiteData.sites);

    const countries = [...new Set(campsiteData.sites.map(site => site.country))];
    countrySelect.innerHTML = `<option value="all">All ${coverage.countries} countries</option>${countries.map(id => `<option value="${id}">${COUNTRY_META[id]?.flag || ''} ${escapeHtml(COUNTRY_META[id]?.name || id)}</option>`).join('')}`;
    settingSelect.innerHTML = optionList([...new Set(campsiteData.sites.map(site => site.setting))], SETTING_LABELS, 'Every setting');
    accessSelect.innerHTML = optionList([...new Set(campsiteData.sites.map(site => site.accessLevel))], ACCESS_LABELS, 'Any vehicle access');
    facilitySelect.innerHTML = optionList([...new Set(campsiteData.sites.flatMap(site => site.facilities))].sort(), FACILITY_LABELS, 'Any listed facility');
    document.getElementById('camp-planner-reviewed').textContent = `Shortlist reviewed ${formatDate(campsiteData.meta.lastReviewed)}.`;
    document.getElementById('camp-planner-disclaimer').textContent = campsiteData.meta.disclaimer;
    document.getElementById('camp-planner-country-count').textContent = String(coverage.countries);
    document.getElementById('camp-planner-site-count').textContent = String(coverage.sites);

    const render = () => {
        const activeTrip = getActiveTrip();
        const savedProviders = new Set((activeTrip?.bookings || []).filter(item => item.type === 'stay').map(item => item.provider));
        const matches = sortCampsites(filterCampsites(campsiteData.sites, {
            country: countrySelect.value,
            setting: settingSelect.value,
            access: accessSelect.value,
            facility: facilitySelect.value,
        }));
        app.innerHTML = matches.map(site => siteCard(site, savedProviders)).join('');
        app.hidden = matches.length === 0;
        empty.hidden = matches.length !== 0;
        summary.textContent = `${matches.length} reviewed ${matches.length === 1 ? 'site' : 'sites'} match. Vehicle labels describe access—not rental permission or current road conditions.`;
    };

    form.addEventListener('change', render);
    form.addEventListener('reset', () => window.setTimeout(render, 0));
    app.addEventListener('click', event => {
        const button = event.target.closest('[data-save-campsite]');
        if (!button) return;
        const site = campsiteData.sites.find(item => item.id === button.dataset.saveCampsite);
        const activeTrip = getActiveTrip();
        if (!site || !activeTrip) {
            status.innerHTML = 'Create or select a trip in <a href="/my-safari">My Safari</a>, then return to shortlist this campsite.';
            return;
        }
        if (activeTrip.bookings.some(item => item.type === 'stay' && item.provider === site.name)) {
            status.textContent = `${site.name} is already in ${activeTrip.name}.`;
            return;
        }
        updateTrip(activeTrip.id, { bookings: addBooking(activeTrip.bookings, campsiteBooking(site)) });
        status.textContent = `${site.name} was added as a planned stay in ${activeTrip.name}. Availability is not reserved.`;
        render();
    });
    render();
}
