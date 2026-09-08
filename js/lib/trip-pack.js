import { buildTripReadiness } from './trip-readiness.js';
import { buildTripOperationsBrief } from './trip-operations.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

function dateLabel(value) {
    if (!DATE_PATTERN.test(String(value || ''))) return 'Date not set';
    return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
}

function dateRange(trip) {
    if (!trip?.startDate && !trip?.endDate) return 'Dates not set';
    return `${dateLabel(trip.startDate)} – ${dateLabel(trip.endDate)}`;
}

function safeFilename(value) {
    const name = String(value || 'safari-trip')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 54);
    return `${name || 'safari-trip'}-offline-pack.html`;
}

function itineraryHtml(routeDays) {
    if (!routeDays.length) return '<p class="trip-pack-empty">No day-by-day route has been added yet.</p>';
    return routeDays.map((day, index) => {
        const stops = Array.isArray(day?.stops) ? day.stops : [];
        return `
            <article class="trip-pack-day">
                <header><span>Day ${index + 1}</span><div><strong>${escapeHtml(day.title || dateLabel(day.date))}</strong>${day.title && day.date ? `<small>${escapeHtml(dateLabel(day.date))}</small>` : ''}</div></header>
                ${stops.length ? `<ol>${stops.map(stop => `
                    <li>
                        <time>${escapeHtml(stop.time || 'Any time')}</time>
                        <div><strong>${escapeHtml(stop.name || 'Untitled stop')}</strong>${stop.location ? `<span>${escapeHtml(stop.location)}</span>` : ''}${stop.notes ? `<small>${escapeHtml(stop.notes)}</small>` : ''}${stop.sourceUrl ? `<small><a href="${escapeHtml(stop.sourceUrl)}">Stay source</a></small>` : ''}</div>
                    </li>
                `).join('')}</ol>` : '<p class="trip-pack-empty">No stops recorded for this day.</p>'}
            </article>
        `;
    }).join('');
}

function bookingHtml(bookings, includeReferences) {
    if (!bookings.length) return '<p class="trip-pack-empty">No booking records have been added.</p>';
    return `<table><thead><tr><th>Booking</th><th>Date</th><th>Status</th>${includeReferences ? '<th>Reference</th>' : ''}</tr></thead><tbody>${bookings.map(booking => `
        <tr>
            <td><strong>${escapeHtml(booking.provider || 'Untitled booking')}</strong><small>${escapeHtml(booking.type || 'other')}</small>${booking.sourceUrl ? `<small><a href="${escapeHtml(booking.sourceUrl)}">Stay source</a></small>` : ''}</td>
            <td>${escapeHtml(dateLabel(booking.date))}</td>
            <td>${escapeHtml(booking.status || 'planned')}</td>
            ${includeReferences ? `<td>${escapeHtml(booking.reference || '—')}</td>` : ''}
        </tr>
    `).join('')}</tbody></table>`;
}

function readinessHtml(trip, generatedAt) {
    const plan = buildTripReadiness(trip, new Date(generatedAt));
    return {
        score: plan.score,
        html: plan.categories.map(category => `
            <section class="trip-pack-check-group">
                <h3>${escapeHtml(category.label)} <span>${category.completedCount}/${category.tasks.length}</span></h3>
                <ul>${category.tasks.map(task => `
                    <li class="${task.completed ? 'is-complete' : ''}"><span class="trip-pack-box">${task.completed ? '✓' : ''}</span><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.dueLabel)}</small></div></li>
                `).join('')}</ul>
            </section>
        `).join(''),
    };
}

function expenseHtml(items) {
    if (!items.length) return '<p class="trip-pack-empty">No expenses have been recorded.</p>';
    const totals = new Map();
    items.forEach(item => {
        const currency = String(item?.currency || 'USD').slice(0, 8).toUpperCase();
        totals.set(currency, (totals.get(currency) || 0) + (Number(item?.amount) || 0));
    });
    return `<div class="trip-pack-totals">${[...totals].map(([currency, total]) => `<span><small>${escapeHtml(currency)}</small><strong>${escapeHtml(total.toLocaleString('en-US', { maximumFractionDigits: 2 }))}</strong></span>`).join('')}</div><p class="trip-pack-caption">${items.length} recorded expense${items.length === 1 ? '' : 's'}; totals are shown in their original currencies.</p>`;
}

