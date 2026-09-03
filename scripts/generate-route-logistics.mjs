import { readFile, writeFile } from 'node:fs/promises';

const ROUTES_FILE = new URL('../data/route-collections.json', import.meta.url);
const OUTPUT_FILE = new URL('../data/route-logistics.json', import.meta.url);
const ROUTER_BASE = 'https://router.project-osrm.org/route/v1/driving';
const CAPTURE_DATE = new Date().toISOString().slice(0, 10);

function round(value, precision = 0) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function confidenceForSnap(fromSnapKm, toSnapKm) {
    const largestSnap = Math.max(fromSnapKm, toSnapKm);
    if (largestSnap <= 2) return 'high';
    if (largestSnap <= 5) return 'medium';
    return 'low';
}

async function routeEstimate(route) {
    const coordinates = route.stops.map(stop => `${stop.lng},${stop.lat}`).join(';');
    const response = await fetch(`${ROUTER_BASE}/${coordinates}?overview=false&steps=false`, {
        headers: { 'user-agent': 'SavannaExplorer route research (https://savannaexplorer.com)' },
    });
    if (!response.ok) throw new Error(`${route.id}: routing service returned ${response.status}`);
    const result = await response.json();
    if (result.code !== 'Ok' || !result.routes?.[0]) throw new Error(`${route.id}: ${result.code || 'no route returned'}`);

    const routed = result.routes[0];
    const legs = routed.legs.map((leg, index) => {
        const fromSnapKm = round((result.waypoints[index]?.distance || 0) / 1000, 1);
        const toSnapKm = round((result.waypoints[index + 1]?.distance || 0) / 1000, 1);
        return {
            fromStopId: route.stops[index].id,
            toStopId: route.stops[index + 1].id,
            distanceKm: Math.round(leg.distance / 1000),
            driveMinutes: Math.round(leg.duration / 60),
            fromSnapKm,
            toSnapKm,
            confidence: confidenceForSnap(fromSnapKm, toSnapKm),
        };
    });

    return {
        status: legs.some(leg => leg.confidence === 'low') ? 'check-required' : 'estimated',
        capturedAt: CAPTURE_DATE,
        totalDistanceKm: Math.round(routed.distance / 1000),
        totalDriveMinutes: Math.round(routed.duration / 60),
        legs,
    };
}

const collection = JSON.parse(await readFile(ROUTES_FILE, 'utf8'));
const logistics = {};

for (const route of collection.routes) {
    logistics[route.id] = await routeEstimate(route);
    process.stdout.write(`Estimated ${route.id}\n`);
    await sleep(350);
}

const output = {
    meta: {
        version: 1,
        generatedAt: CAPTURE_DATE,
        source: 'OSRM public routing service using OpenStreetMap road data',
        methodology: 'Indicative car-routing estimates between the collection coordinates. Remote tracks, gates, ferries, seasonal closures and private access may not be represented.',
        disclaimer: 'Planning estimate only. Verify the actual road, access conditions, fuel range and travel time locally before departure.',
    },
    routes: logistics,
};

await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote logistics for ${Object.keys(logistics).length} routes to data/route-logistics.json\n`);
