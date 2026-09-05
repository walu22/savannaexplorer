function requestId(req) {
    const value = req.headers?.['x-vercel-id'] || req.headers?.['x-request-id'] || 'local';
    return String(Array.isArray(value) ? value[0] : value).slice(0, 120);
}

function write(level, payload) {
    const line = JSON.stringify({ level, ...payload });
    if (level === 'error') console.error(line);
    else console.log(line);
}

export function observeRequest(req, res, route) {
    const startedAt = Date.now();
    const id = requestId(req);
    write('info', { message: 'request_started', route, method: req.method, request_id: id });
    res.once?.('finish', () => {
        write('info', {
            message: 'request_completed',
            route,
            method: req.method,
            status: res.statusCode,
            duration_ms: Date.now() - startedAt,
            request_id: id,
        });
    });
    return {
        error(error, status = 500) {
            write('error', {
                message: 'request_failed',
                route,
                method: req.method,
                status,
                duration_ms: Date.now() - startedAt,
                request_id: id,
                error_type: String(error?.name || 'Error').slice(0, 80),
            });
        },
    };
}
