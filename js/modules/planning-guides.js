import guidesData from '../../data/planning-guides.json';
import { getCountryMeta } from '../lib/country-meta.js';
import { openCountryPage } from './country-guide.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderSection(section) {
    const bullets = section.bullets?.length
        ? `<ul class="planning-guide-bullets">${section.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
    const paragraphs = section.body.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
    return `
        <section class="planning-guide-section" id="guide-section-${section.id}">
            <h3>${escapeHtml(section.title)}</h3>
            ${paragraphs}
            ${bullets}
        </section>
    `;
}

export function openPlanningGuide(countryId) {
    const guide = guidesData.guides[countryId];
    const modal = document.getElementById('planning-guide-modal');
    const body = document.getElementById('planning-guide-body');
    if (!guide || !modal || !body) return;

    const meta = getCountryMeta(countryId);
    document.getElementById('planning-guide-title').textContent = guide.title;
    document.getElementById('planning-guide-meta').innerHTML = `
        <span>${meta.flag} ${meta.name}</span>
        <span>${guide.readTime} read</span>
        <span>Verified ${guide.lastVerified}</span>
    `;

    const links = guide.officialLinks?.length
        ? `<div class="planning-guide-links">
            <h4>Official sources</h4>
            <ul>${guide.officialLinks.map(l =>
                `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} <i class="fas fa-external-link-alt"></i></a></li>`
            ).join('')}</ul>
           </div>`
        : '';

    body.innerHTML = `
        <p class="planning-guide-disclaimer">${escapeHtml(guidesData.meta.disclaimer)}</p>
        ${guide.sections.map(renderSection).join('')}
        ${links}
    `;

    modal.dataset.country = countryId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    body.scrollTop = 0;
}

function closePlanningGuide() {
    const modal = document.getElementById('planning-guide-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function printPlanningGuide() {
    const countryId = document.getElementById('planning-guide-modal')?.dataset.country;
    if (!countryId) return;
    const guide = guidesData.guides[countryId];
    if (!guide) return;

    const meta = getCountryMeta(countryId);
    const printRoot = document.getElementById('planning-guide-print-root');
    if (!printRoot) {
        window.print();
        return;
    }

    printRoot.innerHTML = `
        <article class="planning-guide-print">
            <header>
                <h1>${escapeHtml(guide.title)}</h1>
                <p>${meta.flag} ${meta.name} · ${guide.readTime} · Savanna Explorer</p>
            </header>
            ${guide.sections.map(s => `
                <section>
                    <h2>${escapeHtml(s.title)}</h2>
                    ${s.body.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
                    ${s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
                </section>
            `).join('')}
            <footer><p>${escapeHtml(guidesData.meta.disclaimer)}</p></footer>
        </article>
    `;
    window.print();
}

export function initPlanningGuides() {
    document.querySelectorAll('.planning-guide-close').forEach(btn => {
        btn.addEventListener('click', closePlanningGuide);
    });

    document.getElementById('planning-guide-print')?.addEventListener('click', printPlanningGuide);

    document.getElementById('planning-guide-country-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        const countryId = document.getElementById('planning-guide-modal')?.dataset.country;
        if (countryId) {
            closePlanningGuide();
            openCountryPage(countryId);
        }
    });

    document.getElementById('planning-guide-modal')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('planning-guide-close')) closePlanningGuide();
    });
}

export { guidesData };
