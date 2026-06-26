import countries from '../../data/countries.json';
import faqs from '../../data/faqs.json';
import regions from '../../data/regions.json';
import { getCountryGuide } from '../lib/guide.js';
import { spotImageUrl, activityImageUrl } from '../lib/images.js';

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

function resetGuideTabs() {
    document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('.guide-tab[data-tab="about"]')?.classList.add('active');
    document.getElementById('panel-about')?.classList.add('active');
}

function populateCountryPage(countryId) {
    const data = countries[countryId];
    if (!data) return;
    const guide = getCountryGuide(countryId, data);

    detailView.scrollTop = 0;
    detailTitle.textContent = data.name;
    detailTagline.textContent = data.tagline;

    const aboutHeading = document.getElementById('detail-about-heading');
    const aboutIntro = document.getElementById('detail-about-intro');
    if (aboutHeading) aboutHeading.textContent = `Information About ${data.name}`;
    if (aboutIntro) aboutIntro.textContent = `Discover essential information for your trip to ${data.name} — geography, history, culture, wildlife, and practical travel advice.`;

    document.getElementById('detail-history').textContent = data.about.history || '';
    document.getElementById('detail-wildlife').textContent = guide.wildlife;
    detailGeo.textContent = data.about.geo;
    detailPeople.textContent = data.about.people;

    detailSpotsGrid.innerHTML = data.spots.map(spot => `
        <div class="spot-detail-card">
            <img src="${spotImageUrl(spot)}" alt="${spot.name}" loading="lazy">
            <div class="spot-detail-info"><h3>${spot.name}</h3><p>${spot.desc}</p></div>
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
        <div class="activity-detail-item">
            <img src="${activityImageUrl(act)}" alt="${act.name}" loading="lazy">
            <div class="activity-text"><h3>${act.name}</h3><p>${act.desc}</p></div>
        </div>
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

    const detailRoutesGrid = document.getElementById('detail-routes-grid');
    if (detailRoutesGrid && data.routes) {
        detailRoutesGrid.innerHTML = data.routes.map(route => `
            <div class="route-card">
                <h4>${route.name}</h4><p>${route.desc}</p>
                <button class="btn btn-outline btn-sm" data-action="view-itineraries">View All Itineraries</button>
            </div>
        `).join('');
    }

    if (detailFlavorInline) {
        detailFlavorInline.innerHTML = `
            <div class="flavor-item"><div class="flavor-icon"><i class="fa-solid fa-utensils"></i></div><div class="flavor-text"><span class="flavor-label">Signature Dish</span><span class="flavor-value">${data.localFlavor.food}</span></div></div>
            <div class="flavor-item"><div class="flavor-icon"><i class="fa-solid fa-glass-water"></i></div><div class="flavor-text"><span class="flavor-label">Local Drink</span><span class="flavor-value">${data.localFlavor.drink}</span></div></div>
            <div class="flavor-item"><div class="flavor-icon"><i class="fa-solid fa-comments"></i></div><div class="flavor-text"><span class="flavor-label">Greeting</span><span class="flavor-value">${data.localFlavor.lang}</span></div></div>
        `;
    }

    if (ctaCountryName) ctaCountryName.textContent = data.name;

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
    populateCountryPage(countryId);
    detailView.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCountryPage() {
    detailView.classList.add('hidden');
    document.body.style.overflow = '';
    const hash = window.location.hash.substring(1);
    if (hash && Object.keys(countries).includes(hash)) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
    }
}

function handleRouting() {
    const hash = window.location.hash.substring(1);
    if (hash && countries[hash]) showCountryPage(hash);
    else closeCountryPage();
}

export function initCountryGuide() {
    document.querySelectorAll('.country-card').forEach(card => {
        card.addEventListener('click', () => {
            window.location.hash = card.getAttribute('data-country-id');
        });
    });

    closeDetailBtn?.addEventListener('click', closeCountryPage);

    document.getElementById('country-plan-cta')?.addEventListener('click', () => {
        closeCountryPage();
        window.location.hash = 'contact';
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });

    detailView?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="view-itineraries"]');
        if (btn) {
            closeCountryPage();
            history.pushState('', document.title, window.location.pathname);
            document.getElementById('itineraries')?.scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.querySelectorAll('.guide-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.guide-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`panel-${target}`)?.classList.add('active');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const id = link.getAttribute('href').slice(1);
        if (countries[id]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = id;
            });
        }
    });

    window.addEventListener('hashchange', handleRouting);
    handleRouting();
}

export { closeCountryPage };
