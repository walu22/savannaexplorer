import { initNav } from './modules/nav.js';
import { initReveal } from './modules/reveal.js';
import { initCountryGuide } from './modules/country-guide.js';
import { initItineraries } from './modules/itineraries.js';
import { initMarketplace } from './modules/marketplace.js';
import { initUtilityHub } from './modules/utility-hub.js';
import { initContact } from './modules/contact.js';
import { initParks } from './modules/parks.js';

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initCountryGuide();
    initItineraries();
    initMarketplace();
    initUtilityHub();
    initContact();
    initParks();
});
