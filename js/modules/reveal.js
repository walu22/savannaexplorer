/** Sibling classes that will trigger sequential stagger-reveal delays inside active sections */
const STAGGER_CHILD_SELECTORS = [
    '.service-card',
    '.destination-card',
    '.experience-card',
    '.culture-card',
    '.parks-card',
    '.fact-card',
    '.plan-trip-card',
    '.gastro-card',
    '.trip-country-card',
    '.book-card'
].join(', ');

/** Dense planning hubs — skip parent-level hidden spacing so layout remains fully functional. */
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

/** Reveal target section and every section above it (for deep-linking support). */
export function revealThroughSection(sectionId) {
    if (!sectionId) return;
    let reached = false;
    document.querySelectorAll('section.reveal-item').forEach(section => {
        if (!reached) {
            section.classList.add('reveal-active');
            section.querySelectorAll('.reveal-item-stagger').forEach(card => card.classList.add('reveal-active'));
        }
        if (section.id === sectionId) reached = true;
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('reveal-active');
        targetSection.querySelectorAll('.reveal-item-stagger').forEach(card => card.classList.add('reveal-active'));
    }
}

export function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                
                // Activate nested stagger children simultaneously but with their individual delay transitions
                entry.target.querySelectorAll('.reveal-item-stagger').forEach(card => {
                    card.classList.add('reveal-active');
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('section').forEach(section => {
        if (section.classList.contains('hidden') || REVEAL_SKIP_IDS.has(section.id)) {
            return;
        }
        
        section.classList.add('reveal-item');
        
        // Stagger child elements
        const children = section.querySelectorAll(STAGGER_CHILD_SELECTORS);
        children.forEach((child, index) => {
            child.classList.add('reveal-item-stagger');
            // Sequential delays capped at index 10, resetting/wrapping every 5 elements for a nice rhythmic bounce
            const delayIndex = (index % 5) + 1;
            child.classList.add(`reveal-delay-${delayIndex}`);
        });

        observer.observe(section);
    });
}
