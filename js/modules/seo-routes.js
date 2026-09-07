import {
    borderPath,
    listingPath,
    navigateHome,
    navigateToBorder,
    navigateToListing,
    navigateToPark,
    navigateToPlanningGuide,
    navigateToRoute,
    parkPath,
    scrollToSection,
} from '../lib/router.js';
import parks from '../../data/parks.json';
import borders from '../../data/borders.json';
import listings from '../../data/stays-operators.json';
import routeCollection from '../../data/route-collections.json';
import { getCountryMeta } from '../lib/country-meta.js';
import guidesData from '../../data/planning-guides.json';
import { dismissSeoPrerender } from '../lib/seo-prerender.js';
import {
    setBorderMeta,
    setHomeMeta,
    setHubMeta,
    setListingMeta,
    setParkMeta,
    setPlanningGuideMeta,
    setRouteMeta,
} from '../lib/page-meta.js';
import { openPlanningGuide } from './planning-guides.js';
import { handleListingRoute } from './book-direct.js';

const getParkById = id => parks.find(item => item.id === id) || null;
const getBorderById = id => borders.find(item => item.id === id) || null;
const getListingById = id => listings.find(item => item.id === id) || null;
const getRouteById = id => routeCollection.routes.find(item => item.id === id) || null;

function highlightCard(selector) {
    document.querySelectorAll('.seo-highlight').forEach(el => el.classList.remove('seo-highlight'));
    const card = document.querySelector(selector);
    if (card) {
        card.classList.add('seo-highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function bindSeoLinks() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="/parks/"], a[href^="/borders/"], a[href^="/routes/"], a[href^="/stays/"], a[href^="/operators/"], a[href^="/guides/planning/"]');
        if (!link) return;
        if (e.defaultPrevented) return;
        const href = link.getAttribute('href');
        const parkMatch = href.match(/^\/parks\/([a-z0-9-]+)\/?$/);
        const borderMatch = href.match(/^\/borders\/([a-z0-9-]+)\/?$/);
        const routeMatch = href.match(/^\/routes\/([a-z0-9-]+)\/?$/);
        const stayMatch = href.match(/^\/stays\/([a-z0-9-]+)\/?$/);
        const operatorMatch = href.match(/^\/operators\/([a-z0-9-]+)\/?$/);
        const guideMatch = href.match(/^\/guides\/planning\/([a-z-]+)\/?$/);
        if (parkMatch && getParkById(parkMatch[1])) {
            e.preventDefault();
            navigateToPark(parkMatch[1]);
            handleSeoRoute({ type: 'park', parkId: parkMatch[1] });
        } else if (borderMatch && getBorderById(borderMatch[1])) {
            e.preventDefault();
            navigateToBorder(borderMatch[1]);
            handleSeoRoute({ type: 'border', borderId: borderMatch[1] });
        } else if (routeMatch && getRouteById(routeMatch[1])) {
            e.preventDefault();
            navigateToRoute(routeMatch[1]);
            handleSeoRoute({ type: 'route', routeId: routeMatch[1] });
        } else if (stayMatch && getListingById(stayMatch[1])?.kind === 'stay') {
            e.preventDefault();
            navigateToListing(getListingById(stayMatch[1]));
            handleSeoRoute({ type: 'listing', listingId: stayMatch[1] });
        } else if (operatorMatch && getListingById(operatorMatch[1])?.kind === 'operator') {
            e.preventDefault();
            navigateToListing(getListingById(operatorMatch[1]));
            handleSeoRoute({ type: 'listing', listingId: operatorMatch[1] });
        } else if (guideMatch && guidesData.guides[guideMatch[1]]) {
            e.preventDefault();
            navigateToPlanningGuide(guideMatch[1]);
            handleSeoRoute({ type: 'planning-guide', countryId: guideMatch[1] });
        }
    });
}

export function handleSeoRoute(route) {
    dismissSeoPrerender();

    if (route.type === 'park') {
        const park = getParkById(route.parkId);
        if (!park) return;
        setParkMeta(park);
        scrollToSection('parks');
        highlightCard(`#park-${route.parkId}`);
        return;
    }

    if (route.type === 'border') {
        const border = getBorderById(route.borderId);
        if (!border) return;
        setBorderMeta(border);
        scrollToSection('borders');
        highlightCard(`#border-${route.borderId}`);
        return;
    }

    if (route.type === 'route') {
        const data = getRouteById(route.routeId);
        if (!data) return;
        setRouteMeta(data);
        import('./route-explorer.js').then(({ openRouteExplorer }) => openRouteExplorer(route.routeId));
        return;
    }

    if (route.type === 'listing') {
        handleListingRoute(route);
        return;
    }

    if (route.type === 'planning-guide') {
        const guide = guidesData.guides[route.countryId];
        if (!guide) return;
        setPlanningGuideMeta(route.countryId, guide, getCountryMeta(route.countryId));
        scrollToSection('guides');
        openPlanningGuide(route.countryId);
        return;
    }

    setHomeMeta();
}

export function initSeoRoutes() {
    bindSeoLinks();
}

export function closeSeoRoute(sectionId = null) {
    navigateHome(sectionId);
    setHomeMeta();
    if (sectionId) {
        requestAnimationFrame(() => scrollToSection(sectionId));
    }
}

export { parkPath, borderPath, listingPath, routePath } from '../lib/router.js';
