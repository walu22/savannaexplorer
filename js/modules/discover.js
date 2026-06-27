import discover from '../../data/discover.json';
import faqs from '../../data/faqs.json';
import { getCountryMeta } from '../lib/country-meta.js';
import { countryPath } from '../lib/router.js';
import { openCountryPage } from './country-guide.js';

function imageUrl(imageId) {
    return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=800`;
}

function renderFacts() {
    const grid = document.getElementById('facts-grid');
    if (!grid) return;

    grid.innerHTML = discover.facts.map(fact => {
        const meta = getCountryMeta(fact.country);
        return `
            <a href="${countryPath(fact.country)}" class="fact-card" data-country-link="${fact.country}">
                <div class="fact-icon"><i class="fas ${fact.icon}"></i></div>
                <h3>${fact.title}</h3>
                <p>${fact.description}</p>
                <span class="fact-country">${meta.flag} ${meta.name}</span>
            </a>
        `;
    }).join('');
}

function renderPlanTrip() {
    const grid = document.getElementById('plan-trip-grid');
    if (!grid) return;

    grid.innerHTML = discover.planTripLinks.map(link => `
        <a href="${link.href}" class="plan-trip-card">
            <div class="plan-trip-icon"><i class="fas ${link.icon}"></i></div>
            <h3>${link.title}</h3>
            <span class="plan-trip-sub">${link.subtitle}</span>
            <p>${link.description}</p>
            <span class="plan-trip-arrow">Explore <i class="fas fa-arrow-right"></i></span>
        </a>
    `).join('');
}

function renderTopDestinations() {
    const grid = document.getElementById('top-destinations-grid');
    if (!grid) return;

    grid.innerHTML = discover.topDestinations.map(dest => {
        const meta = getCountryMeta(dest.country);
        const badge = dest.mustVisit !== false
            ? '<span class="top-dest-badge">Must Visit</span>'
            : '';
        return `
            <a href="${countryPath(dest.country)}" class="top-dest-card" data-country-link="${dest.country}">
                <img src="${imageUrl(dest.image)}" alt="${dest.name}" loading="lazy">
                <div class="top-dest-overlay">
                    ${badge}
                    <span class="top-dest-region">${meta.flag} ${dest.region}</span>
                    <h3>${dest.name}</h3>
                    <p>${dest.desc}</p>
                </div>
            </a>
        `;
    }).join('');
}

function renderTravelNews() {
    const grid = document.getElementById('travel-news-grid');
    if (!grid) return;

    grid.innerHTML = discover.travelNews.map(item => {
        const meta = item.country ? getCountryMeta(item.country) : null;
        const link = item.country ? countryPath(item.country) : '#plan';
        return `
            <article class="news-card">
                <div class="news-meta">
                    <span class="news-category">${item.category}</span>
                    <span class="news-date">${item.date}</span>
                </div>
                <h3>${item.title}</h3>
                <p>${item.excerpt}</p>
                <a href="${link}" class="news-read-more" ${item.country ? `data-country-link="${item.country}"` : ''}>
                    Read more <i class="fas fa-arrow-right"></i>
                </a>
                ${meta ? `<span class="news-country">${meta.flag} ${meta.name}</span>` : ''}
            </article>
        `;
    }).join('');
}

function renderPlanningGuides() {
    const grid = document.getElementById('planning-guides-grid');
    if (!grid) return;

    grid.innerHTML = discover.planningGuides.map(guide => {
        const meta = getCountryMeta(guide.country);
        const topics = guide.topics.map(t => `<li>${t}</li>`).join('');
        return `
            <div class="guide-download-card">
                <div class="guide-download-header">
                    <span class="guide-download-flag">${meta.flag}</span>
                    <div>
                        <h3>${guide.title}</h3>
                        <span class="guide-download-pages">${guide.pages} pages · PDF-ready</span>
                    </div>
                </div>
                <ul class="guide-download-topics">${topics}</ul>
                <a href="${countryPath(guide.country)}" class="btn btn-outline btn-sm" data-country-link="${guide.country}">
                    View Country Guide
                </a>
            </div>
        `;
    }).join('');
}

function renderHomeFaq() {
    const list = document.getElementById('home-faq-list');
    if (!list) return;

    const featured = [
        faqs.namibia[0],
        faqs.namibia[2],
        faqs.botswana[0],
        faqs.zambia[0],
        faqs.zimbabwe[3],
        faqs['south-africa'][1],
        faqs.mozambique[0],
        faqs.lesotho[0],
    ].filter(Boolean);

    list.innerHTML = featured.map((item, i) => `
        <div class="accordion-item faq-item">
            <button class="accordion-header" aria-expanded="false" data-home-faq="${i}">
                <span class="accordion-title">${item.q}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="accordion-body">
                <p>${item.a}</p>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const expanded = header.getAttribute('aria-expanded') === 'true';
            list.querySelectorAll('.accordion-header').forEach(h => {
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

function bindCountryLinks() {
    document.querySelectorAll('[data-country-link]').forEach(el => {
        el.addEventListener('click', (e) => {
            const countryId = el.getAttribute('data-country-link');
            if (!countryId) return;
            e.preventDefault();
            openCountryPage(countryId);
        });
    });
}

export function initDiscover() {
    renderFacts();
    renderPlanTrip();
    renderTopDestinations();
    renderTravelNews();
    renderPlanningGuides();
    renderHomeFaq();
    bindCountryLinks();
}
