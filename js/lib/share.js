import { CONFIG } from '../config.js';

const UTM_DEFAULTS = {
    source: 'share',
    medium: 'social',
    campaign: 'savanna-explorer',
};

export function getSiteOrigin() {
    const configured = CONFIG.siteUrl?.replace(/\/$/, '');
    if (configured) return configured;
    if (typeof window !== 'undefined') return window.location.origin;
    return 'https://savannaexplorer.com';
}

export function buildShareUrl(path = '/', utm = {}) {
    const origin = getSiteOrigin();
    let base;

    if (path.startsWith('http://') || path.startsWith('https://')) {
        base = path;
    } else if (path.startsWith('#')) {
        base = `${origin}/${path.slice(1)}`;
    } else if (path.startsWith('/')) {
        base = `${origin}${path}`;
    } else {
        base = `${origin}/${path}`;
    }

    const params = new URLSearchParams();
    const merged = { ...UTM_DEFAULTS, ...utm };
    Object.entries(merged).forEach(([key, value]) => {
        if (value) params.set(`utm_${key}`, value);
    });

    const query = params.toString();
    return query ? `${base}?${query}` : base;
}

export function itineraryShareUrl(itineraryId, medium = 'copy') {
    return buildShareUrl(`/itineraries/${itineraryId}`, {
        source: 'share',
        medium,
        campaign: 'itinerary',
        content: itineraryId,
    });
}

export function hubShareUrl(sectionId, medium = 'copy') {
    return buildShareUrl(`/${sectionId}`, {
        source: 'share',
        medium,
        campaign: 'hub',
        content: sectionId,
    });
}

export async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
}

export function canNativeShare() {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function nativeShare({ title, text, url }) {
    if (!canNativeShare()) return false;
    await navigator.share({ title, text, url });
    return true;
}

export function externalShareUrl(network, { url, title, text }) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title || '');
    const encodedText = encodeURIComponent(text || title || '');

    switch (network) {
        case 'whatsapp':
            return `https://wa.me/?text=${encodeURIComponent(`${text || title}\n${url}`)}`;
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        case 'email':
            return `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${text || ''}\n\n${url}`)}`;
        default:
            return url;
    }
}

export function trackShare(method, detail = {}) {
    if (typeof gtag === 'function') {
        gtag('event', 'share', { method, ...detail });
    }
}

export function showShareToast(message, type = 'success') {
    let toast = document.getElementById('share-toast');
    if (!toast) {
        toast = document.createElement('p');
        toast.id = 'share-toast';
        toast.className = 'share-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove('share-toast--error', 'share-toast--success');
    toast.classList.add(`share-toast--${type}`, 'share-toast--visible');

    clearTimeout(showShareToast._timer);
    showShareToast._timer = setTimeout(() => {
        toast.classList.remove('share-toast--visible');
    }, 2600);
}
