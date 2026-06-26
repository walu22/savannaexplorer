const countryGuideExtensions = {
    namibia: {
        wildlife: 'East of the Namib lies the Great Escarpment — mountain ranges rising to 2,000 metres. The Central Highlands around Windhoek (1,700m) give way to the Kalahari basin in the east. The Zambezi (Caprivi) region offers lush wetlands with crocodiles, hippos, and sable antelope found nowhere else in Namibia. Namibia was the first country to enshrine environmental protection in its constitution. Community conservancies have driven remarkable wildlife recoveries — desert-adapted elephants, lions, and black rhinos thrive in Damaraland and Kaokoland.',
        seasons: [
            { name: 'Summer (Nov–Apr)', icon: '🌧️', desc: 'Higher temperatures and seasonal rains from January. Landscapes turn green and lush. Wildlife can be harder to spot as vegetation thickens.' },
            { name: 'Autumn (Apr–May)', icon: '🍂', desc: 'Dry and moderate temperatures. The landscape slowly loses its green. Excellent transitional season for photography.' },
            { name: 'Winter (Jun–Aug)', icon: '❄️', desc: 'Peak safari season. Wildlife congregates at waterholes making game viewing exceptional. Evenings can be cold, especially in the south.' },
            { name: 'Spring (Sep–Oct)', icon: '🌤️', desc: 'Dry and warming. Outstanding wildlife viewing continues. Ideal for combining Etosha with coastal Swakopmund.' }
        ],
        packing: ['Binoculars', 'Neutral-tone safari clothing', 'Headlamp / torch', 'DEET insect repellent', 'Sun hat & SPF 50', 'Camera with zoom lens', 'Reusable water bottle (5L)', 'Warm layers for desert nights', 'Power bank', 'Travel adapter (Type M)'],
        dayNarrative: [
            'Wake to the sound of distant lions as the first light turns the Namib dunes gold. Brew coffee over last night\'s coals before packing camp.',
            'Hit the gravel road through ever-changing landscapes — from desert to escarpment to savanna — keeping watch for kudu and springbok.',
            'Arrive at a waterhole in Etosha as elephants, zebra, and giraffe gather in the golden afternoon light.',
            'At sunset, the sky erupts in colour over the vast salt pan. Dinner around a campfire with a cold Windhoek Lager under a canopy of stars.'
        ],
        activityCategories: [
            { name: 'Safari', icon: '🦁', items: ['Game drives in Etosha & Namib-Naukluft', 'Walking safaris in Damaraland', 'Rhino tracking on foot', 'Night drives at private reserves'] },
            { name: 'Adventure', icon: '🏜️', items: ['Sandboarding in Swakopmund', 'Quad biking on coastal dunes', 'Skydiving over the desert', 'Fish River Canyon hiking'] },
            { name: 'Up in the Air', icon: '🎈', items: ['Hot air balloon over Sossusvlei', 'Scenic flights over Skeleton Coast', 'Light aircraft transfers'] },
            { name: 'Culture', icon: '🏛️', items: ['Himba village visits', 'San rock art at Twyfelfontein', 'Swakopmund colonial architecture', 'Living museums in Damaraland'] }
        ],
        practical: {
            language: 'English is the official language. Afrikaans is widely spoken. Indigenous languages include Oshiwambo, Nama-Damara, and Khoisan click languages.',
            electricity: '220/240V. Three-pin Type M plugs (same as South Africa). Power failures are rare but a headlamp is useful.',
            sim: 'Buy a pre-paid Namibian SIM (MTC or Telecom) for remote areas. Most lodges offer free Wi-Fi.',
            time: 'UTC+2 year-round (no daylight saving). Plan around national park gate opening times — distances are vast.'
        }
    },
    'south-africa': {
        wildlife: 'South Africa hosts the Big Five in world-renowned reserves like Kruger and Hluhluwe-iMfolozi. The Cape Floral Kingdom is the smallest and richest of the world\'s six floral kingdoms. Marine life includes southern right whales (Hermanus), great white sharks (Gansbaai), and African penguins (Boulders Beach). The Drakensberg shelters bearded vultures and endemic eland.',
        seasons: [
            { name: 'Summer (Nov–Mar)', icon: '☀️', desc: 'Peak season for Cape Town and the coast. Hot in the interior. Afternoon thunderstorms in the bushveld.' },
            { name: 'Autumn (Apr–May)', icon: '🍂', desc: 'Mild temperatures across the country. Excellent for Cape Winelands and Garden Route.' },
            { name: 'Winter (Jun–Aug)', icon: '❄️', desc: 'Best for safari in Kruger and KwaZulu-Natal. Cape Town is rainy but whale season begins.' },
            { name: 'Spring (Sep–Oct)', icon: '🌸', desc: 'Wildflowers bloom in the West Coast and Namaqualand. Ideal safari conditions in the north.' }
        ],
        packing: ['Binoculars', 'Layers for variable climate', 'Rain jacket (Cape winter)', 'Sunscreen SPF 50', 'Comfortable walking shoes', 'Anti-malaria meds (if visiting Kruger)', 'Camera with telephoto lens', 'Travel adapter (Type M/N)'],
        dayNarrative: [
            'Start with sunrise on Table Mountain before heading east into the Winelands for a morning tasting.',
            'Drive the Garden Route through ancient forests with stops at secluded beaches and lagoons.',
            'Enter Kruger at dawn for a full-day game drive — lion, leopard, and rhino sightings are daily possibilities.',
            'End the day at a bushveld lodge with a traditional braai under the southern constellations.'
        ],
        activityCategories: [
            { name: 'Safari', icon: '🦁', items: ['Big Five game drives in Kruger', 'Walking safaris in Hluhluwe', 'Marine safari in Hermanus', 'Pilanesberg day trips from Johannesburg'] },
            { name: 'Adventure', icon: '🏄', items: ['Shark cage diving in Gansbaai', 'Bungee at Bloukrans Bridge', 'Surfing in Jeffrey\'s Bay', 'Hiking the Drakensberg Amphitheatre'] },
            { name: 'Culture', icon: '🏛️', items: ['Robben Island tour', 'Soweto township experience', 'Cape Malay cooking class', 'Zulu cultural village in KZN'] },
            { name: 'Wine & Food', icon: '🍷', items: ['Stellenbosch wine tram', 'Franschhoek culinary trail', 'Constantia wine estates', 'Bo-Kaap spice tour'] }
        ],
        practical: {
            language: '11 official languages. English is widely spoken in tourism. Afrikaans, Zulu, and Xhosa are common.',
            electricity: '230V, 50Hz. Type M (three-round-pin) and Type N plugs.',
            sim: 'Pre-paid SIM cards (Vodacom, MTN, Cell C) available at airports. Good coverage in cities and along major routes.',
            time: 'UTC+2 (SAST). No daylight saving.'
        }
    },
    botswana: {
        wildlife: 'Botswana protects 17% of its land as national parks and reserves. The Okavango Delta — a UNESCO World Heritage Site — supports enormous elephant, hippo, and red lechwe populations. Chobe has Africa\'s highest elephant density. The Central Kalahari shelters black-maned lions and the ancestral lands of the San people.',
        seasons: [
            { name: 'Green Season (Nov–Mar)', icon: '🌧️', desc: 'Afternoon rains transform the landscape. Excellent birding and lower prices. Some remote roads may be challenging.' },
            { name: 'Shoulder (Apr–May)', icon: '🍂', desc: 'Rains end, landscape remains green. Good wildlife viewing with fewer visitors.' },
            { name: 'Dry Season (Jun–Oct)', icon: '☀️', desc: 'Peak season. Delta floods arrive. Wildlife concentrates at permanent water — outstanding game viewing.' },
            { name: 'Hot Season (Oct–Nov)', icon: '🔥', desc: 'Hottest months before the rains. Exceptional predator sightings as prey weakens.' }
        ],
        packing: ['Binoculars', 'Light neutral clothing', 'Warm jacket (winter mornings)', 'Malaria prophylaxis', 'Insect repellent', 'Soft duffel bag (bush flight limit 20kg)', 'Headlamp', 'Camera with zoom lens'],
        dayNarrative: [
            'Wake in a remote Delta camp to the call of fish eagles at sunrise.',
            'Glide through papyrus channels in a mokoro, spotting tiny reed frogs and thirsty elephants.',
            'Afternoon 4×4 drive through Moremi as lions rest in the shade of acacia trees.',
            'Sundowners on the deck as hippos grunt in the lagoon and the Milky Way emerges overhead.'
        ],
        activityCategories: [
            { name: 'Safari', icon: '🦁', items: ['Mokoro excursions in the Delta', 'Chobe river cruises', 'Walking safaris in Moremi', 'Fly-in camp transfers'] },
            { name: 'Adventure', icon: '🛶', items: ['Multi-day canoe trails on the Selinda Spillway', 'Quad biking on the Makgadikgadi Pans', 'Horseback safaris in the Delta', 'Sleeping under baobabs on the salt pans'] },
            { name: 'Culture', icon: '🏛️', items: ['San bush walk in the Kalahari', 'Village visits near Maun', 'Traditional basket weaving demonstrations'] }
        ],
        practical: {
            language: 'English and Setswana are official languages. Guides speak excellent English.',
            electricity: '230V. Type G plugs (British standard) at most lodges. Solar power common in remote camps.',
            sim: 'Limited coverage in remote areas. Lodges use satellite communication. Buy a SIM in Maun or Kasane.',
            time: 'UTC+2 (Central Africa Time). No daylight saving.'
        }
    },
    zambia: {
        wildlife: 'Zambia\'s high plateau is cut by the Zambezi, Kafue, and Luangwa rivers — creating diverse habitats from mopane woodland to riverine forest. South Luangwa is the birthplace of the walking safari and holds one of Africa\'s highest leopard densities. The Bangweulu Wetlands shelter the prehistoric shoebill stork, while Kasanka hosts the world\'s largest mammal migration of fruit bats.',
        seasons: [
            { name: 'Emerald Season (Nov–Apr)', icon: '🌧️', desc: 'Green landscapes, newborn animals, and exceptional birding. Some remote camps close. Lower prices and fewer visitors.' },
            { name: 'Shoulder (May–Jun)', icon: '🍂', desc: 'Rains end, bush thins out. Excellent photography and transitioning wildlife viewing.' },
            { name: 'Dry Season (Jul–Oct)', icon: '☀️', desc: 'Peak safari season. Wildlife concentrates at the Luangwa River. Best time for walking safaris.' },
            { name: 'Hot (Oct–Nov)', icon: '🔥', desc: 'Hottest period before rains. Outstanding predator sightings near dwindling water sources.' }
        ],
        activityCategories: [
            { name: 'Safari', icon: '🦁', items: ['Walking safaris in South Luangwa', 'Canoe safaris on the Lower Zambezi', 'Night drives for leopard', 'Boat cruises on the Kafue'] },
            { name: 'Adventure', icon: '🌊', items: ['Devil\'s Pool swim at Victoria Falls', 'White-water rafting below the falls', 'Microlight flights over the Zambezi', 'Bat migration viewing at Kasanka'] },
            { name: 'Culture', icon: '🏛️', items: ['Kuomboka royal ceremony (March/April)', 'Village visits in the Luangwa Valley', 'Lozi cultural experiences'] }
        ]
    },
    zimbabwe: {
        wildlife: 'Zimbabwe protects over 10% of its land as national parks. Hwange hosts one of Africa\'s largest elephant populations. Mana Pools is a UNESCO site famous for elephants standing on hind legs to reach acacia pods. Matobo Hills shelters both black and white rhino among granite boulders. Zimbabwe trains some of the continent\'s finest safari guides.',
        activityCategories: [
            { name: 'Safari', icon: '🦁', items: ['Walking safaris in Mana Pools', 'Hwange waterhole game viewing', 'Matobo rhino tracking', 'Houseboat safaris on Lake Kariba'] },
            { name: 'Adventure', icon: '🎯', items: ['Victoria Falls bungee and bridge swing', 'White-water rafting (Grade 5)', 'Helicopter flights over the falls', 'Tiger fishing on the Zambezi'] },
            { name: 'Culture', icon: '🏛️', items: ['Great Zimbabwe ruins tour', 'Shona sculpture workshops', 'Traditional dance performances'] }
        ]
    },
    mozambique: {
        wildlife: 'Gorongosa National Park is Africa\'s most successful rewilding story — lion, wild dog, and elephant populations have rebounded dramatically. The 2,500km coastline supports dugongs, whale sharks, manta rays, and over 1,200 fish species on pristine coral reefs.',
        activityCategories: [
            { name: 'Ocean', icon: '🐠', items: ['Whale shark swimming at Tofo', 'Dhow sailing in the Bazaruto Archipelago', 'Scuba diving on Quirimbas reefs', 'Deep-sea fishing off Vilanculos'] },
            { name: 'Safari', icon: '🦁', items: ['Gorongosa game drives', 'Niassa Reserve fly-in safaris', 'Elephant Coast bush walks'] },
            { name: 'Culture', icon: '🏛️', items: ['Ilha de Moçambique UNESCO tour', 'Maputo art deco architecture walk', 'Peri-peri seafood trail'] }
        ]
    },
    malawi: {
        wildlife: 'Lake Malawi contains more fish species than any other lake on Earth — over 1,000 endemic cichlids. Liwonde and Majete have been rewilded with the Big Five. Nyika Plateau shelters leopards, roan antelope, and over 200 orchid species in a landscape resembling the Scottish Highlands.',
        activityCategories: [
            { name: 'Lake & Water', icon: '🏊', items: ['Snorkelling with cichlids at Cape Maclear', 'Kayaking to Domwe Island', 'Shire River boat safaris', 'Dhow cruises at sunset'] },
            { name: 'Mountain', icon: '⛰️', items: ['Mount Mulanje multi-day trek', 'Nyika Plateau horse riding', 'Zomba Plateau hiking'] },
            { name: 'Safari', icon: '🦁', items: ['Liwonde elephant boat safaris', 'Majete Big Five tracking', 'Black rhino sanctuary walks'] }
        ]
    },
    lesotho: {
        wildlife: 'Lesotho\'s alpine ecosystems support bearded vultures, black eagles, and the endemic Maluti minnow. Sehlabathebe National Park protects unique high-altitude wetlands and endemic flora. The rugged mountains are home to hardy Basotho ponies rather than big game.',
        activityCategories: [
            { name: 'Mountain', icon: '⛰️', items: ['Sani Pass 4×4 ascent', 'Pony trekking in Malealea', 'Drakensberg peak hiking', 'Seasonal skiing at Afriski'] },
            { name: 'Adventure', icon: '🧗', items: ['Abseiling Maletsunyane Falls', 'Mountain biking trails', 'Rock climbing at Waterval Boven'] },
            { name: 'Culture', icon: '🏛️', items: ['Thaba Bosiu historical fortress', 'Basotho hat and blanket workshops', 'San rock art tours'] }
        ]
    },
    eswatini: {
        wildlife: 'Despite its small size, Eswatini protects remarkable biodiversity. Hlane and Mkhaya are among Africa\'s best rhino tracking destinations. Mlilwane offers vehicle-free walking and horseback safaris among zebra and wildebeest.',
        activityCategories: [
            { name: 'Safari', icon: '🦁', items: ['Rhino tracking on foot at Mkhaya', 'Big Five in Hlane Royal NP', 'Horseback safari in Mlilwane', 'Night drives for leopard'] },
            { name: 'Culture', icon: '🏛️', items: ['Umhlanga Reed Dance (August/September)', 'Mantenga cultural village', 'Ngwenya Glass workshop tour', 'Swazi craft market trail'] },
            { name: 'Adventure', icon: '🧗', items: ['Gobholo cave exploration', 'White-water rafting on the Usutu', 'Zip-lining in the Ezulwini Valley'] }
        ]
    }
};

