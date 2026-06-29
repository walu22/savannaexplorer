/**
 * Parse display arrival strings (e.g. "8.92M", "900K+") to millions for charting.
 */
export function parseArrivalsMillions(value) {
    if (value == null) return null;
    const raw = String(value).replace(/,/g, '').trim();
    const match = raw.match(/^([\d.]+)\s*([MK])?/i);
    if (!match) return null;

    let num = parseFloat(match[1]);
    if (Number.isNaN(num)) return null;

    const suffix = match[2]?.toUpperCase();
    if (suffix === 'M') return num;
    if (suffix === 'K') return num / 1000;
    if (num >= 100) return num / 1_000_000;
    return num;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderArrivalsChart(countries) {
    const rows = countries
        .map(c => ({
            ...c,
            millions: c.arrivalsMillions ?? parseArrivalsMillions(c.arrivals),
        }))
        .filter(c => c.millions != null && c.millions > 0)
        .sort((a, b) => b.millions - a.millions);

    if (!rows.length) return '';

    const max = rows[0].millions;

    return `
        <div class="tourism-chart" aria-label="International arrivals by country">
            <div class="tourism-chart-header">
                <h3>Arrivals at a glance</h3>
                <p>Millions of international visitors — hover bars for exact figures from national sources.</p>
            </div>
            <div class="tourism-chart-bars">
                ${rows.map(row => {
                    const pct = Math.max(4, (row.millions / max) * 100);
                    const label = row.arrivals.replace(/\+$/, '');
                    return `
                        <div class="tourism-chart-row" title="${escapeHtml(row.name)}: ${escapeHtml(label)}">
                            <span class="tourism-chart-flag">${row.flag}</span>
                            <span class="tourism-chart-name">${escapeHtml(row.name)}</span>
                            <div class="tourism-chart-track">
                                <div class="tourism-chart-bar" style="width: ${pct.toFixed(1)}%"></div>
                            </div>
                            <span class="tourism-chart-value">${escapeHtml(label)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

export function renderRegionalShareChart(countries) {
    const rows = countries
        .map(c => ({
            ...c,
            millions: c.arrivalsMillions ?? parseArrivalsMillions(c.arrivals),
        }))
        .filter(c => c.millions != null && c.millions > 0);

    const total = rows.reduce((sum, r) => sum + r.millions, 0);
    if (!total) return '';

    const top = [...rows].sort((a, b) => b.millions - a.millions).slice(0, 5);

    return `
        <div class="tourism-share-chart" aria-label="Share of regional arrivals, top five countries">
            <h3>Regional share (top 5)</h3>
            <div class="tourism-share-grid">
                ${top.map(row => {
                    const share = (row.millions / total) * 100;
                    return `
                        <div class="tourism-share-card">
                            <span class="tourism-share-flag">${row.flag}</span>
                            <strong>${share.toFixed(0)}%</strong>
                            <span>${escapeHtml(row.name)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
