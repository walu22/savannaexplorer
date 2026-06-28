import visaPassportData from '../../data/visa-passport.json';

const STORAGE_KEY = 'savanna-passport-id';

/** @typedef {'visa-free'|'e-visa'|'voa'|'e-visa-or-voa'|'visa-required'|'verify'} VisaStatus */

export function getPassportOptions() {
    return visaPassportData.passports || [];
}

export function getDefaultPassportId() {
    return getStoredPassportId() || 'uk';
}

export function getStoredPassportId() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && visaPassportData.passports.some(p => p.id === stored)) {
            return stored;
        }
    } catch {
        /* private browsing */
    }
    return null;
}

export function storePassportId(passportId) {
    try {
        localStorage.setItem(STORAGE_KEY, passportId);
    } catch {
        /* ignore */
    }
}

export function getPassportMeta(passportId) {
    return visaPassportData.passports.find(p => p.id === passportId) || null;
}

/**
 * @param {string} countryId
 * @param {string} passportId
 */
export function getVisaForPassport(countryId, passportId) {
    const countryRules = visaPassportData.rules[countryId];
    if (!countryRules) return null;
    return countryRules[passportId] || countryRules.other || null;
}

export function needsVisaAction(status) {
    return status === 'e-visa' || status === 'voa' || status === 'e-visa-or-voa'
        || status === 'visa-required' || status === 'verify';
}

export function getKazaTip(passportId, countryIds = []) {
    const tip = visaPassportData.kazaTip;
    if (!tip || !tip.passports.includes(passportId)) return null;
    if (!countryIds.length) return tip;
    const hasKazaCountry = countryIds.some(id => tip.countries.includes(id));
    return hasKazaCountry ? tip : null;
}

export function summarizeAllCountries(passportId) {
    const countryIds = Object.keys(visaPassportData.rules);
    const summary = summarizeTripVisas(countryIds, passportId);
    summary.kaza = getKazaTip(passportId, []);
    return summary;
}

export function renderPassportSelectOptions(selectedId) {
    return getPassportOptions().map(p =>
        `<option value="${p.id}"${p.id === selectedId ? ' selected' : ''}>${p.label}</option>`
    ).join('');
}

export function bindPassportSelect(selectEl, onChange) {
    if (!selectEl) return;

    const refresh = (passportId) => {
        selectEl.innerHTML = renderPassportSelectOptions(passportId);
        selectEl.value = passportId;
    };

    refresh(getDefaultPassportId());

    selectEl.dataset.passportSelect = 'true';
    selectEl.addEventListener('change', () => {
        const passportId = selectEl.value;
        storePassportId(passportId);
        document.querySelectorAll('[data-passport-select]').forEach(el => {
            if (el !== selectEl) el.value = passportId;
        });
        onChange?.(passportId);
    });
}

/**
 * @param {string[]} countryIds
 * @param {string} passportId
 */
export function summarizeTripVisas(countryIds, passportId) {
    const passport = getPassportMeta(passportId);
    const lines = countryIds.map(countryId => {
        const rule = getVisaForPassport(countryId, passportId);
        return { countryId, rule };
    }).filter(item => item.rule);

    const actionNeeded = lines.filter(item => needsVisaAction(item.rule.status));
    const visaFree = lines.filter(item => item.rule.status === 'visa-free');

    return {
        passport,
        lines,
        actionNeeded,
        visaFree,
        kaza: getKazaTip(passportId, countryIds),
        disclaimer: visaPassportData.meta.disclaimer,
        lastVerified: visaPassportData.meta.lastVerified,
    };
}

export function getVisaPassportDisclaimer() {
    return visaPassportData.meta.disclaimer;
}

export function getVisaPassportLastVerified() {
    return visaPassportData.meta.lastVerified;
}
