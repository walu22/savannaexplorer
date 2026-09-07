import borders from '../../data/borders.json' with { type: 'json' };

const VEHICLE_CONTEXTS = new Set(['owned', 'financed', 'rented']);
const COUNTRY_IDS = {
    Botswana: 'botswana',
    Eswatini: 'eswatini',
    Lesotho: 'lesotho',
    Malawi: 'malawi',
    Mozambique: 'mozambique',
    Namibia: 'namibia',
    'South Africa': 'south-africa',
    Zambia: 'zambia',
    Zimbabwe: 'zimbabwe',
};

function cleanIds(values, limit = 100) {
    return [...new Set((Array.isArray(values) ? values : [])
        .map(String)
        .map(value => value.trim().slice(0, 160))
        .filter(Boolean))]
        .slice(0, limit);
}

function cleanSelections(selections) {
    if (!selections || typeof selections !== 'object' || Array.isArray(selections)) return {};
    return Object.fromEntries(Object.entries(selections)
        .slice(0, 8)
        .map(([key, value]) => [String(key).slice(0, 80), String(value).slice(0, 80)])
        .filter(([key, value]) => key && value));
}

export function normalizeTripOperations(operations) {
    return {
        borderSelections: cleanSelections(operations?.borderSelections),
        vehicleContext: VEHICLE_CONTEXTS.has(operations?.vehicleContext) ? operations.vehicleContext : '',
        completedDocumentIds: cleanIds(operations?.completedDocumentIds),
    };
}

function pairKey(first, second) {
    return [first, second].sort().join('|');
}

function borderFromStop(stop) {
    if (stop?.type !== 'border') return null;
    return borders.find(border => border.name === stop.name || String(stop.id || '').endsWith(border.id)) || null;
}

function documentId(label) {
    return `document:${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120)}`;
}

function contextualDocuments(vehicleContext) {
    if (vehicleContext === 'financed') return [
        'Written cross-border authorisation from the finance provider',
    ];
    if (vehicleContext === 'rented') return [
        'Rental agreement covering every destination country',
        'Rental-company cross-border authorisation letter',
    ];
    if (vehicleContext === 'owned') return [
        'Original vehicle registration matching the traveller or documented owner',
    ];
    return [];
}

export function buildTripActionCentre(trip) {
    const operations = normalizeTripOperations(trip?.operations);
    const countryIds = (trip?.countries || []).map(country => COUNTRY_IDS[country]).filter(Boolean);
    const detectedBorders = (trip?.routeDays || []).flatMap(day => day.stops || [])
        .map(borderFromStop)
        .filter(Boolean);
    const detectedByPair = new Map(detectedBorders.map(border => [pairKey(...border.countries), border.id]));
    const pairs = countryIds.slice(0, -1).map((fromId, index) => {
        const toId = countryIds[index + 1];
        const key = pairKey(fromId, toId);
        const candidates = borders.filter(border => border.vehicleCrossing !== false
            && border.countries.includes(fromId) && border.countries.includes(toId));
        const storedId = operations.borderSelections[key];
        const selectedId = candidates.some(border => border.id === storedId)
            ? storedId
            : candidates.some(border => border.id === detectedByPair.get(key)) ? detectedByPair.get(key) : '';
        const detectedId = candidates.some(border => border.id === detectedByPair.get(key)) ? detectedByPair.get(key) : '';
        return {
            key,
            fromId,
            toId,
            fromName: trip.countries[index],
            toName: trip.countries[index + 1],
            candidates,
            selectedId,
            detectedId,
            needsRouteUpdate: Boolean(detectedId && selectedId && detectedId !== selectedId),
            selected: candidates.find(border => border.id === selectedId) || null,
        };
    });
    const selectedCrossings = pairs.map(pair => pair.selected).filter(Boolean);
    const documentRecords = selectedCrossings.flatMap(crossing => (crossing.documents || []).map(label => ({
        id: documentId(label),
        label,
        reason: `${crossing.name} crossing checklist`,
        sourceUrl: crossing.sourceUrl,
    })));
    contextualDocuments(operations.vehicleContext).forEach(label => documentRecords.push({
        id: documentId(label),
        label,
        reason: `${operations.vehicleContext} vehicle`,
        sourceUrl: '',
    }));
    const completed = new Set(operations.completedDocumentIds);
    const documents = [];
    const seenDocuments = new Map();
    documentRecords.forEach(document => {
        if (seenDocuments.has(document.id)) {
            const existing = seenDocuments.get(document.id);
            if (!existing.reason.includes(document.reason)) existing.reason = `${existing.reason} · ${document.reason}`;
            return;
        }
        const item = { ...document, completed: completed.has(document.id) };
        seenDocuments.set(document.id, item);
        documents.push(item);
    });

    return {
        operations,
        pairs,
        selectedCrossings,
        vehicleContext: operations.vehicleContext,
        documents,
        completedCount: documents.filter(document => document.completed).length,
        totalCount: documents.length,
        allSelected: pairs.length > 0 && pairs.every(pair => pair.selected),
        routeUpdateRequired: pairs.some(pair => pair.needsRouteUpdate),
        isComplete: pairs.length > 0
            && pairs.every(pair => pair.selected)
            && !pairs.some(pair => pair.needsRouteUpdate)
            && Boolean(operations.vehicleContext)
            && documents.length > 0
            && documents.every(document => document.completed),
    };
}

export function setTripBorderSelection(operations, key, borderId) {
    const current = normalizeTripOperations(operations);
    const borderSelections = { ...current.borderSelections };
    if (borderId) borderSelections[String(key)] = String(borderId);
    else delete borderSelections[String(key)];
    return normalizeTripOperations({ ...current, borderSelections });
}

export function setTripVehicleContext(operations, vehicleContext) {
    return normalizeTripOperations({ ...normalizeTripOperations(operations), vehicleContext });
}

export function setTripDocumentComplete(operations, documentIdValue, completed) {
    const current = normalizeTripOperations(operations);
    const ids = new Set(current.completedDocumentIds);
    if (completed) ids.add(String(documentIdValue));
    else ids.delete(String(documentIdValue));
    return normalizeTripOperations({ ...current, completedDocumentIds: [...ids] });
}