const defaultPacking = ['Binoculars', 'Neutral-tone clothing', 'Insect repellent', 'Sun hat & SPF 50', 'Headlamp / torch', 'Power bank', 'Camera', 'Reusable water bottle', 'Travel adapter', 'Copies of passport'];

const defaultSeasons = [
    { name: 'Wet Season', icon: '🌧️', desc: 'Higher rainfall and lush landscapes. Wildlife disperses but birding is excellent and prices are lower.' },
    { name: 'Shoulder Season', icon: '🍂', desc: 'Transitional weather with moderate temperatures. Good balance of wildlife viewing and value.' },
    { name: 'Dry Season', icon: '☀️', desc: 'Peak safari conditions. Wildlife congregates at water sources. Book accommodation well in advance.' },
    { name: 'Cool Season', icon: '❄️', desc: 'Milder temperatures, especially at altitude. Comfortable for hiking and cultural exploration.' }
];

const defaultActivityCategories = [
    { name: 'Safari & Wildlife', icon: '🦁', items: ['Game drives in national parks', 'Walking safaris with armed guides', 'Boat-based wildlife viewing', 'Birdwatching excursions'] },
    { name: 'Adventure', icon: '🏔️', items: ['Hiking and trekking', 'Water sports and rafting', 'Mountain biking', 'Rock climbing and abseiling'] },
    { name: 'Culture', icon: '🏛️', items: ['Traditional village visits', 'Local market tours', 'Museum and heritage sites', 'Festival and ceremony experiences'] }
];

