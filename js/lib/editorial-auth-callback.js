const EDITORIAL_AUTH_TYPES = new Set(['invite', 'magiclink', 'recovery']);

function callbackPayload({ pathname = '', hash = '' } = {}) {
    const hashPayload = String(hash).replace(/^#/, '');
    if (hashPayload.includes('access_token=')) return hashPayload;

    const pathPayload = String(pathname).replace(/^\/+/, '');
    if (pathPayload.startsWith('access_token=')) return pathPayload;

    return '';
}

export function getEditorialAuthRedirect(locationLike = {}) {
    if (String(locationLike.pathname || '').replace(/\/$/, '') === '/editorial') return null;

    const payload = callbackPayload(locationLike);
    if (!payload) return null;

    const params = new URLSearchParams(payload);
    if (!params.get('access_token') || !params.get('refresh_token')) return null;
    if (!EDITORIAL_AUTH_TYPES.has(params.get('type'))) return null;

    return `/editorial#${params.toString()}`;
}
