export const MAX_COMPARE_ROUTES = 3;

export function normalizeComparisonIds(ids, routes, max = MAX_COMPARE_ROUTES) {
    const available = new Set((routes || []).map(route => route.id));
    return [...new Set(Array.isArray(ids) ? ids : [])]
        .filter(id => available.has(id))
        .slice(0, max);
}

export function toggleComparisonId(ids, routeId, routes, max = MAX_COMPARE_ROUTES) {
    const current = normalizeComparisonIds(ids, routes, max);
    if (current.includes(routeId)) {
        return { ids: current.filter(id => id !== routeId), outcome: 'removed' };
    }
    if (!routes?.some(route => route.id === routeId)) return { ids: current, outcome: 'invalid' };
    if (current.length >= max) return { ids: current, outcome: 'limit' };
    return { ids: [...current, routeId], outcome: 'added' };
}

/** A relative planning signal, never a price quote. */
export function routeCostSignal(route) {
    if (!route) return { level: 'Unknown', reasons: [] };
    let score = 0;
    const reasons = [];
    if (route.duration?.min >= 10) {
        score += 2;
        reasons.push('longer trip');
    } else if (route.duration?.min >= 7) {
        score += 1;
        reasons.push('mid-length trip');
    }
    if (route.vehicle?.id === '4x4') {
        score += 2;
        reasons.push('specialist 4×4');
    } else if (route.vehicle?.id === 'suv') {
        score += 1;
        reasons.push('SUV');
    }
    if ((route.countryIds?.length || 0) > 1) {
        score += 1;
        reasons.push('cross-border travel');
    }
    if ((route.stops?.length || 0) >= 6) {
        score += 1;
        reasons.push('more overnight stops');
    }
    return {
        level: score >= 5 ? 'Higher' : score >= 3 ? 'Moderate' : 'Lower',
        reasons: reasons.length ? reasons : ['shorter, simpler route'],
    };
}
