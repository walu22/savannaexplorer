import { parsePublishedHours } from './journey-logistics.js';

export const VEHICLE_ARRANGEMENTS = {
    rental: 'Rental vehicle',
    owned: 'Your own vehicle',
    financed: 'Financed vehicle',
    borrowed: 'Borrowed vehicle',
};

export function normalizeVehicleArrangement(value) {
    return VEHICLE_ARRANGEMENTS[value] ? value : 'rental';
}

function unique(items) {
    const seen = new Set();
    return items.filter(item => {
        const key = String(item || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function addDays(value, amount) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
}

export function vehiclePaperworkFor(crossing, arrangement = 'rental') {
    const normalized = normalizeVehicleArrangement(arrangement);
    const arrangementDocuments = {
        rental: [
            'Rental agreement valid for every country on the journey',
            'Rental-company cross-border authority naming each destination country',
            'Ask the rental company which original or certified vehicle registration copy it supplies',
        ],
        owned: [
            'Original vehicle registration certificate or the accepted certified copy',
            'Proof that the registered owner matches the traveller carrying the vehicle',
        ],
        financed: [
            'Original vehicle registration certificate or the accepted certified copy',
            'Written cross-border authorisation from the finance house',
        ],
        borrowed: [
            'Original vehicle registration certificate or the accepted certified copy',
            'Signed owner authorisation and a certified copy of the owner’s identity document',
        ],
    };
    return {
        arrangement: normalized,
        arrangementLabel: VEHICLE_ARRANGEMENTS[normalized],
        items: unique([
            ...(arrangementDocuments[normalized] || []),
            'Third-party insurance, temporary-import and road permits required by the arrival country',
            ...(crossing?.documents || []),
            crossing?.fees || 'Confirm current border, road and vehicle fees',
        ]),
        sourceUrl: crossing?.sourceUrl || '',
        lastVerified: crossing?.lastVerified || '',
        status: 'check',
        note: 'Requirements can depend on registration country, ownership and rental-company policy. Confirm originals, certified copies and fees before collection or departure.',
    };
}

function crossingDay(journey, crossingIndex) {
    let elapsed = 0;
    for (let index = 0; index <= crossingIndex; index += 1) {
        elapsed += Number(journey.segments?.[index]?.days) || 0;
        if (index < crossingIndex) elapsed += Number(journey.stopovers?.[index]?.transferDays) || 1;
    }
    return elapsed + 1;
}

function accommodationCheck(stopover) {
    const options = stopover?.corridorStays || [];
    const required = (Number(stopover?.stopoverNights) || 0) > 0;
    if (required && !options.length) {
        return {
            status: 'blocker',
            count: 0,
            label: 'No researched corridor stay yet',
            note: 'Choose and verify a safe overnight before treating this transfer as feasible.',
        };
    }
    if (options.length) {
        return {
            status: 'check',
            count: options.length,
            label: `${options.length} researched corridor option${options.length === 1 ? '' : 's'}`,
            note: 'Location research is complete; price, access and availability still need direct confirmation.',
        };
    }
    return {
        status: 'ready',
        count: 0,
        label: 'No planned overnight required',
        note: 'Keep a fallback stay in mind if queues, road conditions or daylight change the plan.',
    };
}

export function assessJourneyFeasibility(journey) {
    const checks = (journey?.crossings || []).map((crossing, index) => {
        const transfer = journey.transfers?.[index] || {};
        const stopover = journey.stopovers?.[index] || {};
        const schedule = parsePublishedHours(crossing.hours);
        const dayNumber = crossingDay(journey, index);
        const accommodation = accommodationCheck(stopover);
        const paperwork = vehiclePaperworkFor(crossing, journey.preferences?.vehicleArrangement);
        const timingStatus = transfer.arrival?.status === 'closed'
            ? 'blocker'
            : transfer.arrival?.status === 'open' && transfer.status === 'estimated' ? 'ready' : 'check';
        const hoursStatus = schedule.status === 'known' ? 'ready' : 'check';
        const statuses = [timingStatus, hoursStatus, accommodation.status];
        const status = statuses.includes('blocker') ? 'blocker' : statuses.includes('check') ? 'check' : 'ready';
        return {
            crossingIndex: index,
            borderId: crossing.id,
            borderName: crossing.name,
            route: crossing.route,
            dayNumber,
            date: addDays(journey.preferences?.startDate, dayNumber - 1),
            status,
            hours: {
                status: hoursStatus,
                exact: schedule.status === 'known',
                label: crossing.hours || 'Confirm current hours',
                sourceUrl: crossing.sourceUrl || '',
                lastVerified: crossing.lastVerified || '',
            },
            timing: {
                status: timingStatus,
                departureTime: transfer.departureTime || '',
                borderArrivalTime: transfer.arrival?.arrivalTime || '',
                clearanceTime: transfer.arrival?.clearanceTime || '',
                destinationArrivalTime: transfer.destinationArrivalTime || '',
                latestDepartureTime: transfer.arrival?.latestDepartureTime || '',
                planningMinutes: transfer.totalPlanningMinutes,
            },
            paperwork,
            accommodation,
        };
    });

    const exactHoursCount = checks.filter(check => check.hours.exact).length;
    const safeTimingCount = checks.filter(check => check.timing.status === 'ready').length;
    const corridorCoveredCount = checks.filter(check => check.accommodation.status !== 'blocker').length;
    const blockerCount = checks.filter(check => check.status === 'blocker').length;
    const checkCount = checks.filter(check => check.status === 'check').length;
    const status = blockerCount ? 'blocker' : checkCount ? 'check' : 'ready';
    return {
        status,
        checks,
        crossingCount: checks.length,
        exactHoursCount,
        safeTimingCount,
        paperworkCount: checks.length,
        corridorCoveredCount,
        blockerCount,
        checkCount,
        title: status === 'ready' ? 'Feasible on reviewed planning data'
            : status === 'blocker' ? 'Revise before treating this journey as feasible'
                : 'Workable after the highlighted confirmations',
        summary: status === 'ready'
            ? 'Every transfer fits its published window with a clearance allowance and has a usable corridor plan.'
            : status === 'blocker'
                ? `${blockerCount} transfer${blockerCount === 1 ? '' : 's'} currently fail a timing or overnight requirement.`
                : `${checkCount} transfer${checkCount === 1 ? ' needs' : 's need'} current hours, road, paperwork or accommodation confirmation.`,
    };
}
