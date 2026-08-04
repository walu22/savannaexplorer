import campsiteData from '../../data/campsites.json';

const AMENITY_ICONS = {
    'WiFi': 'fas fa-wifi',
    'Pool': 'fas fa-swimming-pool',
    'Braai': 'fas fa-fire',
    'Power': 'fas fa-plug',
    'Pet-Friendly': 'fas fa-paw',
    'Restaurant': 'fas fa-utensils',
    'Bar': 'fas fa-glass-martini-alt',
    'Shop': 'fas fa-store'
};

export function initCampsites() {
    const section = document.getElementById('campsites-app');
    if (!section) return;

    let activeCountry = 'all';
    let activeType = 'all';
    let activeAmenities = new Set();

    function render() {
        // Build filters
        let html = `<div class="campsites-filters">
            <div class="campsites-filter-group">
                <label for="camp-country">Country</label>
                <select id="camp-country">
                    <option value="all">All Countries</option>
                    ${campsiteData.filters.countries.map(c => `<option value="${c}" ${activeCountry === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="campsites-filter-group">
                <label for="camp-type">Type</label>
                <select id="camp-type">
                    <option value="all">All Types</option>
                    ${campsiteData.filters.types.map(t => `<option value="${t}" ${activeType === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </div>
            <div class="campsites-amenity-filters">
                ${campsiteData.filters.amenities.map(a => `<span class="amenity-chip ${activeAmenities.has(a) ? 'active' : ''}" data-amenity="${a}"><i class="${AMENITY_ICONS[a] || 'fas fa-check'}"></i> ${a}</span>`).join('')}
            </div>
        </div>`;

        // Filter accommodations
        const filtered = campsiteData.accommodations.filter(acc => {
            if (activeCountry !== 'all' && acc.country !== activeCountry) return false;
            if (activeType !== 'all' && acc.type !== activeType) return false;
            for (const a of activeAmenities) {
                if (!acc.amenities.includes(a)) return false;
            }
            return true;
        });

        html += `<p class="campsites-results-count">Showing <strong>${filtered.length}</strong> of ${campsiteData.accommodations.length} accommodations</p>`;

        if (filtered.length === 0) {
            html += `<div class="campsites-empty"><i class="fas fa-search"></i> No accommodations match your filters. Try broadening your search.</div>`;
        } else {
            html += '<div class="campsites-grid">';
            filtered.forEach(acc => {
                const typeSlug = acc.type.toLowerCase().replace(/\s+/g, '-');
                html += `<div class="campsite-card">
                    <div class="campsite-card-header">
                        <div class="campsite-card-title">
                            <h3>${acc.name}</h3>
                            <div class="campsite-card-meta">${acc.park} · ${acc.country}</div>
                        </div>
                        <div class="campsite-card-price">${acc.priceRange}</div>
                    </div>
                    <div class="campsite-card-body">
                        <p class="campsite-card-description">${acc.description}</p>
                        <div class="campsite-amenities">
                            ${acc.amenities.map(a => `<span class="campsite-amenity-tag"><i class="${AMENITY_ICONS[a] || 'fas fa-check'}"></i> ${a}</span>`).join('')}
                        </div>
                        <span class="campsite-type-badge campsite-type-badge--${typeSlug}">${acc.type}</span>
                    </div>
                    <div class="campsite-card-footer">
                        <span class="campsite-pet-badge">${acc.petFriendly ? '🐾 Pet-Friendly' : ''}</span>
                        <a href="${acc.bookingUrl}" target="_blank" rel="noopener" class="btn-campsite-book"><i class="fas fa-external-link-alt"></i> Book Direct</a>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        section.innerHTML = html;
        bindEvents();
    }

    function bindEvents() {
        document.getElementById('camp-country')?.addEventListener('change', e => {
            activeCountry = e.target.value;
            render();
        });
        document.getElementById('camp-type')?.addEventListener('change', e => {
            activeType = e.target.value;
            render();
        });
        section.querySelectorAll('.amenity-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const amenity = chip.dataset.amenity;
                if (activeAmenities.has(amenity)) {
                    activeAmenities.delete(amenity);
                } else {
                    activeAmenities.add(amenity);
                }
                render();
            });
        });
    }

    render();
}
