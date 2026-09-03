import {
    TRIP_CHANGE_EVENT,
    createTrip,
    deleteTrip,
    duplicateTrip,
    getActiveTrip,
    readTripState,
    setActiveTrip,
    updateTrip,
} from '../lib/trip-store.js';
import {
    acceptCollaborationInvite,
    createCollaborationInvite,
    disableTripShare,
    enableTripShare,
    getCollaborationActivity,
    getCollaborationManagement,
    getCurrentSession,
    getTripShareStatus,
    listMyCollaborations,
    loadCollaboration,
    loadSharedTrip,
    onAuthChange,
    removeCollaborator,
    revokeCollaborationInvite,
    saveCollaboration,
    sendSignInLink,
    signOut,
    startAutomaticTripSync,
    syncTrips,
} from '../lib/trip-cloud.js';

const COUNTRIES = ['Botswana', 'Eswatini', 'Lesotho', 'Malawi', 'Mozambique', 'Namibia', 'South Africa', 'Zambia', 'Zimbabwe'];
let collaborationPoll = null;
let openCollaborativeTrip = null;

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function formatDates(trip) {
    if (!trip.startDate && !trip.endDate) return 'Dates not set';
    const display = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open';
    return `${display(trip.startDate)} – ${display(trip.endDate)}`;
}

function renderCountryChoices() {
    const root = document.getElementById('my-safari-country-options');
    if (!root) return;
    root.innerHTML = COUNTRIES.map(country => `
        <label class="my-safari-country"><input type="checkbox" name="trip-country" value="${escapeHtml(country)}"> <span>${escapeHtml(country)}</span></label>
    `).join('');
}

function renderDashboard() {
    const state = readTripState();
    const active = getActiveTrip();
    const list = document.getElementById('my-safari-trip-list');
    const workspace = document.getElementById('my-safari-workspace');
    const empty = document.getElementById('my-safari-empty');
    if (!list || !workspace || !empty) return;

    list.innerHTML = state.trips.map(trip => `
        <button type="button" class="my-safari-trip-card${trip.id === state.activeTripId ? ' is-active' : ''}" data-trip-select="${escapeHtml(trip.id)}" aria-pressed="${trip.id === state.activeTripId}">
            <strong>${escapeHtml(trip.name)}</strong>
            <span>${escapeHtml(formatDates(trip))}</span>
            <small>${trip.countries.length ? escapeHtml(trip.countries.join(' · ')) : 'Countries not selected'}</small>
        </button>
    `).join('');

    empty.hidden = Boolean(active);
    workspace.hidden = !active;
    if (!active) return;

    document.getElementById('my-safari-active-name').textContent = active.name;
    document.getElementById('my-safari-active-meta').textContent = `${formatDates(active)} · ${active.countries.length ? active.countries.join(', ') : 'Add destinations when editing this trip'}`;
    document.getElementById('my-safari-notes').value = active.notes;
    document.getElementById('my-safari-itinerary-count').textContent = active.aiItinerary ? '1 saved' : 'None yet';
    document.getElementById('my-safari-expense-count').textContent = `${active.expenses.items.length} item${active.expenses.items.length === 1 ? '' : 's'}`;
    document.getElementById('my-safari-packing-count').textContent = `${active.packing.packedItems.length} packed`;
}

function setCloudStatus(message = '', error = false) {
    const status = document.getElementById('my-safari-cloud-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', error);
}

function friendlyCloudError(error) {
    const message = String(error?.message || error || 'Cloud sync failed.');
    if (/user_trips|schema cache|relation .* does not exist/i.test(message)) {
        return 'Cloud storage is being set up. Your trips are still safe on this device.';
    }
    if (/fetch|network|offline/i.test(message)) return 'You appear to be offline. Local trip changes are still saved.';
    return message;
}

function invitationUrl(token) {
    return `${window.location.origin}${window.location.pathname}?invite=${token}#hub-my-safari`;
}

