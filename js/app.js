import { CONFIG } from './config.js';
import { initNav } from './modules/nav.js';
import { initScrollUx } from './modules/scroll-ux.js';
import { initReveal } from './modules/reveal.js';

function whenIdle(callback) {
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(callback, { timeout: 2500 });
    } else {
        setTimeout(callback, 1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('app-version');
    if (versionEl && CONFIG.appVersion) {
        versionEl.textContent = `v${CONFIG.appVersion}`;
    }

    initNav();
    initScrollUx();
    initReveal();

    import('./modules/share.js').then(({ initShare }) => initShare());

    // Above-the-fold and routing-critical modules load immediately.
    Promise.all([
        import('./modules/destinations.js'),
        import('./modules/country-guide.js'),
        import('./modules/seo-routes.js'),
        import('./modules/itineraries.js'),
    ]).then(([destinations, countryGuide, seoRoutes, itineraries]) => {
        destinations.initDestinations();
        countryGuide.initCountryGuide();
        seoRoutes.initSeoRoutes();
        itineraries.initItineraries();
        countryGuide.bootstrapRouting();
    });

    // Mid-page sections — load in parallel without blocking first paint.
    Promise.all([
        import('./modules/marketplace.js'),
        import('./modules/utility-hub.js'),
        import('./modules/trip-planner.js'),
        import('./modules/contact.js'),
        import('./modules/newsletter.js'),
        import('./modules/parks.js'),
        import('./modules/borders.js'),
        import('./modules/discover.js'),
        import('./modules/about.js'),
        import('./modules/health.js'),
        import('./modules/events.js'),
        import('./modules/book-direct.js'),
        import('./modules/transport-logistics.js'),
        import('./modules/travel-essentials.js'),
        import('./modules/embassies.js'),
        import('./modules/ai-planner.js'),
        import('./modules/planning-checklist.js'),
    ]).then(modules => {
        const [
            marketplace,
            utilityHub,
            tripPlanner,
            contact,
            newsletter,
            parks,
            borders,
            discover,
            about,
            health,
            events,
            bookDirect,
            transportLogistics,
            travelEssentials,
            embassies,
            aiPlanner,
            planningChecklist,
        ] = modules;

        marketplace.initMarketplace();
        utilityHub.initUtilityHub();
        tripPlanner.initTripPlanner();
        contact.initContact();
        newsletter.initNewsletter();
        parks.initParks();
        borders.initBorders();
        discover.initDiscover();
        about.initAbout();
        health.initHealth();
        events.initEvents();
        bookDirect.initBookDirect();
        transportLogistics.initTransportLogistics();
        travelEssentials.initTravelEssentials();
        embassies.initEmbassies();
        aiPlanner.initAiPlanner();
        planningChecklist.initPlanningChecklist();
    });

    // Chat assistant — load independently, non-blocking
    import('./modules/chat-assistant.js').then(({ initChatAssistant }) => initChatAssistant());

    // Cost estimator — load independently, non-blocking
    import('./modules/cost-estimator.js').then(({ initCostEstimator }) => initCostEstimator());

    // Safari Bingo — load independently, non-blocking
    import('./modules/safari-bingo.js').then(({ initSafariBingo }) => initSafariBingo());


    // Below-the-fold — defer until the browser is idle.
    whenIdle(() => {
        Promise.all([
            import('./modules/planning-guides.js'),
            import('./modules/tourism-stats.js'),
        ]).then(([planningGuides, tourismStats]) => {
            planningGuides.initPlanningGuides();
            tourismStats.initTourismStats();
        });
    });
});
