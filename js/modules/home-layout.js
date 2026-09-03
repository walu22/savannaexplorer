import { parseLocation } from '../lib/router.js';

const DETAIL_SECTION = {
    park: 'parks',
    border: 'borders',
    itinerary: 'itineraries',
    route: 'route-explorer',
    listing: 'book-direct',
    'planning-guide': 'guides',
};

function clearActiveSection() {
    document.querySelectorAll('.home-layout-active, .home-layout-active-branch').forEach(element => {
        element.classList.remove('home-layout-active', 'home-layout-active-branch');
    });
}

function focusSection(sectionId) {
    const main = document.getElementById('main-content');
    const target = document.getElementById(sectionId);
    if (!main || !target || !main.contains(target)) return false;

    const section = target.matches('section') ? target : target.closest('section');
    if (!section) return false;
    let branch = section;
    while (branch.parentElement && branch.parentElement !== main) branch = branch.parentElement;

    section.classList.add('home-layout-active');
    target.classList.add('home-layout-active');
    branch.classList.add('home-layout-active-branch');
    document.body.dataset.homeSection = sectionId;
    document.body.classList.toggle('home-section-focus--my-safari', sectionId === 'hub-my-safari');
    return true;
}

export function syncHomeLayout() {
    const route = parseLocation();
    clearActiveSection();
    document.body.classList.remove('home-focused', 'home-section-focus', 'home-section-focus--my-safari');
    delete document.body.dataset.homeSection;

    if (route.type === 'country' || route.type === 'legacy-country-hash') return;

    const detailSection = DETAIL_SECTION[route.type];
    if (detailSection && focusSection(detailSection)) {
        document.body.classList.add('home-section-focus');
        return;
    }

    if (route.type !== 'home') return;
    if (route.sectionHash && route.sectionHash !== 'home' && focusSection(route.sectionHash)) {
        document.body.classList.add('home-section-focus');
        return;
    }

    document.body.classList.add('home-focused');
}

function syncAssistantVisibility() {
    const button = document.getElementById('chat-fab');
    const hero = document.getElementById('home');
    if (!button || !hero) return;
    const overHero = document.body.classList.contains('home-focused')
        && window.scrollY < Math.max(240, hero.offsetHeight - 160);
    button.classList.toggle('chat-fab--deferred', overHero);
}

export function initHomeLayout() {
    syncHomeLayout();
    syncAssistantVisibility();
    const sync = () => {
        syncHomeLayout();
        syncAssistantVisibility();
    };
    window.addEventListener('savanna:routechange', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('scroll', syncAssistantVisibility, { passive: true });
}
