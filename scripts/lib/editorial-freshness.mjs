const DAY_MS = 24 * 60 * 60 * 1000;

export const FRESHNESS_POLICIES = Object.freeze({
    visa: Object.freeze({ label: 'Visa & entry', cadenceDays: 90, risk: 'critical' }),
    border: Object.freeze({ label: 'Border operations', cadenceDays: 90, risk: 'high' }),
    'park-fee': Object.freeze({ label: 'Park fees & gates', cadenceDays: 90, risk: 'high' }),
    emergency: Object.freeze({ label: 'Emergency contacts', cadenceDays: 90, risk: 'critical' }),
    'travel-advisory': Object.freeze({ label: 'Travel advisories', cadenceDays: 30, risk: 'critical' }),
});

function isoDate(date) {
    return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
    return new Date(date.getTime() + (days * DAY_MS));
}

function lastDayOfMonth(year, month) {
    return new Date(Date.UTC(year, month, 0));
}

export function parseReviewedDate(value) {
    if (typeof value !== 'string') return null;
    const month = value.match(/^(\d{4})-(\d{2})$/);
    if (month) {
        const year = Number(month[1]);
        const monthNumber = Number(month[2]);
        if (monthNumber < 1 || monthNumber > 12) return null;
        return lastDayOfMonth(year, monthNumber);
    }

    const day = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!day) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || isoDate(date) !== value ? null : date;
}