function activityLabel(item) {
    const actions = {
        collaborator_joined: 'joined the trip',
        collaborator_removed: 'removed a collaborator',
        invite_created: 'created a collaboration invitation',
        invite_revoked: 'revoked a collaboration invitation',
        trip_updated: 'updated the shared trip',
    };
    return `${item.actor_email || 'A collaborator'} ${actions[item.action] || item.action.replaceAll('_', ' ')}`;
}

function renderActivity(targetId, activity = []) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.replaceChildren();
    if (!activity.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No collaboration activity yet.';
        target.append(empty);
        return;
    }
    activity.forEach(item => {
        const row = document.createElement('div');
        row.className = 'my-safari-activity-item';
        const label = document.createElement('strong');
        label.textContent = activityLabel(item);
        const date = document.createElement('span');
        date.textContent = new Date(item.created_at).toLocaleString();
        row.append(label, date);
        target.append(row);
    });
}

async function refreshCollaborationManagement() {
    const active = getActiveTrip();
    const panel = document.getElementById('my-safari-collaboration-panel');
    if (!active || !panel || panel.hidden) return;
    try {
        const management = await getCollaborationManagement(active.id);
        const people = document.getElementById('my-safari-collaborators');
        people.replaceChildren();
        if (!management.collaborators.length) people.append(Object.assign(document.createElement('p'), { textContent: 'No collaborators yet.' }));
        management.collaborators.forEach(person => {
            const row = document.createElement('div');
            row.className = 'my-safari-access-item';
            const identity = document.createElement('strong');
            identity.textContent = person.email;
            const role = document.createElement('span');
            role.textContent = person.role === 'editor' ? 'Can edit' : 'View only';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.dataset.removeCollaborator = person.user_id;
            remove.textContent = 'Remove';
            row.append(identity, remove, role);
            people.append(row);
        });

        const invites = document.getElementById('my-safari-invites');
        invites.replaceChildren();
        if (!management.invites.length) invites.append(Object.assign(document.createElement('p'), { textContent: 'No open invitations.' }));
        management.invites.forEach(invite => {
            const row = document.createElement('div');
            row.className = 'my-safari-access-item';
            const role = document.createElement('strong');
            role.textContent = invite.invite_role === 'editor' ? 'Editor invitation' : 'Viewer invitation';
            const revoke = document.createElement('button');
            revoke.type = 'button';
            revoke.dataset.revokeInvite = invite.invite_id;
            revoke.textContent = 'Revoke';
            const expiry = document.createElement('span');
            expiry.textContent = invite.claimed ? 'Accepted' : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`;
            const copy = document.createElement('button');
            copy.type = 'button';
            copy.dataset.copyInvite = invite.invite_token;
            copy.textContent = 'Copy';
            row.append(role, revoke, expiry, copy);
            invites.append(row);
        });
        renderActivity('my-safari-activity', management.activity);
    } catch (error) {
        setCloudStatus(friendlyCloudError(error), true);
    }
}

async function refreshMyCollaborations() {
    const box = document.getElementById('my-safari-shared-with-me');
    const list = document.getElementById('my-safari-collaboration-list');
    if (!box || !list) return;
    try {
        const collaborations = await listMyCollaborations();
        list.replaceChildren();
        collaborations.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'my-safari-collaboration-chip';
            button.dataset.openCollaboration = item.trip_id;
            const name = document.createElement('strong');
            name.textContent = item.data?.name || 'Shared safari';
            const role = document.createElement('small');
            role.textContent = ` · ${item.access_role === 'editor' ? 'Can edit' : 'View only'}`;
            button.append(name, role);
            list.append(button);
        });
        box.hidden = collaborations.length === 0;
    } catch {
        box.hidden = true;
    }
}

function enterCollaborationLayout() {
    ['my-safari-create-form', 'my-safari-trip-list', 'my-safari-empty', 'my-safari-workspace', 'my-safari-shared-view', 'my-safari-shared-with-me']
        .forEach(id => document.getElementById(id)?.setAttribute('hidden', ''));
    document.getElementById('my-safari-collaboration-view').hidden = false;
}

function renderCollaboration(record) {
    const trip = record?.data || {};
    openCollaborativeTrip = record;
    const canEdit = record?.access_role === 'editor' || record?.access_role === 'owner';
    document.getElementById('collaboration-safari-name').textContent = trip.name || 'Collaborative safari';
    document.getElementById('collaboration-safari-role').textContent = canEdit ? 'Editor' : 'Viewer';
    document.getElementById('collaboration-safari-meta').textContent = `${formatDates(trip)} · ${trip.countries?.length ? trip.countries.join(', ') : 'Destinations not listed'}`;
    const expenseCount = trip.expenses?.items?.length || 0;
    document.getElementById('collaboration-safari-expenses').textContent = `${expenseCount} item${expenseCount === 1 ? '' : 's'}`;
    document.getElementById('collaboration-safari-packing').textContent = `${trip.packing?.packedItems?.length || 0} packed`;
    document.getElementById('collaboration-safari-updated').textContent = new Date(record.updated_at || trip.updatedAt || Date.now()).toLocaleString();
    const notes = document.getElementById('collaboration-safari-notes');
    notes.value = trip.notes || '';
    notes.disabled = !canEdit;
    document.getElementById('collaboration-safari-save').hidden = !canEdit;
}

async function refreshOpenCollaboration(showStatus = false) {
    if (!openCollaborativeTrip?.trip_id) return;
    const record = await loadCollaboration(openCollaborativeTrip.trip_id);
    if (!record) throw new Error('You no longer have access to this safari.');
    renderCollaboration(record);
    renderActivity('collaboration-safari-activity', await getCollaborationActivity(record.data.id));
    if (showStatus) document.getElementById('collaboration-safari-status').textContent = 'Shared trip refreshed.';
}

async function openCollaboration(recordOrId) {
    enterCollaborationLayout();
    const status = document.getElementById('collaboration-safari-status');
    status.classList.remove('is-error');
    status.textContent = 'Opening shared trip…';
    try {
        const record = typeof recordOrId === 'string' ? await loadCollaboration(recordOrId) : recordOrId;
        if (!record) throw new Error('This collaborative trip is unavailable.');
        renderCollaboration(record);
        renderActivity('collaboration-safari-activity', await getCollaborationActivity(record.data.id));
        status.textContent = 'Changes are shared with everyone who has access.';
        clearInterval(collaborationPoll);
        collaborationPoll = window.setInterval(() => refreshOpenCollaboration(false).catch(() => {}), 12000);
    } catch (error) {
        document.getElementById('collaboration-safari-name').textContent = 'Collaborative safari unavailable';
        status.textContent = friendlyCloudError(error);
        status.classList.add('is-error');
    }
}

function renderAccount(session) {
    const signedOut = document.getElementById('my-safari-signed-out');
    const signedIn = document.getElementById('my-safari-signed-in');
    if (signedOut) signedOut.hidden = Boolean(session);
    if (signedIn) signedIn.hidden = !session;
    const email = document.getElementById('my-safari-account-email');
    if (email) email.textContent = session?.user?.email || '';
    const shareButton = document.getElementById('my-safari-share');
    if (shareButton) shareButton.hidden = !session;
    const collaborateButton = document.getElementById('my-safari-collaborate');
    if (collaborateButton) collaborateButton.hidden = !session;
    if (!session) {
        document.getElementById('my-safari-share-panel')?.setAttribute('hidden', '');
        document.getElementById('my-safari-collaboration-panel')?.setAttribute('hidden', '');
        document.getElementById('my-safari-shared-with-me')?.setAttribute('hidden', '');
    }
}

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
}

function renderSharedTrip(trip) {
    const view = document.getElementById('my-safari-shared-view');
    if (!view) return;
    view.hidden = false;
    document.getElementById('shared-safari-name').textContent = trip.name || 'Shared safari';
    document.getElementById('shared-safari-meta').textContent = `${formatDates(trip)} · ${trip.countries?.length ? trip.countries.join(', ') : 'Destinations not listed'}`;
    const expenses = Array.isArray(trip.expenses?.items) ? trip.expenses.items.length : 0;
    const packed = Array.isArray(trip.packing?.packedItems) ? trip.packing.packedItems.length : 0;
    document.getElementById('shared-safari-expenses').textContent = `${expenses} item${expenses === 1 ? '' : 's'}`;
    document.getElementById('shared-safari-packing').textContent = `${packed} packed`;
    document.getElementById('shared-safari-updated').textContent = trip.updatedAt
        ? new Date(trip.updatedAt).toLocaleDateString()
        : 'Not provided';

    const notesSection = document.getElementById('shared-safari-notes-section');
    notesSection.hidden = !trip.notes;
    document.getElementById('shared-safari-notes').textContent = trip.notes || '';

    const latestPlan = Array.isArray(trip.aiItinerary?.history)
        ? [...trip.aiItinerary.history].reverse().find(item => item?.role === 'assistant')?.content
        : '';
    const itinerarySection = document.getElementById('shared-safari-itinerary-section');
    itinerarySection.hidden = !latestPlan;
    document.getElementById('shared-safari-itinerary').textContent = latestPlan || '';
}

async function openSharedTrip(token) {
    ['my-safari-cloud', 'my-safari-create-form', 'my-safari-trip-list', 'my-safari-empty', 'my-safari-workspace']
        .forEach(id => document.getElementById(id)?.setAttribute('hidden', ''));
    const view = document.getElementById('my-safari-shared-view');
    view.hidden = false;
    document.getElementById('shared-safari-name').textContent = 'Opening shared safari…';
    try {
        const trip = await loadSharedTrip(token);
        if (!trip) throw new Error('This share link is unavailable or has been turned off.');
        renderSharedTrip(trip);
    } catch (error) {
        document.getElementById('shared-safari-name').textContent = 'Shared safari unavailable';
        document.getElementById('shared-safari-meta').textContent = friendlyCloudError(error);
    }
}

async function refreshSharePanel() {
    const panel = document.getElementById('my-safari-share-panel');
    const input = document.getElementById('my-safari-share-url');
    const active = getActiveTrip();
    if (!panel || !input || !active || !await getCurrentSession()) {
        if (panel) panel.hidden = true;
        return;
    }
    try {
        const url = await getTripShareStatus(active.id);
        panel.hidden = !url;
        input.value = url || '';
    } catch {
        panel.hidden = true;
    }
}

async function syncAndReport(successMessage = 'Trips are up to date.') {
    setCloudStatus('Syncing trips…');
    try {
        const result = await syncTrips();
        setCloudStatus(`${successMessage} ${result?.count ?? 0} trip${result?.count === 1 ? '' : 's'} in the cloud.`);
        await refreshSharePanel();
    } catch (error) {
        setCloudStatus(friendlyCloudError(error), true);
    }
}

export async function initMySafari() {
    const root = document.getElementById('hub-my-safari');
    if (!root) return;
    renderCountryChoices();
    renderDashboard();

    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    const inviteToken = params.get('invite');
    const collaborationId = params.get('collaboration');
    if (shareToken) {
        await openSharedTrip(shareToken);
        return;
    }

    let session = await getCurrentSession();
    renderAccount(session);
    if (inviteToken || collaborationId) {
        enterCollaborationLayout();
        document.getElementById('collaboration-safari-name').textContent = session
            ? 'Opening collaborative safari…'
            : 'Sign in to join this safari';
        document.getElementById('collaboration-safari-status').textContent = session
            ? 'Checking your access…'
            : 'Use the email sign-in form above. This invitation will remain open.';
        if (session) {
            try {
                const record = inviteToken
                    ? await acceptCollaborationInvite(inviteToken)
                    : await loadCollaboration(collaborationId);
                if (inviteToken && record?.trip_id) {
                    history.replaceState(null, '', `${window.location.pathname}?collaboration=${record.trip_id}#hub-my-safari`);
                }
                await openCollaboration(record);
            } catch (error) {
                document.getElementById('collaboration-safari-name').textContent = 'Could not join this safari';
                document.getElementById('collaboration-safari-status').textContent = friendlyCloudError(error);
                document.getElementById('collaboration-safari-status').classList.add('is-error');
            }
        }
    } else if (session) {
        await syncAndReport('Signed in and synced.');
        await refreshMyCollaborations();
    }

    onAuthChange(nextSession => {
        const wasSignedIn = Boolean(session);
        session = nextSession;
        renderAccount(session);
        if (session && !wasSignedIn) {
            window.setTimeout(async () => {
                if (inviteToken) {
                    try {
                        const record = await acceptCollaborationInvite(inviteToken);
                        if (record?.trip_id) history.replaceState(null, '', `${window.location.pathname}?collaboration=${record.trip_id}#hub-my-safari`);
                        await openCollaboration(record);
                    } catch (error) {
                        document.getElementById('collaboration-safari-status').textContent = friendlyCloudError(error);
                    }
                } else if (collaborationId) {
                    await openCollaboration(collaborationId);
                } else {
                    await syncAndReport('Signed in and synced.');
                    await refreshMyCollaborations();
                }
            }, 0);
        }
        if (!session) setCloudStatus('Signed out. Trips remain available on this device.');
    });
    if (!inviteToken && !collaborationId) {
        startAutomaticTripSync(error => setCloudStatus(friendlyCloudError(error), true));
    }

    document.getElementById('my-safari-signin-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const email = new FormData(event.currentTarget).get('email')?.toString().trim();
        if (!email) return;
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        setCloudStatus('Sending your secure sign-in link…');
        try {
            await sendSignInLink(email);
            setCloudStatus(`Sign-in link sent to ${email}. You can keep planning while you check your inbox.`);
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById('my-safari-sync')?.addEventListener('click', () => syncAndReport());
    document.getElementById('my-safari-signout')?.addEventListener('click', async () => {
        try {
            await signOut();
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    document.getElementById('my-safari-collaboration-list')?.addEventListener('click', event => {
        const button = event.target.closest('[data-open-collaboration]');
        if (button) window.location.assign(`${window.location.pathname}?collaboration=${button.dataset.openCollaboration}#hub-my-safari`);
    });

    document.getElementById('my-safari-create-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = String(form.get('trip-name') || '').trim();
        if (!name) return;
        createTrip({
            name,
            startDate: String(form.get('trip-start') || ''),
            endDate: String(form.get('trip-end') || ''),
            countries: form.getAll('trip-country').map(String),
        });
        event.currentTarget.reset();
    });

    document.getElementById('my-safari-trip-list')?.addEventListener('click', event => {
        const button = event.target.closest('[data-trip-select]');
        if (button) {
            setActiveTrip(button.dataset.tripSelect);
            refreshSharePanel();
            refreshCollaborationManagement();
        }
    });

    document.getElementById('my-safari-rename')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (!active) return;
        const name = prompt('Rename this trip', active.name)?.trim();
        if (name) updateTrip(active.id, { name: name.slice(0, 80) });
    });

    document.getElementById('my-safari-duplicate')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (active) duplicateTrip(active.id);
    });

    document.getElementById('my-safari-delete')?.addEventListener('click', () => {
        const active = getActiveTrip();
        if (!active || !confirm(`Delete “${active.name}” from this device?`)) return;
        deleteTrip(active.id);
    });

    document.getElementById('my-safari-notes')?.addEventListener('change', event => {
        const active = getActiveTrip();
        if (active) updateTrip(active.id, { notes: event.target.value.trim() });
    });

    document.getElementById('my-safari-share')?.addEventListener('click', async () => {
        const active = getActiveTrip();
        if (!active) return;
        setCloudStatus('Creating a read-only share link…');
        try {
            const url = await enableTripShare(active.id);
            document.getElementById('my-safari-share-url').value = url;
            document.getElementById('my-safari-share-panel').hidden = false;
            await copyText(url);
            setCloudStatus('Share link created and copied.');
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    document.getElementById('my-safari-copy-share')?.addEventListener('click', async () => {
        const url = document.getElementById('my-safari-share-url')?.value;
        if (!url) return;
        await copyText(url);
        setCloudStatus('Share link copied.');
    });

    document.getElementById('my-safari-stop-share')?.addEventListener('click', async () => {
        const active = getActiveTrip();
        if (!active || !confirm('Turn off this share link?')) return;
        try {
            await disableTripShare(active.id);
            document.getElementById('my-safari-share-panel').hidden = true;
            setCloudStatus('Sharing stopped. The old link no longer works.');
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    document.getElementById('my-safari-collaborate')?.addEventListener('click', async () => {
        const panel = document.getElementById('my-safari-collaboration-panel');
        panel.hidden = false;
        setCloudStatus('Loading collaboration access…');
        await syncAndReport('Trip ready to share.');
        await refreshCollaborationManagement();
    });

    document.getElementById('my-safari-close-collaboration')?.addEventListener('click', () => {
        document.getElementById('my-safari-collaboration-panel').hidden = true;
    });

    document.getElementById('my-safari-invite-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const active = getActiveTrip();
        if (!active) return;
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const role = new FormData(event.currentTarget).get('role')?.toString() || 'editor';
            const invite = await createCollaborationInvite(active.id, role);
            document.getElementById('my-safari-invite-url').value = invite.url;
            document.getElementById('my-safari-invite-result').hidden = false;
            await copyText(invite.url);
            setCloudStatus('Private invitation created and copied. It expires in seven days.');
            await refreshCollaborationManagement();
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById('my-safari-copy-invite')?.addEventListener('click', async () => {
        const url = document.getElementById('my-safari-invite-url')?.value;
        if (url) {
            await copyText(url);
            setCloudStatus('Invitation link copied.');
        }
    });

    document.getElementById('my-safari-collaboration-panel')?.addEventListener('click', async event => {
        const copy = event.target.closest('[data-copy-invite]');
        const revoke = event.target.closest('[data-revoke-invite]');
        const remove = event.target.closest('[data-remove-collaborator]');
        try {
            if (copy) {
                await copyText(invitationUrl(copy.dataset.copyInvite));
                setCloudStatus('Invitation link copied.');
            } else if (revoke) {
                await revokeCollaborationInvite(revoke.dataset.revokeInvite);
                setCloudStatus('Invitation revoked.');
                await refreshCollaborationManagement();
            } else if (remove) {
                const active = getActiveTrip();
                if (!active || !confirm('Remove this person from the trip?')) return;
                await removeCollaborator(active.id, remove.dataset.removeCollaborator);
                setCloudStatus('Collaborator removed.');
                await refreshCollaborationManagement();
            }
        } catch (error) {
            setCloudStatus(friendlyCloudError(error), true);
        }
    });

    document.getElementById('collaboration-safari-save')?.addEventListener('click', async () => {
        if (!openCollaborativeTrip?.data) return;
        const status = document.getElementById('collaboration-safari-status');
        status.textContent = 'Saving shared notes…';
        try {
            const data = {
                ...openCollaborativeTrip.data,
                notes: document.getElementById('collaboration-safari-notes').value.trim(),
                updatedAt: new Date().toISOString(),
            };
            const saved = await saveCollaboration(openCollaborativeTrip.trip_id, data);
            renderCollaboration({ ...openCollaborativeTrip, ...saved, data: saved.data });
            renderActivity('collaboration-safari-activity', await getCollaborationActivity(data.id));
            status.classList.remove('is-error');
            status.textContent = 'Shared notes saved for everyone.';
        } catch (error) {
            status.textContent = friendlyCloudError(error);
            status.classList.add('is-error');
        }
    });

    document.getElementById('collaboration-safari-refresh')?.addEventListener('click', () => {
        refreshOpenCollaboration(true).catch(error => {
            document.getElementById('collaboration-safari-status').textContent = friendlyCloudError(error);
        });
    });

    window.addEventListener(TRIP_CHANGE_EVENT, renderDashboard);
}
