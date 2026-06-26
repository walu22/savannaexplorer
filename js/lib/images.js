const FALLBACK_HERO = 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=800';
const FALLBACK_ACTIVITY = 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=300';

export function spotImageUrl(spot) {
    if (spot.image) {
        return `https://images.unsplash.com/photo-${spot.image}?auto=format&fit=crop&q=80&w=800`;
    }
    return FALLBACK_HERO;
}

export function activityImageUrl(act) {
    if (act.image) {
        return `https://images.unsplash.com/photo-${act.image}?auto=format&fit=crop&q=80&w=300`;
    }
    return FALLBACK_ACTIVITY;
}