function emergencyHtml(countries, emergencies) {
    const selected = emergencies.filter(item => countries.includes(item?.country));
    if (!selected.length) return '<p class="trip-pack-empty">No destination emergency details are available in this pack.</p>';
    return selected.map(item => `
        <article class="trip-pack-emergency">
            <strong>${escapeHtml(item.flag || '🌍')} ${escapeHtml(item.country)}</strong>
            <p>${escapeHtml(item.numbers)}</p>
            ${item.sourceUrl ? `<small>Official source: ${escapeHtml(item.sourceUrl)}</small>` : ''}
            ${item.lastVerified ? `<small>Reviewed ${escapeHtml(dateLabel(item.lastVerified))}</small>` : ''}
        </article>
    `).join('');
}

const VEHICLE_CONTEXT_LABELS = {
    owned: 'Owned vehicle',
    financed: 'Financed vehicle',
    rented: 'Rental vehicle',
};

function verifiedLabel(value) {
    return DATE_PATTERN.test(String(value || '')) ? `Reviewed ${dateLabel(value)}` : 'Review date not published';
}

function sourceLink(url, label = 'Official source') {
    if (!url) return '';
    return `<a class="trip-pack-source" href="${escapeHtml(url)}">${escapeHtml(label)} · ${escapeHtml(url)}</a>`;
}

function corridorStaysHtml(stays) {
    if (!stays.length) return '<p class="trip-pack-empty">No reviewed border-corridor stay is saved for this crossing. Choose and confirm an overnight before a long transfer.</p>';
    return `<div class="trip-pack-stays">${stays.map(stay => `
        <article class="trip-pack-stay">
            <div class="trip-pack-stay-heading"><div><span>Nearby stay · ${escapeHtml(stay.countryName || stay.locality || '')}</span><strong>${escapeHtml(stay.name)}</strong></div><b>${escapeHtml(Number(stay.distanceKm).toFixed(1))} km*</b></div>
            <p>${escapeHtml(stay.publishedProximity || `${stay.locality || 'This stay'} is near the selected crossing.`)}</p>
            <ul><li>${escapeHtml(stay.parking?.label || 'Confirm parking arrangements directly.')}</li><li>${escapeHtml(stay.checkIn?.label || 'Confirm check-in times directly.')}</li></ul>
            <small>*Straight-line distance, not driving distance · ${escapeHtml(verifiedLabel(stay.lastVerified))}</small>
            ${sourceLink(stay.propertyUrl || stay.sourceUrl, 'Property details')}
        </article>
    `).join('')}</div>`;
}

