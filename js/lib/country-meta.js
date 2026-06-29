export const COUNTRY_META = {
    'south-africa': {
        name: 'South Africa',
        flag: '🇿🇦',
        cardImage: '1755251418399-c56a9579858f',
        highlights: 'Kruger Park • Cape Town • Garden Route • Drakensberg • Winelands',
    },
    namibia: {
        name: 'Namibia',
        flag: '🇳🇦',
        cardImage: '1772289093245-218447e77b64',
        highlights: 'Sossusvlei • Etosha • Fish River Canyon • Skeleton Coast • Swakopmund',
    },
    botswana: {
        name: 'Botswana',
        flag: '🇧🇼',
        cardImage: '1547471080-7cc2caa01a7e',
        highlights: 'Okavango Delta • Chobe • Moremi • Makgadikgadi • Central Kalahari',
    },
    zambia: {
        name: 'Zambia',
        flag: '🇿🇲',
        cardImage: '1679713594549-ec393ce9c909',
        highlights: 'Victoria Falls • South Luangwa • Lower Zambezi • Kafue • Lake Kariba',
    },
    zimbabwe: {
        name: 'Zimbabwe',
        flag: '🇿🇼',
        cardImage: '1759164882609-58b00ec3b09a',
        highlights: 'Victoria Falls • Hwange • Mana Pools • Lake Kariba • Matobo Hills',
    },
    mozambique: {
        name: 'Mozambique',
        flag: '🇲🇿',
        cardImage: '1505142468610-359e7d316be0',
        highlights: 'Bazaruto • Tofo Beach • Gorongosa • Maputo • Ibo Island',
    },
    malawi: {
        name: 'Malawi',
        flag: '🇲🇼',
        cardImage: '1658221744192-00e3770b8625',
        highlights: 'Lake Malawi • Mount Mulanje • Liwonde • Majete • Nyika Plateau',
    },
    lesotho: {
        name: 'Lesotho',
        flag: '🇱🇸',
        cardImage: '1663527025647-0934ef6d06e5',
        highlights: 'Maletsunyane Falls • Sani Pass • Sehlabathebe • Thaba Bosiu • Katse Dam',
    },
    eswatini: {
        name: 'Eswatini',
        flag: '🇸🇿',
        cardImage: '1500530855697-b586d89ba3ee',
        highlights: 'Hlane Royal Park • Mlilwane • Mantenga Village • Mkhaya • Ezulwini',
    },
};

export const COUNTRY_ORDER = [
    'namibia', 'south-africa', 'botswana', 'zambia', 'zimbabwe',
    'mozambique', 'malawi', 'lesotho', 'eswatini',
];

export function getCountryMeta(countryId) {
    return COUNTRY_META[countryId] || { name: countryId, flag: '🌍', cardImage: '', highlights: '' };
}

export function cardImageUrl(countryId) {
    const meta = getCountryMeta(countryId);
    if (meta.cardImage) {
        return `https://images.unsplash.com/photo-${meta.cardImage}?auto=format&fit=crop&q=80&w=800`;
    }
    return 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=800';
}
