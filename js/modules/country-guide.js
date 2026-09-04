import countries from '../../data/countries.json';
import faqs from '../../data/faqs.json';
import regions from '../../data/regions.json';
import quickFacts from '../../data/country-quickfacts.json';
import weatherData from '../../data/country-weather.json';
import tipsData from '../../data/country-tips.json';
import routeCollection from '../../data/route-collections.json';
import { getFullCountryData } from '../lib/merge-country.js';
import { getCountryGuide } from '../lib/guide.js';
import { spotImageUrl, activityImageUrl } from '../lib/images.js';
import { getCountryMeta, cardImageUrl } from '../lib/country-meta.js';
import {
    getBordersForCountry,
    getCountryResourcePack,
    getParksForCountry,
    getVisaRow,
    renderCountryBorderRow,
    renderCountryParkRow,
    renderOfficialResourceCard,
} from '../lib/country-resources.js';
import { hasCountryMapData, mountCountryMap } from '../lib/itinerary-maps.js';
import {
    parseLocation,
    navigateToCountry,
    navigateHome,
    replaceWithCountryPath,
    scrollToSection,
    countryPath,
    routePath,
    COUNTRY_IDS,
    HUB_SECTIONS,
} from '../lib/router.js';
import { routeToTripTemplate } from '../lib/route-collection.js';
import { createTrip } from '../lib/trip-store.js';
import { setCountryMeta, setHomeMeta, setHubMeta } from '../lib/page-meta.js';
import { dismissSeoPrerender } from '../lib/seo-prerender.js';
import { handleSeoRoute } from './seo-routes.js';
import { getCountryLastReviewed, lastReviewedLabel, toIsoReviewDate } from '../lib/content-meta.js';
import { getListingsForCountry, renderCountryBookRows } from './book-direct.js';
import { closeMobileNav, setMainNavSuppressed } from './nav.js';
import { syncOfflineButtonState } from './offline-manager.js';
import { inferSpotTags } from '../lib/spot-tags.js';

const detailView = document.getElementById('country-detail-view');
const countryScroll = document.getElementById('country-detail-scroll');
const closeDetailBtn = document.getElementById('close-detail');
const detailTitle = document.getElementById('detail-title');
const detailTagline = document.getElementById('detail-tagline');
const detailGeo = document.getElementById('detail-geo');
const detailPeople = document.getElementById('detail-people');
const detailSpotsGrid = document.getElementById('detail-spots-grid');
const detailActivities = document.getElementById('detail-activities');
const detailTransport = document.getElementById('detail-transport');
const detailBudget = document.getElementById('detail-budget');
const detailVisa = document.getElementById('detail-visa');
const detailSafety = document.getElementById('detail-safety');
const detailMoney = document.getElementById('detail-money');
const detailFlavorInline = document.getElementById('detail-flavor-inline');
const ctaCountryName = document.querySelector('.cta-country-name');

let countryHeaderScrollHandler;

function bindCountryPageHeader() {
    const header = document.getElementById('country-page-header');
    const scrollEl = countryScroll;
    if (!header || !scrollEl) return;

    countryHeaderScrollHandler = () => {
        header.classList.toggle('scrolled', scrollEl.scrollTop > 50);
    };
    scrollEl.addEventListener('scroll', countryHeaderScrollHandler, { passive: true });
    countryHeaderScrollHandler();
}

