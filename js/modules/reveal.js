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
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('reveal-item');
        observer.observe(section);
    });
}
