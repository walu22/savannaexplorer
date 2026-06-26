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

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon?.classList.add('fa-bars');
                icon?.classList.remove('fa-xmark');
            });
        });
    }

    window.addEventListener('scroll', () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 50);
    });

    window.addEventListener('scroll', () => {
        if (heroImg) {
            heroImg.style.transform = `scale(${1 + window.pageYOffset * 0.0005})`;
        }
    });
}
