import practical from '../../../data/practical.json';

let rendered = false;

export function initHubEmergencies() {
    if (rendered) return;
    rendered = true;

    const list = document.getElementById('hub-emergency-list');
    if (!list) return;

    list.innerHTML = practical.emergencies.map(row => `
        <div class="emg-row">
            <span class="emg-flag">${row.flag}</span>
            <div class="emg-body">
                <span class="emg-country">${row.country}</span>
                <span class="emg-nums">${row.numbers}</span>
            </div>
            <a class="emg-source" href="${row.sourceUrl}" target="_blank" rel="noopener noreferrer" title="Official source · verified ${row.lastVerified}" aria-label="Source for ${row.country}">↗</a>
        </div>
    `).join('');
}
