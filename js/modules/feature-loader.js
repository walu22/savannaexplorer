import { parseRouteShape } from '../lib/route-shape.js';
import { finalizeHubRoute } from '../lib/hub-hydration.js';
import { setHubMeta } from '../lib/page-meta.js';
import { dismissSeoPrerender } from '../lib/seo-prerender.js';

const loaders = {
    destinations: () => import('./destinations.js').then(module => module.initDestinations()),
    routes: () => import('./route-explorer.js').then(module => module.initRouteExplorer()),
    newsletter: () => import('./newsletter.js').then(module => module.initNewsletter()),
    ai: () => import('./ai-planner.js').then(module => module.initAiPlanner()),
    chat: () => import('./chat-assistant.js').then(module => module.initChatAssistant()),
    safari: () => import('./my-safari.js').then(module => module.initMySafari()),
    utility: () => import('./utility-hub.js').then(module => module.initUtilityHub()),
    'trip-planner': () => import('./trip-planner.js').then(module => module.initTripPlanner()),
    marketplace: () => import('./marketplace.js').then(module => module.initMarketplace()),
    itineraries: () => import('./itineraries.js').then(module => module.initItineraries()),
    parks: () => import('./parks.js').then(module => module.initParks()),
    borders: () => import('./borders.js').then(module => module.initBorders()),
    discover: () => import('./discover.js').then(module => module.initDiscover()),
    about: () => import('./about.js').then(module => module.initAbout()),
    contact: () => import('./contact.js').then(module => module.initContact()),
    health: () => import('./health.js').then(module => module.initHealth()),
    events: () => import('./events.js').then(module => module.initEvents()),
    'book-direct': () => import('./book-direct.js').then(module => module.initBookDirect()),
    transport: () => import('./transport-logistics.js').then(module => module.initTransportLogistics()),
    essentials: () => import('./travel-essentials.js').then(module => module.initTravelEssentials()),
    embassies: () => import('./embassies.js').then(module => module.initEmbassies()),
    checklist: () => import('./planning-checklist.js').then(module => module.initPlanningChecklist()),
    guides: () => import('./planning-guides.js').then(module => module.initPlanningGuides()),
    statistics: () => import('./tourism-stats.js').then(module => module.initTourismStats()),
    'cost-estimator': () => import('./cost-estimator.js').then(module => module.initCostEstimator()),
    'safari-bingo': () => import('./safari-bingo.js').then(module => module.initSafariBingo()),
    'packing-list': () => import('./packing-list.js').then(module => module.initPackingList()),
    phrasebook: () => import('./phrasebook.js').then(module => module.initPhrasebook()),
    campsites: () => import('./campsites.js').then(module => module.initCampsites()),
    editorial: () => import('./editorial.js').then(module => module.initEditorialWorkspace()),
};

const loaded = new Map();

function updateDebugState() {
    document.documentElement.dataset.loadedFeatures = [...loaded.keys()].sort().join(',');
}

function loadFeature(name) {
    if (!loaders[name]) return Promise.resolve();
    if (!loaded.has(name)) {
        const promise = loaders[name]().then(() => updateDebugState());
        loaded.set(name, promise);
        updateDebugState();
    }
    return loaded.get(name);
}

const SECTION_FEATURES = {
    destinations: ['destinations'],
    'route-explorer': ['routes'],
    'hub-my-safari': ['safari', 'ai'],
    plan: ['utility', 'trip-planner', 'safari', 'ai'],
    itineraries: ['itineraries'],
    parks: ['parks'],
    borders: ['borders'],
    'book-direct': ['book-direct'],
    health: ['health'],
    events: ['events'],
    embassies: ['embassies'],
    transport: ['transport'],
    'travel-essentials': ['essentials'],
    'planning-checklist': ['checklist'],
    guides: ['guides'],
    'tourism-stats': ['statistics'],
    'cost-estimator': ['cost-estimator'],
    'safari-bingo': ['safari-bingo'],
    'packing-list': ['packing-list'],
    phrasebook: ['phrasebook'],
    campsites: ['campsites'],
    editorial: ['editorial'],
    cultures: ['marketplace'],
    gastronomy: ['marketplace'],
    experiences: ['marketplace'],
    news: ['discover'],
    'top-destinations': ['discover'],
    faq: ['discover'],
    about: ['about'],
    contact: ['contact'],
    'hub-expense-tracker': ['utility'],
};

const DETAIL_FEATURES = {
    park: ['parks'],
    border: ['borders'],
    itinerary: ['itineraries'],
    route: ['routes'],
    listing: ['book-direct'],
    'planning-guide': ['guides'],
};

const LEGACY_SECTION_PATHS = {
    'route-explorer': '/routes',
    'hub-my-safari': '/my-safari',
    'shared-safari': '/my-safari',
    'hub-expense-tracker': '/expenses',
};

function redirectRemovedHomepageSection(route) {
    if (window.location.pathname !== '/' || route.type !== 'home' || !route.sectionHash) return false;
    if (document.getElementById(route.sectionHash)) return false;
    const path = LEGACY_SECTION_PATHS[route.sectionHash] || `/${route.sectionHash}`;
    window.location.replace(`${path}${window.location.search}${window.location.hash}`);
    return true;
}

let routeControllerLoaded = false;

async function loadRouteController() {
    if (routeControllerLoaded) return;
    routeControllerLoaded = true;
    const module = await import('./country-guide.js');
    module.initCountryGuide();
    module.bootstrapRouting();
}

async function loadForCurrentRoute() {
    const route = parseRouteShape();
    if (redirectRemovedHomepageSection(route)) return;

    if (route.type === 'country') {
        await loadRouteController();
        return;
    }

    if (DETAIL_FEATURES[route.type]) {
        await Promise.all(DETAIL_FEATURES[route.type].map(loadFeature));
        await loadRouteController();
        return;
    }

    if (route.type === 'home' && route.sectionHash) {
        await Promise.all((SECTION_FEATURES[route.sectionHash] || []).map(loadFeature));
        finalizeHubRoute(route.sectionHash, {
            dismiss: dismissSeoPrerender,
            setMeta: setHubMeta,
        });
        return;
    }

    await Promise.all(['destinations', 'routes', 'newsletter', 'ai'].map(loadFeature));
}

export function initFeatureLoader() {
    loadForCurrentRoute().catch(error => console.error('[Features] Could not load page features', error));
    loadFeature('chat').catch(error => console.error('[Features] Could not load assistant', error));
    const sync = () => loadForCurrentRoute().catch(error => console.error('[Features] Could not update page features', error));
    window.addEventListener('savanna:routechange', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
}