function unbindCountryPageHeader() {
    const scrollEl = countryScroll;
    if (scrollEl && countryHeaderScrollHandler) {
        scrollEl.removeEventListener('scroll', countryHeaderScrollHandler);
    }
    countryHeaderScrollHandler = null;
    document.getElementById('country-page-header')?.classList.remove('scrolled');
}
function activateGuideTab(tabId) {
    if (!tabId) return;
    document.querySelectorAll('#country-detail-view .guide-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.guide-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`panel-${tabId}`)?.classList.add('active');
}

function resetGuideTabs() {
    activateGuideTab('about');
}

function spotMetaHtml(spot) {
    const badges = [];
    if (spot.bestSeason) badges.push(`<span><i class="fas fa-calendar"></i> ${spot.bestSeason}</span>`);
    if (spot.visitDuration) badges.push(`<span><i class="fas fa-clock"></i> ${spot.visitDuration}</span>`);
    if (spot.fees) badges.push(`<span><i class="fas fa-ticket"></i> ${spot.fees}</span>`);
    const meta = badges.length ? `<div class="spot-meta">${badges.join('')}</div>` : '';
    const tip = spot.tip ? `<p class="spot-tip"><i class="fas fa-lightbulb"></i> ${spot.tip}</p>` : '';
    return meta + tip;
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function spotAnchorId(name) {
    return `country-spot-${String(name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}`;
}

function regionCardHtml(region, availableSpots) {
    const facts = [
        ['fa-plane-arrival', 'Gateway', region.gateway],
        ['fa-clock', 'Ideal stay', region.idealStay],
        ['fa-calendar-alt', 'When to go', region.bestMonths],
    ].filter(([, , value]) => value);
    const linkedSpots = (region.spots || []).filter(name => availableSpots.has(name));

    return `
        <article class="region-card${facts.length ? ' region-card--detailed' : ''}">
            ${region.province ? `<p class="region-card-kicker">${escapeHtml(region.province)}</p>` : ''}
            <h3>${escapeHtml(region.name)}</h3>
            <p class="region-card-desc">${escapeHtml(region.desc)}</p>
            ${facts.length ? `<dl class="region-facts">${facts.map(([icon, label, value]) => `
                <div><dt><i class="fas ${icon}" aria-hidden="true"></i>${label}</dt><dd>${escapeHtml(value)}</dd></div>
            `).join('')}</dl>` : ''}
            ${region.bestFor?.length ? `
                <div class="region-best-for" aria-label="Best for">
                    ${region.bestFor.map(item => `<span>${escapeHtml(item)}</span>`).join('')}
                </div>
            ` : ''}
            ${linkedSpots.length ? `
                <div class="region-places">
                    <span class="region-places-label">Explore these places</span>
                    <div>${linkedSpots.map(name => `
                        <button type="button" class="region-place-link" data-spot-target="${spotAnchorId(name)}">${escapeHtml(name)}</button>
                    `).join('')}</div>
                </div>
            ` : ''}
            ${region.source?.url ? `
                <a class="region-source-link" href="${escapeHtml(region.source.url)}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(region.source.label || 'Official regional guide')}
                    <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                </a>
                ${region.source.lastVerified ? `<span class="region-source-date">Link checked ${escapeHtml(region.source.lastVerified)}</span>` : ''}
            ` : ''}
        </article>
    `;
}

function setCollapsibleText(el, text, threshold = 220) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('collapsible-text', 'expanded');
    const existingBtn = el.parentElement?.querySelector('.read-more-toggle');
    if (existingBtn) existingBtn.remove();

    if (!text || text.length <= threshold) return;

    el.classList.add('collapsible-text');
    const btn = document.createElement('button');
    btn.className = 'read-more-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    if (el.id) btn.setAttribute('aria-controls', el.id);
    btn.innerHTML = 'Read more <i class="fas fa-chevron-down"></i>';
    el.after(btn);
    btn.addEventListener('click', () => {
        const isExpanded = el.classList.toggle('expanded');
        btn.classList.toggle('toggled', isExpanded);
        btn.setAttribute('aria-expanded', String(isExpanded));
        btn.innerHTML = isExpanded
            ? 'Show less <i class="fas fa-chevron-up"></i>'
            : 'Read more <i class="fas fa-chevron-down"></i>';
    });
}

function populateCountryPage(countryId) {
    const data = getFullCountryData(countryId);
    if (!data) return;
    const guide = getCountryGuide(countryId, data);

    if (countryScroll) countryScroll.scrollTop = 0;
    detailTitle.textContent = data.name;
    detailTagline.textContent = data.tagline;
    const reviewedEl = document.getElementById('detail-last-reviewed');
    if (reviewedEl) {
        const reviewed = getCountryLastReviewed(countryId);
        reviewedEl.textContent = lastReviewedLabel(reviewed);
        reviewedEl.hidden = !reviewedEl.textContent;
        const iso = toIsoReviewDate(reviewed);
        if (iso) reviewedEl.dateTime = iso;
    }
    const headerName = document.getElementById('detail-header-country-name');
    if (headerName) headerName.textContent = data.name;

    const meta = getCountryMeta(countryId);
    const heroImg = document.getElementById('detail-hero-img');
    if (heroImg) {
        heroImg.src = cardImageUrl(countryId);
        heroImg.alt = `${data.name} — travel destination`;
    }
    const flagEl = document.getElementById('detail-flag');
    if (flagEl) flagEl.textContent = meta.flag || '🌍';

    const statsEl = document.getElementById('detail-quick-stats');
    if (statsEl) {
        const regionCount = regions[countryId]?.length || 0;
        statsEl.innerHTML = `
            <div class="detail-stat"><strong>${data.spots.length}</strong><span>Top Spots</span></div>
            <div class="detail-stat"><strong>${data.activities.length}</strong><span>Activities</span></div>
            <div class="detail-stat"><strong>${data.routes?.length || 0}</strong><span>Routes</span></div>
            ${regionCount ? `<div class="detail-stat"><strong>${regionCount}</strong><span>Regions</span></div>` : ''}
        `;
    }

    const highlightsEl = document.getElementById('detail-highlights');
    if (highlightsEl) {
        highlightsEl.innerHTML = data.highlights.map(item => `
            <span class="highlight-chip"><span class="chip-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>${escapeHtml(item.label)}</span>
        `).join('');
    }

    const aboutHeading = document.getElementById('detail-about-heading');
    const aboutIntro = document.getElementById('detail-about-intro');
    const summaryEl = document.getElementById('detail-summary');
    const gettingThereEl = document.getElementById('detail-getting-there');
    const economyEl = document.getElementById('detail-economy');

    if (aboutHeading) aboutHeading.textContent = `Information About ${data.name}`;
    if (aboutIntro) aboutIntro.textContent = `Discover essential information for your trip to ${data.name} — geography, history, culture, wildlife, and practical travel advice.`;

    // Quick Facts
    const qf = quickFacts[countryId];
    const quickFactsContainer = document.getElementById('detail-quick-facts');
    if (quickFactsContainer && qf) {
        quickFactsContainer.innerHTML = `
            <div class="qf-item"><i class="fas fa-city"></i><span class="qf-label">Capital</span><span class="qf-val">${qf.capital}</span></div>
            <div class="qf-item"><i class="fas fa-users"></i><span class="qf-label">Population</span><span class="qf-val">${qf.population}</span></div>
            <div class="qf-item"><i class="fas fa-ruler-combined"></i><span class="qf-label">Area</span><span class="qf-val">${qf.area}</span></div>
            <div class="qf-item"><i class="fas fa-clock"></i><span class="qf-label">Timezone</span><span class="qf-val">${qf.timezone}</span></div>
            <div class="qf-item"><i class="fas fa-money-bill"></i><span class="qf-label">Currency</span><span class="qf-val">${qf.currency}</span></div>
            <div class="qf-item"><i class="fas fa-car"></i><span class="qf-label">Driving</span><span class="qf-val">${qf.drivingSide}</span></div>
            <div class="qf-item"><i class="fas fa-plug"></i><span class="qf-label">Voltage</span><span class="qf-val">${qf.voltage}</span></div>
            <div class="qf-item"><i class="fas fa-language"></i><span class="qf-label">Languages</span><span class="qf-val">${qf.languages}</span></div>
            <div class="qf-item"><i class="fas fa-phone-alt"></i><span class="qf-label">Emergency</span><span class="qf-val">${qf.emergency}</span></div>
            <div class="qf-item"><i class="fas fa-sun"></i><span class="qf-label">Best Months</span><span class="qf-val">${qf.bestMonths}</span></div>
        `;
    } else if (quickFactsContainer) {
        quickFactsContainer.innerHTML = '';
    }

    if (summaryEl) {
        summaryEl.textContent = data.about.summary || '';
        summaryEl.classList.toggle('hidden', !data.about.summary);
    }
    setCollapsibleText(detailGeo, data.about.geo);
    setCollapsibleText(document.getElementById('detail-history'), data.about.history);
    setCollapsibleText(detailPeople, data.about.people);
    setCollapsibleText(document.getElementById('detail-wildlife'), guide.wildlife);
    setCollapsibleText(gettingThereEl, data.about.gettingThere);
    setCollapsibleText(economyEl, data.about.economy);

    detailSpotsGrid.innerHTML = data.spots.map(spot => `
        <div class="spot-detail-card" id="${spotAnchorId(spot.name)}">
            <img src="${spotImageUrl(spot)}" alt="${spot.name}" loading="lazy">
            <div class="spot-detail-info">
                <div class="spot-tags" aria-label="Destination categories">${inferSpotTags(spot).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
                <h3>${spot.name}</h3>
                <p>${spot.desc}</p>
                ${spotMetaHtml(spot)}
            </div>
        </div>
    `).join('');

    const regionsGrid = document.getElementById('detail-regions-grid');
    const countryRegions = regions[countryId];
    const regionsSection = document.getElementById('detail-regions-section');
    if (regionsGrid && countryRegions?.length) {
        regionsSection?.classList.remove('hidden');
        const availableSpots = new Set(data.spots.map(spot => spot.name));
        regionsGrid.classList.toggle('regions-grid--detailed', countryRegions.some(region => region.gateway));
        regionsGrid.innerHTML = countryRegions.map(region => regionCardHtml(region, availableSpots)).join('');
        regionsGrid.querySelectorAll('.region-place-link').forEach(link => {
            link.addEventListener('click', () => {
                const target = document.getElementById(link.dataset.spotTarget);
                if (!target) return;
                detailSpotsGrid.querySelectorAll('.spot-card--spotlight').forEach(card => card.classList.remove('spot-card--spotlight'));
                target.classList.add('spot-card--spotlight');
                target.setAttribute('tabindex', '-1');
                target.scrollIntoView({
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                    block: 'center',
                });
                target.focus({ preventScroll: true });
            });
        });
    } else {
        regionsSection?.classList.add('hidden');
        regionsGrid?.classList.remove('regions-grid--detailed');
    }

    detailActivities.innerHTML = data.activities.map(act => `
        <article class="activity-detail-card">
            <img src="${activityImageUrl(act)}" alt="${act.name}" loading="lazy">
            <div class="activity-detail-body">
                <h3>${act.name}</h3>
                <p>${act.desc}</p>
            </div>
        </article>
    `).join('');

    const actCategories = document.getElementById('detail-activity-categories');
    if (actCategories) {
        actCategories.innerHTML = guide.activityCategories.map(cat => `
            <div class="activity-cat-card">
                <div class="activity-cat-header"><span>${cat.icon}</span><h4>${cat.name}</h4></div>
                <ul>${cat.items.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    detailTransport.textContent = data.advice.transport;
    detailBudget.textContent = data.advice.budget;
    detailVisa.textContent = data.advice.visa;
    detailSafety.textContent = data.advice.safety;
    detailMoney.textContent = data.advice.money;

    document.getElementById('detail-health').textContent = guide.health;
    document.getElementById('detail-tipping').textContent = guide.tipping;
    document.getElementById('detail-food').textContent = guide.food;

    document.getElementById('detail-seasons').innerHTML = guide.seasons.map(s => `
        <div class="season-card"><span class="season-icon">${s.icon}</span><h4>${s.name}</h4><p>${s.desc}</p></div>
    `).join('');

    // Weather Matrix
    const weatherList = weatherData[countryId];
    const weatherMatrix = document.getElementById('detail-weather-matrix');
    if (weatherMatrix && weatherList) {
        weatherMatrix.innerHTML = `
            <h3><i class="fas fa-cloud-sun-rain"></i> Climate & Weather Overview</h3>
            <div class="weather-grid">
                ${weatherList.map(w => `
                    <div class="weather-cell rating-${w.rating}">
                        <div class="weather-month">${w.month}</div>
                        <div class="weather-temp"><i class="fas fa-temperature-high"></i> ${w.tempHigh}° / ${w.tempLow}°</div>
                        <div class="weather-rain"><i class="fas fa-tint"></i> ${w.rain}mm</div>
                        <div class="weather-notes">${w.notes}</div>
                    </div>
                `).join('')}
            </div>
            <div class="weather-legend">
                <span class="legend-item"><span class="legend-dot rating-ideal"></span> Ideal</span>
                <span class="legend-item"><span class="legend-dot rating-shoulder"></span> Shoulder</span>
                <span class="legend-item"><span class="legend-dot rating-avoid"></span> Avoid / Challenging</span>
            </div>
        `;
    } else if (weatherMatrix) {
        weatherMatrix.innerHTML = '';
    }

    const bestTimeEl = document.getElementById('detail-best-time');
    if (bestTimeEl) {
        bestTimeEl.innerHTML = data.bestTimeFor.length ? `
            <h3><i class="fas fa-calendar-check" aria-hidden="true"></i> Best time for your interests</h3>
            <div class="best-time-grid">
                ${data.bestTimeFor.map(item => `<article class="best-time-card">
                    <span class="best-time-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
                    <div class="best-time-info"><p class="best-time-activity">${escapeHtml(item.activity)}</p><p class="best-time-months">${escapeHtml(item.months)}</p></div>
                </article>`).join('')}
            </div>
        ` : '';
    }

    document.getElementById('detail-packing').innerHTML = guide.packing.map(item => `<li>${item}</li>`).join('');

    document.getElementById('detail-day-narrative').innerHTML = `
        <h3><i class="fas fa-sun"></i> A Day on Safari in ${data.name}</h3>
        <ol class="narrative-list">${guide.dayNarrative.map(line => `<li>${line}</li>`).join('')}</ol>
    `;

    const p = guide.practical;
    document.getElementById('detail-practical').innerHTML = `
        <div class="practical-card"><i class="fas fa-language"></i><h4>Language</h4><p>${p.language}</p></div>
        <div class="practical-card"><i class="fas fa-plug"></i><h4>Electricity</h4><p>${p.electricity}</p></div>
        <div class="practical-card"><i class="fas fa-sim-card"></i><h4>Mobile & SIM</h4><p>${p.sim}</p></div>
        <div class="practical-card"><i class="fas fa-clock"></i><h4>Time Zone</h4><p>${p.time}</p></div>
    `;

    // Traveler Tips
    const tipsList = tipsData[countryId];
    const tipsSection = document.getElementById('detail-tips-section');
    if (tipsSection && tipsList && tipsList.length > 0) {
        tipsSection.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Did You Know?</h3>
            <div class="tips-grid">
                ${tipsList.map(tip => `
                    <div class="tip-card">
                        <i class="fas fa-info-circle"></i>
                        <p>${tip}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (tipsSection) {
        tipsSection.innerHTML = '';
    }

    const resourcePack = getCountryResourcePack(countryId);
    const visaRow = getVisaRow(countryId);
    const resourcesSection = document.getElementById('detail-resources-section');
    const resourcesGrid = document.getElementById('detail-official-resources');
    const resourcesNote = document.getElementById('detail-resources-note');

    if (resourcesSection && resourcesGrid) {
        const links = [...(resourcePack?.links || [])];
        if (visaRow?.sourceUrl && !links.some(link => link.id === 'immigration')) {
            links.push({
                id: 'immigration',
                icon: 'fa-passport',
                label: 'Immigration — official source',
                url: visaRow.sourceUrl,
                desc: 'Visa and entry requirements from our visa matrix source',
            });
        }

        if (links.length) {
            resourcesSection.hidden = false;
            resourcesGrid.innerHTML = links.map(renderOfficialResourceCard).join('');
            if (resourcesNote) {
                const verified = resourcePack?.lastVerified || visaRow?.lastVerified || '2026-03';
                const planningNote = resourcePack?.planningNote || '';
                resourcesNote.innerHTML = `${planningNote ? `${planningNote} ` : ''}<span class="resource-verified">Links verified ${verified} — always confirm before you travel.</span>`;
            }
        } else {
            resourcesSection.hidden = true;
            resourcesGrid.innerHTML = '';
        }
    }

    const countryParks = getParksForCountry(countryId);
    const parksSection = document.getElementById('detail-parks-section');
    const parksList = document.getElementById('detail-country-parks');
    if (parksSection && parksList) {
        if (countryParks.length) {
            parksSection.hidden = false;
            parksList.innerHTML = countryParks.map(park => renderCountryParkRow(park, countryId)).join('');
        } else {
            parksSection.hidden = true;
            parksList.innerHTML = '';
        }
    }

    const countryBookings = getListingsForCountry(countryId);
    const bookSection = document.getElementById('detail-book-section');
    const bookList = document.getElementById('detail-country-book');
    if (bookSection && bookList) {
        if (countryBookings.length) {
            bookSection.hidden = false;
            bookList.innerHTML = renderCountryBookRows(countryBookings);
        } else {
            bookSection.hidden = true;
            bookList.innerHTML = '';
        }
    }

    const countryBorders = getBordersForCountry(countryId);
    const bordersSection = document.getElementById('detail-borders-section');
    const bordersList = document.getElementById('detail-country-borders');
    if (bordersSection && bordersList) {
        if (countryBorders.length) {
            bordersSection.hidden = false;
            bordersList.innerHTML = countryBorders
                .slice(0, 6)
                .map(border => renderCountryBorderRow(border, countryId))
                .join('');
            const moreEl = document.getElementById('detail-borders-more');
            if (moreEl) {
                moreEl.textContent = countryBorders.length > 6
                    ? `+ ${countryBorders.length - 6} more crossings in the full border guide`
                    : '';
            }
        } else {
            bordersSection.hidden = true;
            bordersList.innerHTML = '';
        }
    }

    const detailRoutesGrid = document.getElementById('detail-routes-grid');
    if (detailRoutesGrid) {
        const countryRoutes = routeCollection.routes.filter(route => route.countryIds.includes(countryId));
        detailRoutesGrid.innerHTML = countryRoutes.map(route => `
            <article class="route-card country-route-card">
                <div class="country-route-card__top">
                    <span class="route-readiness route-readiness--${escapeHtml(route.readiness)}">${route.readiness === 'green' ? 'Map ready' : 'Check conditions'}</span>
                    <span>${escapeHtml(route.duration.label)}</span>
                </div>
                <h4>${escapeHtml(route.title)}</h4>
                <p>${escapeHtml(route.promise)}</p>
                <div class="route-meta">
                    <span><i class="fas fa-car" aria-hidden="true"></i>${escapeHtml(route.vehicle.label)}</span>
                    <span><i class="far fa-calendar" aria-hidden="true"></i>${escapeHtml(route.bestSeason.label)}</span>
                </div>
                <ol class="country-route-days" aria-label="Day-by-day preview">
                    ${route.phases.slice(0, 3).map(phase => `<li><span>Day ${phase.dayStart}</span>${escapeHtml(phase.title)}</li>`).join('')}
                </ol>
                <p class="country-route-card__plan-note"><i class="fas fa-pen-to-square" aria-hidden="true"></i>${route.duration.min}-day editable plan with ${route.stops.length} mapped stops</p>
                <div class="country-route-card__actions">
                    <a class="btn btn-outline btn-sm" href="${escapeHtml(routePath(route.id))}" data-country-route-open="${escapeHtml(route.id)}">View full route</a>
                    <button type="button" class="btn btn-primary btn-sm" data-country-route-start="${escapeHtml(route.id)}">Start in My Safari</button>
                </div>
                <p class="country-route-card__status" role="status" aria-live="polite"></p>
            </article>
        `).join('');
    }

    if (detailFlavorInline) {
        detailFlavorInline.innerHTML = `
            <div class="flavor-item"><div class="flavor-icon"><i class="fa-solid fa-utensils"></i></div><div class="flavor-text"><span class="flavor-label">Signature Dish</span><span class="flavor-value">${data.localFlavor.food}</span></div></div>
            <div class="flavor-item"><div class="flavor-icon"><i class="fa-solid fa-glass-water"></i></div><div class="flavor-text"><span class="flavor-label">Local Drink</span><span class="flavor-value">${data.localFlavor.drink}</span></div></div>
            <div class="flavor-item"><div class="flavor-icon"><i class="fa-solid fa-comments"></i></div><div class="flavor-text"><span class="flavor-label">Greeting</span><span class="flavor-value">${data.localFlavor.lang}</span></div></div>
        `;
    }

    if (ctaCountryName) {
        document.querySelectorAll('.cta-country-name').forEach(el => {
            el.textContent = data.name;
        });
    }

    const faqList = document.getElementById('detail-faq-list');
    if (faqList) {
        const countryFaqs = faqs[countryId] || [];
        faqList.innerHTML = countryFaqs.map((item, i) => `
            <div class="accordion-item faq-item">
                <button class="accordion-header" aria-expanded="false" data-faq="${i}">
                    <span class="accordion-title">${item.q}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="accordion-body" id="faq-body-${i}">
                    <p>${item.a}</p>
                </div>
            </div>
        `).join('');

        faqList.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const expanded = header.getAttribute('aria-expanded') === 'true';
                faqList.querySelectorAll('.accordion-header').forEach(h => {
                    h.setAttribute('aria-expanded', 'false');
                    h.nextElementSibling?.classList.remove('open');
                });
                if (!expanded) {
                    header.setAttribute('aria-expanded', 'true');
                    header.nextElementSibling?.classList.add('open');
                }
            });
        });
    }

    const mapPanel = document.getElementById('country-map-panel');
    if (mapPanel) {
        mapPanel.hidden = !hasCountryMapData(countryParks, countryBorders);
        if (!mapPanel.hidden) {
            mountCountryMap(countryId, countryParks, countryBorders).catch((error) => {
                console.error('[Country map] Failed to load:', error);
                mapPanel.hidden = true;
            });
        }
    }

    resetGuideTabs();
}

