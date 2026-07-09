import {
    NAV_CTA,
    NAV_DESKTOP_TOP,
    NAV_HUB_TABS,
    NAV_JOURNEY_GROUPS,
    NAV_MOBILE_SITE_GROUP,
    getCountryNavLinks,
} from '../lib/nav-structure.js';

function setMobileNavOpen(open) {
    const menuToggle = document.getElementById('mobile-menu');
    const panel = document.getElementById('mobile-nav-panel');
    if (!panel) return;

    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('nav-open', open);
    menuToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

    const icon = menuToggle?.querySelector('i');
    icon?.classList.toggle('fa-bars', !open);
    icon?.classList.toggle('fa-xmark', open);

    if (!open) {
        document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.mobile-nav-group').forEach(g => g.classList.remove('is-open'));
        document.querySelectorAll('.mobile-nav-group__toggle').forEach(t => {
            t.setAttribute('aria-expanded', 'false');
        });
    }
}

export function closeMobileNav() {
    setMobileNavOpen(false);
}

export function setMainNavSuppressed(suppressed) {
    const navbar = document.getElementById('navbar');
    document.body.classList.toggle('country-detail-open', suppressed);
    if (suppressed) closeMobileNav();
    if (navbar) navbar.setAttribute('aria-hidden', suppressed ? 'true' : 'false');
}

function renderCountryGrid() {
    const grid = document.getElementById('nav-country-grid');
    if (!grid) return;

    grid.innerHTML = getCountryNavLinks().map(({ href, label, flag }) =>
        `<a class="nav-country-link" href="${href}"><span aria-hidden="true">${flag}</span><span>${label}</span></a>`
    ).join('');
}

function renderHubDropdown() {
    const slot = document.getElementById('nav-hub-dropdown');
    if (!slot) return;

    slot.innerHTML = `
        <button type="button" class="nav-drop-toggle nav-cta" aria-expanded="false">
            ${NAV_CTA.desktopLabel} <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="nav-drop-menu nav-drop-menu--hub">
            ${NAV_HUB_TABS.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}
        </div>
    `;
}

function renderMobilePanel() {
    const body = document.getElementById('mobile-nav-body');
    if (!body) return;

    // Beautiful, highlighted mobile golden-and-glassmorphism CTA for AI Planner
    const aiPlannerCta = `
        <a class="mobile-nav-standalone open-ai-planner" href="#" style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.25); color: var(--primary-light); margin-bottom: 1.25rem; border-radius: 8px; font-weight: 600; text-align: center; padding: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: var(--transition-smooth); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);">
            <i class="fas fa-sparkles" style="color: var(--primary);"></i> Plan with AI
        </a>
    `;

    const countryLinks = getCountryNavLinks().map(({ href, label, flag }) =>
        `<a href="${href}"><span aria-hidden="true">${flag}</span> ${label}</a>`
    ).join('');

    const destinationsGroup = `
        <div class="mobile-nav-group" data-mobile-nav-group>
            <button type="button" class="mobile-nav-group__toggle" aria-expanded="false">
                <span>Destinations</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="mobile-nav-group__panel">
                ${countryLinks}
                <a href="#destinations">View all destinations</a>
            </div>
        </div>
    `;

    const journeyGroups = NAV_JOURNEY_GROUPS.map(group => `
        <div class="mobile-nav-group" data-mobile-nav-group>
            <button type="button" class="mobile-nav-group__toggle" aria-expanded="false">
                <span>${group.label}</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="mobile-nav-group__panel">
                ${group.items.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}
            </div>
        </div>
    `).join('');

    const siteGroup = `
        <div class="mobile-nav-group" data-mobile-nav-group>
            <button type="button" class="mobile-nav-group__toggle" aria-expanded="false">
                <span>${NAV_MOBILE_SITE_GROUP.label}</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="mobile-nav-group__panel">
                ${NAV_MOBILE_SITE_GROUP.items.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}
            </div>
        </div>
    `;

    const newsLink = NAV_DESKTOP_TOP.map(item =>
        `<a class="mobile-nav-standalone" href="${item.href}">${item.label}</a>`
    ).join('');

    const hubGroup = `
        <div class="mobile-nav-group mobile-nav-group--hub" data-mobile-nav-group>
            <button type="button" class="mobile-nav-group__toggle" aria-expanded="false">
                <span>${NAV_CTA.desktopLabel}</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="mobile-nav-group__panel">
                ${NAV_HUB_TABS.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}
            </div>
        </div>
    `;

    body.innerHTML = aiPlannerCta + hubGroup + destinationsGroup + journeyGroups + siteGroup + newsLink;
}

function initDesktopDropdowns() {
    document.querySelectorAll('.nav-drop-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const parent = toggle.closest('.nav-dropdown');
            const isOpen = parent?.classList.contains('open');
            document.querySelectorAll('.nav-dropdown').forEach(d => {
                d.classList.remove('open');
                d.querySelector('.nav-drop-toggle')?.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                parent?.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown').forEach(d => {
                d.classList.remove('open');
                d.querySelector('.nav-drop-toggle')?.setAttribute('aria-expanded', 'false');
            });
        }
    });
}

function initMobilePanel() {
    const menuToggle = document.getElementById('mobile-menu');
    const closeBtn = document.getElementById('mobile-nav-close');
    const panel = document.getElementById('mobile-nav-panel');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        setMobileNavOpen(!panel?.classList.contains('is-open'));
    });

    closeBtn?.addEventListener('click', () => closeMobileNav());

    panel?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => closeMobileNav());
    });

    panel?.querySelectorAll('[data-mobile-nav-group]').forEach(group => {
        const toggle = group.querySelector('.mobile-nav-group__toggle');
        toggle?.addEventListener('click', () => {
            const isOpen = group.classList.contains('is-open');
            panel.querySelectorAll('.mobile-nav-group').forEach(g => {
                g.classList.remove('is-open');
                g.querySelector('.mobile-nav-group__toggle')?.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                group.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileNav();
    });
}

export function initNav() {
    const navbar = document.getElementById('navbar');
    const heroImg = document.getElementById('hero-img');

    // Expose closeMobileNav globally for other modules (like AI planner)
    window.closeMobileNav = closeMobileNav;

    renderCountryGrid();
    renderHubDropdown();
    renderMobilePanel();
    initDesktopDropdowns();
    initMobilePanel();

    window.addEventListener('scroll', () => {
        if (document.body.classList.contains('country-detail-open')) return;
        navbar?.classList.toggle('scrolled', window.scrollY > 50);
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (heroImg && !reduceMotion.matches) {
        window.addEventListener('scroll', () => {
            heroImg.style.transform = `scale(${1 + window.pageYOffset * 0.0004})`;
        }, { passive: true });
    }
}
