import transport from '../../data/transport.json';
import { hubShareUrl } from '../lib/share.js';
import { renderShareBar } from './share.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderPreview() {
    const preview = document.getElementById('lead-magnet-preview');
    if (!preview) return;

    const checklist = transport.vehicleCrossBorder;
    const items = checklist.items.slice(0, 8);
    preview.innerHTML = `
        <ul class="lead-magnet-checklist">
            ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
        <p class="lead-magnet-preview-more">Reviewed ${escapeHtml(checklist.lastVerified)}. Confirm requirements and opening times with the relevant border authority close to travel.</p>
        <p><a href="/borders">Check researched border crossings and official sources</a></p>
    `;
}

export function initPlanningChecklist() {
    const section = document.getElementById('planning-checklist');
    if (!section) return;

    renderPreview();

    const shareMount = section.querySelector('.lead-magnet-share');
    if (shareMount && !shareMount.querySelector('.share-bar')) {
        shareMount.innerHTML = renderShareBar({
            url: hubShareUrl('planning-checklist', 'copy'),
            title: 'Southern Africa planning checklist',
            text: 'Southern Africa cross-border planning checklist from Savanna Explorer.',
            compact: true,
        });
    }
}
