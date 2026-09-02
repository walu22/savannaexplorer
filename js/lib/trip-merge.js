function timestamp(value) {
    const parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? parsed : 0;
}

export function mergeTripRecords(localTrips, cloudRows) {
    const merged = new Map((localTrips || []).map(trip => [trip.id, trip]));

    for (const row of cloudRows || []) {
        const local = merged.get(row.client_id);
        if (row.deleted_at) {
            if (!local || timestamp(row.deleted_at) >= timestamp(local.updatedAt)) {
                merged.delete(row.client_id);
            }
            continue;
        }

        const cloudTrip = row.data;
        if (!cloudTrip || typeof cloudTrip !== 'object' || cloudTrip.id !== row.client_id) continue;
        if (!local || timestamp(cloudTrip.updatedAt) > timestamp(local.updatedAt)) {
            merged.set(row.client_id, cloudTrip);
        }
    }

    return [...merged.values()].sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt));
}
