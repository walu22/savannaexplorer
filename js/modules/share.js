import {
    buildShareUrl,
    canNativeShare,
    copyToClipboard,
    externalShareUrl,
    hubShareUrl,
    nativeShare,
    showShareToast,
    trackShare,
} from '../lib/share.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderShareBar({
    url,
    title,
    text,
    compact = false,
    showNative = true,
}) {
    const classes = ['share-bar', compact ? 'share-bar--compact' : ''].filter(Boolean).join(' ');
    const nativeBtn = showNative && canNativeShare()
        ? `<button type="button" class="share-btn share-btn--native" data-share-action="native" title="Share"><i class="fas fa-share-alt"></i><span>Share</span></button>`
        : '';

    return `
        <div class="${classes}" data-share-url="${escapeHtml(url)}" data-share-title="${escapeHtml(title)}" data-share-text="${escapeHtml(text)}">
            <span class="share-bar-label">Share</span>
            <div class="share-bar-actions">
                <button type="button" class="share-btn" data-share-action="copy" title="Copy link with tracking"><i class="fas fa-link"></i><span>Copy link</span></button>
                <button type="button" class="share-btn" data-share-action="whatsapp" title="Share on WhatsApp"><i class="fab fa-whatsapp"></i><span class="sr-only">WhatsApp</span></button>
                <button type="button" class="share-btn" data-share-action="facebook" title="Share on Facebook"><i class="fab fa-facebook-f"></i><span class="sr-only">Facebook</span></button>
                <button type="button" class="share-btn" data-share-action="twitter" title="Share on X"><i class="fab fa-twitter"></i><span class="sr-only">X</span></button>
                <button type="button" class="share-btn" data-share-action="email" title="Share by email"><i class="fas fa-envelope"></i><span class="sr-only">Email</span></button>
                ${nativeBtn}
            </div>
        </div>
    `;
}

async function handleShareAction(bar, action) {
    const url = bar.dataset.shareUrl;
    const title = bar.dataset.shareTitle || 'Savanna Explorer';
    const text = bar.dataset.shareText || title;

    if (!url) return;

    if (action === 'copy') {
        const ok = await copyToClipboard(url);
        showShareToast(ok ? 'Link copied — ready to paste' : 'Could not copy link', ok ? 'success' : 'error');
        trackShare('copy', { content_type: 'link', item_id: url });
        return;
    }

    if (action === 'native') {
        try {
            await nativeShare({ title, text, url });
            trackShare('native', { content_type: 'link', item_id: url });
        } catch (err) {
            if (err?.name !== 'AbortError') {
                showShareToast('Share cancelled', 'error');
            }
        }
        return;
    }

    const shareUrl = externalShareUrl(action, { url, title, text });
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=520');
    trackShare(action, { content_type: 'link', item_id: url });
}

function mountShareBar(container, options) {
    if (!container || container.querySelector('.share-bar')) return;
    container.insertAdjacentHTML('beforeend', renderShareBar(options));
}

const HUB_SHARE_TARGETS = [
    {
        selector: '#itineraries .section-header',
        sectionId: 'itineraries',
        title: 'Southern Africa route templates',
        text: 'Free cross-border and single-country itinerary templates for self-drive safari planning.',
    },
    {
        selector: '#borders .section-header',
        sectionId: 'borders',
        title: 'Southern Africa border crossings guide',
        text: 'Documents, fees, hours, and wait times for major land borders across nine countries.',
    },
    {
        selector: '#travel-essentials .section-header',
        sectionId: 'travel-essentials',
        title: 'Southern Africa travel essentials',
        text: 'Insurance, road rules, tipping, SIMs, permits, advisories, and packing for independent travellers.',
    },
    {
        selector: '#planning-checklist .section-header',
        sectionId: 'planning-checklist',
        title: 'Free Southern Africa planning checklist',
        text: 'Printable self-drive and cross-border checklist — visas, borders, packing, and official links.',
    },
];

function initHubShareBars() {
    HUB_SHARE_TARGETS.forEach(({ selector, sectionId, title, text }) => {
        const header = document.querySelector(selector);
        if (!header) return;
        mountShareBar(header, {
            url: hubShareUrl(sectionId, 'copy'),
            title,
            text,
            compact: true,
        });
    });
}

function initFooterSocialShare() {
    const siteUrl = buildShareUrl('/', { source: 'footer', medium: 'social', campaign: 'site' });
    const title = 'Savanna Explorer — free Southern Africa trip planning';
    const text = 'Country guides, route templates, border crossings, and travel tools — book direct with official sources.';

    const links = document.querySelectorAll('.social-links a');
    const networks = ['facebook', 'instagram', 'twitter', 'youtube'];
    links.forEach((link, index) => {
        const network = networks[index];
        if (!network) return;

        if (network === 'instagram') {
            link.href = siteUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = 'Open Savanna Explorer (add us on Instagram @savannaexplorer)';
            return;
        }

        if (network === 'youtube') {
            link.href = buildShareUrl('/planning-checklist', {
                source: 'footer',
                medium: 'youtube',
                campaign: 'checklist',
            });
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = 'Free planning checklist';
            return;
        }

        link.href = externalShareUrl(network === 'twitter' ? 'twitter' : network, {
            url: siteUrl,
            title,
            text,
        });
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = `Share Savanna Explorer on ${network}`;
    });
}

export function initShare() {
    initHubShareBars();
    initFooterSocialShare();

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-share-action]');
        if (!btn) return;
        const bar = btn.closest('.share-bar');
        if (!bar) return;
        e.preventDefault();
        void handleShareAction(bar, btn.dataset.shareAction);
    });
}