function getCountryGuide(countryId, baseData) {
    const ext = countryGuideExtensions[countryId] || {};
    const advice = baseData.advice || {};
    const flavor = baseData.localFlavor || {};

    return {
        wildlife: ext.wildlife || `Southern Africa's diverse ecosystems support an extraordinary range of wildlife. ${baseData.about.geo} Key species include elephants, predators, antelope, and hundreds of bird species across national parks and reserves.`,
        seasons: ext.seasons || defaultSeasons.map(s => ({
            ...s,
            desc: s.name.includes('Dry') ? advice.climate : s.desc
        })),
        packing: ext.packing || defaultPacking,
        dayNarrative: ext.dayNarrative || [
            'Wake to the sounds of the African bush as golden light filters through the acacia trees.',
            'Set out on a morning game drive or cultural excursion with your expert local guide.',
            'Enjoy a leisurely afternoon — swim, read, or explore a nearby village or market.',
            'As the sun sets, gather for dinner and share stories under a brilliant star-filled sky.'
        ],
        activityCategories: ext.activityCategories || defaultActivityCategories,
        practical: ext.practical || {
            language: 'English is widely spoken in tourist areas. Learning a local greeting is always appreciated.',
            electricity: '220–240V. Check plug type before travel — Type M/G is common across Southern Africa.',
            sim: 'Pre-paid SIM cards available at airports and major towns. Coverage varies in remote parks.',
            time: 'Most Southern African countries use UTC+2 with no daylight saving.'
        },
        food: flavor.food || 'Local cuisine features maize-based staples paired with grilled meats, fresh vegetables, and regional specialties.',
        tipping: advice.tipping || '10% in restaurants. $10–15 per day for safari guides is customary.',
        health: advice.health || advice.safety || 'Consult your doctor about vaccinations and malaria prophylaxis before travel.'
    };
}