function showCountryPage(countryId) {
    if (!countries[countryId]) return;
    dismissSeoPrerender();
    populateCountryPage(countryId);
    closeMobileNav();
    setMainNavSuppressed(true);
    detailView.classList.remove('hidden');
    detailView.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setCountryMeta(countryId, getFullCountryData(countryId));
    requestAnimationFrame(() => bindCountryPageHeader());
    // Sync offline button state
    const saveBtn = document.getElementById('btn-save-country-offline');
    if (saveBtn) syncOfflineButtonState('country', countryId, saveBtn);
}

function hideCountryPage() {
    unbindCountryPageHeader();
    setMainNavSuppressed(false);
    detailView.classList.add('hidden');
    detailView.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setHomeMeta();
}

function closeCountryPage(scrollTarget) {
    hideCountryPage();
    navigateHome(scrollTarget);
    if (scrollTarget) {
        requestAnimationFrame(() => scrollToSection(scrollTarget));
    }
}

export function openCountryPage(countryId, { replace = false } = {}) {
    if (!countries[countryId]) return;
    navigateToCountry(countryId, { replace });
    showCountryPage(countryId);
}

function handleRoute(route) {
    if (route.type === 'legacy-country-hash') {
        replaceWithCountryPath(route.countryId);
        showCountryPage(route.countryId);
        return;
    }

    if (route.type === 'country') {
        showCountryPage(route.countryId);
        return;
    }

    if (route.type === 'park' || route.type === 'border' || route.type === 'itinerary' || route.type === 'route' || route.type === 'listing' || route.type === 'planning-guide') {
        hideCountryPage();
        handleSeoRoute(route);
        return;
    }

    hideCountryPage();
    dismissSeoPrerender();
    if (route.sectionHash && HUB_SECTIONS.has(route.sectionHash)) {
        setHubMeta(route.sectionHash);
    } else {
        setHomeMeta();
    }
    if (route.sectionHash && !COUNTRY_IDS.includes(route.sectionHash)) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => scrollToSection(route.sectionHash));
        });
    }
}

