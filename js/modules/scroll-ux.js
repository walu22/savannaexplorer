import { revealThroughSection } from './reveal.js';
import { closeMobileNav } from './nav.js';
import { scrollToSection as routerScrollToSection } from '../lib/router.js';

/** Major homepage sections for scroll-spy and anchor focus. */
const TRACKED_SECTIONS = [
    'destinations',
    'itineraries',
    'parks',
    'book-direct',
    'borders',
    'health',
    'events',
    'plan',
    'transport',
    'guides',
    'news',
    'about',
    'faq',
    'contact',
];

const PAGE_CONTENTS = [
    { href: '#destinations', label: 'Destinations' },
    { href: '#itineraries', label: 'Itineraries' },
    { href: '#parks', label: 'National Parks' },
    { href: '#book-direct', label: 'Book Direct' },
    { href: '#transport', label: 'Transport' },
    { href: '#plan', label: 'Travel Tools' },
    { href: '#health', label: 'Health & Safety' },
    { href: '#guides', label: 'Planning Guides' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
];

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function smoothScrollBehavior() {
    return prefersReducedMotion() ? 'auto' : 'smooth';
}

function getScrollOffset() {
    const nav = document.getElementById('navbar');
    const height = nav?.offsetHeight || 76;
    return height + 12;
}


function scrollToSection(sectionId, { updateHash = true } = {}) {
    routerScrollToSection(sectionId);
    if (updateHash && sectionId !== 'home') {
        history.replaceState(null, '', `#${sectionId}`);
    }
}

function clearNavActive() {
    document.querySelectorAll(
        '.nav-links--desktop a.active, .nav-drop-menu a.active, .page-contents-links a.active, .mobile-nav-panel a.active'
    ).forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
}

function setNavActive(sectionId) {
    clearNavActive();
    document.querySelectorAll(`a[href="#${sectionId}"]`).forEach(link => {
        if (
            link.closest('.nav-links--desktop')
            || link.closest('.page-contents-links')
            || link.closest('.mobile-nav-panel')
        ) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'true');
        }
    });
}

function initAnchorLinks() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link || link.getAttribute('href') === '#') return;

        const hash = link.getAttribute('href').slice(1);
        if (!hash || !document.getElementById(hash)) return;
        if (link.closest('#country-detail-view')) return;

        e.preventDefault();
        closeMobileNav();
        scrollToSection(hash);
    });
}

function initScrollSpy() {
    const sections = TRACKED_SECTIONS
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    let activeId = null;

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const next = visible[0]?.target.id;
        if (next && next !== activeId) {
            activeId = next;
            setNavActive(next);
        }
    }, {
        rootMargin: `-${getScrollOffset()}px 0px -55% 0px`,
        threshold: [0, 0.15, 0.35, 0.55],
    });

    sections.forEach(section => {
        section.setAttribute('tabindex', '-1');
        observer.observe(section);
    });
}

function initBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    const toggle = () => {
        const show = window.scrollY > window.innerHeight * 2;
        button.hidden = !show;
    };

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: smoothScrollBehavior() });
        document.getElementById('main-content')?.focus({ preventScroll: true });
    });
}

function initPageContents() {
    const list = document.getElementById('page-contents-links');
    if (!list) return;

    list.innerHTML = PAGE_CONTENTS.map(({ href, label }) =>
        `<li><a href="${href}">${label}</a></li>`
    ).join('');
}

function initHashOnLoad() {
    const hash = window.location.hash.slice(1);
    if (!hash || !document.getElementById(hash)) return;

    window.requestAnimationFrame(() => {
        revealThroughSection(hash);
        scrollToSection(hash, { updateHash: false });
    });
}

export function initScrollUx() {
    initPageContents();
    initAnchorLinks();
    initScrollSpy();
    initBackToTop();
    initHashOnLoad();
}
