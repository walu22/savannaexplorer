import transport from '../../data/transport.json';
import packing from '../../data/packing.json';
import practical from '../../data/practical.json';
import printCss from '../../css/print-checklist.css?inline';
import { subscribeNewsletter } from './newsletter.js';
import { hubShareUrl, trackShare } from '../lib/share.js';
import { renderShareBar } from './share.js';

const UNLOCK_KEY = 'se-checklist-unlocked';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function isUnlocked() {
    try {
        return localStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
        return false;
    }
}

function setUnlocked() {
    try {
        localStorage.setItem(UNLOCK_KEY, '1');
    } catch {
        /* ignore */
    }
}

function buildLeadMagnetHtml() {
    const checklist = transport.vehicleCrossBorder;
    const generated = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
    const packingItems = (packing.safari || []).slice(0, 12);

    const borderItems = checklist.items.map(item =>
        `<li><span class="print-box" aria-hidden="true"></span> ${escapeHtml(item)}</li>`
    ).join('');

    const packItems = packingItems.map(item =>
        `<li><span class="print-box" aria-hidden="true"></span> ${escapeHtml(item)}</li>`
    ).join('');

    const resources = checklist.resources.map(resource => {
        const href = resource.internal ? `https://savannaexplorer.com/${resource.url.replace(/^#/, '')}` : resource.url;
        return `<li><strong>${escapeHtml(resource.label)}</strong> — ${escapeHtml(href)}</li>`;
    }).join('');

    return `
        <article class="print-checklist-doc">
            <header class="print-header">
                <div class="print-header-bar" aria-hidden="true"></div>
                <p class="print-brand">Savanna Explorer</p>
                <h1>Southern Africa Self-Drive Planning Checklist</h1>
                <p class="print-subtitle">Cross-border documents, borders, and safari packing</p>
                <p class="print-generated">Generated ${escapeHtml(generated)} · savannaexplorer.com/planning-checklist</p>
            </header>
            <section class="print-section">
                <h2>${escapeHtml(checklist.title)}</h2>
                <p class="print-meta">${escapeHtml(checklist.intro)}</p>
                <ul class="print-checklist">${borderItems}</ul>
                <p class="print-note">Verified ${escapeHtml(checklist.lastVerified)} — confirm at each border post.</p>
            </section>
            <section class="print-section">
                <h2>Safari packing essentials</h2>
                <ul class="print-checklist">${packItems}</ul>
                <p class="print-note">Full lists by trip type at savannaexplorer.com/travel-essentials</p>
            </section>
            <section class="print-section">
                <h2>Official planning links</h2>
                <ul class="print-links">${resources}</ul>
            </section>
            <footer class="print-footer">
                <p><strong>Planning reference only.</strong> ${escapeHtml(practical.meta.disclaimer)}</p>
                <p>Savanna Explorer — independent Southern Africa planning hub. We do not sell tours or take payments.</p>
            </footer>
        </article>
    `;
}

function printLeadMagnet() {
    const html = buildLeadMagnetHtml();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Planning checklist print');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: '0',
        opacity: '0',
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Southern Africa Planning Checklist</title><style>${printCss}</style></head><body>${html}</body></html>`);
    doc.close();

    iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => iframe.remove(), 1000);
    };

    trackShare('print_checklist', { content_type: 'lead_magnet', item_id: 'planning-checklist' });
}

function updateUnlockUi() {
    const gate = document.getElementById('lead-magnet-gate');
    const unlocked = document.getElementById('lead-magnet-unlocked');
    const unlockedState = isUnlocked();

    if (gate) gate.hidden = unlockedState;
    if (unlocked) unlocked.hidden = !unlockedState;
}

function renderPreview() {
    const preview = document.getElementById('lead-magnet-preview');
    if (!preview) return;

    const items = transport.vehicleCrossBorder.items.slice(0, 6);
    preview.innerHTML = `
        <ul class="lead-magnet-checklist">
            ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
        <p class="lead-magnet-preview-more">+ ${transport.vehicleCrossBorder.items.length - 6} more border items, safari packing list, and official links in the PDF</p>
    `;
}

export function initPlanningChecklist() {
    const section = document.getElementById('planning-checklist');
    if (!section) return;

    renderPreview();
    updateUnlockUi();

    const shareMount = section.querySelector('.lead-magnet-share');
    if (shareMount && !shareMount.querySelector('.share-bar')) {
        shareMount.innerHTML = renderShareBar({
            url: hubShareUrl('planning-checklist', 'copy'),
            title: 'Free Southern Africa planning checklist',
            text: 'Printable cross-border and safari packing checklist from Savanna Explorer.',
            compact: true,
        });
    }

    document.getElementById('lead-magnet-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const emailInput = document.getElementById('lead-magnet-email');
        const feedback = document.getElementById('lead-magnet-feedback');
        const email = emailInput?.value.trim();
        if (!email) return;

        const submitBtn = form.querySelector('[type="submit"]');
        submitBtn.disabled = true;

        const result = await subscribeNewsletter(email, { source: 'planning-checklist' });
        submitBtn.disabled = false;

        if (feedback) {
            feedback.hidden = false;
            feedback.textContent = result.message;
            feedback.classList.remove('form-feedback--success', 'form-feedback--error', 'form-feedback--info');
            feedback.classList.add(`form-feedback--${result.type}`);
        }

        if (result.ok) {
            setUnlocked();
            updateUnlockUi();
            if (typeof gtag === 'function') {
                gtag('event', 'lead_magnet_unlock', { source: 'planning-checklist' });
            }
        }
    });

    document.getElementById('lead-magnet-print')?.addEventListener('click', () => {
        if (!isUnlocked()) return;
        printLeadMagnet();
    });

    if (window.location.pathname.replace(/\/$/, '') === '/planning-checklist' && !isUnlocked()) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