export function bootstrapRouting() {
    window.addEventListener('popstate', () => handleRoute(parseLocation()));
    handleRoute(parseLocation());
}

export function initCountryGuide() {
    document.getElementById('destinations-grid')?.addEventListener('click', (e) => {
        const card = e.target.closest('.country-card');
        if (!card) return;
        const countryId = card.getAttribute('data-country-id');
        if (countryId) openCountryPage(countryId);
    });

    closeDetailBtn?.addEventListener('click', () => closeCountryPage('destinations'));

    detailView?.addEventListener('click', (e) => {
        const tab = e.target.closest('.guide-tab');
        if (tab?.getAttribute('data-tab')) {
            activateGuideTab(tab.getAttribute('data-tab'));
            return;
        }
        if (e.target.closest('[data-action="back-home"]')) {
            closeCountryPage('home');
            return;
        }
        if (e.target.closest('[data-action="back-destinations"]')) {
            closeCountryPage('destinations');
            return;
        }
        const btn = e.target.closest('[data-action="view-itineraries"]');
        if (btn) {
            closeCountryPage('itineraries');
            return;
        }
        const routeOpen = e.target.closest('[data-country-route-open]');
        if (routeOpen) {
            e.preventDefault();
            hideCountryPage();
            window.location.assign(routePath(routeOpen.dataset.countryRouteOpen));
            return;
        }
        const routeStart = e.target.closest('[data-country-route-start]');
        if (routeStart) {
            const route = routeCollection.routes.find(item => item.id === routeStart.dataset.countryRouteStart);
            const template = routeToTripTemplate(route);
            const status = routeStart.closest('.country-route-card')?.querySelector('.country-route-card__status');
            if (!template) {
                if (status) status.textContent = 'This route could not be added.';
                return;
            }
            const trip = createTrip(template);
            if (status) status.textContent = `${trip.name} is ready. Opening your editable plan…`;
            window.location.assign('/my-safari');
            return;
        }
        const parksBtn = e.target.closest('[data-action="view-parks"]');
        if (parksBtn) {
            closeCountryPage('parks');
            return;
        }
        const bordersBtn = e.target.closest('[data-action="view-borders"]');
        if (bordersBtn) {
            closeCountryPage('borders');
            return;
        }
        const bookBtn = e.target.closest('[data-action="view-book-direct"]');
        if (bookBtn) {
            closeCountryPage('book-direct');
        }
    });

    document.getElementById('country-plan-cta')?.addEventListener('click', () => {
        closeCountryPage('plan');
    });

    document.querySelectorAll('a[href^="/countries/"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const match = link.getAttribute('href')?.match(/^\/countries\/([a-z-]+)\/?$/);
            if (!match || !countries[match[1]]) return;
            e.preventDefault();
            openCountryPage(match[1]);
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const id = link.getAttribute('href').slice(1);
        if (countries[id]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openCountryPage(id);
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !detailView.classList.contains('hidden')) {
            closeCountryPage('destinations');
        }
    });
}

export { closeCountryPage };
