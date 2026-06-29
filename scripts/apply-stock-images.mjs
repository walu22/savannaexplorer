/**
 * Apply verified stock images from data/image-catalog.json across the site.
 * Run: node scripts/apply-stock-images.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const catalog = JSON.parse(readFileSync(resolve(root, 'data/image-catalog.json'), 'utf8'));
const I = catalog.images;

function url(id, w = 800) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;
}

const countryCards = {
    namibia: I.sossusvleiDunes,
    'south-africa': I.tableMountainSunset,
    botswana: I.okavangoDelta,
    zambia: I.victoriaFallsSunrise,
    zimbabwe: I.victoriaFalls2025,
    mozambique: I.tropicalBeach,
    malawi: I.lakeMalawi,
    lesotho: I.saniPass,
    eswatini: I.zebraWildlife,
};

const spotImages = {
    'Sossusvlei & Deadvlei': I.deadvlei,
    'Etosha National Park': I.elephants,
    'Fish River Canyon': I.canyonGorge,
    Spitzkoppe: I.rockFormations,
    'Zambezi Region': I.riverBoat,
    Swakopmund: I.namibOrangeDunes,
    'Kruger National Park': I.krugerSafari,
    'Cape Town & Table Mountain': I.tableMountain,
    'The Garden Route': I.gardenRoute,
    'The Drakensberg (uKhahlamba)': I.mountains,
    'Cape Winelands': I.vineyard,
    'Okavango Delta (UNESCO)': I.okavangoDelta,
    'Chobe National Park': I.elephants,
    'Makgadikgadi salt pans': I.zebraWildlife,
    'Moremi Game Reserve': I.savannaWildlife,
    'Central Kalahari': I.safariVehicle,
    'Victoria Falls (Mosi-oa-Tunya)': I.victoriaFalls,
    'South Luangwa National Park': I.savannaWildlife,
    'Lower Zambezi National Park': I.riverBoat,
    'Kasanka (The Bat Migration)': I.hikingTrail,
    'Bangweulu (The Shoebill Stork)': I.riverBoat,
    'Nsumbu & Lake Tanganyika': I.lakeMalawi,
    'Hwange National Park': I.elephants,
    'Mana Pools (UNESCO)': I.riverBoat,
    'Lake Kariba': I.boatCruise,
    'Matobo Hills': I.rockFormations,
    'Bazaruto Archipelago': I.tropicalBeach,
    'Tofo Beach & Vilanculos': I.marineWildlife,
    'Gorongosa National Park': I.safariVehicle,
    Maputo: I.urbanAfrica,
    'Ibo Island (Quirimbas)': I.tropicalBeach,
    'Lake Malawi (UNESCO)': I.lakeMalawi,
    'Mount Mulanje': I.mountains,
    'Liwonde National Park': I.elephants,
    'Majete Wildlife Reserve': I.safariVehicle,
    'Nyika Plateau': I.hikingTrail,
    'Maletsunyane Falls': I.canyonGorge,
    'Sani Pass': I.mountains,
    'Sehlabathebe National Park': I.hikingTrail,
    'Katse Dam': I.mountains,
    'Thaba Bosiu': I.rockFormations,
    'Hlane Royal National Park': I.safariVehicle,
    'Mlilwane Wildlife Sanctuary': I.zebraWildlife,
    'Mantenga Cultural Village': I.culturalVillage,
    'Mkhaya Game Reserve': I.elephants,
    'Ngwenya Glass & Craft Markets': I.culturalVillage,
    'Skeleton Coast National Park': I.marineOcean,
    'Twyfelfontein Rock Engravings': I.rockFormations,
    'Damaraland & Palmwag Concession': I.elephants,
    'Lüderitz & Kolmanskop Ghost Town': I.namibOrangeDunes,
    'Addo Elephant National Park': I.elephants,
    'iSimangaliso Wetland Park': I.tropicalBeach,
    'Pilanesberg Game Reserve': I.safariVehicle,
    'Cederberg Wilderness Area': I.mountains,
    'Tsodilo Hills': I.rockFormations,
    'Khwai Community Concession': I.okavangoDelta,
    'Nxai Pan National Park': I.zebraWildlife,
    'Tuli Block': I.savannaWildlife,
    'Kafue National Park': I.savannaWildlife,
    'Liuwa Plain National Park': I.zebraWildlife,
    "Livingstone Island & Devil's Pool": I.victoriaFalls,
    "Shiwa Ng'andu Manor House": I.culturalVillage,
    'Gonarezhou National Park': I.savannaWildlife,
    'Great Zimbabwe National Monument': I.rockFormations,
    'Eastern Highlands': I.mountains,
    'Matusadona National Park': I.boatCruise,
    'Quirimbas Archipelago': I.tropicalBeach,
    'Ponta do Ouro': I.marineWildlife,
    'Niassa Special Reserve': I.safariVehicle,
    'Mozambique Island (Ilha de Moçambique)': I.culturalVillage,
    'Cape Maclear & Lake Malawi National Park': I.lakeMalawi,
    'Likoma Island': I.lakeMalawi,
    'Zomba Plateau': I.mountains,
    'Nkhotakota Wildlife Reserve': I.riverBoat,
    'Afriski Mountain Resort': I.mountains,
    'Malealea Lodge & Pony Trek Centre': I.mountains,
    'Quthing Dinosaur Footprints': I.rockFormations,
    'Bokong Nature Reserve': I.hikingTrail,
    'Sibebe Rock': I.rockFormations,
    'Phophonyane Falls Ecolodge': I.canyonGorge,
    'Malolotja Nature Reserve': I.hikingTrail,
    'Mlawula Nature Reserve': I.savannaWildlife,
};

const activityImages = {
    'Sandboarding & Quad Biking': I.namibDunes,
    'Rhino Tracking': I.elephants,
    'Aerial Sossusvlei': I.sossusvleiAerial,
    'Skeleton Coast Fly-in': I.marineOcean,
    'Desert Safari': I.safariVehicle,
    'Big Five Safari': I.krugerSafari,
    'Shark Cage Diving': I.marineWildlife,
    'Marine Big Five Cruise': I.marineOcean,
    'Robben Island Tour': I.urbanAfrica,
    'Wine Tasting Safaris': I.vineyard,
    'Mokoro Safaris': I.okavangoDelta,
    'Fly-in Safaris': I.sossusvleiAerial,
    'Baobab Camping': I.zebraWildlife,
    'Chobe Boat Cruise': I.boatCruise,
    'San Cultural Walk': I.culturalVillage,
    'Walking Safaris': I.savannaWildlife,
    'The Kuomboka Festival': I.culturalVillage,
    'Canoeing Safaris': I.riverBoat,
    "Devil's Pool Swim": I.victoriaFalls,
    'Conservation Tracking': I.elephants,
    'Bungee & Bridge Jump': I.victoriaFalls,
    'Elephant Interaction': I.elephants,
    'Great Zimbabwe Tour': I.rockFormations,
    'Tiger Fishing': I.riverBoat,
    'Swimming with Whale Sharks': I.marineWildlife,
    'Sunset Dhow Sailing': I.boatCruise,
    'Scuba Diving & Snorkeling': I.marineOcean,
    'Peri-Peri Seafood Trail': I.urbanAfrica,
    'Island Hopping': I.tropicalBeach,
    'Snorkeling with Cichlids': I.lakeMalawi,
    'Mulanje Peak Trek': I.mountains,
    'Shire River Boat Safari': I.riverBoat,
    'Tea Estate Tasting': I.hikingTrail,
    'Kayaking to Domwe Island': I.lakeMalawi,
    'Pony Trekking': I.mountains,
    'Abseiling the Falls': I.canyonGorge,
    'Drakensberg Alpine Hiking': I.mountains,
    'Snow Skiing (Seasonal)': I.mountains,
    'San Rock Art Tours': I.rockFormations,
    'Rhino Tracking on Foot': I.elephants,
    'The Umhlanga (Reed Dance)': I.culturalVillage,
    'Ezulwini Valley Horse Back Safari': I.zebraWildlife,
    'Adventure Caving': I.rockFormations,
    'Swazi Craft Trail': I.culturalVillage,
    'Dune Boarding at Swakopmund': I.namibDunes,
    'Stargazing in the NamibRand': I.sossusvleiDunes,
    'Living Museum Cultural Visits': I.culturalVillage,
    'Township Tour with Local Guide': I.culturalVillage,
    'Cape Peninsula Cycling Tour': I.urbanAfrica,
    'Panorama Route Day Trip': I.mountains,
    'Helicopter Delta Flight': I.okavangoDelta,
    'Meerkat Habituation Walk': I.zebraWildlife,
    'Catch-and-Release Tiger Fishing': I.riverBoat,
    'Microlight Flight over Victoria Falls': I.victoriaFallsSunrise,
    'Busanga Plains Balloon Safari': I.sossusvleiAerial,
    'Village & Craft Tour in Mfuwe': I.culturalVillage,
    'White-Water Rafting below Victoria Falls': I.victoriaFalls,
    'Mana Pools Walking Safari': I.savannaWildlife,
    'Shona Sculpture Workshop Visit': I.culturalVillage,
    'Dhow Sunset Cruise': I.boatCruise,
    'Gorongosa Safari Drives': I.safariVehicle,
    'Maputo City Food Tour': I.urbanAfrica,
    'Cichlid Snorkelling Safari': I.lakeMalawi,
    'Mulanje Multi-Day Trek': I.mountains,
    'Fair Trade Tea Estate Tour': I.hikingTrail,
    'Sani Pass 4x4 Expedition': I.mountains,
    'Basotho Hat Craft Workshop': I.culturalVillage,
    'Katse Dam Engineering Tour': I.mountains,
    'Mkhaya Rhinoceros Walk': I.elephants,
    'Mantenga Cultural Village Performance': I.culturalVillage,
    'Ngwenya Glass Blowing Demo': I.culturalVillage,
};

const discoverImages = {
    'Kruger National Park': I.krugerSafari,
    'Etosha National Park': I.elephants,
    'Okavango Delta': I.okavangoDelta,
    'Victoria Falls': I.victoriaFalls,
    'Hwange National Park': I.savannaWildlife,
    'Bazaruto Archipelago': I.tropicalBeach,
    'Lake Malawi': I.lakeMalawi,
    'Sani Pass & Highlands': I.mountains,
    'Hlane Royal National Park': I.safariVehicle,
};

const itineraryImages = {
    'desert-to-delta': I.sossusvleiDunes,
    'coastal-explorer': I.tropicalBeach,
    'falls-beyond': I.victoriaFalls,
    'kingdom-circuit': I.mountains,
    'lake-mountain': I.lakeMalawi,
    'grand-safari': I.krugerSafari,
    'namibia-essentials': I.deadvlei,
    'south-africa-classic': I.vineyard,
    'botswana-delta-focus': I.okavangoDelta,
    'zambia-falls-safari': I.victoriaFallsSunrise,
    'zimbabwe-wilderness': I.savannaWildlife,
    'mozambique-bush-beach': I.marineOcean,
    'malawi-lake-safari': I.lakeMalawi,
    'lesotho-highlands': I.mountains,
    'eswatini-kingdom': I.culturalVillage,
};

const marketplaceImages = {
    saf1: I.krugerSafari,
    saf2: I.okavangoDelta,
    saf3: I.elephants,
    saf4: I.savannaWildlife,
    saf5: I.safariVehicle,
    saf6: I.riverBoat,
    saf7: I.safariVehicle,
    saf8: I.savannaWildlife,
    adv1: I.namibDunes,
    adv2: I.victoriaFalls,
    adv3: I.marineWildlife,
    adv4: I.mountains,
    adv5: I.lakeMalawi,
    adv6: I.hikingTrail,
    adv7: I.riverBoat,
    cul1: I.culturalVillage,
    cul2: I.vineyard,
    cul3: I.rockFormations,
    cul4: I.urbanAfrica,
    cul5: I.culturalVillage,
    cul6: I.mountains,
    cul7: I.culturalVillage,
    cul8: I.victoriaFallsSunrise,
    nat1: I.victoriaFalls2025,
    nat2: I.mountains,
    nat3: I.zebraWildlife,
    nat4: I.tropicalBeach,
    nat5: I.lakeMalawi,
    nat6: I.hikingTrail,
    nat7: I.sossusvleiAerial,
    nat8: I.riverBoat,
};

function applyImageFields(items, map, field = 'image') {
    for (const item of items || []) {
        if (map[item.name] || map[item.id]) {
            item[field] = map[item.name] || map[item.id];
        }
    }
}

// countries.json
const countries = JSON.parse(readFileSync(resolve(root, 'data/countries.json'), 'utf8'));
for (const data of Object.values(countries)) {
    applyImageFields(data.spots, spotImages);
    applyImageFields(data.activities, activityImages);
}
writeFileSync(resolve(root, 'data/countries.json'), JSON.stringify(countries, null, 2) + '\n');

// country-depth.json
const depth = JSON.parse(readFileSync(resolve(root, 'data/country-depth.json'), 'utf8'));
for (const data of Object.values(depth)) {
    applyImageFields(data.additionalSpots, spotImages);
    applyImageFields(data.additionalActivities, activityImages);
}
writeFileSync(resolve(root, 'data/country-depth.json'), JSON.stringify(depth, null, 2) + '\n');

// discover.json
const discover = JSON.parse(readFileSync(resolve(root, 'data/discover.json'), 'utf8'));
for (const dest of discover.topDestinations) {
    if (discoverImages[dest.name]) dest.image = discoverImages[dest.name];
}
writeFileSync(resolve(root, 'data/discover.json'), JSON.stringify(discover, null, 2) + '\n');

// itineraries.json
const itineraries = JSON.parse(readFileSync(resolve(root, 'data/itineraries.json'), 'utf8'));
for (const [key, data] of Object.entries(itineraries)) {
    if (itineraryImages[key]) {
        data.mapImage = url(itineraryImages[key], 1200);
    }
}
writeFileSync(resolve(root, 'data/itineraries.json'), JSON.stringify(itineraries, null, 2) + '\n');

// marketplace.json
const marketplace = JSON.parse(readFileSync(resolve(root, 'data/marketplace.json'), 'utf8'));
for (const items of Object.values(marketplace)) {
    for (const item of items) {
        if (marketplaceImages[item.id]) {
            item.image = url(marketplaceImages[item.id]);
        }
    }
}
writeFileSync(resolve(root, 'data/marketplace.json'), JSON.stringify(marketplace, null, 2) + '\n');

// country-meta.js
let metaJs = readFileSync(resolve(root, 'js/lib/country-meta.js'), 'utf8');
for (const [countryId, imageId] of Object.entries(countryCards)) {
    const re = new RegExp(`('${countryId}':[\\s\\S]*?cardImage: ')[^']+(')`);
    metaJs = metaJs.replace(re, `$1${imageId}$2`);
}
writeFileSync(resolve(root, 'js/lib/country-meta.js'), metaJs);

// seo-data.mjs — keep prerender cardImage in sync
let seoData = readFileSync(resolve(root, 'scripts/lib/seo-data.mjs'), 'utf8');
for (const [countryId, imageId] of Object.entries(countryCards)) {
    const re = new RegExp(`((?:'${countryId}'|${countryId}):\\s*\\{[^}]*cardImage:\\s*')[^']+(')`);
    seoData = seoData.replace(re, `$1${imageId}$2`);
}
writeFileSync(resolve(root, 'scripts/lib/seo-data.mjs'), seoData);

// images.js fallbacks
let imagesJs = `const FALLBACK_HERO = '${url(I.heroSavanna)}';
const FALLBACK_ACTIVITY = '${url(I.safariVehicle, 300)}';

export function unsplashUrl(id, w = 800) {
    return \`https://images.unsplash.com/photo-\${id}?auto=format&fit=crop&q=80&w=\${w}\`;
}

export function spotImageUrl(spot) {
    if (spot.image) return unsplashUrl(spot.image);
    return FALLBACK_HERO;
}

export function activityImageUrl(act) {
    if (act.image) return unsplashUrl(act.image, 300);
    return FALLBACK_ACTIVITY;
}
`;
writeFileSync(resolve(root, 'js/lib/images.js'), imagesJs);

// index.html — hero + experience cards from catalog
const indexStockImages = {
    heroSavanna: { width: 1920 },
    expSafari: { key: 'krugerSafari', width: 800 },
    expAdventure: { key: 'namibDunes', width: 800 },
    expCulture: { key: 'culturalVillage', width: 800 },
    expNature: { key: 'victoriaFalls2025', width: 800 },
};

let indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');

for (const [slot, config] of Object.entries(indexStockImages)) {
    const imageKey = config.key || slot;
    const imageId = I[imageKey];
    if (!imageId) continue;
    const src = url(imageId, config.width || 800);
    indexHtml = indexHtml.replace(
        new RegExp(`(data-stock-image="${slot}"[^>]*src=")[^"]+(")`, 'g'),
        `$1${src}$2`,
    );
}
writeFileSync(resolve(root, 'index.html'), indexHtml);

// Regenerate supabase seed
const rows = Object.values(marketplace).flat().map((item) => {
    const esc = (s) => String(s).replace(/'/g, "''");
    return `    ('${item.id}', '${esc(item.title)}', '${item.category}', '${esc(item.location)}', '${esc(item.duration)}', '${item.price_range}', ${item.rating}, '${esc(item.badge)}', '${esc(item.best_time)}', '${esc(item.image)}', '${esc(item.description)}')`;
}).join(',\n');
const seedSql = `-- Seed marketplace experiences from data/marketplace.json
-- Run after schema.sql

insert into public.experiences (id, title, category, location, duration, price_range, rating, badge, best_time, image_url, description)
values
${rows}
on conflict (id) do update set
    title = excluded.title,
    category = excluded.category,
    location = excluded.location,
    duration = excluded.duration,
    price_range = excluded.price_range,
    rating = excluded.rating,
    badge = excluded.badge,
    best_time = excluded.best_time,
    image_url = excluded.image_url,
    description = excluded.description;
`;
writeFileSync(resolve(root, 'supabase/seed.sql'), seedSql);

console.log('Applied', Object.keys(I).length, 'verified stock images across the site.');
console.log('Updated: countries, country-depth, discover, itineraries, marketplace, country-meta, seo-data, images.js, index.html, seed.sql');
