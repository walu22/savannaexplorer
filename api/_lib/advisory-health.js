import {
    classifyFreshness,
    FRESHNESS_POLICIES,
} from '../../scripts/lib/editorial-freshness.mjs';

const GUARDED_STATUS_CODES = new Set([401, 403, 429]);
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 4;
const DUE_SOON_DAYS = 7;

function isHttpsUrl(value) {
    if (typeof value !== 'string') return false;
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}

function header(response, name) {
    return response?.headers?.get?.(name) || null;
}

function todayUtc(now) {
    const date = now instanceof Date ? now : new Date(now);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid advisory health check date');
    return date.toISOString().slice(0, 10);
}

export function advisorySources(advisoryData) {
    return (advisoryData?.countries || []).flatMap(country => (
        (country.links || []).map(link => ({
            countryId: country.id,
            country: country.name,
            reviewedOn: country.lastVerified,
            label: link.label,
            url: link.url,
            validUrl: isHttpsUrl(link.url),
        }))
    ));
}

export async function checkAdvisorySource(source, {
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
    const startedAt = Date.now();
    if (!source.validUrl) {
        return {
            ...source,
            result: 'failed',
            httpStatus: null,
            finalUrl: null,
            durationMs: 0,
            errorType: 'InvalidSourceUrl',
            etag: null,
            lastModified: null,
        };
    }

    try {
        const response = await fetchImpl(source.url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
                'User-Agent': 'SavannaExplorer-EditorialMonitor/1.0 (+https://savannaexplorer.com)',
            },
            signal: AbortSignal.timeout(timeoutMs),
        });
        await response.body?.cancel?.();

        const httpStatus = Number(response.status) || null;
        const result = httpStatus >= 200 && httpStatus < 400
            ? 'healthy'
            : GUARDED_STATUS_CODES.has(httpStatus) ? 'guarded' : 'failed';

        return {
            ...source,
            result,
            httpStatus,
            finalUrl: response.url || source.url,
            durationMs: Date.now() - startedAt,
            errorType: null,
            etag: header(response, 'etag'),
            lastModified: header(response, 'last-modified'),
        };
    } catch (error) {
        return {
            ...source,
            result: 'failed',
            httpStatus: null,
            finalUrl: null,
            durationMs: Date.now() - startedAt,
            errorType: String(error?.name || 'FetchError').slice(0, 80),
            etag: null,
            lastModified: null,
        };
    }
}

async function checkWithConcurrency(sources, options) {
    if (!sources.length) return [];
    const results = new Array(sources.length);
    let cursor = 0;
    const workers = Math.min(options.concurrency, sources.length);

    async function work() {
        while (cursor < sources.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await checkAdvisorySource(sources[index], options);
        }
    }

    await Promise.all(Array.from({ length: workers }, () => work()));
    return results;
}

export async function runAdvisoryHealthCheck(advisoryData, {
    fetchImpl = fetch,
    now = new Date(),
    timeoutMs = DEFAULT_TIMEOUT_MS,
    concurrency = DEFAULT_CONCURRENCY,
} = {}) {
    const asOf = todayUtc(now);
    const sources = advisorySources(advisoryData);
    const safeConcurrency = Math.max(1, Math.min(Number(concurrency) || DEFAULT_CONCURRENCY, 8));
    const results = await checkWithConcurrency(sources, {
        fetchImpl,
        timeoutMs,
        concurrency: safeConcurrency,
    });
    const reviews = (advisoryData?.countries || []).map(country => ({
        countryId: country.id,
        country: country.name,
        ...classifyFreshness(
            country.lastVerified,
            FRESHNESS_POLICIES['travel-advisory'].cadenceDays,
            asOf,
            DUE_SOON_DAYS,
        ),
    }));
    const count = result => results.filter(item => item.result === result).length;
    const overdue = reviews.filter(item => item.status === 'overdue');
    const dueSoon = reviews.filter(item => item.status === 'due-soon');
    const unknown = reviews.filter(item => item.status === 'unknown');
    const failed = count('failed');

    return {
        ok: failed === 0 && overdue.length === 0 && unknown.length === 0,
        checkedAt: new Date(now).toISOString(),
        policy: {
            reviewCadenceDays: FRESHNESS_POLICIES['travel-advisory'].cadenceDays,
            warningDays: DUE_SOON_DAYS,
            guardedStatusCodes: [...GUARDED_STATUS_CODES],
        },
        summary: {
            countries: reviews.length,
            sources: results.length,
            healthy: count('healthy'),
            guarded: count('guarded'),
            failed,
            current: reviews.filter(item => item.status === 'current').length,
            dueSoon: dueSoon.length,
            overdue: overdue.length,
            unknown: unknown.length,
        },
        needsReview: [...overdue, ...unknown, ...dueSoon],
        results,
    };
}
