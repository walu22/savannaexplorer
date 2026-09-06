import test from 'node:test';
import assert from 'node:assert/strict';
import { getEditorialAuthRedirect } from '../js/lib/editorial-auth-callback.js';

const callback = 'access_token=header.payload.signature&refresh_token=refresh-value&token_type=bearer&type=invite';

test('editorial invitations landing on the homepage are routed to the workspace', () => {
    assert.equal(
        getEditorialAuthRedirect({ pathname: '/', hash: `#${callback}` }),
        `/editorial#${callback}`,
    );
});

test('malformed callback paths are removed from the server-visible URL', () => {
    assert.equal(
        getEditorialAuthRedirect({ pathname: `/${callback}`, hash: '' }),
        `/editorial#${callback}`,
    );
});

test('an existing editorial callback is not redirected again', () => {
    assert.equal(
        getEditorialAuthRedirect({ pathname: '/editorial', hash: `#${callback}` }),
        null,
    );
});

test('ordinary pages and incomplete or unrelated tokens are ignored', () => {
    assert.equal(getEditorialAuthRedirect({ pathname: '/', hash: '' }), null);
    assert.equal(getEditorialAuthRedirect({ pathname: '/', hash: '#access_token=token&type=invite' }), null);
    assert.equal(
        getEditorialAuthRedirect({
            pathname: '/',
            hash: '#access_token=token&refresh_token=refresh&type=signup',
        }),
        null,
    );
});
