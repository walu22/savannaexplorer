const DAY_MS = 24 * 60 * 60 * 1000;

const CATEGORY_META = {
    essentials: { label: 'Essentials', icon: 'fa-shield-halved' },
    bookings: { label: 'Bookings', icon: 'fa-calendar-check' },
    road: { label: 'On the road', icon: 'fa-road' },
};

function cleanIds(ids) {
    return [...new Set((Array.isArray(ids) ? ids : [])
        .map(String)
        .map(id => id.trim().slice(0, 80))
        .filter(Boolean))]
        .slice(0, 80);
}

export function normalizeReadiness(readiness) {
    return {
        completedTaskIds: cleanIds(readiness?.completedTaskIds),
    };
}

function countrySummary(countries = []) {
    const clean = [...new Set(countries.map(String).map(country => country.trim()).filter(Boolean))];
    if (!clean.length) return 'your destinations';
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return clean.join(' and ');
    return `${clean.slice(0, -1).join(', ')} and ${clean.at(-1)}`;
}

function parseTripDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function deadline(startDate, daysBefore) {
    const start = parseTripDate(startDate);
    if (!start) return null;
    return new Date(start.getTime() - (daysBefore * DAY_MS));
}

function formatDeadline(date, state) {
    if (!date) return 'Set trip dates to unlock a deadline';
    const formatted = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    if (state === 'complete') return 'Completed';
    if (state === 'overdue') return `Target passed · ${formatted}`;
    if (state === 'soon') return `Due soon · ${formatted}`;
    return `Aim for ${formatted}`;
}

function dueState(date, completed, now) {
    if (completed) return 'complete';
    if (!date) return 'unscheduled';
    const remainingDays = Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
    if (remainingDays < 0) return 'overdue';
    if (remainingDays <= 14) return 'soon';
    return 'later';
}

function task(definition, trip, completedIds, now) {
    const dueDate = deadline(trip.startDate, definition.daysBefore);
    const completed = completedIds.has(definition.id);
    const state = dueState(dueDate, completed, now);
    return {
        ...definition,
        categoryLabel: CATEGORY_META[definition.category].label,
        categoryIcon: CATEGORY_META[definition.category].icon,
        completed,
        dueDate: dueDate?.toISOString() || '',
        dueLabel: formatDeadline(dueDate, state),
        dueState: state,
    };
}

export function buildTripReadiness(trip, now = new Date()) {
    const readiness = normalizeReadiness(trip?.readiness);
    const completedIds = new Set(readiness.completedTaskIds);
    const destinations = countrySummary(trip?.countries);
    const hasMultipleCountries = (trip?.countries?.length || 0) > 1;
    const definitions = [
        {
            id: 'entry-rules', category: 'essentials', daysBefore: 120,
            title: `Verify entry rules for ${destinations}`,
            description: 'Check passport validity, visa rules and entry conditions against current official sources.',
            href: '/plan', linkLabel: 'Open visa matrix',
        },
        {
            id: 'health-plan', category: 'essentials', daysBefore: 60,
            title: 'Review health preparation',
            description: 'Check destination guidance and arrange a travel-health consultation when appropriate.',
            href: '/health', linkLabel: 'Review health zones',
        },
        {
            id: 'travel-cover', category: 'essentials', daysBefore: 45,
            title: 'Confirm insurance and emergency cover',
            description: 'Check medical evacuation, vehicle, cancellation and activity exclusions before departure.',
            href: '/travel-essentials', linkLabel: 'Review insurance guidance',
        },
        {
            id: 'transport-booked', category: 'bookings', daysBefore: 75,
            title: 'Confirm transport',
            description: 'Record flights, transfers or rental details and verify the vehicle matches the planned roads.',
            href: '/transport', linkLabel: 'Open transport guide',
        },
        {
            id: 'stays-booked', category: 'bookings', daysBefore: 60,
            title: 'Confirm overnight stays',
            description: 'Check every overnight stop, cancellation term and late-arrival instruction.',
            href: '/book-direct', linkLabel: 'Find official booking links',
        },
        {
            id: 'park-access', category: 'bookings', daysBefore: 45,
            title: 'Check park access and permits',
            description: 'Verify current fees, gate times, reservation rules and permit requirements.',
            href: '/parks', linkLabel: 'Review park information',
        },
        ...(hasMultipleCountries ? [{
            id: 'border-documents', category: 'road', daysBefore: 30,
            title: 'Prepare cross-border documents',
            description: 'Confirm vehicle letters, insurance, road charges, border hours and document copies for every crossing.',
            href: '/borders', linkLabel: 'Open border guides',
        }] : []),
        {
            id: 'route-verified', category: 'road', daysBefore: 14,
            title: 'Recheck the driving plan',
            description: 'Review fuel anchors, road conditions, realistic drive times and no-driving-after-dark limits.',
            href: '/routes', linkLabel: 'Review route guidance',
        },
        {
            id: 'money-ready', category: 'road', daysBefore: 10,
            title: 'Prepare payments and trip budget',
            description: 'Set a working budget and carry suitable backup payment options for remote areas.',
            href: '/expenses', linkLabel: 'Open trip budget',
        },
        {
            id: 'packing-ready', category: 'road', daysBefore: 7,
            title: 'Finish the packing check',
            description: 'Complete documents, medication, charging, weather layers and destination-specific gear.',
            href: '/packing-list', linkLabel: 'Open packing list',
        },
        {
            id: 'emergency-plan', category: 'road', daysBefore: 3,
            title: 'Save emergency details offline',
            description: 'Keep contacts, insurance numbers, booking references and a route copy available without data.',
            href: '/planning-checklist', linkLabel: 'Open planning checklist',
        },
    ];
    const tasks = definitions.map(definition => task(definition, trip || {}, completedIds, now));
    const completedCount = tasks.filter(item => item.completed).length;
    const score = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    const categories = Object.entries(CATEGORY_META).map(([id, meta]) => {
        const categoryTasks = tasks.filter(item => item.category === id);
        return {
            id,
            ...meta,
            tasks: categoryTasks,
            completedCount: categoryTasks.filter(item => item.completed).length,
        };
    }).filter(category => category.tasks.length);
    const nextTask = tasks
        .filter(item => !item.completed)
        .sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        })[0] || null;

    return {
        score,
        completedCount,
        totalCount: tasks.length,
        tasks,
        categories,
        nextTask,
        hasDates: Boolean(parseTripDate(trip?.startDate)),
    };
}

export function setReadinessTask(readiness, taskId, completed) {
    const current = normalizeReadiness(readiness);
    const ids = new Set(current.completedTaskIds);
    if (completed) ids.add(String(taskId));
    else ids.delete(String(taskId));
    return normalizeReadiness({ completedTaskIds: [...ids] });
}
