import costData from '../../data/cost-estimates.json';

export function initCostEstimator() {
    const container = document.getElementById('cost-estimator');
    if (!container) return;

    // Elements
    const countrySelect = document.getElementById('cost-country');
    const durationSlider = document.getElementById('cost-duration');
    const durationValue = document.getElementById('cost-duration-val');
    const styleBtns = document.querySelectorAll('.cost-style-btn');
    
    const totalEl = document.getElementById('cost-total-val');
    const totalSubEl = document.getElementById('cost-total-sub');
    
    // Breakdown bars and values
    const bars = {
        accommodation: { val: document.getElementById('cost-val-acc'), fill: document.getElementById('cost-bar-acc') },
        food: { val: document.getElementById('cost-val-food'), fill: document.getElementById('cost-bar-food') },
        transport: { val: document.getElementById('cost-val-trans'), fill: document.getElementById('cost-bar-trans') },
        activities: { val: document.getElementById('cost-val-act'), fill: document.getElementById('cost-bar-act') },
        parks: { val: document.getElementById('cost-val-parks'), fill: document.getElementById('cost-bar-parks') }
    };

    // State
    let currentCountry = countrySelect.value;
    let currentDuration = parseInt(durationSlider.value, 10);
    let currentStyle = 'mid';

    // Populate country dropdown from data keys
    const countries = Object.keys(costData.countries);
    countrySelect.innerHTML = countries.map(c => 
        `<option value="${c}">${formatCountryName(c)}</option>`
    ).join('');
    
    // Ensure initial selected value matches state
    countrySelect.value = currentCountry || countries[0];
    currentCountry = countrySelect.value;

    function formatCountryName(str) {
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });

    function updateEstimates() {
        const estimates = costData.countries[currentCountry][currentStyle];
        
        let total = 0;
        const maxCategory = Math.max(...Object.values(estimates)) * currentDuration;

        Object.entries(estimates).forEach(([key, dailyValue]) => {
            if (!bars[key]) return;
            
            const categoryTotal = dailyValue * currentDuration;
            total += categoryTotal;
            
            bars[key].val.textContent = formatter.format(categoryTotal);
            // Calculate width relative to max category to make bars look balanced
            const percentage = maxCategory > 0 ? (categoryTotal / maxCategory) * 100 : 0;
            bars[key].fill.style.width = `${Math.min(percentage, 100)}%`;
        });

        totalEl.textContent = formatter.format(total);
        totalSubEl.textContent = `for ${currentDuration} days in ${formatCountryName(currentCountry)}`;
    }

    // Event Listeners
    countrySelect.addEventListener('change', (e) => {
        currentCountry = e.target.value;
        updateEstimates();
    });

    durationSlider.addEventListener('input', (e) => {
        currentDuration = parseInt(e.target.value, 10);
        durationValue.textContent = currentDuration;
        updateEstimates();
    });

    styleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            styleBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentStyle = target.dataset.style;
            updateEstimates();
        });
    });

    // Initial render
    updateEstimates();
}
