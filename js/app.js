import { CONFIG } from './config.js';
import { getEditorialAuthRedirect } from './lib/editorial-auth-callback.js';

const editorialAuthRedirect = getEditorialAuthRedirect(window.location);
if (editorialAuthRedirect) {
    window.location.replace(editorialAuthRedirect);
}

// Register Service Worker for PWA
if (!editorialAuthRedirect && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('[PWA] ServiceWorker registration successful');
        }).catch(err => {
            console.log('[PWA] ServiceWorker registration failed: ', err);
        });
    });
}

import { initNav } from './modules/nav.js';
import { initScrollUx } from './modules/scroll-ux.js';
import { initReveal } from './modules/reveal.js';
import { initOfflineManager } from './modules/offline-manager.js';
import { initHomeLayout } from './modules/home-layout.js';
import { initFeatureLoader } from './modules/feature-loader.js';
import { initProductObservability } from './lib/product-analytics.js';
import { initSearchLauncher } from './modules/search-launcher.js';

if (!editorialAuthRedirect) initProductObservability();

if (!editorialAuthRedirect) document.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('app-version');
    if (versionEl && CONFIG.appVersion) {
        versionEl.textContent = `v${CONFIG.appVersion}`;
    }

    initNav();
    initSearchLauncher();
    initScrollUx();
    initReveal();
    initOfflineManager();
    initHomeLayout();
    initFeatureLoader();
});