function borderPackHtml(trip) {
    const brief = buildTripOperationsBrief(trip);
    const action = brief.actionCentre;
    if (!action.pairs.length) return { html: '', pairCount: 0, documentCount: 0, completedCount: 0 };
    const crossingById = new Map(brief.crossings.map(crossing => [crossing.id, crossing]));
    const vehicleLabel = VEHICLE_CONTEXT_LABELS[action.vehicleContext] || 'Vehicle situation not selected';
    const crossingStatus = `${action.pairs.filter(pair => pair.selected).length}/${action.pairs.length} selected`;
    const documentStatus = action.documents.length
        ? `${action.completedCount}/${action.totalCount} confirmed`
        : 'Waiting for crossing selection';

    const crossings = action.pairs.map((pair, index) => {
        const crossing = pair.selected ? (crossingById.get(pair.selected.id) || pair.selected) : null;
        return `
            <article class="trip-pack-crossing${pair.needsRouteUpdate ? ' needs-update' : ''}">
                <div class="trip-pack-crossing-heading"><span>Border leg ${index + 1}</span><strong>${escapeHtml(pair.fromName)} → ${escapeHtml(pair.toName)}</strong></div>
                ${crossing ? `
                    <div class="trip-pack-crossing-title"><h3>${escapeHtml(crossing.name)}</h3><span>${escapeHtml(crossing.hours || 'Hours not published')}</span></div>
                    <dl><div><dt>Road route</dt><dd>${escapeHtml(crossing.route || 'Confirm locally')}</dd></div><div><dt>Fees & charges</dt><dd>${escapeHtml(crossing.fees || 'Confirm before departure')}</dd></div><div><dt>Information reviewed</dt><dd>${escapeHtml(dateLabel(crossing.lastVerified))}</dd></div></dl>
                    ${pair.needsRouteUpdate ? '<p class="trip-pack-route-alert"><strong>Driving itinerary needs updating.</strong> This crossing differs from the border in the saved route. Rebuild that transfer before relying on its road times.</p>' : ''}
                    ${sourceLink(crossing.sourceUrl)}
                    ${corridorStaysHtml(crossing.stays || [])}
                ` : '<p class="trip-pack-route-alert"><strong>Crossing not selected.</strong> Choose the exact land border in My Safari before relying on this pack.</p>'}
            </article>
        `;
    }).join('');

    const documents = action.documents.length ? `<ul class="trip-pack-documents">${action.documents.map(document => `
        <li class="${document.completed ? 'is-complete' : ''}"><span class="trip-pack-box">${document.completed ? '✓' : ''}</span><div><strong>${escapeHtml(document.label)}</strong><small>${document.completed ? 'Confirmed or packed' : 'Still to confirm or pack'} · ${escapeHtml(document.reason)}</small>${sourceLink(document.sourceUrl, 'Document source')}</div></li>
    `).join('')}</ul>` : '<p class="trip-pack-empty">Select each crossing and vehicle situation in My Safari to create the full document list.</p>';

    return {
        pairCount: action.pairs.length,
        documentCount: action.totalCount,
        completedCount: action.completedCount,
        html: `
            <div class="trip-pack-border-summary">
                <span><small>Crossings</small><strong>${escapeHtml(crossingStatus)}</strong></span>
                <span><small>Vehicle</small><strong>${escapeHtml(vehicleLabel)}</strong></span>
                <span><small>Paperwork</small><strong>${escapeHtml(documentStatus)}</strong></span>
            </div>
            ${action.routeUpdateRequired ? '<aside class="trip-pack-critical"><strong>Route mismatch</strong><span>Your chosen crossing no longer matches the saved driving itinerary. Update the route before departure.</span></aside>' : ''}
            <div class="trip-pack-crossings">${crossings}</div>
            <div class="trip-pack-document-list"><h3>Documents to carry</h3><p>Ticked items reflect your saved confirmations when this pack was generated.</p>${documents}</div>
        `,
    };
}

