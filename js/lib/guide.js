import guideExtensions from '../../data/guides.json';

const defaultPacking = [
    'Binoculars', 'Neutral-tone clothing', 'Insect repellent', 'Sun hat & SPF 50',
    'Headlamp / torch', 'Power bank', 'Camera', 'Reusable water bottle',
    'Travel adapter', 'Copies of passport',
];

const defaultSeasons = [
    { name: 'Wet Season', icon: '🌧️', desc: 'Higher rainfall and lush landscapes. Wildlife disperses but birding is excellent and prices are lower.' },
    { name: 'Shoulder Season', icon: '🍂', desc: 'Transitional weather with moderate temperatures. Good balance of wildlife viewing and value.' },
    { name: 'Dry Season', icon: '☀️', desc: 'Peak safari conditions. Wildlife congregates at water sources. Book accommodation well in advance.' },
    { name: 'Cool Season', icon: '❄️', desc: 'Milder temperatures, especially at altitude. Comfortable for hiking and cultural exploration.' },
];

const defaultActivityCategories = [
    { name: 'Safari & Wildlife', icon: '🦁', items: ['Game drives in national parks', 'Walking safaris with armed guides', 'Boat-based wildlife viewing', 'Birdwatching excursions'] },
    { name: 'Adventure', icon: '🏔️', items: ['Hiking and trekking', 'Water sports and rafting', 'Mountain biking', 'Rock climbing and abseiling'] },
    { name: 'Culture', icon: '🏛️', items: ['Traditional village visits', 'Local market tours', 'Museum and heritage sites', 'Festival and ceremony experiences'] },
];

export function getCountryGuide(countryId, baseData) {
    const ext = guideExtensions[countryId] || {};
    const advice = baseData.advice || {};
    const flavor = baseData.localFlavor || {};

    return {
        wildlife: ext.wildlife || `Southern Africa's diverse ecosystems support an extraordinary range of wildlife. ${baseData.about.geo} Key species include elephants, predators, antelope, and hundreds of bird species across national parks and reserves.`,
        seasons: ext.seasons || defaultSeasons.map(s => ({
            ...s,
            desc: s.name.includes('Dry') ? advice.climate : s.desc,
        })),
        packing: ext.packing || defaultPacking,
        dayNarrative: ext.dayNarrative || [
            'Wake to the sounds of the African bush as golden light filters through the acacia trees.',
            'Set out on a morning game drive or cultural excursion with your expert local guide.',
            'Enjoy a leisurely afternoon — swim, read, or explore a nearby village or market.',
            'As the sun sets, gather for dinner and share stories under a brilliant star-filled sky.',
        ],
        activityCategories: ext.activityCategories || defaultActivityCategories,
        practical: ext.practical || {
            language: 'English is widely spoken in tourist areas. Learning a local greeting is always appreciated.',
            electricity: '220–240V. Check plug type before travel — Type M/G is common across Southern Africa.',
            sim: 'Pre-paid SIM cards available at airports and major towns. Coverage varies in remote parks.',
            time: 'Most Southern African countries use UTC+2 with no daylight saving.',
        },
        food: flavor.food || 'Local cuisine features maize-based staples paired with grilled meats, fresh vegetables, and regional specialties.',
        tipping: advice.tipping || '10% in restaurants. $10–15 per day for safari guides is customary.',
        health: advice.health || advice.safety || 'Consult your doctor about vaccinations and malaria prophylaxis before travel.',
    };
}
