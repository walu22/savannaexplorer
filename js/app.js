import { CONFIG } from './config.js';
import { initNav } from './modules/nav.js';
import { initScrollUx } from './modules/scroll-ux.js';
import { initReveal } from './modules/reveal.js';
import { initSearch } from './modules/search.js';
import { initDarkMode } from './modules/dark-mode.js';

function whenIdle(callback) {
    if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(callback, { timeout: 2500 });
    } else {
        setTimeout(callback, 1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Sentry for error tracking (if configured)
    if (typeof Sentry !== 'undefined') {
        Sentry.init({
            dsn: '', // Add your Sentry DSN here in production
            tracesSampleRate: 1.0,
            enabled: false, // Disable by default, enable when DSN is provided, enable when DSN is available
        });
    }

    const versionEl = document.getElementById('app-version');
    if (versionEl && CONFIG.appVersion) {
        versionEl.textContent = `v${CONFIG.appVersion}`;
    }

    initNav();
    initScrollUx();
    initReveal();
    initSearch();
    initDarkMode();

    // Register service worker for PWA support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch((error) => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

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
