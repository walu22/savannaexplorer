/** Dense planning hubs — skip scroll-reveal so the next section is not an invisible layout gap. */
const REVEAL_SKIP_IDS = new Set([
    'parks',
    'book-direct',
    'borders',
    'health',
    'events',
    'plan',
    'embassies',
    'transport',
    'itineraries',
    'destinations',
]);

/** Reveal target section and every section above it (for hash / hub deep links). */
export function revealThroughSection(sectionId) {
    if (!sectionId) return;
    let reached = false;
    document.querySelectorAll('section.reveal-item').forEach(section => {
        if (!reached) section.classList.add('reveal-active');
        if (section.id === sectionId) reached = true;
    });
    document.getElementById(sectionId)?.classList.add('reveal-active');
}

export function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px 15% 0px' });

    document.querySelectorAll('section').forEach(section => {
        if (section.classList.contains('hidden') || REVEAL_SKIP_IDS.has(section.id)) {
            return;
        }
        section.classList.add('reveal-item');
        observer.observe(section);
    });
}
