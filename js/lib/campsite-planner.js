const ACCESS_ORDER = { standard: 1, 'high-clearance': 2, '4x4': 3 };

export function filterCampsites(sites = [], filters = {}) {
    return sites.filter(site => (
        (!filters.country || filters.country === 'all' || site.country === filters.country)
        && (!filters.setting || filters.setting === 'all' || site.setting === filters.setting)
        && (!filters.access || filters.access === 'all' || site.accessLevel === filters.access)
        && (!filters.facility || filters.facility === 'all' || site.facilities.includes(filters.facility))
    ));
}

export function campsiteCoverage(sites = []) {
    return {
        sites: sites.length,
        countries: new Set(sites.map(site => site.country)).size,
        fourByFour: sites.filter(site => site.accessLevel === '4x4').length,
        authoritySources: sites.filter(site => site.sourceType.includes('authority')).length,
    };
}

export function sortCampsites(sites = []) {
    return [...sites].sort((a, b) => (
        (ACCESS_ORDER[a.accessLevel] || 9) - (ACCESS_ORDER[b.accessLevel] || 9)
        || a.country.localeCompare(b.country)
        || a.name.localeCompare(b.name)
    ));
}

export function campsiteBooking(site, day = null) {
    return {
        type: 'stay',
        provider: site.name,
        reference: 'Shortlisted from Campsite Finder',
        date: day?.date || '',
        status: 'planned',
        routeDayId: day?.id || '',
        sourceType: 'campsite',
        sourceId: site.id,
        sourceUrl: site.sourceUrl,
        country: site.country,
        location: site.area,
        accessLevel: site.accessLevel,
        accessLabel: site.accessLabel,
        accessNote: site.accessNote,
    };
}
