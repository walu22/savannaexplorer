let activeStyle = 'all';

function applyExperienceFilters() {
    const country = document.getElementById('experience-country-filter')?.value || 'all';
    const cards = [...document.querySelectorAll('[data-experience-card]')];
    let visible = 0;

    cards.forEach(card => {
        const styleMatch = activeStyle === 'all' || card.dataset.style === activeStyle;
        const countries = String(card.dataset.countries || '').split(/\s+/);
        const countryMatch = country === 'all' || countries.includes(country);
        const show = styleMatch && countryMatch;
        card.hidden = !show;
        if (show) visible += 1;
    });

    const status = document.getElementById('experience-filter-status');
    if (status) {
        const countryLabel = document.getElementById('experience-country-filter')?.selectedOptions[0]?.textContent || 'all countries';
        status.textContent = `${visible} experience ${visible === 1 ? 'style' : 'styles'} shown for ${countryLabel}`;
    }
}

export function initExperiences() {
    const filterGroup = document.getElementById('experience-style-filters');
    const countryFilter = document.getElementById('experience-country-filter');
    if (!filterGroup || !countryFilter) return;

    filterGroup.addEventListener('click', event => {
        const button = event.target.closest('[data-experience-style]');
        if (!button) return;
        activeStyle = button.dataset.experienceStyle || 'all';
        filterGroup.querySelectorAll('[data-experience-style]').forEach(item => {
            const selected = item === button;
            item.classList.toggle('active', selected);
            item.setAttribute('aria-pressed', String(selected));
        });
        applyExperienceFilters();
    });

    countryFilter.addEventListener('change', applyExperienceFilters);
    applyExperienceFilters();
}
