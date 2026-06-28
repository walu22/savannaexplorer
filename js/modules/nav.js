function setMobileNavOpen(open) {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinksContainer = document.getElementById('nav-links');
    if (!navLinksContainer) return;

    navLinksContainer.classList.toggle('active', open);
    document.body.classList.toggle('nav-open', open);
    menuToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

    const icon = menuToggle?.querySelector('i');
    icon?.classList.toggle('fa-bars', !open);
    icon?.classList.toggle('fa-xmark', open);

    if (!open) {
        document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
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

export function initNav() {
    const navbar = document.getElementById('navbar');
    const heroImg = document.getElementById('hero-img');
    const menuToggle = document.getElementById('mobile-menu');
    const navLinksContainer = document.getElementById('nav-links');

    if (menuToggle && navLinksContainer) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            setMobileNavOpen(!navLinksContainer.classList.contains('active'));
        });

        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => closeMobileNav());
        });
    }

    document.querySelectorAll('.nav-drop-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const parent = toggle.closest('.nav-dropdown');
            const isOpen = parent?.classList.contains('open');
            document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
            if (!isOpen) parent?.classList.add('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
        }
        if (
            document.body.classList.contains('nav-open')
            && !e.target.closest('#nav-links')
            && !e.target.closest('#mobile-menu')
        ) {
            closeMobileNav();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileNav();
    });

    window.addEventListener('scroll', () => {
        if (document.body.classList.contains('country-detail-open')) return;
        navbar?.classList.toggle('scrolled', window.scrollY > 50);
    });

    window.addEventListener('scroll', () => {
        if (heroImg) {
            heroImg.style.transform = `scale(${1 + window.pageYOffset * 0.0004})`;
        }
    });
}
