const ALLOWED_INTERESTS = new Set(['wildlife', 'landscapes', 'water', 'culture', 'active', 'road-trip', 'family']);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ROUTE_THEME_MAP = {
    wildlife: 'wildlife',
    landscapes: 'landscapes',
    water: 'water',
    culture: 'culture',
    active: 'adventure',
    family: 'family',
};

const SEASON_SCORE = { ideal: 30, shoulder: 17, avoid: 2 };

function allowed(value, choices, fallback) {
    return choices.includes(value) ? value : fallback;
}

export function normalizeDestinationPreferences(input = {}) {
    const month = Math.max(0, Math.min(11, Math.round(Number(input.month) || 0)));
    const days = Math.max(4, Math.min(30, Math.round(Number(input.days) || 10)));
    const interests = [...new Set((Array.isArray(input.interests) ? input.interests : [input.interests])
        .filter(value => ALLOWED_INTERESTS.has(value)))];
    return {
        month,
        days,
        interests,
        budget: allowed(input.budget, ['value', 'balanced', 'premium'], 'balanced'),
        driving: allowed(input.driving, ['no-drive', 'standard', 'suv', '4x4'], 'suv'),
        pace: allowed(input.pace, ['slow', 'balanced', 'fast'], 'balanced'),
    };
}

function routeScore(route, preferences) {
    const mappedInterests = preferences.interests.map(item => ROUTE_THEME_MAP[item]).filter(Boolean);
    const themeMatches = mappedInterests.filter(theme => route.themes?.includes(theme)).length;
    const durationMidpoint = (Number(route.duration?.min) + Number(route.duration?.max)) / 2;
    const durationGap = Math.abs(durationMidpoint - preferences.days);
    const durationPenalty = Number(route.duration?.min) > preferences.days ? 12 : 0;
    return (themeMatches * 8) - durationGap - durationPenalty;
}

function bestRoute(routes, countryId, preferences) {
    return routes
        .filter(route => route.countryIds?.includes(countryId) && Number(route.duration?.min) <= preferences.days + 2)
        .map(route => ({ route, score: routeScore(route, preferences) }))
        .sort((a, b) => b.score - a.score)[0]?.route || null;
}

export function rankDestinations(profiles, weather, routes, input) {
    const preferences = normalizeDestinationPreferences(input);
    return profiles.map(profile => {
        const season = weather[profile.countryId]?.[preferences.month] || { rating: 'shoulder', notes: 'Seasonal detail unavailable' };
        const interestMatches = preferences.interests.filter(item => profile.interests.includes(item));
        const interestScore = preferences.interests.length
            ? (interestMatches.length / preferences.interests.length) * 30
            : 15;
        const idealDayMidpoint = (profile.minDays + profile.maxDays) / 2;
        const dayScore = preferences.days < profile.minDays
            ? Math.max(-12, (preferences.days - profile.minDays) * 3)
            : (preferences.days <= profile.maxDays
                ? 15 + Math.max(0, 5 - Math.abs(preferences.days - idealDayMidpoint))
                : Math.max(3, 15 - ((preferences.days - profile.maxDays) * 2)));
        const score = (SEASON_SCORE[season.rating] || 10)
            + interestScore
            + dayScore
            + (profile.budget.includes(preferences.budget) ? 10 : 2)
            + (profile.driving.includes(preferences.driving) ? 8 : 0)
            + (profile.pace.includes(preferences.pace) ? 7 : 1);

        return {
            countryId: profile.countryId,
            score: Math.round(score),
            season,
            interestMatches,
            strengths: profile.strengths,
            tradeoff: profile.tradeoff,
            minDays: profile.minDays,
            route: bestRoute(routes, profile.countryId, preferences),
            preferences,
        };
    }).sort((a, b) => b.score - a.score || a.countryId.localeCompare(b.countryId));
}

export function destinationMatchSummary(preferences) {
    const month = MONTH_NAMES[preferences.month];
    const interestText = preferences.interests.length
        ? preferences.interests.join(', ').replace(/-/g, ' ')
        : 'a balanced mix';
    return `${month} · ${preferences.days} days · ${interestText}`;
}
