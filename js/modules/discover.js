import guidesData from '../../data/planning-guides.json';
import faqs from '../../data/faqs.json';
import { getCountryMeta } from '../lib/country-meta.js';
import { countryPath, planningGuidePath } from '../lib/router.js';
import { openCountryPage } from './country-guide.js';
import { openPlanningGuide } from './planning-guides.js';

function renderPlanningGuides() {
    const grid = document.getElementById('planning-guides-grid');
    if (!grid) return;

    grid.innerHTML = Object.entries(guidesData.guides).map(([countryId, guide]) => {
        const meta = getCountryMeta(countryId);
        const topics = guide.topics.map(t => `<li>${t}</li>`).join('');
        const sectionCount = guide.sections?.length || guide.topics.length;
        return `
            <article class="guide-download-card">
                <div class="guide-download-header">
                    <span class="guide-download-flag">${meta.flag}</span>
                    <div>
                        <h3><a href="${planningGuidePath(countryId)}">${guide.title}</a></h3>
                        <span class="guide-download-pages">${sectionCount} sections · ${guide.readTime} read</span>
                    </div>
                </div>
                <ul class="guide-download-topics">${topics}</ul>
                <div class="guide-download-actions">
                    <button type="button" class="btn btn-primary btn-sm" data-open-guide="${countryId}">
                        <i class="fas fa-book-open"></i> Read Guide
                    </button>
                    <a href="${countryPath(countryId)}" class="btn btn-outline btn-sm" data-country-link="${countryId}">
                        Country Page
                    </a>
                </div>
            </article>
        `;
    }).join('');

    grid.querySelectorAll('[data-open-guide]').forEach(btn => {
        btn.addEventListener('click', () => openPlanningGuide(btn.dataset.openGuide));
    });
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
    renderPlanningGuides();
    renderHomeFaq();
    bindCountryLinks();
}
