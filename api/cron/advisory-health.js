import { readFile } from 'node:fs/promises';
import { observeRequest } from '../_lib/observability.js';
import { runAdvisoryHealthCheck } from '../_lib/advisory-health.js';

async function loadAdvisoryData() {
    const file = new URL('../../data/travel-advisories.json', import.meta.url);
    return JSON.parse(await readFile(file, 'utf8'));
}

function requestHeader(req, name) {
    const value = req.headers?.[name] || req.headers?.[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

export function createAdvisoryHealthHandler({
    loadData = loadAdvisoryData,
    runCheck = runAdvisoryHealthCheck,
    secret = () => process.env.CRON_SECRET,
} = {}) {
    return async function advisoryHealthHandler(req, res) {
        const observation = observeRequest(req, res, '/api/cron/advisory-health');
        if (req.method !== 'GET') {
            res.setHeader('Allow', 'GET');
            return res.status(405).json({ ok: false, error: 'Method not allowed' });
        }

        const cronSecret = secret();
        if (!cronSecret || requestHeader(req, 'authorization') !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }

        try {
            const report = await runCheck(await loadData());
            const log = {
                level: report.ok ? 'info' : 'error',
                message: 'advisory_health_checked',
                schedule: requestHeader(req, 'x-vercel-cron-schedule') || 'manual',
                ...report.summary,
                failingSources: report.results
                    .filter(item => item.result === 'failed')
                    .map(item => ({
                        country: item.countryId,
                        label: item.label,
                        httpStatus: item.httpStatus,
                        errorType: item.errorType,
                    })),
                reviewQueue: report.needsReview.map(item => ({
                    country: item.countryId,
                    status: item.status,
                    dueOn: item.dueOn,
                })),
            };
            if (report.ok) console.log(JSON.stringify(log));
            else console.error(JSON.stringify(log));

            if (!report.ok) observation.error({ name: 'AdvisoryHealthFailure' }, 503);
            return res.status(report.ok ? 200 : 503).json(report);
        } catch (error) {
            observation.error(error);
            return res.status(500).json({ ok: false, error: 'Advisory health check failed' });
        }
    };
}

export default createAdvisoryHealthHandler();
