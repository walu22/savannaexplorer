import mapsData from '../../data/itinerary-maps.json';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

/** @type {Map<string, object>} */
const activeMaps = new Map();

let leafletPromise = null;

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;

    leafletPromise = new Promise((resolve, reject) => {
        if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = LEAFLET_JS;
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = () => reject(new Error('Failed to load Leaflet'));
        document.head.appendChild(script);
    });

    return leafletPromise;
}

export function getItineraryMap(itineraryId) {
    return mapsData.routes[itineraryId] || null;
}

export function destroyRouteMap(itineraryId) {
    const map = activeMaps.get(itineraryId);
    if (map) {
        map.remove();
        activeMaps.delete(itineraryId);
    }
}

export async function mountRouteMap(itineraryId) {
    const mapData = getItineraryMap(itineraryId);
    const container = document.getElementById(`itin-map-canvas-${itineraryId}`);
    if (!mapData?.points?.length || !container) return;

    destroyRouteMap(itineraryId);
    container.innerHTML = '';

    const L = await loadLeaflet();
    const latlngs = mapData.points.map(p => [p.lat, p.lng]);

    const map = L.map(container, {
        scrollWheelZoom: false,
        attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapData.points.forEach((point, index) => {
        L.marker([point.lat, point.lng])
            .addTo(map)
            .bindPopup(`<strong>${index + 1}.</strong> ${escapeHtml(point.label)}`);
    });

    L.polyline(latlngs, {
        color: '#C4672A',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 6',
    }).addTo(map);

    map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
    activeMaps.set(itineraryId, map);

    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 200);
}

export function renderItineraryMapLink(itineraryId) {
    const map = getItineraryMap(itineraryId);
    if (!map) return '';

    const stops = map.waypoints.map(w => `<li>${escapeHtml(w)}</li>`).join('');
    return `
        <div class="itin-maps-panel">
            <h4><i class="fas fa-map-marked-alt"></i> Route map</h4>
            <p class="itin-maps-note">${map.waypoints.length} key stops — indicative driving route for planning.</p>
            <div id="itin-map-canvas-${escapeHtml(itineraryId)}" class="itin-map-canvas" role="img" aria-label="Route map for ${escapeHtml(itineraryId)}"></div>
            <ol class="itin-maps-stops">${stops}</ol>
            <a class="btn btn-outline btn-sm itin-maps-btn" href="${escapeHtml(map.mapsUrl)}" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i> Open turn-by-turn in Google Maps
            </a>
            <p class="itin-maps-disclaimer">${escapeHtml(mapsData.meta.disclaimer)}</p>
        </div>
    `;
}
