const CATEGORY_LABELS = {
    person: 'Person',
    vehicle: 'Vehicle',
    camping: 'Camping',
    activity: 'Activity',
    permit: 'Permit',
};

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatAmount(row, feeTable) {
    const raw = String(row.amount ?? '');
    if (!raw || /^(included|required|varies|separate|via|operator|recommended|minimal|extra)/i.test(raw)) {
        return raw;
    }
    const sym = feeTable.symbol || feeTable.currency || '';
    if (raw.endsWith('+')) return `${sym}${raw}`;
    if (/^\d/.test(raw)) return `${sym}${raw}`;
    return raw;
}

function formatUnit(unit) {
    if (!unit) return '';
    const map = { day: 'per day', night: 'per night', trip: 'per trip' };
    return map[unit] || unit;
}

export function hasParkFeeTable(park) {
    return Boolean(park?.feeTable?.rows?.length);
}

export function renderParkFeeTable(park, { compact = false } = {}) {
    if (!hasParkFeeTable(park)) return '';

    const { feeTable, lastVerified } = park;
    const period = feeTable.period ? ` (${feeTable.period})` : '';
    const caption = compact
        ? `Conservation fees${period}`
        : `Fee table${period} · verified ${lastVerified || '—'}`;

    const rows = feeTable.rows.map(row => {
        const category = CATEGORY_LABELS[row.category] || row.category;
        const amount = formatAmount(row, feeTable);
        const unit = formatUnit(row.unit);
        const note = row.note ? `<span class="park-fee-note">${escapeHtml(row.note)}</span>` : '';
        return `
            <tr>
                <td class="park-fee-cat">${escapeHtml(category)}</td>
                <td>${escapeHtml(row.label)}</td>
                <td class="park-fee-amt">${escapeHtml(amount)}${unit ? ` <span class="park-fee-unit">${escapeHtml(unit)}</span>` : ''}${note}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="park-fee-table-wrap${compact ? ' park-fee-table-wrap--compact' : ''}">
            <table class="park-fee-table">
                <caption>${escapeHtml(caption)}</caption>
                <thead>
                    <tr><th>Type</th><th>Item</th><th>Rate</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

export function renderParkFeeTablePlain(park) {
    if (!hasParkFeeTable(park)) return '';
    return park.feeTable.rows.map(row => {
        const amount = formatAmount(row, park.feeTable);
        const unit = formatUnit(row.unit);
        const note = row.note ? ` (${row.note})` : '';
        return `${row.label}: ${amount}${unit ? ` ${unit}` : ''}${note}`;
    }).join('; ');
}
