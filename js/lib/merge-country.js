import countries from '../../data/countries.json';
import depth from '../../data/country-depth.json';

export function getFullCountryData(countryId) {
    const base = countries[countryId];
    const ext = depth[countryId];
    if (!base) return null;
    if (!ext) return { ...base, about: { ...base.about, summary: '', gettingThere: '', economy: '' } };

    const mergedSpots = [...base.spots];
    for (const spot of ext.additionalSpots || []) {
        const idx = mergedSpots.findIndex(s => s.name === spot.name);
        if (idx >= 0) mergedSpots[idx] = { ...mergedSpots[idx], ...spot };
        else mergedSpots.push(spot);
    }

    const mergedActivities = [...base.activities];
    for (const act of ext.additionalActivities || []) {
        if (!mergedActivities.some(a => a.name === act.name)) mergedActivities.push(act);
    }

    return {
        ...base,
        about: {
            ...base.about,
            summary: ext.summary || '',
            gettingThere: ext.gettingThere || '',
            economy: ext.economy || '',
            history: ext.historyOverride || base.about.history,
            geo: ext.geoOverride || base.about.geo,
            people: ext.peopleOverride || base.about.people,
        },
        spots: mergedSpots,
        activities: mergedActivities,
        routes: ext.routesEnhanced || base.routes,
        advice: { ...base.advice, ...ext.adviceExtended },
    };
}