export function buildTripPack(trip, options = {}) {
    if (!trip?.id) throw new Error('Choose a saved safari before creating a trip pack.');
    const generatedAt = options.generatedAt || new Date();
    const includeNotes = options.includeNotes === true;
    const includeReferences = options.includeReferences === true;
    const countries = Array.isArray(trip.countries) ? trip.countries.filter(Boolean) : [];
    const routeDays = Array.isArray(trip.routeDays) ? trip.routeDays : [];
    const bookings = Array.isArray(trip.bookings) ? trip.bookings : [];
    const expenses = Array.isArray(trip.expenses?.items) ? trip.expenses.items : [];
    const packedCount = Array.isArray(trip.packing?.packedItems) ? trip.packing.packedItems.length : 0;
    const readiness = readinessHtml(trip, generatedAt);
    const borderPack = borderPackHtml(trip);
    const hasBorderPack = Boolean(borderPack.html);
    const readinessNumber = hasBorderPack ? '04' : '03';
    const budgetNumber = hasBorderPack ? '05' : '04';
    const emergencyNumber = hasBorderPack ? '06' : '05';
    const notesNumber = hasBorderPack ? '07' : '06';
    const generatedLabel = new Date(generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    });

    const html = `
        <article class="trip-pack-document">
            <header class="trip-pack-cover">
                <p class="trip-pack-brand">Savanna Explorer</p>
                <p class="trip-pack-kicker">My Safari · Offline trip pack</p>
                <h1>${escapeHtml(trip.name || 'My Safari')}</h1>
                <p class="trip-pack-destinations">${escapeHtml(countries.join(' · ') || 'Southern Africa')}</p>
                <div class="trip-pack-meta"><span><strong>Dates</strong>${escapeHtml(dateRange(trip))}</span><span><strong>Travellers</strong>${escapeHtml(Number(trip.travellers) || 1)}</span><span><strong>Readiness</strong>${readiness.score}%</span></div>
                <p class="trip-pack-generated">Generated ${escapeHtml(generatedLabel)} · Saved copy for use without internet</p>
            </header>
            <aside class="trip-pack-warning"><strong>Check before departure</strong><span>This is a saved planning copy, not live travel advice. Reconfirm borders, entry rules, health guidance, park access and safety information with official sources.</span></aside>
            <section class="trip-pack-section"><div class="trip-pack-heading"><span>01</span><div><h2>Day-by-day journey</h2><p>Your saved route in travel order.</p></div></div>${itineraryHtml(routeDays)}</section>
            <section class="trip-pack-section"><div class="trip-pack-heading"><span>02</span><div><h2>Booking records</h2><p>${includeReferences ? 'References included by your choice—store this file securely.' : 'Private references excluded from this copy.'}</p></div></div>${bookingHtml(bookings, includeReferences)}</section>
            ${hasBorderPack ? `<section class="trip-pack-section trip-pack-border-section"><div class="trip-pack-heading"><span>03</span><div><h2>Cross-border action pack</h2><p>Your saved crossings, vehicle paperwork and reviewed corridor stays.</p></div></div>${borderPack.html}</section>` : ''}
            <section class="trip-pack-section"><div class="trip-pack-heading"><span>${readinessNumber}</span><div><h2>Readiness checklist</h2><p>${readiness.score}% complete when this pack was generated.</p></div></div><div class="trip-pack-checks">${readiness.html}</div></section>
            <section class="trip-pack-section"><div class="trip-pack-heading"><span>${budgetNumber}</span><div><h2>Budget & packing snapshot</h2><p>Working totals and preparation progress.</p></div></div><div class="trip-pack-split"><div><h3>Recorded expenses</h3>${expenseHtml(expenses)}</div><div><h3>Packing progress</h3><p class="trip-pack-big-number">${packedCount}</p><p class="trip-pack-caption">item${packedCount === 1 ? '' : 's'} marked packed in My Safari.</p></div></div></section>
            <section class="trip-pack-section"><div class="trip-pack-heading"><span>${emergencyNumber}</span><div><h2>Emergency numbers</h2><p>Keep these available offline and verify locally on arrival.</p></div></div><div class="trip-pack-emergencies">${emergencyHtml(countries, options.emergencies || [])}</div></section>
            ${includeNotes && trip.notes ? `<section class="trip-pack-section"><div class="trip-pack-heading"><span>${notesNumber}</span><div><h2>Private trip notes</h2><p>Included by your choice—store this file securely.</p></div></div><div class="trip-pack-notes">${escapeHtml(trip.notes).replace(/\r?\n/g, '<br>')}</div></section>` : ''}
            <footer><strong>Savanna Explorer</strong><p>Independent travel planning for Southern Africa. We do not sell tours, take payments or act as a travel agent.</p><p>${escapeHtml(options.disclaimer || '')}</p><p>savannaexplorer.com</p></footer>
        </article>
    `;

    return {
        filename: safeFilename(trip.name),
        html,
        stats: {
            routeDays: routeDays.length,
            bookings: bookings.length,
            readinessScore: readiness.score,
            borderPairs: borderPack.pairCount,
            borderDocuments: borderPack.documentCount,
            completedBorderDocuments: borderPack.completedCount,
            includesNotes: includeNotes && Boolean(trip.notes),
            includesReferences: includeReferences,
        },
    };
}
