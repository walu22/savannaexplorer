import countries from '../../data/countries.json';
import faqs from '../../data/faqs.json';
import regions from '../../data/regions.json';
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
import {
    parseLocation,
    navigateToCountry,
    navigateHome,
    replaceWithCountryPath,
    scrollToSection,
    countryPath,
    COUNTRY_IDS,
} from '../lib/router.js';
import { setCountryMeta, setHomeMeta } from '../lib/page-meta.js';
import { dismissSeoPrerender } from '../lib/seo-prerender.js';
import { handleSeoRoute } from './seo-routes.js';
import { getCountryLastReviewed, lastReviewedLabel, toIsoReviewDate } from '../lib/content-meta.js';
import { getListingsForCountry, renderCountryBookRows } from './book-direct.js';
import { closeMobileNav, setMainNavSuppressed } from './nav.js';

const detailView = document.getElementById('country-detail-view');
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

let heroSectionObserver;

function activateGuideTab(tabId) {
    if (!tabId) return;
    document.querySelectorAll('#country-detail-view .guide-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.guide-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`panel-${tabId}`)?.classList.add('active');
}

function updateStickyCountryNav(heroVisible) {
    const stickyNav = document.getElementById('sticky-country-nav');
    if (!stickyNav || !detailView) return;

    const wasHidden = stickyNav.hidden;
    if (!wasHidden && heroVisible) {
        const navHeight = stickyNav.offsetHeight;
        stickyNav.hidden = true;
        stickyNav.setAttribute('aria-hidden', 'true');
        detailView.classList.remove('country-sticky-nav-active');
        if (navHeight) {
            detailView.scrollTop = Math.max(0, detailView.scrollTop - navHeight);
        }
        return;
    }

    stickyNav.hidden = heroVisible;
    stickyNav.setAttribute('aria-hidden', heroVisible ? 'true' : 'false');
    detailView.classList.toggle('country-sticky-nav-active', !heroVisible);

    if (wasHidden && !heroVisible) {
        const navHeight = stickyNav.offsetHeight;
        if (navHeight) detailView.scrollTop += navHeight;
    }
}

function bindCountryStickyNav() {
    const heroSection = document.getElementById('country-hero-section');
    if (!heroSection || !detailView) return;

    heroSectionObserver?.disconnect();
    heroSectionObserver = new IntersectionObserver(
        ([entry]) => updateStickyCountryNav(entry.isIntersecting),
        { root: detailView, threshold: 0 },
    );
    heroSectionObserver.observe(heroSection);
    updateStickyCountryNav(true);
}

function unbindCountryStickyNav() {
    heroSectionObserver?.disconnect();
    heroSectionObserver = null;
    updateStickyCountryNav(true);
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

function populateCountryPage(countryId) {
    const data = getFullCountryData(countryId);
    if (!data) return;
    const guide = getCountryGuide(countryId, data);

    detailView.scrollTop = 0;
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
    const breadcrumbName = document.getElementById('detail-breadcrumb-name');
    if (breadcrumbName) breadcrumbName.textContent = data.name;
    const stickyName = document.getElementById('detail-sticky-country-name');
    if (stickyName) stickyName.textContent = data.name;

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

    const aboutHeading = document.getElementById('detail-about-heading');
    const aboutIntro = document.getElementById('detail-about-intro');
    const summaryEl = document.getElementById('detail-summary');
    const gettingThereEl = document.getElementById('detail-getting-there');
    const economyEl = document.getElementById('detail-economy');

    if (aboutHeading) aboutHeading.textContent = `Information About ${data.name}`;
    if (aboutIntro) aboutIntro.textContent = `Discover essential information for your trip to ${data.name} — geography, history, culture, wildlife, and practical travel advice.`;
    if (summaryEl) {
        summaryEl.textContent = data.about.summary || '';
        summaryEl.classList.toggle('hidden', !data.about.summary);
    }
    if (gettingThereEl) gettingThereEl.textContent = data.about.gettingThere || '';
    if (economyEl) economyEl.textContent = data.about.economy || '';

    document.getElementById('detail-history').textContent = data.about.history || '';
    document.getElementById('detail-wildlife').textContent = guide.wildlife;
    detailGeo.textContent = data.about.geo;
    detailPeople.textContent = data.about.people;

    detailSpotsGrid.innerHTML = data.spots.map(spot => `
        <div class="spot-detail-card">
            <img src="${spotImageUrl(spot)}" alt="${spot.name}" loading="lazy">
            <div class="spot-detail-info">
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
        regionsGrid.innerHTML = countryRegions.map(region => `
            <article class="region-card">
                <h3>${region.name}</h3>
                <p>${region.desc}</p>
            </article>
        `).join('');
    } else {
        regionsSection?.classList.add('hidden');
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
    if (detailRoutesGrid && data.routes) {
        detailRoutesGrid.innerHTML = data.routes.map(route => {
            const highlights = route.highlights?.length
                ? `<ul class="route-highlights">${route.highlights.map(h => `<li>${h}</li>`).join('')}</ul>`
                : '';
            const meta = route.duration || route.distance
                ? `<div class="route-meta">${route.duration ? `<span><i class="far fa-clock"></i> ${route.duration}</span>` : ''}${route.distance ? `<span><i class="fas fa-road"></i> ${route.distance}</span>` : ''}</div>`
                : '';
            return `
            <div class="route-card">
                <h4>${route.name}</h4>
                ${meta}
                <p>${route.desc}</p>
                ${highlights}
                <button class="btn btn-outline btn-sm" data-action="view-itineraries">View All Itineraries</button>
            </div>`;
        }).join('');
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
    setCountryMeta(countryId);
    requestAnimationFrame(() => bindCountryStickyNav());
}

function hideCountryPage() {
    unbindCountryStickyNav();
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

    if (route.type === 'park' || route.type === 'border' || route.type === 'itinerary' || route.type === 'listing') {
        hideCountryPage();
        handleSeoRoute(route);
        return;
    }

    hideCountryPage();
    dismissSeoPrerender();
    setHomeMeta();
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
    document.getElementById('close-detail-sticky')?.addEventListener('click', () => closeCountryPage('destinations'));

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
