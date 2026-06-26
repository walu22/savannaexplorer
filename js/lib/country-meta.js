export const COUNTRY_META = {
    'south-africa': { name: 'South Africa', flag: '🇿🇦' },
    namibia: { name: 'Namibia', flag: '🇳🇦' },
    botswana: { name: 'Botswana', flag: '🇧🇼' },
    zambia: { name: 'Zambia', flag: '🇿🇲' },
    zimbabwe: { name: 'Zimbabwe', flag: '🇿🇼' },
    mozambique: { name: 'Mozambique', flag: '🇲🇿' },
    malawi: { name: 'Malawi', flag: '🇲🇼' },
    lesotho: { name: 'Lesotho', flag: '🇱🇸' },
    eswatini: { name: 'Eswatini', flag: '🇸🇿' },
};

export function getCountryMeta(countryId) {
    return COUNTRY_META[countryId] || { name: countryId, flag: '🌍' };
}
