const itineraryData = {
    'desert-to-delta': {
        type: 'Self-Drive Route',
        title: 'The Desert to Delta',
        countries: '🇳🇦 Namibia → 🇧🇼 Botswana',
        duration: '14–21 Days',
        priceFrom: '$2,450 USD',
        customizable: true,
        description: 'Journey from the rust-red dunes of Sossusvlei through Etosha\'s legendary waterholes to the emerald channels of the Okavango Delta. This cross-border route captures the full spectrum of Southern Africa\'s desert-to-wetland transformation.',
        highlights: [
            'Climb the iconic Dune 45 at sunrise in Sossusvlei',
            'Game drive around Etosha\'s floodlit waterholes at dusk',
            'Cross into Botswana via the lush Caprivi Strip',
            'Mokoro safari through the Okavango Delta channels',
            'Sunset cruise on the Chobe River among elephant herds'
        ],
        days: [
            { range: 'Day 1–2', title: 'Windhoek & Sossusvlei', places: 'Windhoek, Namib-Naukluft Park', narrative: 'Collect your 4×4 in Windhoek and head south into the Namib Desert. Arrive at Sossusvlei for a pre-dawn climb of Dune 45 and explore the surreal white clay pan of Deadvlei with its ancient camelthorn skeletons.' },
            { range: 'Day 3–4', title: 'Swakopmund & Skeleton Coast', places: 'Swakopmund, Walvis Bay', narrative: 'Drive through the Gaub and Kuiseb passes to the Atlantic coast. Enjoy sandboarding, quad biking, or a catamaran cruise among dolphins and seals at Walvis Bay.' },
            { range: 'Day 5–7', title: 'Damaraland & Etosha', places: 'Twyfelfontein, Etosha National Park', narrative: 'Track desert-adapted elephants in Damaraland and visit UNESCO-listed rock engravings at Twyfelfontein. Enter Etosha for world-class game viewing at its famous waterholes — rhino, elephant, and lion sightings are common.' },
            { range: 'Day 8–9', title: 'Caprivi Strip', places: 'Rundu, Divundu, Mahango', narrative: 'Head north into the tropical Zambezi region — a lush contrast to the desert south. Birding, river cruises, and hippo pods await along the Kavango River.' },
            { range: 'Day 10–12', title: 'Chobe National Park', places: 'Kasane, Chobe Riverfront', narrative: 'Cross the border into Botswana. Chobe is home to Africa\'s largest elephant population. Afternoon boat cruises offer intimate wildlife encounters at water level.' },
            { range: 'Day 13–14', title: 'Okavango Delta', places: 'Maun, Moremi Game Reserve', narrative: 'Fly or drive to Maun and enter the Delta. Glide through papyrus channels in a traditional mokoro, then enjoy guided bush walks and 4×4 game drives in Moremi.' }
        ],
        included: [
            '4×4 rental vehicle with unlimited kilometres',
            'Pre-booked accommodation (lodges, guesthouses, or campsites)',
            'Cross-border paperwork assistance',
            'Detailed route maps and GPS waypoints',
            '24-hour emergency support hotline',
            'Personal travel planning app access'
        ],
        excluded: [
            'International flights',
            'Fuel and park entrance fees',
            'Meals (unless specified at lodge)',
            'Travel and cancellation insurance',
            'Optional activities (balloon rides, scenic flights)',
            'Visa fees and border crossing charges'
        ]
    },
    'coastal-explorer': {
        type: 'Self-Drive Route',
        title: 'The Coastal Explorer',
        countries: '🇿🇦 South Africa → 🇲🇿 Mozambique',
        duration: '15–20 Days',
        priceFrom: '$2,890 USD',
        customizable: true,
        description: 'From Cape Town\'s Table Mountain along the Garden Route and Wild Coast to Mozambique\'s Bazaruto Archipelago — the ultimate Indian Ocean adventure combining mountains, forests, and tropical islands.',
        highlights: [
            'Table Mountain cable car and Cape Winelands tasting',
            'Garden Route forests, lagoons, and Storms River Mouth',
            'iSimangaliso Wetland Park — UNESCO World Heritage',
            'Maputo\'s vibrant markets and peri-peri seafood',
            'Dhow sailing and snorkelling in the Bazaruto Archipelago'
        ],
        days: [
            { range: 'Day 1–3', title: 'Cape Town & Peninsula', places: 'Cape Town, Cape Point', narrative: 'Explore Table Mountain, the V&A Waterfront, and the Cape Peninsula — penguins at Boulders Beach, Chapman\'s Peak drive, and Cape Point where two oceans meet.' },
            { range: 'Day 4–6', title: 'Garden Route', places: 'Hermanus, Knysna, Tsitsikamma', narrative: 'Whale watching in Hermanus, canopy tours in Tsitsikamma, and the dramatic Knysna Heads. Ancient forests and secluded beaches define this legendary coastal drive.' },
            { range: 'Day 7–9', title: 'Wild Coast & Durban', places: 'Coffee Bay, Durban', narrative: 'Trace the rugged Eastern Cape coastline through traditional Xhosa villages. Continue to Durban for its Indian-influenced cuisine and golden beaches.' },
            { range: 'Day 10–12', title: 'Kosi Bay & Maputo', places: 'St Lucia, Kosi Bay, Maputo', narrative: 'Snorkel the coral reefs of Kosi Bay and cross into Mozambique. Explore Maputo\'s art deco architecture and feast on tiger prawns at the fish market.' },
            { range: 'Day 13–15', title: 'Vilanculos & Bazaruto', places: 'Vilanculos, Bazaruto Island', narrative: 'Speedboat to the Bazaruto Archipelago. Snorkel pristine reefs, spot dugongs, and sail into the sunset on a traditional dhow.' }
        ],
        included: [
            'Rental vehicle with comprehensive insurance',
            'Accommodation bookings along the route',
            'Border crossing documentation support',
            'Island transfer arrangements (Bazaruto)',
            'Route guide with restaurant recommendations',
            '24-hour support while travelling'
        ],
        excluded: [
            'International and domestic flights',
            'Fuel, tolls, and border fees',
            'Diving, snorkelling, and dhow excursion fees',
            'Meals and personal expenses',
            'Travel insurance',
            'Mozambique visa fees'
        ]
    },
    'falls-beyond': {
        type: 'Guided & Self-Drive',
        title: 'The Falls & Beyond',
        countries: '🇿🇲 Zambia → 🇿🇼 Zimbabwe → 🇧🇼 Botswana',
        duration: '10–14 Days',
        priceFrom: '$3,150 USD',
        customizable: true,
        description: 'Experience the thunder of Victoria Falls, walk among leopards in South Luangwa, track elephants in Hwange, and cruise the Chobe River — the quintessential Zambezi basin safari circuit.',
        highlights: [
            'Helicopter "Flight of Angels" over Victoria Falls',
            'Walking safari in the birthplace of the genre — South Luangwa',
            'Devil\'s Pool swim at the edge of the falls (seasonal)',
            'Hwange\'s massive elephant herds at waterholes',
            'Chobe sunset river cruise among hippos and crocs'
        ],
        days: [
            { range: 'Day 1–3', title: 'Livingstone & Victoria Falls', places: 'Livingstone, Mosi-oa-Tunya', narrative: 'Witness the world\'s largest sheet of falling water from the Zambian side. Optional bungee, white-water rafting, or helicopter flight over the "Smoke That Thunders".' },
            { range: 'Day 4–6', title: 'South Luangwa', places: 'Mfuwe, South Luangwa NP', narrative: 'Fly to Mfuwe for the ultimate walking safari experience. South Luangwa has one of Africa\'s highest leopard densities and exceptional night drives.' },
            { range: 'Day 7–9', title: 'Hwange & Matobo', places: 'Hwange NP, Matobo Hills', narrative: 'Cross into Zimbabwe. Hwange\'s waterholes attract hundreds of elephants. Visit Matobo Hills for rhino tracking and ancient San rock art.' },
            { range: 'Day 10–12', title: 'Chobe River', places: 'Kasane, Chobe NP', narrative: 'Enter Botswana for a finale on the Chobe River. Boat cruises at sunset reveal elephant herds swimming between islands.' }
        ],
        included: [
            'All accommodation (mid-range lodges and camps)',
            'Internal flights (Livingstone–Mfuwe)',
            'Guided walking safaris in South Luangwa',
            'Park fees and conservation levies',
            'Chobe river cruise',
            'KAZA Univisa assistance'
        ],
        excluded: [
            'International flights',
            'Adventure activities at Victoria Falls',
            'Premium spirits and personal purchases',
            'Travel insurance',
            'Gratuities for guides and lodge staff'
        ]
    },
    'kingdom-circuit': {
        type: 'Mountain & Culture Route',
        title: 'The Kingdom Circuit',
        countries: '🇱🇸 Lesotho → 🇸🇿 Eswatini → 🇿🇦 South Africa',
        duration: '7–10 Days',
        priceFrom: '$1,680 USD',
        customizable: true,
        description: 'A compact highland adventure through two mountain kingdoms — pony trekking in Lesotho, royal game reserves in Eswatini, and a Big Five finale in Kruger National Park.',
        highlights: [
            'Ascend the legendary Sani Pass into the "Kingdom in the Sky"',
            'Pony trekking through Lesotho\'s highland villages',
            'Rhino tracking on foot in Mkhaya Game Reserve',
            'Swazi cultural village and traditional dance at Mantenga',
            'Big Five game drive in Kruger National Park'
        ],
        days: [
            { range: 'Day 1–2', title: 'Sani Pass & Malealea', places: 'Sani Pass, Malealea', narrative: 'Cross from South Africa into Lesotho via the dramatic Sani Pass. Pony trek through remote highland villages and overnight in a traditional lodge.' },
            { range: 'Day 3–4', title: 'Afriski & Katse Dam', places: 'Afriski, Katse Dam', narrative: 'Visit Africa\'s only ski resort (winter) or hike the surrounding peaks. Marvel at the engineering feat of Katse Dam nestled in the mountains.' },
            { range: 'Day 5–6', title: 'Eswatini Kingdom', places: 'Hlane, Mkhaya, Mantenga', narrative: 'Enter the Kingdom of Eswatini. Track rhinos on foot in Mkhaya, visit the Mantenga cultural village, and spot lions in Hlane Royal National Park.' },
            { range: 'Day 7–8', title: 'Kruger National Park', places: 'Kruger NP (Orpen Gate)', narrative: 'Cross back into South Africa for a Big Five finale. Full-day game drives in Kruger\'s central region around Satara and Orpen.' }
        ],
        included: [
            '4×4 vehicle rental (high-clearance for Sani Pass)',
            'Accommodation in lodges and guesthouses',
            'Pony trekking excursion in Malealea',
            'Mkhaya rhino tracking activity',
            'Kruger park entry fees',
            'Route maps and border guidance'
        ],
        excluded: [
            'International flights',
            'Fuel and meals',
            'Optional abseiling at Maletsunyane Falls',
            'Travel insurance',
            'Lesotho/Eswatini border fees'
        ]
    },
    'lake-mountain': {
        type: 'Adventure Route',
        title: 'Lake & Mountain',
        countries: '🇲🇼 Malawi → 🇲🇿 Mozambique',
        duration: '10–14 Days',
        priceFrom: '$1,950 USD',
        customizable: true,
        description: 'Snorkel among a thousand cichlid species in Lake Malawi, summit Mount Mulanje\'s peaks, safari along the Shire River, and explore Mozambique\'s UNESCO-listed Ilha de Moçambique.',
        highlights: [
            'Snorkelling with endemic cichlids at Cape Maclear',
            'Multi-day trek on Mount Mulanje — the "Island in the Sky"',
            'Boat safari among elephants on the Shire River',
            'Kayak to uninhabited Domwe Island',
            'Explore the historic stone town of Ilha de Moçambique'
        ],
        days: [
            { range: 'Day 1–3', title: 'Lake Malawi', places: 'Cape Maclear, Nkhata Bay', narrative: 'Arrive at the "Lake of Stars". Snorkel among hundreds of colourful cichlid species, kayak to Domwe Island, and enjoy sunset dhow cruises.' },
            { range: 'Day 4–5', title: 'Mount Mulanje', places: 'Mulanje Massif', narrative: 'Trek through tea estates to the base of Mulanje. Hike to Chambe Basin and optionally summit Sapitwa Peak (3,002m) — the highest point in the region.' },
            { range: 'Day 6–7', title: 'Liwonde National Park', places: 'Liwonde NP', narrative: 'Boat safari on the Shire River among dense elephant and hippo populations. Optional rhino tracking in the sanctuary.' },
            { range: 'Day 8–10', title: 'Ilha de Moçambique', places: 'Nampula, Ilha de Moçambique', narrative: 'Cross into Mozambique and fly or drive to the coast. Explore the UNESCO World Heritage island — crumbling Portuguese forts, dhow harbour, and pristine reefs.' }
        ],
        included: [
            'Accommodation (beach lodges and mountain huts)',
            'Lake Malawi snorkelling gear rental',
            'Mulanje mountain guide and hut fees',
            'Liwonde boat safari',
            'Internal transport arrangements',
            'Border crossing assistance'
        ],
        excluded: [
            'International flights',
            'Meals and personal expenses',
            'Mulanje peak summit attempt (optional guide upgrade)',
            'Mozambique visa fees',
            'Travel insurance'
        ]
    },
    'grand-safari': {
        type: 'Signature Safari',
        title: 'The Grand Safari',
        countries: '🇿🇦 South Africa → 🇳🇦 Namibia → 🇧🇼 Botswana',
        duration: '21–28 Days',
        priceFrom: '$5,200 USD',
        customizable: true,
        description: 'The definitive three-country Southern African safari. From Kruger\'s Big Five through Namibia\'s desert wonders to Botswana\'s pristine Okavango Delta — the journey of a lifetime.',
        highlights: [
            'Big Five safari in Kruger and Sabi Sands',
            'Etosha\'s floodlit waterhole game viewing',
            'Desert-adapted elephant tracking in Damaraland',
            'Skeleton Coast fly-in and seal colony visit',
            'Mokoro and walking safari in the Okavango Delta'
        ],
        days: [
            { range: 'Day 1–4', title: 'Kruger National Park', places: 'Kruger NP, Sabi Sands', narrative: 'Begin in South Africa\'s flagship reserve. Expert-guided game drives in search of the Big Five, with optional luxury extension into Sabi Sands for leopard encounters.' },
            { range: 'Day 5–7', title: 'Etosha & Damaraland', places: 'Etosha NP, Damaraland', narrative: 'Fly or drive to Namibia. Game drives around Etosha\'s vast salt pan and track rare desert-adapted elephants and rhinos on foot in Damaraland.' },
            { range: 'Day 8–10', title: 'Skeleton Coast & Sossusvlei', places: 'Swakopmund, Sossusvlei', narrative: 'Explore the haunting Skeleton Coast by scenic flight. Climb the towering dunes of Sossusvlei and discover the ancient dead trees of Deadvlei.' },
            { range: 'Day 11–13', title: 'Swakopmund & Walvis Bay', places: 'Swakopmund, Walvis Bay', narrative: 'Coastal adventure interlude — sandboarding, kayaking with seals, and fresh Atlantic oysters in Namibia\'s adventure capital.' },
            { range: 'Day 14–16', title: 'Caprivi & Chobe', places: 'Caprivi Strip, Chobe NP', narrative: 'Head north through the lush Caprivi into Botswana. Chobe\'s elephant herds gather along the riverfront in their hundreds.' },
            { range: 'Day 17–21', title: 'Okavango Delta & Moremi', places: 'Maun, Moremi GR', narrative: 'The grand finale in the Okavango Delta. Mokoro excursions, guided bush walks, and 4×4 drives in Moremi — Africa\'s predator capital.' }
        ],
        included: [
            '4×4 rental or light aircraft transfers between regions',
            'All accommodation (mix of lodges and camps)',
            'Guided game drives in Kruger, Etosha, and Moremi',
            'Scenic flight over Skeleton Coast',
            'Mokoro excursion in the Delta',
            '24-hour support and comprehensive route planning'
        ],
        excluded: [
            'International flights',
            'Fuel, park fees, and conservation levies',
            'Premium lodge upgrades',
            'Meals not specified as included',
            'Travel and cancellation insurance',
            'Visa fees for three countries'
        ]
    }
};
