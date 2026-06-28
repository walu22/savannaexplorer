import fs from 'node:fs';

const parksPath = new URL('../data/parks.json', import.meta.url);
const parks = JSON.parse(fs.readFileSync(parksPath, 'utf8'));

/** @type {Record<string, import('../data/parks.json').ParkFeeTable>} */
const FEE_TABLES = {
    kruger: {
        currency: 'ZAR', symbol: 'R', period: '2025/26',
        rows: [
            { category: 'person', label: 'International adult', amount: '486', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '243', unit: 'day' },
            { category: 'person', label: 'Child (2–11)', amount: '243', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: 'Included', unit: 'day', note: 'In daily conservation fee' },
            { category: 'camping', label: 'Rest camp site', amount: '400+', unit: 'night', note: 'Plus conservation fee; Wild Card available' },
        ],
    },
    'table-mountain': {
        currency: 'ZAR', symbol: 'R', period: '2025',
        rows: [
            { category: 'activity', label: 'Cableway return (international)', amount: '420+', unit: 'trip' },
            { category: 'person', label: 'Boulders Beach entry', amount: '190+', unit: 'day' },
            { category: 'person', label: 'TMNP conservation (where applicable)', amount: 'Varies', unit: 'day' },
        ],
    },
    addo: {
        currency: 'ZAR', symbol: 'R', period: '2025/26',
        rows: [
            { category: 'person', label: 'International adult', amount: '376', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '188', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: 'Included', unit: 'day' },
            { category: 'camping', label: 'Camp site', amount: '350+', unit: 'night', note: 'Plus conservation fee' },
        ],
    },
    etosha: {
        currency: 'NAD', symbol: 'N$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '142', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '80', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '30', unit: 'day' },
            { category: 'camping', label: 'Camp site', amount: '300+', unit: 'night', note: 'Plus park fees' },
        ],
    },
    'namib-naukluft': {
        currency: 'NAD', symbol: 'N$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '142', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '80', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '30', unit: 'day' },
            { category: 'camping', label: 'Sesriem camp', amount: '350+', unit: 'night', note: 'Book via NWR' },
        ],
    },
    'skeleton-coast': {
        currency: 'NAD', symbol: 'N$', period: '2025',
        rows: [
            { category: 'permit', label: 'Park permit', amount: 'Required', unit: 'trip', note: 'Via NWR or licensed operator' },
            { category: 'person', label: 'International adult (where applicable)', amount: '142+', unit: 'day' },
            { category: 'vehicle', label: '4×4 vehicle fee', amount: '30+', unit: 'day' },
        ],
    },
    chobe: {
        currency: 'BWP', symbol: 'P', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '120', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '60', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '10', unit: 'day' },
            { category: 'activity', label: 'River cruise', amount: 'Separate', unit: 'trip', note: 'Book via operators' },
        ],
    },
    moremi: {
        currency: 'BWP', symbol: 'P', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '120', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '60', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '10', unit: 'day' },
            { category: 'activity', label: 'Mokoro excursion', amount: 'Via lodge', unit: 'trip' },
        ],
    },
    'central-kalahari': {
        currency: 'BWP', symbol: 'P', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '50', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '30', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '10', unit: 'day' },
            { category: 'camping', label: 'Remote camp', amount: 'Minimal', unit: 'night', note: 'Self-sufficient 4×4 required' },
        ],
    },
    'south-luangwa': {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '30', unit: 'day' },
            { category: 'person', label: 'SADC / resident', amount: '15', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '15', unit: 'day' },
            { category: 'activity', label: 'Walking safari', amount: 'Guide required', unit: 'trip' },
        ],
    },
    kafue: {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '20', unit: 'day' },
            { category: 'person', label: 'SADC / resident', amount: '10', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '10', unit: 'day' },
            { category: 'camping', label: 'Busanga Plains (seasonal)', amount: 'Via lodge', unit: 'night', note: 'Dry season only' },
        ],
    },
    'lower-zambezi': {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '20', unit: 'day' },
            { category: 'person', label: 'SADC / resident', amount: '10', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '10', unit: 'day' },
            { category: 'activity', label: 'Canoe safari', amount: 'Via lodge', unit: 'trip' },
        ],
    },
    hwange: {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '15', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '7', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '5', unit: 'day' },
            { category: 'camping', label: 'Main camp site', amount: '15+', unit: 'night', note: 'Plus park fees' },
        ],
    },
    'mana-pools': {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '15', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '7', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '5', unit: 'day' },
            { category: 'permit', label: 'Walking permit', amount: 'Required', unit: 'trip', note: 'Licensed guide mandatory' },
        ],
    },
    gonarezhou: {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '15', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '7', unit: 'day' },
            { category: 'vehicle', label: '4×4 vehicle', amount: '5', unit: 'day' },
            { category: 'camping', label: 'Remote camp', amount: '10+', unit: 'night', note: 'Self-drive 4×4 essential' },
        ],
    },
    gorongosa: {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '20', unit: 'day' },
            { category: 'person', label: 'Resident / SADC', amount: '10', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '5', unit: 'day' },
            { category: 'activity', label: 'Guided game drive', amount: 'Recommended', unit: 'trip' },
        ],
    },
    bazaruto: {
        currency: 'MZN', symbol: 'MT', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '700+', unit: 'day' },
            { category: 'activity', label: 'Dive / snorkel permit', amount: 'Varies', unit: 'trip' },
            { category: 'activity', label: 'Dhow excursion', amount: 'Via operator', unit: 'trip' },
        ],
    },
    quirimbas: {
        currency: 'MZN', symbol: 'MT', period: '2025',
        rows: [
            { category: 'person', label: 'Park entry', amount: 'Via lodge', unit: 'day', note: 'Fly-in packages often include fees' },
            { category: 'activity', label: 'Boat transfer', amount: 'Operator rate', unit: 'trip' },
        ],
    },
    liwonde: {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '25', unit: 'day' },
            { category: 'person', label: 'SADC / resident', amount: '12', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '5', unit: 'day' },
            { category: 'activity', label: 'Boat safari', amount: 'Separate', unit: 'trip' },
        ],
    },
    nyika: {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '20', unit: 'day' },
            { category: 'person', label: 'SADC / resident', amount: '10', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '5', unit: 'day' },
            { category: 'camping', label: 'Plateau camp', amount: '15+', unit: 'night' },
        ],
    },
    'lake-malawi': {
        currency: 'USD', symbol: '$', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '10', unit: 'day' },
            { category: 'person', label: 'SADC / resident', amount: '5', unit: 'day' },
            { category: 'activity', label: 'Snorkelling (Cape Maclear)', amount: '5+', unit: 'day' },
        ],
    },
    sehlathebe: {
        currency: 'LSL', symbol: 'M', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '100', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '50', unit: 'day' },
            { category: 'vehicle', label: '4×4 vehicle', amount: '50', unit: 'day' },
            { category: 'camping', label: 'Backpack camp', amount: '80+', unit: 'night' },
        ],
    },
    tsenhlanyane: {
        currency: 'LSL', symbol: 'M', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '50', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '25', unit: 'day' },
            { category: 'camping', label: 'Camp site', amount: '60+', unit: 'night' },
        ],
    },
    bokong: {
        currency: 'LSL', symbol: 'M', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '50', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '25', unit: 'day' },
            { category: 'camping', label: 'Plateau camp', amount: '60+', unit: 'night' },
        ],
    },
    hlane: {
        currency: 'SZL', symbol: 'E', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '250', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '125', unit: 'day' },
            { category: 'vehicle', label: 'Foreign vehicle', amount: '50', unit: 'day' },
            { category: 'activity', label: 'Guided lion drive', amount: 'Extra', unit: 'trip' },
        ],
    },
    mlilwane: {
        currency: 'SZL', symbol: 'E', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '80', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '40', unit: 'day' },
            { category: 'activity', label: 'Walking / cycling', amount: 'Included', unit: 'day' },
        ],
    },
    malolotja: {
        currency: 'SZL', symbol: 'E', period: '2025',
        rows: [
            { category: 'person', label: 'International adult', amount: '50', unit: 'day' },
            { category: 'person', label: 'SADC adult', amount: '25', unit: 'day' },
            { category: 'activity', label: 'Canopy tour', amount: 'Separate', unit: 'trip' },
            { category: 'camping', label: 'Camp site', amount: '40+', unit: 'night' },
        ],
    },
};

for (const park of parks) {
    const table = FEE_TABLES[park.id];
    if (table) park.feeTable = table;
    else console.warn(`No fee table for ${park.id}`);
}

fs.writeFileSync(parksPath, `${JSON.stringify(parks, null, 2)}\n`);
console.log(`Updated fee tables for ${parks.length} parks.`);
