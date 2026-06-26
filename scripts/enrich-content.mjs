import fs from 'fs';
import path from 'path';

const root = path.resolve('data');

const guides = JSON.parse(fs.readFileSync(path.join(root, 'guides.json'), 'utf8'));
const countries = JSON.parse(fs.readFileSync(path.join(root, 'countries.json'), 'utf8'));
const itineraries = JSON.parse(fs.readFileSync(path.join(root, 'itineraries.json'), 'utf8'));

const guideEnrichments = {
  zambia: {
    packing: [
      'Binoculars', 'Neutral-tone safari clothing', 'DEET insect repellent',
      'Headlamp / torch', 'Malaria prophylaxis', 'Sun hat & SPF 50',
      'Camera with zoom lens', 'Soft duffel bag (bush flights)', 'US Dollars in small bills',
      'Travel adapter (Type C/D/G)', 'Reusable water bottle',
    ],
    dayNarrative: [
      'Wake to the roar of the Zambezi and the mist of Mosi-oa-Tunya rising above the treeline. Coffee on the veranda as the sun lights up the spray.',
      'Set out on foot with your scout in South Luangwa — track leopard prints in the soft sand and watch elephants cross the river.',
      'Drift silently in a canoe past pods of hippos on the Lower Zambezi, elephants bathing on the far bank.',
      'Sundowners on the river as fish eagles call. Dinner under the stars with stories from your guide and a cold Mosi Lager.',
    ],
    practical: {
      language: 'English is the official language. Bemba, Nyanja, Tonga, and Lozi are widely spoken. Guides speak excellent English.',
      electricity: '230V. Type C, D, and G plugs. Power cuts possible in cities; lodges have backup generators.',
      sim: 'Buy Airtel or MTN SIM at Lusaka or Livingstone airport. Coverage is good in towns; patchy in remote parks.',
      time: 'UTC+2 (CAT). No daylight saving. Bush flights require soft bags max 15–23kg.',
    },
  },
  zimbabwe: {
    seasons: [
      { name: 'Emerald Season (Nov–Apr)', icon: '🌧️', desc: 'Lush landscapes and newborn animals. Victoria Falls is at peak flow (Feb–May). Some Mana Pools camps close. Excellent birding.' },
      { name: 'Shoulder (May–Jun)', icon: '🍂', desc: 'Rains taper off. Falls remain impressive. Bush thins for improving game viewing.' },
      { name: 'Dry Season (Jul–Oct)', icon: '☀️', desc: 'Peak safari season. Hwange waterholes teem with elephant. Best walking safari conditions in Mana Pools.' },
      { name: 'Hot (Oct–Nov)', icon: '🔥', desc: 'Hottest and driest before rains. Predator action intensifies. Falls at lowest flow on the Zim side.' },
    ],
    packing: [
      'Binoculars', 'Neutral safari clothing', 'DEET insect repellent', 'Malaria tablets',
      'US Dollars (small denominations, post-2013 notes)', 'Headlamp', 'Sun hat & SPF 50',
      'Camera with telephoto lens', 'Warm layer for winter mornings', 'Soft bag for domestic flights',
    ],
    dayNarrative: [
      'Stand before the thundering curtain of Victoria Falls as the spray catches the morning rainbow.',
      'Game drive in Hwange to a hide at water level — hundreds of elephants arrive in the golden afternoon.',
      'Walk in Mana Pools with Zimbabwe\'s legendary guides, approaching elephants and wild dogs on foot.',
      'Sunset houseboat cruise on Lake Kariba as the drowned forest silhouettes against a copper sky.',
    ],
    practical: {
      language: 'English, Shona, and Ndebele are official languages. Tourism industry speaks fluent English.',
      electricity: '220/240V. Type D and G plugs. Load-shedding occurs in cities; lodges have backup power.',
      sim: 'Econet and NetOne SIM cards available in Harare and Victoria Falls. Buy data bundles for maps.',
      time: 'UTC+2 (CAT). KAZA Univisa ($50) covers Zambia/Zimbabwe cross-border day trips.',
    },
    activityCategories: [
      { name: 'Safari', icon: '🦁', items: ['Walking safaris in Mana Pools', 'Hwange waterhole game viewing', 'Matobo rhino tracking on foot', 'Houseboat safaris on Lake Kariba', 'Night drives for leopard and lion'] },
      { name: 'Adventure', icon: '🎯', items: ['Victoria Falls bungee and bridge swing', 'Grade 5 white-water rafting', 'Helicopter Flight of Angels', 'Tiger fishing on the Zambezi', 'Gorge swing and zipline'] },
      { name: 'Culture', icon: '🏛️', items: ['Great Zimbabwe ruins UNESCO tour', 'Shona sculpture village workshops', 'Traditional mbira music performances', 'Eastern Highlands tea estate visits'] },
      { name: 'Up in the Air', icon: '🚁', items: ['Helicopter over Victoria Falls', 'Microlight flights along the Batoka Gorge', 'Scenic flights over Hwange'] },
    ],
  },
  mozambique: {
    seasons: [
      { name: 'Wet Season (Nov–Apr)', icon: '🌧️', desc: 'Hot and humid with afternoon rains. Cyclone risk on the south coast Jan–Feb. Lush Gorongosa. Lower prices.' },
      { name: 'Shoulder (May)', icon: '🍂', desc: 'Rains end. Rivers still full. Transition period with fewer tourists.' },
      { name: 'Dry Season (Jun–Oct)', icon: '☀️', desc: 'Peak beach and safari season. Calm seas for diving. Best visibility for whale sharks at Tofo (Oct–Mar overlap).' },
      { name: 'Whale Season (Jun–Oct)', icon: '🐋', desc: 'Humpback whales migrate along the coast. Excellent for ocean safaris from Vilanculos and Inhambane.' },
    ],
    packing: [
      'Reef-safe sunscreen SPF 50', 'Swimsuit & rash vest', 'Snorkel mask (or rent locally)',
      'DEET insect repellent', 'Malaria prophylaxis', 'Light cotton clothing',
      'Waterproof phone pouch', 'US Dollars and South African Rands', 'Travel adapter (Type C/F/M)',
      'Motion sickness tablets for boat trips',
    ],
    dayNarrative: [
      'Wake to the sound of dhow rigging and turquoise water lapping the Bazaruto shore.',
      'Snorkel pristine reefs among sea turtles and tropical fish before a lunch of peri-peri prawns.',
      'Afternoon dhow sail at sunset as the archipelago turns gold and pink.',
      'Evening in Maputo — live marrabenta music, grilled seafood, and a cold 2M beer.',
    ],
    practical: {
      language: 'Portuguese is the official language. English is spoken in tourist areas and lodges. Swahili in the far north.',
      electricity: '220/240V. Type C, F, and M plugs. Power cuts common; lodges have generators.',
      sim: 'Vodacom and mCel SIM cards in Maputo. Buy data at airports and shopping centres.',
      time: 'UTC+2 (CAT). E-visa recommended before travel. 4x4 essential for Gorongosa and northern coast.',
    },
    activityCategories: [
      { name: 'Ocean', icon: '🐠', items: ['Whale shark swimming at Tofo', 'Dhow sailing in Bazaruto Archipelago', 'Scuba diving Quirimbas reefs', 'Deep-sea fishing off Vilanculos', 'Dugong spotting in Bazaruto'] },
      { name: 'Safari', icon: '🦁', items: ['Gorongosa game drives and wild dog tracking', 'Niassa Reserve fly-in safaris', 'Elephant Coast bush walks', 'Birding in Gorongosa floodplains'] },
      { name: 'Culture', icon: '🏛️', items: ['Ilha de Moçambique UNESCO walking tour', 'Maputo art deco and FEIMA craft market', 'Peri-peri seafood trail', 'Makonde wood carving workshops'] },
      { name: 'Adventure', icon: '🏄', items: ['Kitesurfing at Ponta do Ouro', 'Ocean safaris for manta rays', 'Kayaking through mangrove channels', 'Island hopping by speedboat'] },
    ],
  },
  malawi: {
    seasons: [
      { name: 'Wet Season (Nov–Apr)', icon: '🌧️', desc: 'Warm rains green the landscape. Roads can be challenging. Excellent value and birding. Lake is warm for swimming.' },
      { name: 'Shoulder (May)', icon: '🍂', desc: 'Rains end. Landscapes lush. Good for combining lake and safari.' },
      { name: 'Dry Season (Jun–Oct)', icon: '☀️', desc: 'Peak travel season. Clear skies, excellent wildlife at Liwonde waterholes. Cool nights on Nyika Plateau.' },
      { name: 'Festival Season (Sep)', icon: '🎵', desc: 'Lake of Stars music festival on the lakeshore. Warm days, ideal for trekking Mulanje.' },
    ],
    packing: [
      'Binoculars', 'Swimsuit & snorkel gear', 'DEET insect repellent', 'Malaria prophylaxis',
      'Sun hat & SPF 50', 'Hiking boots (for Mulanje)', 'Warm fleece (Nyika nights)',
      'Waterproof dry bag', 'Camera', 'Kwacha cash and USD backup',
    ],
    dayNarrative: [
      'Morning snorkel at Cape Maclear among hundreds of colourful endemic cichlids in crystal water.',
      'Kayak across to Domwe Island for a picnic on an uninhabited shore in Lake Malawi National Park.',
      'Afternoon boat safari on the Shire River — elephants wade past your bow in Liwonde.',
      'Sunset dhow cruise with the golden lake stretching to the horizon and fishermen in dugouts.',
    ],
    practical: {
      language: 'English and Chichewa are official languages. Chitumbuka in the north. Malawians are famously welcoming.',
      electricity: '230V. Type G plugs (British standard). Frequent power cuts; lodges have solar backup.',
      sim: 'Airtel and TNM SIM widely available. Buy bundles in Lilongwe or Blantyre.',
      time: 'UTC+2 (CAT). Bilharzia risk in stagnant lake water — stick to open, moving water for swimming.',
    },
    activityCategories: [
      { name: 'Lake & Water', icon: '🏊', items: ['Snorkelling with cichlids at Cape Maclear', 'Kayaking to Domwe Island', 'Shire River boat safaris', 'Sunset dhow cruises', 'Scuba diving at Lake Malawi'] },
      { name: 'Mountain', icon: '⛰️', items: ['Mount Mulanje multi-day trek to Sapitwa', 'Nyika Plateau horse riding', 'Zomba Plateau hiking and views', 'Livingstonia escarpment waterfall hike'] },
      { name: 'Safari', icon: '🦁', items: ['Liwonde elephant boat safaris', 'Majete Big Five tracking', 'Black rhino sanctuary walks', 'Nyika leopard and roan antelope'] },
      { name: 'Culture', icon: '🏛️', items: ['Tea estate tours in Thyolo', 'Village homestays on Likoma Island', 'Local market visits in Nkhata Bay', 'Livingstonia mission history'] },
    ],
  },
  lesotho: {
    seasons: [
      { name: 'Summer (Nov–Mar)', icon: '🌧️', desc: 'Warm afternoons with dramatic thunderstorms. Green mountain landscapes. Pony trekking at its best.' },
      { name: 'Autumn (Apr–May)', icon: '🍂', desc: 'Clear skies and golden light. Ideal hiking weather. Waterfalls at peak flow after rains.' },
      { name: 'Winter (Jun–Aug)', icon: '❄️', desc: 'Snow on the peaks. Skiing at Afriski. Crisp, clear days but freezing nights. Bring serious warm layers.' },
      { name: 'Spring (Sep–Oct)', icon: '🌸', desc: 'Wildflowers on the highlands. Mild temperatures. Excellent for Sani Pass and pony trekking.' },
    ],
    packing: [
      'Warm layers & down jacket', 'Waterproof rain shell', 'Hiking boots (broken in)',
      'Sun hat & SPF 50 (high altitude sun)', 'Gloves and beanie (year-round)', 'Headlamp',
      'Reusable water bottle', 'Travel adapter (Type M)', 'Basotho blanket (buy locally)',
    ],
    dayNarrative: [
      'Ascend Sani Pass in a 4x4 through hairpin bends as the Drakensberg drops away below you.',
      'Pony trek with a local guide through remote highland villages unreachable by road.',
      'Pause at a shepherd\'s hut for pap and moroho, watching eagles soar above the Maloti peaks.',
      'Night in a mountain lodge as temperatures plunge and the Milky Way blazes overhead.',
    ],
    practical: {
      language: 'Sesotho and English are official languages. Most guides speak both fluently.',
      electricity: '220V. Type M plugs (same as South Africa). Remote lodges use solar power.',
      sim: 'Econet and Vodacom Lesotho SIM. Coverage in towns; limited in remote highlands.',
      time: 'UTC+2 (SAST). Entry is via South Africa — ensure your SA visa allows multiple entries.',
    },
    activityCategories: [
      { name: 'Mountain', icon: '⛰️', items: ['Sani Pass 4x4 ascent', 'Pony trekking from Malealea', 'Drakensberg peak hiking', 'Seasonal skiing at Afriski', 'Katse Dam scenic drives'] },
      { name: 'Adventure', icon: '🧗', items: ['Abseiling Maletsunyane Falls (world\'s longest commercial)', 'Mountain biking trails', 'Rock climbing', 'Single-track pony trails'] },
      { name: 'Culture', icon: '🏛️', items: ['Thaba Bosiu fortress tour', 'Basotho hat and blanket workshops', 'San rock art in remote caves', 'Morija Museum and Archives'] },
    ],
  },
  eswatini: {
    seasons: [
      { name: 'Summer (Nov–Mar)', icon: '🌧️', desc: 'Hot and wet. Malaria risk in lowveld. Umhlanga Reed Dance (Aug/Sep). Lush landscapes.' },
      { name: 'Autumn (Apr–May)', icon: '🍂', desc: 'Rains taper. Pleasant temperatures. Good for combining culture and wildlife.' },
      { name: 'Dry Winter (Jun–Aug)', icon: '☀️', desc: 'Best wildlife viewing in Hlane and Mkhaya. Mild days, cool nights. Peak rhino tracking season.' },
      { name: 'Spring (Sep–Oct)', icon: '🌸', desc: 'Umhlanga Reed Dance ceremonies. Warm weather. Excellent for Ezulwini Valley exploration.' },
    ],
    packing: [
      'Binoculars', 'Neutral safari clothing', 'DEET insect repellent', 'Malaria prophylaxis (lowveld)',
      'Sun hat & SPF 50', 'Comfortable walking shoes', 'Camera', 'Warm layer for winter evenings',
      'South African Rand (widely accepted)', 'Travel adapter (Type M)',
    ],
    dayNarrative: [
      'Morning rhino tracking on foot in Mkhaya — approach within metres of white rhino with expert rangers.',
      'Visit Mantenga Cultural Village for traditional Swazi song, dance, and craft demonstrations.',
      'Horseback safari through Mlilwane as zebra and warthog graze in the Valley of Heaven.',
      'Sunset over Ezulwini with the Lebombo Mountains turning purple as hippos grunt in the ponds below.',
    ],
    practical: {
      language: 'SiSwati and English are official languages. Everyone in tourism speaks English.',
      electricity: '230V. Type M plugs (same as South Africa). Reliable in towns and lodges.',
      sim: 'MTN Eswatini SIM available at border posts and Mbabane. Good coverage nationwide.',
      time: 'UTC+2 (SAST). Lilangeni pegged 1:1 with ZAR. Both currencies accepted everywhere.',
    },
    activityCategories: [
      { name: 'Safari', icon: '🦁', items: ['Rhino tracking on foot at Mkhaya', 'Big Five in Hlane Royal NP', 'Horseback safari in Mlilwane', 'Night drives for leopard', 'Guided walks in Mlawula'] },
      { name: 'Culture', icon: '🏛️', items: ['Umhlanga Reed Dance (Aug/Sep)', 'Mantenga Cultural Village', 'Ngwenya Glass workshop tour', 'Swazi craft markets in Mbabane', 'Royal palace grounds (exterior)'] },
      { name: 'Adventure', icon: '🧗', items: ['Gobholo cave exploration', 'White-water rafting on the Usutu', 'Zip-lining in Ezulwini Valley', 'Sibebe Rock hike'] },
    ],
  },
};

