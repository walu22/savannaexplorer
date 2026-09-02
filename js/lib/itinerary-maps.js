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

// Country Maps Extension
const COUNTRY_COORDS = {
    'south-africa': [-30.5595, 22.9375],
    'namibia': [-22.9576, 18.4904],
    'botswana': [-22.3285, 24.6849],
    'zambia': [-13.1339, 27.8493],
    'zimbabwe': [-19.0154, 29.1549],
    'mozambique': [-18.6657, 35.5296],
    'malawi': [-13.2543, 34.3015],
    'lesotho': [-29.61, 28.2336],
    'eswatini': [-26.5225, 31.4659]
};

function hasCoordinates(item) {
    return Number.isFinite(item?.coordinates?.lat) && Number.isFinite(item?.coordinates?.lng);
}

export function hasCountryMapData(parks = [], borders = []) {
    return parks.some(hasCoordinates) || borders.some(hasCoordinates);
}

export async function mountCountryMap(countryId, parks = [], borders = []) {
    const container = document.getElementById('country-map-canvas');
    if (!container) return false;

    const mappedParks = parks.filter(hasCoordinates);
    const mappedBorders = borders.filter(hasCoordinates);
    if (!mappedParks.length && !mappedBorders.length) return false;

    destroyRouteMap('country-detail');
    container.innerHTML = '';

    container.setAttribute('aria-busy', 'true');
    const L = await loadLeaflet();
    const coords = COUNTRY_COORDS[countryId] || [-22, 24]; // Default to Southern Africa

    const map = L.map(container, {
        center: coords,
        zoom: 5,
        scrollWheelZoom: false,
        attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Feature Layers
    const parksLayer = L.layerGroup();
    const bordersLayer = L.layerGroup();

    const markerCoordinates = [];
    mappedParks.forEach(park => {
        const point = [park.coordinates.lat, park.coordinates.lng];
        markerCoordinates.push(point);
        L.marker(point, { title: park.name })
            .bindPopup(`<strong>${escapeHtml(park.name)}</strong><br>${escapeHtml(park.tags?.join(', ') || '')}`)
            .addTo(parksLayer);
    });

    mappedBorders.forEach(border => {
        const point = [border.coordinates.lat, border.coordinates.lng];
        markerCoordinates.push(point);
        const icon = L.divIcon({ className: 'custom-border-icon', html: '🛂' });
        L.marker(point, { icon, title: border.name })
            .bindPopup(`<strong>${escapeHtml(border.name)}</strong><br>Wait: ${escapeHtml(border.typicalWait || '')}`)
            .addTo(bordersLayer);
    });

    parksLayer.addTo(map);
    bordersLayer.addTo(map);

    activeMaps.set('country-detail', map);

    if (markerCoordinates.length > 1) {
        map.fitBounds(L.latLngBounds(markerCoordinates), { padding: [28, 28], maxZoom: 7 });
    }

    // Setup Toggles
    const toggleParks = document.getElementById('toggle-parks');
    const toggleBorders = document.getElementById('toggle-borders');

    if (toggleParks) {
        toggleParks.disabled = mappedParks.length === 0;
        toggleParks.checked = mappedParks.length > 0;
        toggleParks.onchange = (e) => {
            if (e.target.checked) map.addLayer(parksLayer);
            else map.removeLayer(parksLayer);
        };
    }

    if (toggleBorders) {
        toggleBorders.disabled = mappedBorders.length === 0;
        toggleBorders.checked = mappedBorders.length > 0;
        toggleBorders.onchange = (e) => {
            if (e.target.checked) map.addLayer(bordersLayer);
            else map.removeLayer(bordersLayer);
        };
    }

    container.removeAttribute('aria-busy');
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 200);
    return true;
}
