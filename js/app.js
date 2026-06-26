import { CONFIG } from './config.js';
import { initNav } from './modules/nav.js';
import { initReveal } from './modules/reveal.js';
import { initCountryGuide } from './modules/country-guide.js';
import { initItineraries } from './modules/itineraries.js';
import { initMarketplace } from './modules/marketplace.js';
import { initUtilityHub } from './modules/utility-hub.js';
import { initContact } from './modules/contact.js';
import { initParks } from './modules/parks.js';
import { initBorders } from './modules/borders.js';
import { initDiscover } from './modules/discover.js';

document.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('app-version');
    if (versionEl && CONFIG.appVersion) {
        versionEl.textContent = `v${CONFIG.appVersion}`;
    }

    initNav();
    initReveal();
    initCountryGuide();
    initItineraries();
    initMarketplace();
    initUtilityHub();
    initContact();
    initParks();
    initBorders();
    initDiscover();
});
