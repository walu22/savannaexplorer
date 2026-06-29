import guidesData from '../../data/planning-guides.json';
import { getCountryMeta } from '../lib/country-meta.js';
import { openCountryPage } from './country-guide.js';
import { createModalFocusManager } from '../lib/modal-focus.js';
import printCss from '../../css/planning-guide-print.css?inline';

let planningGuideModalFocus = null;

function getPlanningGuideModalFocus() {
    if (!planningGuideModalFocus) {
        planningGuideModalFocus = createModalFocusManager(document.getElementById('planning-guide-modal'));
    }
    return planningGuideModalFocus;
}

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

function buildPrintGuideHtml(guide, meta) {
    const generated = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const sectionsHtml = guide.sections.map(section => `
        <section class="print-section">
            <h2>${escapeHtml(section.title)}</h2>
            ${section.body.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
            ${section.bullets?.length
                ? `<ul class="print-bullets">${section.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
                : ''}
        </section>
    `).join('');

    const linksHtml = guide.officialLinks?.length
        ? `<section class="print-links-section">
            <h2>Official sources</h2>
            <ul class="print-links">
                ${guide.officialLinks.map(link => `
                    <li>
                        <strong>${escapeHtml(link.label)}</strong>
                        <div class="print-source">${escapeHtml(link.url)}</div>
                    </li>
                `).join('')}
            </ul>
           </section>`
        : '';

    return `
        <article class="print-guide-doc">
            <header class="print-header">
                <div class="print-header-bar" aria-hidden="true"></div>
                <p class="print-brand">Savanna Explorer</p>
                <h1>${escapeHtml(guide.title)}</h1>
                <p class="print-subtitle">${escapeHtml(meta.name)}</p>
                <div class="print-meta-row">
                    <span><strong>Read time:</strong> ${escapeHtml(guide.readTime)}</span>
                    <span><strong>Verified:</strong> ${escapeHtml(guide.lastVerified)}</span>
                </div>
                <p class="print-generated">Generated ${escapeHtml(generated)} · savannaexplorer.com · Planning reference only</p>
            </header>
            <p class="print-disclaimer">${escapeHtml(guidesData.meta.disclaimer)}</p>
            ${sectionsHtml}
            ${linksHtml}
            <footer class="print-footer">
                <p><strong>Not a booking or quote.</strong> Requirements and fees change — confirm with official sources before travel.</p>
                <p>Savanna Explorer is an independent planning hub — we do not sell tours, take payments, or act as a travel agent.</p>
            </footer>
        </article>
    `;
}

function printGuideDocument(html, title) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Planning guide print preview');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: '0',
        opacity: '0',
        pointerEvents: 'none',
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)} — Savanna Explorer</title>
    <style>${printCss.replace(/<\/style/gi, '<\\/style')}</style>
</head>
<body>${html}</body>
</html>`);
    doc.close();

    const win = iframe.contentWindow;
    const cleanup = () => {
        iframe.remove();
    };

    win.addEventListener('afterprint', cleanup, { once: true });

    const triggerPrint = () => {
        win.focus();
        win.print();
        setTimeout(cleanup, 8000);
    };

    if (doc.readyState === 'complete') {
        triggerPrint();
    } else {
        win.addEventListener('load', triggerPrint, { once: true });
    }
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
    getPlanningGuideModalFocus().open();
}

function closePlanningGuide() {
    const modal = document.getElementById('planning-guide-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    getPlanningGuideModalFocus().close();
}

function printPlanningGuide() {
    const countryId = document.getElementById('planning-guide-modal')?.dataset.country;
    if (!countryId) return;
    const guide = guidesData.guides[countryId];
    if (!guide) return;

    const meta = getCountryMeta(countryId);
    printGuideDocument(buildPrintGuideHtml(guide, meta), guide.title);
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('planning-guide-modal')?.classList.contains('active')) {
            closePlanningGuide();
        }
    });
}

export { guidesData };
