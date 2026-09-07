import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesPath = path.join(root, 'data', 'route-collections.json');
const bordersPath = path.join(root, 'data', 'borders.json');
const outputPath = path.join(root, 'data', 'journey-transfer-logistics.json');
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

const routeCollection = JSON.parse(await fs.readFile(routesPath, 'utf8'));
const borders = JSON.parse(await fs.readFile(bordersPath, 'utf8'));

function distanceKm(from, to) {
    if (![from?.lat, from?.lng, to?.lat, to?.lng].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
    const radians = degrees => degrees * Math.PI / 180;
    const lat = radians(to.lat - from.lat);
    const lng = radians(to.lng - from.lng);
    const value = Math.sin(lat / 2) ** 2
        + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function pairBorders(fromCountry, toCountry) {
    return borders.filter(border => border.vehicleCrossing !== false
        && border.coordinates
        && border.countries?.includes(fromCountry)
        && border.countries?.includes(toCountry));
}

function selectedBorder(fromRoute, toRoute) {
    const fromCountry = fromRoute.countryIds[0];
    const toCountry = toRoute.countryIds[0];
    const fromStop = fromRoute.stops.at(-1);
    const toStop = toRoute.stops[0];
    return pairBorders(fromCountry, toCountry).sort((a, b) => {
        const score = border => distanceKm(fromStop, border.coordinates) + distanceKm(border.coordinates, toStop);
        return score(a) - score(b) || String(b.lastVerified || '').localeCompare(String(a.lastVerified || ''));
    })[0] || null;
}

function snapDistanceKm(input, snapped) {
    return distanceKm(input, { lat: snapped[1], lng: snapped[0] });
}

function confidenceFor(snapKm) {
    if (snapKm <= 2) return 'high';
    if (snapKm <= 5) return 'medium';
    return 'low';
}

function weakestConfidence(values) {
    if (values.includes('low')) return 'low';
    if (values.includes('medium')) return 'medium';
    return 'high';
}

function transferKey(fromRouteId, borderId, toRouteId) {
    return `${fromRouteId}__${borderId}__${toRouteId}`;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTransfer(fromRoute, border, toRoute) {
    const from = fromRoute.stops.at(-1);
    const crossing = border.coordinates;
    const to = toRoute.stops[0];
    const coordinates = [from, crossing, to].map(point => `${point.lng},${point.lat}`).join(';');
    const response = await fetch(`${OSRM_BASE}/${coordinates}?overview=false&steps=false`, {
        headers: { 'User-Agent': 'SavannaExplorer/4.74 journey-planning-cache' },
        signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`OSRM request returned ${response.status}`);
    const payload = await response.json();
    if (payload.code !== 'Ok' || payload.routes?.[0]?.legs?.length !== 2) {
        throw new Error(`OSRM response was ${payload.code || 'incomplete'}`);
    }

    const snaps = payload.waypoints.map((waypoint, index) => snapDistanceKm([from, crossing, to][index], waypoint.location));
    const confidence = snaps.map(confidenceFor);
    const names = [from.name, border.name, to.name];
    const legs = payload.routes[0].legs.map((leg, index) => ({
        kind: index === 0 ? 'approach' : 'onward',
        fromName: names[index],
        toName: names[index + 1],
        distanceKm: Math.round(leg.distance / 1000),
        driveMinutes: Math.round(leg.duration / 60),
        fromSnapKm: Number(snaps[index].toFixed(1)),
        toSnapKm: Number(snaps[index + 1].toFixed(1)),
        confidence: weakestConfidence([confidence[index], confidence[index + 1]]),
    }));
    return {
        status: 'estimated',
        confidence: weakestConfidence(legs.map(leg => leg.confidence)),
        totalDistanceKm: legs.reduce((sum, leg) => sum + leg.distanceKm, 0),
        totalDriveMinutes: legs.reduce((sum, leg) => sum + leg.driveMinutes, 0),
        legs,
    };
}

const routes = routeCollection.routes.filter(route => route.countryIds?.length === 1 && route.stops?.length);
const candidates = [];
for (const fromRoute of routes) {
    for (const toRoute of routes) {
        if (fromRoute.id === toRoute.id || fromRoute.countryIds[0] === toRoute.countryIds[0]) continue;
        const border = selectedBorder(fromRoute, toRoute);
        if (border) candidates.push({ fromRoute, border, toRoute });
    }
}

const transfers = {};
for (const [index, candidate] of candidates.entries()) {
    const { fromRoute, border, toRoute } = candidate;
    const key = transferKey(fromRoute.id, border.id, toRoute.id);
    process.stdout.write(`[${index + 1}/${candidates.length}] ${key}\n`);
    try {
        transfers[key] = {
            fromRouteId: fromRoute.id,
            borderId: border.id,
            toRouteId: toRoute.id,
            ...(await fetchTransfer(fromRoute, border, toRoute)),
        };
    } catch (error) {
        transfers[key] = {
            fromRouteId: fromRoute.id,
            borderId: border.id,
            toRouteId: toRoute.id,
            status: 'unavailable',
            reason: error instanceof Error ? error.message : 'Routing estimate unavailable',
        };
    }
    await wait(250);
}

const output = {
    meta: {
        generatedAt: new Date().toISOString(),
        source: 'OSRM public routing service using OpenStreetMap road data',
        methodology: 'Cached driving estimates connect the final stop of one route to the selected border and then to the first stop of the next route.',
        disclaimer: 'Planning estimate only. Not live navigation. Road conditions, closures, queues and border processing time are not included and must be rechecked locally.',
        candidateCount: candidates.length,
        estimatedCount: Object.values(transfers).filter(item => item.status === 'estimated').length,
    },
    transfers,
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(transfers).length} transfer plans to ${outputPath}`);