function validSourceUrl(value) {
    if (typeof value !== 'string') return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function classifyFreshness(reviewedValue, cadenceDays, asOfValue, dueSoonDays = 30) {
    const reviewed = parseReviewedDate(reviewedValue);
    const asOf = parseReviewedDate(asOfValue);
    if (!reviewed || !asOf || !Number.isInteger(cadenceDays) || cadenceDays < 1) {
        return {
            status: 'unknown',
            reviewedOn: reviewed ? isoDate(reviewed) : null,
            dueOn: null,
            daysUntilDue: null,
        };
    }

    const due = addUtcDays(reviewed, cadenceDays);
    const daysUntilDue = Math.ceil((due.getTime() - asOf.getTime()) / DAY_MS);
    const status = daysUntilDue < 0
        ? 'overdue'
        : daysUntilDue <= dueSoonDays ? 'due-soon' : 'current';

    return {
        status,
        reviewedOn: isoDate(reviewed),
        dueOn: isoDate(due),
        daysUntilDue,
    };
}

function countryName(countries, id, fallback = '') {
    return countries[id]?.name || fallback || id || 'Regional';
}

function immigrationSource(resources, countryId) {
    return resources[countryId]?.links?.find(link => link.id === 'immigration')?.url || '';
}

function makeRecord({ id, category, subject, country, sourceFile, sourceUrls, reviewed, detail = '', review = null }, asOf, dueSoonDays) {
    const policy = FRESHNESS_POLICIES[category];
    if (!policy) throw new Error(`Missing freshness policy for ${category}`);
    const evidenceUrls = review?.sourceUrls || [];
    const urls = [...new Set([...(sourceUrls || []), ...evidenceUrls].filter(Boolean))];
    const freshness = classifyFreshness(reviewed, policy.cadenceDays, asOf, dueSoonDays);
    const evidenceComplete = Boolean(
        review?.reviewer
        && review?.reviewedAt
        && parseReviewedDate(review.reviewedAt)
        && review?.outcome
        && review?.evidence
        && evidenceUrls.length
        && evidenceUrls.every(validSourceUrl),
    );
    return {
        id,
        category,
        categoryLabel: policy.label,
        subject,
        country,
        risk: policy.risk,
        cadenceDays: policy.cadenceDays,
        sourceFile,
        sourceUrls: urls,
        hasPrimarySource: urls.length > 0 && urls.every(validSourceUrl),
        review: review ? {
            reviewer: review.reviewer,
            reviewedAt: review.reviewedAt,
            method: review.reviewMethod,
            outcome: review.outcome,
            evidence: review.evidence,
            sourceUrls: evidenceUrls,
        } : null,
        evidenceComplete,
        detail,
        ...freshness,
    };
}

const STATUS_ORDER = Object.freeze({ unknown: 0, overdue: 1, 'due-soon': 2, current: 3 });
const RISK_ORDER = Object.freeze({ critical: 0, high: 1 });

function queueSort(left, right) {
    return STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
        || RISK_ORDER[left.risk] - RISK_ORDER[right.risk]
        || (left.daysUntilDue ?? -Infinity) - (right.daysUntilDue ?? -Infinity)
        || left.categoryLabel.localeCompare(right.categoryLabel)
        || left.country.localeCompare(right.country)
        || left.subject.localeCompare(right.subject);
}

export function buildFreshnessReport(data, { asOf = isoDate(new Date()), dueSoonDays = 30 } = {}) {
    if (!parseReviewedDate(asOf) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
        throw new Error(`Invalid --as-of date: ${asOf}. Use YYYY-MM-DD.`);
    }

    const {
        countries = {}, practical = {}, visaPassport = {}, countryResources = {},
        borders = [], parks = [], travelAdvisories = {}, editorialEvidence = {},
    } = data;
    const records = [];
    const reviewDefaults = {
        reviewer: editorialEvidence.meta?.reviewer,
        reviewedAt: editorialEvidence.meta?.reviewedAt,
        reviewMethod: editorialEvidence.meta?.reviewMethod,
    };
    const reviews = new Map((editorialEvidence.reviews || []).map(review => [
        review.recordId,
        { ...reviewDefaults, ...review },
    ]));
    const reviewFor = id => reviews.get(id) || null;

    for (const item of practical.visaHealth || []) {
        const id = `visa-summary:${item.id}`;
        records.push(makeRecord({
            id,
            category: 'visa',
            subject: 'Visa entry summary',
            country: countryName(countries, item.id, item.name),
            sourceFile: 'data/practical.json',
            sourceUrls: [item.sourceUrl],
            reviewed: item.visaLastVerified || item.lastVerified,
            detail: item.visa?.label || '',
            review: reviewFor(id),
        }, asOf, dueSoonDays));
    }

    for (const countryId of Object.keys(visaPassport.rules || {})) {
        const id = `visa-matrix:${countryId}`;
        records.push(makeRecord({
            id,
            category: 'visa',
            subject: 'Passport-specific visa matrix',
            country: countryName(countries, countryId),
            sourceFile: 'data/visa-passport.json',
            sourceUrls: [immigrationSource(countryResources, countryId)],
            reviewed: visaPassport.meta?.countryLastVerified?.[countryId]
                || visaPassport.meta?.lastVerified,
            detail: `${Object.keys(visaPassport.rules[countryId] || {}).length} passport profiles`,
            review: reviewFor(id),
        }, asOf, dueSoonDays));
    }

    for (const item of borders) {
        const id = `border:${item.id}`;
        records.push(makeRecord({
            id,
            category: 'border',
            subject: item.name,
            country: (item.countries || []).map(id => countryName(countries, id)).join(' / '),
            sourceFile: 'data/borders.json',
            sourceUrls: [item.sourceUrl],
            reviewed: item.lastVerified,
            detail: `${item.hours || 'Hours unknown'} · ${item.fees || 'Fees unknown'}`,
            review: reviewFor(id),
        }, asOf, dueSoonDays));
    }

    for (const item of parks) {
        const id = `park-fee:${item.id}`;
        records.push(makeRecord({
            id,
            category: 'park-fee',
            subject: item.name,
            country: countryName(countries, item.country),
            sourceFile: 'data/parks.json',
            sourceUrls: [item.sourceUrl, item.bookingUrl],
            reviewed: item.lastVerified,
            detail: item.feeTable?.period ? `${item.fees} · tariff ${item.feeTable.period}` : item.fees,
            review: reviewFor(id),
        }, asOf, dueSoonDays));
    }

    for (const item of practical.emergencies || []) {
        const id = `emergency:${item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        records.push(makeRecord({
            id,
            category: 'emergency',
            subject: 'Emergency contact numbers',
            country: item.country,
            sourceFile: 'data/practical.json',
            sourceUrls: item.sourceUrls || [item.sourceUrl],
            reviewed: item.lastVerified,
            detail: item.numbers,
            review: reviewFor(id),
        }, asOf, dueSoonDays));
    }

    for (const item of travelAdvisories.countries || []) {
        const id = `travel-advisory:${item.id}`;
        records.push(makeRecord({
            id,
            category: 'travel-advisory',
            subject: 'Official travel-advisory links',
            country: countryName(countries, item.id, item.name),
            sourceFile: 'data/travel-advisories.json',
            sourceUrls: (item.links || []).map(link => link.url),
            reviewed: travelAdvisories.meta?.lastUpdated,
            detail: `${item.links?.length || 0} government advisory links`,
            review: reviewFor(id),
        }, asOf, dueSoonDays));
    }

    records.sort(queueSort);

    const statusCounts = Object.fromEntries(['overdue', 'due-soon', 'current', 'unknown']
        .map(status => [status, records.filter(record => record.status === status).length]));
    const categoryCounts = Object.fromEntries(Object.keys(FRESHNESS_POLICIES).map(category => [category, {
        label: FRESHNESS_POLICIES[category].label,
        total: records.filter(record => record.category === category).length,
        overdue: records.filter(record => record.category === category && record.status === 'overdue').length,
        dueSoon: records.filter(record => record.category === category && record.status === 'due-soon').length,
    }]));

    return {
        generatedAt: new Date().toISOString(),
        asOf,
        dueSoonDays,
        policies: FRESHNESS_POLICIES,
        summary: {
            total: records.length,
            overdue: statusCounts.overdue,
            dueSoon: statusCounts['due-soon'],
            current: statusCounts.current,
            unknown: statusCounts.unknown,
            criticalOverdue: records.filter(record => record.risk === 'critical' && record.status === 'overdue').length,
            sourceLinked: records.filter(record => record.hasPrimarySource).length,
            missingSource: records.filter(record => !record.hasPrimarySource).length,
            evidenceComplete: records.filter(record => record.evidenceComplete).length,
            missingEvidence: records.filter(record => !record.evidenceComplete).length,
            categories: categoryCounts,
        },
        records,
    };
}
