import { CONFIG } from './config.js';
import { initNav } from './modules/nav.js';
import { initReveal } from './modules/reveal.js';
import { initCountryGuide, bootstrapRouting } from './modules/country-guide.js';
import { initItineraries } from './modules/itineraries.js';
import { initMarketplace } from './modules/marketplace.js';
import { initUtilityHub } from './modules/utility-hub.js';
import { initContact } from './modules/contact.js';
import { initNewsletter } from './modules/newsletter.js';
import { initParks } from './modules/parks.js';
import { initBorders } from './modules/borders.js';
import { initDiscover } from './modules/discover.js';
import { initAbout } from './modules/about.js';
import { initHealth } from './modules/health.js';
import { initEvents } from './modules/events.js';
import { initDestinations } from './modules/destinations.js';
import { initTripPlanner } from './modules/trip-planner.js';
import { initSeoRoutes } from './modules/seo-routes.js';
import { initBookDirect } from './modules/book-direct.js';
import { initTransportLogistics } from './modules/transport-logistics.js';
import { initEmbassies } from './modules/embassies.js';

document.addEventListener('DOMContentLoaded', () => {

    const versionEl = document.getElementById('app-version');
    if (versionEl && CONFIG.appVersion) {
        versionEl.textContent = `v${CONFIG.appVersion}`;
    }

    initNav();
    initReveal();
    initDestinations();
    initCountryGuide();
    initItineraries();
    initMarketplace();
    initUtilityHub();
    initTripPlanner();
    initContact();
    initNewsletter();
    initParks();
    initBorders();
    initHealth();
    initEvents();
    initDiscover();
    initAbout();
    initSeoRoutes();
    initBookDirect();
    initTransportLogistics();
    initEmbassies();
    bootstrapRouting();
});