for (const [id, data] of Object.entries(guideEnrichments)) {
  guides[id] = { ...guides[id], ...data };
}

const historyEnrichments = {
  zambia: 'Ancient Tonga and Lozi kingdoms flourished along the Zambezi for centuries before David Livingstone became the first European to witness Victoria Falls in 1855, naming them after Queen Victoria. Northern Rhodesia was administered by the British South Africa Company until 1924, then as a British protectorate. Copper mining in the Copperbelt transformed the economy. Independence came peacefully on 24 October 1964 under Kenneth Kaunda, who championed pan-Africanism and stability. Today Zambia is renowned for its peaceful democracy, pioneering walking safaris in South Luangwa, and community conservation models.',
  zimbabwe: 'The medieval stone city of Great Zimbabwe — built between 1100 and 1450 AD — was the capital of a vast trading empire that exported gold and ivory to the Swahili coast. Cecil Rhodes\' British South Africa Company occupied the territory in 1890, naming it Rhodesia. After a bitter liberation war, independence was achieved on 18 April 1980 as Zimbabwe, with Robert Mugabe as prime minister. Despite economic challenges, the country has preserved world-class guiding standards, UNESCO sites at Great Zimbabwe and Mana Pools, and a cultural renaissance in stone sculpture and mbira music.',
  mozambique: 'For over a millennium, Arab dhow traders sailed the Mozambique Channel, establishing ports that later attracted Portuguese explorers. Vasco da Gama landed in 1498; by 1530 Portugal controlled the coast. Mozambique remained a Portuguese colony until independence on 25 June 1975, followed by a devastating civil war that ended in 1992. The nation has since rebuilt with remarkable resilience — Gorongosa National Park\'s restoration is a global conservation model, and the 2,500km coastline has become one of Africa\'s hottest beach and diving destinations.',
  malawi: 'The Maravi Kingdom dominated the region from the 15th century, giving the country its name. David Livingstone reached Lake Malawi in 1859, calling it the "Lake of Stars" for the fishermen\'s lanterns. Britain established the Nyasaland Protectorate in 1891. Independence followed peacefully on 6 July 1964 under Hastings Banda. Despite being one of Africa\'s smallest and poorest nations, Malawi has earned its nickname "The Warm Heart of Africa" through extraordinary hospitality, successful rewilding at Majete and Liwonde, and the UNESCO-listed lake ecosystem with over 1,000 endemic fish species.',
  lesotho: 'King Moshoeshoe I united scattered Sotho clans in the early 19th century, forging the Basotho nation in the mountain stronghold of Thaba Bosiu and successfully resisting Zulu, Boer, and British forces. In 1868, Moshoeshoe appealed to Queen Victoria for protection, making Lesotho a British protectorate — deliberately avoiding incorporation into South Africa. Independence as the Kingdom of Lesotho came on 4 October 1966. Today it remains a constitutional monarchy where traditional blankets, pony culture, and highland resilience define the "Kingdom in the Sky."',
  eswatini: 'The Dlamini clan established the Swazi kingdom in the 18th century under King Ngwane III, consolidating power in the Ezulwini Valley. King Sobhuza II reigned for 82 years (1899–1982), guiding the nation through British protectorate status to independence on 6 September 1968. Renamed Eswatini in 2018, it remains one of the world\'s last absolute monarchies. Ancient traditions persist — the Umhlanga Reed Dance and Incwala ceremony are living royal rituals. Conservation success at Mkhaya and Hlane makes this tiny kingdom a heavyweight in rhino protection.',
};

