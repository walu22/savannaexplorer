import mapsData from '../../data/itinerary-maps.json';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function getItineraryMap(itineraryId) {
    return mapsData.routes[itineraryId] || null;
}

export function renderItineraryMapLink(itineraryId) {
    const map = getItineraryMap(itineraryId);
    if (!map) return '';

    const stops = map.waypoints.map(w => `<li>${escapeHtml(w)}</li>`).join('');
    return `
        <div class="itin-maps-panel">
            <h4><i class="fas fa-map-marked-alt"></i> Route map</h4>
            <p class="itin-maps-note">${map.waypoints.length} key stops — opens in Google Maps for planning drives between hubs.</p>
            <ol class="itin-maps-stops">${stops}</ol>
            <a class="btn btn-outline btn-sm itin-maps-btn" href="${escapeHtml(map.mapsUrl)}" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i> Open route in Google Maps
            </a>
            <p class="itin-maps-disclaimer">${escapeHtml(mapsData.meta.disclaimer)}</p>
        </div>
    `;
}
