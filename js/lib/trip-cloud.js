import { getSupabaseClient } from './supabase.js';
import { TRIP_CHANGE_EVENT, readTripState, replaceTripState } from './trip-store.js';
import { mergeTripRecords } from './trip-merge.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let syncTimer = null;
let activeSync = null;

function requireClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud sync is not configured for this site.');
    return client;
}

async function requireUser(client = requireClient()) {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Sign in to sync your trips.');
    return data.user;
}

export async function getCurrentSession() {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
}

export function onAuthChange(callback) {
    const client = getSupabaseClient();
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
}

export async function sendSignInLink(email) {
    const client = requireClient();
    const redirectTo = `${window.location.origin}${window.location.pathname}#hub-my-safari`;
    const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
}

export async function signOut() {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
}

export function syncTrips() {
    if (activeSync) return activeSync;
    const pending = (async () => {
        const client = requireClient();
        const user = await requireUser(client);
        const localState = readTripState();
        const { data: cloudRows, error: fetchError } = await client
            .from('user_trips')
            .select('client_id,data,deleted_at,updated_at,share_enabled,share_token')
            .eq('user_id', user.id);
        if (fetchError) throw fetchError;

        const trips = mergeTripRecords(localState.trips, cloudRows);
        const activeTripId = trips.some(trip => trip.id === localState.activeTripId)
            ? localState.activeTripId
            : (trips[0]?.id || '');

        if (trips.length) {
            const rows = trips.map(trip => ({
                user_id: user.id,
                client_id: trip.id,
                data: trip,
                deleted_at: null,
                updated_at: new Date().toISOString(),
            }));
            const { error: upsertError } = await client
                .from('user_trips')
                .upsert(rows, { onConflict: 'user_id,client_id' });
            if (upsertError) throw upsertError;
        }

        replaceTripState({ activeTripId, trips });
        return { count: trips.length, syncedAt: new Date().toISOString() };
    })();
    activeSync = pending.then(
        result => {
            activeSync = null;
            return result;
        },
        error => {
            activeSync = null;
            throw error;
        },
    );
    return activeSync;
}

async function softDeleteCloudTrip(tripId) {
    const client = requireClient();
    const user = await requireUser(client);
    const { error } = await client
        .from('user_trips')
        .update({ deleted_at: new Date().toISOString(), share_enabled: false })
        .eq('user_id', user.id)
        .eq('client_id', tripId);
    if (error) throw error;
}

export function startAutomaticTripSync(onError = () => {}) {
    const listener = event => {
        if (event.detail?.action === 'cloud' || event.detail?.action === 'active') return;
        if (event.detail?.action === 'delete') {
            getCurrentSession()
                .then(current => current ? softDeleteCloudTrip(event.detail.tripId) : null)
                .catch(onError);
            return;
        }
        clearTimeout(syncTimer);
        syncTimer = setTimeout(async () => {
            try {
                if (!await getCurrentSession()) return;
                await syncTrips();
            } catch (error) {
                onError(error);
            }
        }, 700);
    };
    window.addEventListener(TRIP_CHANGE_EVENT, listener);
    return () => window.removeEventListener(TRIP_CHANGE_EVENT, listener);
}

export async function enableTripShare(tripId) {
    await syncTrips();
    const client = requireClient();
    const user = await requireUser(client);
    const { data, error } = await client
        .from('user_trips')
        .update({ share_enabled: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('client_id', tripId)
        .select('share_token')
        .single();
    if (error) throw error;
    return `${window.location.origin}${window.location.pathname}?share=${data.share_token}#shared-safari`;
}

export async function getTripShareStatus(tripId) {
    const client = requireClient();
    const user = await requireUser(client);
    const { data, error } = await client
        .from('user_trips')
        .select('share_enabled,share_token')
        .eq('user_id', user.id)
        .eq('client_id', tripId)
        .maybeSingle();
    if (error) throw error;
    if (!data?.share_enabled) return null;
    return `${window.location.origin}${window.location.pathname}?share=${data.share_token}#shared-safari`;
}

export async function disableTripShare(tripId) {
    const client = requireClient();
    const user = await requireUser(client);
    const { error } = await client
        .from('user_trips')
        .update({ share_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('client_id', tripId);
    if (error) throw error;
}

export async function loadSharedTrip(token) {
    if (!UUID_PATTERN.test(token || '')) throw new Error('This share link is invalid.');
    const client = requireClient();
    const { data, error } = await client.rpc('get_shared_trip', { p_token: token });
    if (error) throw error;
    return data?.[0]?.data || null;
}