for (const [id, history] of Object.entries(historyEnrichments)) {
  countries[id].about.history = history;
}

const spotImages = {
  zimbabwe: ['1516026672322-bc52d61a55d5', '1547970810-dc1eef37d176', '1516246062751-beda751bedaf', '1519066629447-267fffa62d4b', '1502675135487-e971002a6adb'],
  mozambique: ['1519066629447-267fffa62d4b', '1568249761-0ae12982d60d', '1516426122078-c23e76319801', '1580060839134-75a5edca2d99', '1506905925344-21ddaec4d32d'],
  malawi: ['1519066629447-267fffa62d4b', '1541414779316-956a5084c0d4', '1547970810-dc1eef37d176', '1516426122078-c23e76319801', '1504107123655-081832049e37'],
  lesotho: ['1519408299519-b7a0274f7d67', '1541414779316-956a5084c0d4', '1502675135487-e971002a6adb', '1454486326938-e6727284ea44', '1504107123655-081832049e37'],
  eswatini: ['1547970810-dc1eef37d176', '1516426122078-c23e76319801', '1518709766631-a6a7f45921c3', '1612140403750-13f69b821034', '1576485375217-d6a95e34d043'],
};

for (const [id, images] of Object.entries(spotImages)) {
  countries[id].spots.forEach((spot, i) => {
    if (!spot.image) spot.image = images[i] || images[0];
  });
  countries[id].activities.forEach((act, i) => {
    if (!act.image) act.image = images[i % images.length];
  });
}

const mapImages = {
  'desert-to-delta': 'https://images.unsplash.com/photo-1504107123655-081832049e37?auto=format&fit=crop&q=80&w=1200',
  'coastal-explorer': 'https://images.unsplash.com/photo-1506905925344-21ddaec4d32d?auto=format&fit=crop&q=80&w=1200',
  'falls-beyond': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=1200',
  'kingdom-circuit': 'https://images.unsplash.com/photo-1541414779316-956a5084c0d4?auto=format&fit=crop&q=80&w=1200',
  'lake-mountain': 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=1200',
  'grand-safari': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1200',
};

for (const [id, url] of Object.entries(mapImages)) {
  itineraries[id].mapImage = url;
  itineraries[id].mapCaption = itineraries[id].mapCaption || 'Route overview — illustrative map showing key stops along this journey.';
}

fs.writeFileSync(path.join(root, 'guides.json'), JSON.stringify(guides, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'countries.json'), JSON.stringify(countries, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'itineraries.json'), JSON.stringify(itineraries, null, 2) + '\n');
console.log('Enriched guides, countries, and itineraries.');
