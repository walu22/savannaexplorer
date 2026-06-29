import practical from '../../../data/practical.json';
import { bindPassportSelect } from '../../lib/visa-passport.js';
import {
    applyPassportToVisaHub,
    initPassportVisaHelper,
} from '../visa-passport-ui.js';
import { initOnTheGround } from '../on-the-ground.js';
import { initExpenseTracker } from '../expense-tracker.js';
import { initHubCurrency } from './currency.js';
import { initHubSeasonsWeather } from './seasons-weather.js';
import { initHubEmergencies } from './emergencies.js';
import { initHubTabs, registerHubTabInit } from './tabs.js';

let visaSearchBound = false;

function bindVisaSearch() {
    if (visaSearchBound) return;
    visaSearchBound = true;

    document.getElementById('hub-visa-search')?.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        document.querySelectorAll('.hub-matrix-row').forEach(row => {
            const country = row.getAttribute('data-country') || '';
            row.style.display = country.includes(q) ? '' : 'none';
        });
        document.querySelectorAll('.hub-visa-detail').forEach(detail => {
            const text = detail.textContent.toLowerCase();
            detail.style.display = !q || text.includes(q) ? '' : 'none';
        });
    });
}

function initHubPassport() {
    bindPassportSelect(
        document.getElementById('hub-passport-select'),
        applyPassportToVisaHub,
    );
}

function initDocumentsTab() {
    initPassportVisaHelper();
    bindVisaSearch();
}

function initOnTheGoTab() {
    initHubCurrency();
    initHubEmergencies();
    initOnTheGround();
}

function initWhenTab() {
    initHubSeasonsWeather();
}

function initPlanTab() {
    initExpenseTracker();
}

function renderDisclaimer() {
    const el = document.getElementById('hub-disclaimer');
    if (el) el.textContent = practical.meta.disclaimer;
}

export function initUtilityHub() {
    initHubPassport();
    renderDisclaimer();

    registerHubTabInit('plan', initPlanTab);
    registerHubTabInit('documents', initDocumentsTab);
    registerHubTabInit('on-the-go', initOnTheGoTab);
    registerHubTabInit('when', initWhenTab);

    initHubTabs();
}
