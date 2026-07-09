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
        '.nav-links--desktop a.active, .nav-drop-menu a.active, .mobile-nav-panel a.active'
    ).forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
}

function setNavActive(sectionId) {
    clearNavActive();
    document.querySelectorAll(`a[href="#${sectionId}"]`).forEach(link => {
        if (link.closest('.nav-links--desktop') || link.closest('.mobile-nav-panel')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'true');
        }
    });

    const panel = document.getElementById('mobile-nav-panel');
    if (!panel?.classList.contains('is-open')) return;

    panel.querySelectorAll('.mobile-nav-group').forEach(group => {
        const hasActive = group.querySelector('a.active');
        const toggle = group.querySelector('.mobile-nav-group__toggle');
        if (hasActive) {
            group.classList.add('is-open');
            toggle?.setAttribute('aria-expanded', 'true');
        }
    });
}

function resolveSectionIdFromHash(hash) {
    if (!hash) return null;
    if (document.getElementById(hash)) return hash;
    if (hash === 'plan' || hash.startsWith('plan/')) return 'plan';
    return null;
}

function scrollToPlanHub(hash) {
    const sectionId = resolveSectionIdFromHash(hash);
    if (!sectionId) return;

    revealThroughSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - getScrollOffset();
        window.scrollTo({ top, behavior: smoothScrollBehavior() });
    }

    history.replaceState(null, '', `#${hash}`);
    if (hash.startsWith('plan/') || hash === 'plan') {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
}

function initAnchorLinks() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link || link.getAttribute('href') === '#') return;

        const hash = link.getAttribute('href').slice(1);
        const sectionId = resolveSectionIdFromHash(hash);
        if (!sectionId) return;
        if (link.closest('#country-detail-view')) return;

        e.preventDefault();
        closeMobileNav();

        if (hash.startsWith('plan/') || hash === 'plan') {
            scrollToPlanHub(hash);
            return;
        }

        scrollToSection(sectionId);
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

function initHashOnLoad() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const sectionId = resolveSectionIdFromHash(hash);
    if (!sectionId) return;

    window.requestAnimationFrame(() => {
        if (hash.startsWith('plan/') || hash === 'plan') {
            scrollToPlanHub(hash);
            return;
        }
        revealThroughSection(sectionId);
        scrollToSection(sectionId, { updateHash: false });
    });
}

function initScrollTracking() {
    const progressBar = document.getElementById('scroll-progress-bar');
    const heroBg = document.getElementById('hero-img');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const handleScroll = () => {
        const scrollTop = window.scrollY;

        // 1. Reading Progress Calculation
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percentage = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
        }

        // 2. Hardware-Accelerated Hero Parallax (skip on mobile for maximum battery saving)
        if (heroBg && !isMobile && scrollTop < window.innerHeight) {
            const offset = scrollTop * 0.35;
            heroBg.style.setProperty('--scroll-y-px', `${offset}px`);
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial run to sync states on page load
}

function initHeadlineRotation() {
    const wrapper = document.getElementById('headline-rotate');
    if (!wrapper) return;

    const words = wrapper.querySelectorAll('.rotate-word');
    if (words.length <= 1) return;

    let index = 0;
    setInterval(() => {
        const current = words[index];
        index = (index + 1) % words.length;
        const next = words[index];

        // Animate current word sliding out up
        current.classList.remove('active');
        current.classList.add('exit');

        // Animate next word sliding in from bottom
        next.classList.remove('exit');
        next.classList.add('active');

        // Reset exited class once off-screen and transition has completed
        setTimeout(() => {
            current.classList.remove('exit');
        }, 800);
    }, 3800); // Exquisite rhythm, pacing rotation every 3.8 seconds
}

export function initScrollUx() {
    initAnchorLinks();
    initScrollSpy();
    initBackToTop();
    initHashOnLoad();
    initScrollTracking();
    initHeadlineRotation();
}
