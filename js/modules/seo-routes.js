import {
    borderPath,
    getBorderById,
    getItineraryById,
    getListingById,
    getParkById,
    itineraryPath,
    listingPath,
    navigateHome,
    navigateToBorder,
    navigateToItinerary,
    navigateToListing,
    navigateToPark,
    parkPath,
    scrollToSection,
} from '../lib/router.js';
import { dismissSeoPrerender } from '../lib/seo-prerender.js';
import {
    setBorderMeta,
    setHomeMeta,
    setItineraryMeta,
    setListingMeta,
    setParkMeta,
} from '../lib/page-meta.js';
import { openItineraryDetail } from './itineraries.js';
import { handleListingRoute } from './book-direct.js';

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
        const link = e.target.closest('a[href^="/parks/"], a[href^="/borders/"], a[href^="/itineraries/"], a[href^="/stays/"], a[href^="/operators/"]');
        if (!link) return;
        const href = link.getAttribute('href');
        const parkMatch = href.match(/^\/parks\/([a-z0-9-]+)\/?$/);
        const borderMatch = href.match(/^\/borders\/([a-z0-9-]+)\/?$/);
        const itinMatch = href.match(/^\/itineraries\/([a-z0-9-]+)\/?$/);
        const stayMatch = href.match(/^\/stays\/([a-z0-9-]+)\/?$/);
        const operatorMatch = href.match(/^\/operators\/([a-z0-9-]+)\/?$/);
        if (parkMatch && getParkById(parkMatch[1])) {
            e.preventDefault();
            navigateToPark(parkMatch[1]);
            handleSeoRoute({ type: 'park', parkId: parkMatch[1] });
        } else if (borderMatch && getBorderById(borderMatch[1])) {
            e.preventDefault();
            navigateToBorder(borderMatch[1]);
            handleSeoRoute({ type: 'border', borderId: borderMatch[1] });
        } else if (itinMatch && getItineraryById(itinMatch[1])) {
            e.preventDefault();
            navigateToItinerary(itinMatch[1]);
            handleSeoRoute({ type: 'itinerary', itineraryId: itinMatch[1] });
        } else if (stayMatch && getListingById(stayMatch[1])?.kind === 'stay') {
            e.preventDefault();
            navigateToListing(stayMatch[1]);
            handleSeoRoute({ type: 'listing', listingId: stayMatch[1] });
        } else if (operatorMatch && getListingById(operatorMatch[1])?.kind === 'operator') {
            e.preventDefault();
            navigateToListing(operatorMatch[1]);
            handleSeoRoute({ type: 'listing', listingId: operatorMatch[1] });
        }
    });
}

export function handleSeoRoute(route) {
    dismissSeoPrerender();

    if (route.type === 'park') {
        const park = getParkById(route.parkId);
        if (!park) return;
        setParkMeta(route.parkId);
        scrollToSection('parks');
        highlightCard(`#park-${route.parkId}`);
        return;
    }

    if (route.type === 'border') {
        const border = getBorderById(route.borderId);
        if (!border) return;
        setBorderMeta(route.borderId);
        scrollToSection('borders');
        highlightCard(`#border-${route.borderId}`);
        return;
    }

    if (route.type === 'itinerary') {
        const data = getItineraryById(route.itineraryId);
        if (!data) return;
        setItineraryMeta(route.itineraryId);
        scrollToSection('itineraries');
        openItineraryDetail(route.itineraryId);
        return;
    }

    if (route.type === 'listing') {
        handleListingRoute(route);
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

export { parkPath, borderPath, itineraryPath, listingPath };
