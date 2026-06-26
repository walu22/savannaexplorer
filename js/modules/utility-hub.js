import packingData from '../../data/packing.json';

function updatePackProgress() {
    const total = document.querySelectorAll('#hub-pack-list input[type="checkbox"]').length;
    const checked = document.querySelectorAll('#hub-pack-list input[type="checkbox"]:checked').length;
    const fill = document.getElementById('pack-progress');
    const text = document.getElementById('pack-progress-text');
    if (fill) fill.style.width = total ? `${(checked / total) * 100}%` : '0%';
    if (text) text.textContent = `${checked} of ${total} packed`;
}

function renderPackList(type) {
    const list = document.getElementById('hub-pack-list');
    if (!list) return;
    const items = packingData[type] || packingData.safari;
    list.innerHTML = items.map(item =>
        `<label class="hub-pack-item"><input type="checkbox"> <span>${item}</span></label>`
    ).join('');
    updatePackProgress();
}

export function initUtilityHub() {
    const hubAmount = document.getElementById('hub-amount');
    const hubFrom = document.getElementById('hub-from-currency');

    function updateCurrency() {
        const amount = parseFloat(hubAmount?.value) || 0;
        const from = hubFrom?.value || 'USD';
        const rateKey = `rate${from.charAt(0).toUpperCase() + from.slice(1).toLowerCase()}`;

        document.querySelectorAll('.hub-cur-val').forEach(el => {
            const rate = parseFloat(el.dataset[rateKey]) || 0;
            const result = amount * rate;
            el.textContent = result.toLocaleString('en-US', {
                minimumFractionDigits: result > 1000 ? 0 : 2,
                maximumFractionDigits: result > 1000 ? 0 : 2,
            });
        });
    }

    hubAmount?.addEventListener('input', updateCurrency);
    hubFrom?.addEventListener('change', updateCurrency);

    const hubVisaSearch = document.getElementById('hub-visa-search');
    hubVisaSearch?.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        document.querySelectorAll('.hub-matrix-row').forEach(row => {
            const country = row.getAttribute('data-country') || '';
            row.style.display = country.includes(q) ? '' : 'none';
        });
    });

    document.getElementById('hub-pack-list')?.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) updatePackProgress();
    });

    document.querySelectorAll('.hub-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderPackList(this.dataset.pack);
        });
    });
}
