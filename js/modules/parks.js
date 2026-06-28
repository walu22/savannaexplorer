import parks from '../../data/parks.json';
import { COUNTRY_META } from '../lib/country-meta.js';
import { getParkBookingUrl } from '../lib/country-resources.js';

function tagIcon(tag) {
    const lower = tag.toLowerCase();
    if (lower.includes('big five') || lower.includes('elephant') || lower.includes('lion')) return 'fa-paw';
    if (lower.includes('hik') || lower.includes('walk')) return 'fa-person-hiking';
    if (lower.includes('marine') || lower.includes('boat') || lower.includes('canoe')) return 'fa-water';
    if (lower.includes('remote') || lower.includes('4x4')) return 'fa-road';
    if (lower.includes('unesco') || lower.includes('landscape')) return 'fa-mountain';
    return 'fa-leaf';
}

function renderParkCard(park) {
    const meta = COUNTRY_META[park.country] || {};
    const tags = park.tags.map(tag =>
        `<span><i class="fa-solid ${tagIcon(tag)}"></i> ${tag}</span>`
    ).join('');
    const bookingUrl = getParkBookingUrl(park, park.country);
    const links = [];
    if (bookingUrl) {
        links.push(`<a class="data-source-link data-source-link--primary" href="${bookingUrl}" target="_blank" rel="noopener noreferrer">Book / reserve <i class="fas fa-external-link-alt"></i></a>`);
    }
    if (park.sourceUrl) {
        links.push(`<a class="data-source-link" href="${park.sourceUrl}" target="_blank" rel="noopener noreferrer">Fees source · verified ${park.lastVerified || '—'}</a>`);
    }

    return `
        <div class="park-card" id="park-${park.id}" data-country="${park.country}">
            <div class="park-badge">${meta.flag || '🌍'}</div>
            <h3>${park.name}</h3>
            <p>${park.description}</p>
            <div class="park-meta">${tags}</div>
            <div class="park-extra">
                <span><i class="fa-solid fa-calendar"></i> ${park.bestSeason}</span>
                <span><i class="fa-solid fa-ticket"></i> ${park.fees}</span>
            </div>
            ${park.gateHours ? `<p class="park-gate-hours"><i class="fa-solid fa-clock"></i> ${park.gateHours}</p>` : ''}
            ${park.feeDetail ? `<p class="park-fee-detail">${park.feeDetail}</p>` : ''}
            ${links.length ? `<div class="park-source-links">${links.join('')}</div>` : ''}
        </div>
    `;
}

export function initParks() {
    const filtersEl = document.getElementById('parks-filters');
    const gridEl = document.getElementById('parks-grid');
    if (!gridEl) return;

    const countries = [...new Set(parks.map(p => p.country))];

    if (filtersEl) {
        filtersEl.innerHTML = `
            <button class="park-filter active" data-filter="all">All Parks</button>
            ${countries.map(id => {
                const m = COUNTRY_META[id];
                return `<button class="park-filter" data-filter="${id}">${m.flag} ${m.name}</button>`;
            }).join('')}
        `;
    }

    gridEl.innerHTML = parks.map(renderParkCard).join('');

    const countEl = document.getElementById('parks-count');
    if (countEl) countEl.textContent = parks.length;

    document.querySelectorAll('.park-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.park-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.park-card').forEach(card => {
                const match = filter === 'all' || card.getAttribute('data-country') === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}
