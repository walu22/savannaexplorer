export function closeMobileNav() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinksContainer = document.querySelector('.nav-links');
    navLinksContainer?.classList.remove('active');
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
    const icon = menuToggle?.querySelector('i');
    icon?.classList.add('fa-bars');
    icon?.classList.remove('fa-xmark');
}

export function setMainNavSuppressed(suppressed) {
    const navbar = document.getElementById('navbar');
    document.body.classList.toggle('country-detail-open', suppressed);
    if (navbar) navbar.setAttribute('aria-hidden', suppressed ? 'true' : 'false');
}

export function initNav() {
    const navbar = document.getElementById('navbar');
    const heroImg = document.getElementById('hero-img');
    const menuToggle = document.getElementById('mobile-menu');
    const navLinksContainer = document.querySelector('.nav-links');

    if (menuToggle && navLinksContainer) {
        menuToggle.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon?.classList.toggle('fa-bars');
            icon?.classList.toggle('fa-xmark');
        });

        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileNav();
            });
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

    document.addEventListener('click', () => {
        document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
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
