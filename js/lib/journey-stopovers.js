import listings from '../../data/stays-operators.json' with { type: 'json' };

const MAX_DRIVING_MINUTES_PER_TRANSFER_DAY = 420;

function searchable(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function meaningfulTokens(value) {
    return [...new Set(searchable(value).split(/\s+/).filter(token => token.length >= 4))];
}

function sourceScore(listing, route) {
    const terms = meaningfulTokens([
        route?.title,
        route?.stops?.[0]?.name,
        route?.stops?.at(-1)?.name,
    ].join(' '));
    const haystack = searchable([listing.title, listing.region, ...(listing.tags || [])].join(' '));
    const matches = terms.filter(term => haystack.includes(term)).length;
    const directoryBoost = /directory|tourism|hospitality|parks|reservations/i.test(`${listing.title} ${listing.description}`) ? 2 : 0;
    return matches * 5 + directoryBoost;
}

function sourcesFor(countryId, route) {
    return listings
        .filter(item => item.kind === 'stay' && item.country === countryId && /^https:\/\//.test(item.url || ''))
        .map(item => ({ item, score: sourceScore(item, route) }))
        .sort((a, b) => b.score - a.score || String(b.item.lastVerified).localeCompare(String(a.item.lastVerified)))
        .slice(0, 2)
        .map(({ item, score }) => ({
            id: item.id,
            title: item.title,
            region: item.region,
            url: item.url,
            linkLabel: item.linkLabel,
            lastVerified: item.lastVerified,
            planningTip: item.planningTip,
            relevance: score >= 5 ? 'Route-region match' : 'Reviewed country directory',
        }));
}

export function estimateTransferDays(transfer) {
    const minutes = Number.isFinite(transfer?.schedulingMinutes)
        ? transfer.schedulingMinutes
        : Number.isFinite(transfer?.totalDriveMinutes) ? transfer.totalDriveMinutes : 840;
    const uncertaintyBuffer = transfer?.status === 'estimated' ? 0 : 1;
    return Math.max(1, Math.ceil(minutes / MAX_DRIVING_MINUTES_PER_TRANSFER_DAY) + uncertaintyBuffer);
}

function placementFor(transfer) {
    const approach = transfer?.approach?.driveMinutes;
    const onward = transfer?.onward?.driveMinutes;
    if (!Number.isFinite(approach) || !Number.isFinite(onward)) return 'Confirm the first overnight with a local host before departure.';
    if (approach > onward * 1.25) return 'Prioritise the departure-country side; most driving is before the border.';
    if (onward > approach * 1.25) return 'Cross early and prioritise the arrival-country side; most driving follows the border.';
    return 'Plan stopovers on both sides of the crossing rather than forcing one long final day.';
}

export function buildStopoverPlan(transfer, crossing, fromSegment, toSegment) {
    const transferDays = estimateTransferDays(transfer);
    const stopoverNights = Math.max(0, transferDays - 1);
    const sources = [
        ...sourcesFor(fromSegment?.countryId, fromSegment?.route).map(source => ({ ...source, countryName: fromSegment?.countryName })),
        ...sourcesFor(toSegment?.countryId, toSegment?.route).map(source => ({ ...source, countryName: toSegment?.countryName })),
    ];
    const status = transfer?.status === 'estimated' ? (stopoverNights ? 'required' : 'same-day') : 'local-check';
    const summary = status === 'same-day'
        ? 'No extra stopover is built into this crossing, but keep the day free for border formalities and breaks.'
        : status === 'required'
            ? `Reserve ${transferDays} transfer days and ${stopoverNights} overnight stop${stopoverNights === 1 ? '' : 's'}; this is not a safe single-day connection.`
            : `Reserve ${transferDays} transfer days until a local host or operator confirms the uncertain road leg.`;
    return {
        status,
        transferDays,
        stopoverNights,
        title: stopoverNights ? `${stopoverNights} stopover night${stopoverNights === 1 ? '' : 's'} needed` : 'Same-day transfer estimate',
        summary,
        placement: placementFor(transfer),
        sources,
        disclaimer: `These are reviewed booking sources for ${fromSegment?.countryName} and ${toSegment?.countryName}, not confirmed rooms near ${crossing?.name}. Check the exact property location, secure parking, late-arrival policy and current availability directly.`,
    };
}
