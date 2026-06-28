import countryResources from '../../data/country-resources.json';
import parksData from '../../data/parks.json';
import bordersData from '../../data/borders.json';
import practicalData from '../../data/practical.json';
import { renderParkFeeTable } from './park-fees.js';

export function getCountryResourcePack(countryId) {
    return countryResources[countryId] || null;
}

export function getVisaRow(countryId) {
    return practicalData.visaHealth?.find(row => row.id === countryId) || null;
}

export function getParksForCountry(countryId) {
    return parksData.filter(park => park.country === countryId);
}

export function getBordersForCountry(countryId) {
    return bordersData.filter(border => border.countries.includes(countryId));
}

export function getParkBookingUrl(park, countryId) {
    if (park.bookingUrl) return park.bookingUrl;
    const pack = getCountryResourcePack(countryId);
    const parksLink = pack?.links?.find(link => link.id === 'parks');
    return parksLink?.url || park.sourceUrl || '';
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderOfficialResourceCard(link) {
    return `
        <a class="official-resource-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
            <span class="official-resource-icon"><i class="fas ${escapeHtml(link.icon)}"></i></span>
            <span class="official-resource-body">
                <strong>${escapeHtml(link.label)}</strong>
                <span>${escapeHtml(link.desc)}</span>
            </span>
            <i class="fas fa-external-link-alt official-resource-arrow" aria-hidden="true"></i>
        </a>
    `;
}

export function renderCountryParkRow(park, countryId) {
    const bookingUrl = getParkBookingUrl(park, countryId);
    const bookingLink = bookingUrl
        ? `<a class="resource-inline-link" href="${escapeHtml(bookingUrl)}" target="_blank" rel="noopener noreferrer">Book / fees <i class="fas fa-external-link-alt"></i></a>`
        : '';

    return `
        <article class="country-resource-row country-resource-row--park">
            <div>
                <h4>${escapeHtml(park.name)}</h4>
                <p>${escapeHtml(park.fees)} · ${escapeHtml(park.bestSeason)}</p>
                ${renderParkFeeTable(park, { compact: true })}
            </div>
            ${bookingLink}
        </article>
    `;
}

export function renderCountryBorderRow(border, countryId) {
    const otherCountry = border.countries.find(id => id !== countryId);
    const sourceLink = border.sourceUrl
        ? `<a class="resource-inline-link" href="${escapeHtml(border.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official source <i class="fas fa-external-link-alt"></i></a>`
        : '';

    return `
        <article class="country-resource-row" data-other-country="${otherCountry || ''}">
            <div>
                <h4>${escapeHtml(border.name)}</h4>
                <p>${escapeHtml(border.route)} · ${escapeHtml(border.hours)} · ${escapeHtml(border.typicalWait)} wait</p>
            </div>
            ${sourceLink}
        </article>
    `;
}
