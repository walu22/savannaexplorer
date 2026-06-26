// Navbar scroll effect
const navbar = document.getElementById('navbar');
const heroImg = document.getElementById('hero-img');

// Mobile Menu Toggle
const menuToggle = document.getElementById('mobile-menu');
const navLinksContainer = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });
}

// Close menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinksContainer.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        }
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Parallax effect for hero image
window.addEventListener('scroll', () => {
    let offset = window.pageYOffset;
    if (heroImg) {
        heroImg.style.transform = `scale(${1 + offset * 0.0005})`;
    }
});

// Smooth reveal on scroll (Intersection Observer)
const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
        }
    });
}, revealOptions);

// Add reveal classes to sections
document.querySelectorAll('section').forEach(section => {
    section.classList.add('reveal-item');
    observer.observe(section);
});

// Add some basic CSS for the observation (normally would be in style.css but I'll add a helper here or in style.css later)
const revealStyle = document.createElement('style');
revealStyle.innerHTML = `
    .reveal-item {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }
    .reveal-active {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(revealStyle);

// Redesigned Experience Grid - No JS needed for hover effects (handled by CSS)

// --- Currency Converter ---
const baseAmount = document.getElementById('base-amount');
const baseCurrency = document.getElementById('base-currency');
const zarVal = document.getElementById('zar-val');
const nadVal = document.getElementById('nad-val');
const bwpVal = document.getElementById('bwp-val');

const rates = {
    USD: 19.10,
    EUR: 20.50,
    GBP: 24.10
};

function updateConversion() {
    const amount = parseFloat(baseAmount.value) || 0;
    const rate = rates[baseCurrency.value];
    const zar = amount * rate;
    const nad = zar; // 1:1 Peg
    const bwp = zar * 0.72; // Approx rate

    zarVal.textContent = zar.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    nadVal.textContent = nad.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    bwpVal.textContent = bwp.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

if (baseAmount) {
    baseAmount.addEventListener('input', updateConversion);
    baseCurrency.addEventListener('change', updateConversion);
}

// --- Visa Matrix Search ---
const visaSearch = document.getElementById('visa-search');
const visaRows = document.querySelectorAll('#visa-matrix tbody tr');

if (visaSearch) {
    visaSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        visaRows.forEach(row => {
            const country = row.getAttribute('data-country');
            row.style.display = country.includes(term) ? '' : 'none';
        });
    });
}

// --- Packing List Tabs ---
const tabBtns = document.querySelectorAll('.tab-btn');
const packingContent = document.getElementById('packing-content');

const lists = {
    safari: [
        'Binoculars', 'Neutral clothing', 'Mosi-spray', 'Headlamp', 'Power bank'
    ],
    coastal: [
        'Sunscreen (SPF 50)', 'Snorkel gear', 'Waterproof phone case', 'Beach towel', 'Light sandals'
    ]
};

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active class
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update content
        const listType = btn.getAttribute('data-list');
        const items = lists[listType];
        packingContent.innerHTML = items.map(item => `
            <label class="item"><input type="checkbox"> <span>${item}</span></label>
        `).join('');
    });
});

// --- Country Insight System ---
const countryData = {
    'namibia': {
        name: 'Namibia',
        tagline: 'A Realm of Endless Horizons',
        about: { 
            geo: 'A vast land of dramatic contrasts, from the world\'s oldest desert (the Namib) and the rugged Skeleton Coast to the high central plateau and the red sands of the Kalahari basin.', 
            people: 'Home to a resilient tapestry of cultures including the semi-nomadic Himba, the ancestral San (Bushmen), and the Herero, all of whom have adapted to thrive in this arid wilderness.', 
            history: 'Until Western explorers arrived, Namibia\'s stories were passed through generations of San, Nama, and Herero oral tradition. Rock engravings at Twyfelfontein and stone circles of Khoi settlements remain vital records of ancient life. European contact began at the coast — Portuguese explorers named the Skeleton Coast in the 15th century. German colonization followed from 1884, and the 1904 Battle of Waterberg triggered devastating conflict. After South African administration and decades of struggle, SWAPO led Namibia to independence on 21 March 1990 under founding president Sam Nujoma. Today, reconciliation and community conservancies define the nation\'s remarkable conservation success story.' 
        },
        spots: [ 
            { name: 'Sossusvlei & Deadvlei', desc: 'Towering apricot-colored dunes and ancient, skeletal trees. Home to "Big Daddy" and the iconic "Dune 45".', image: '1504107123655-081832049e37' }, 
            { name: 'Etosha National Park', desc: 'A premier wildlife sanctuary centered around a massive salt pan. Famous for rare black rhino and elephant sightings.', image: '1549219355-66779e9508d4' },
            { name: 'Fish River Canyon', desc: 'The second-largest canyon on Earth, offering spectacular multi-day hiking and panoramic desert vistas.', image: '1519408299519-b7a0274f7d67' },
            { name: 'Spitzkoppe', desc: 'The "Matterhorn of Africa"—massive granite peaks that offer a paradise for photographers and stargazers.', image: '1502675135487-e971002a6adb' },
            { name: 'Zambezi Region', desc: 'A lush, river-swung oasis in the far north that provides a tropical contrast to the Namib desert.', image: '1454486326938-e6727284ea44' },
            { name: 'Swakopmund', desc: 'A coastal adventure hub where German colonial history meets adrenaline-fueled sandboarding and skydiving.', image: '1612450531505-181cf3a60424' }
        ],
        activities: [ 
            { name: 'Sandboarding & Quad Biking', desc: 'Feel the adrenaline on the sheer slipfaces of the Swakopmund dunes.', image: '1583271167909-5e263fa7bce3' }, 
            { name: 'Rhino Tracking', desc: 'Join expert conservationists on foot in Damaraland to track rare desert-adapted black rhinos.', image: '1612140403750-13f69b821034' },
            { name: 'Aerial Sossusvlei', desc: 'Experience the desert from above with a sunrise hot air balloon flight or scenic light aircraft tour.', image: '1611181829676-d3929e061807' },
            { name: 'Skeleton Coast Fly-in', desc: 'Explore the shipwrecks and seal colonies of this misty, rugged Atlantic shoreline.', image: '1611181829285-d3929e061807' },
            { name: 'Desert Safari', desc: 'Track desert-adapted elephants and lions that have evolved to live without permanent water.', image: '1516426122078-c23e76319801' }
        ],
        routes: [ 
            { name: 'The Arid Eden Route', desc: 'A classic journey from the coast through the rugged Damaraland mountains to Etosha.' },
            { name: 'The Great Namib Loop', desc: 'Covering the southern highlights from Windhoek to Sossusvlei and the Fish River Canyon.' },
            { name: 'The Tropical North Transit', desc: 'Traveling from the desert heart up into the lush wetlands of the Zambezi region.' }
        ],
        localFlavor: { 
            food: 'Kapana (spiced grilled beef) from a traditional street braai, and fresh Atlantic oysters from Walvis Bay.', 
            drink: 'Windhoek Lager — brewed strictly by German purity laws and perfect after a day in the desert.', 
            lang: 'KhoeKhoe/Nama: "Matisa" (How are you?) / Himba/Herero: "Tangi" (Thank you)' 
        },
        advice: { 
            transport: 'Namibia is the ultimate self-drive destination. A robust 4x4 is essential for gravel roads and remote exploration.', 
            budget: 'Mid-range self-drive to High-end luxury fly-in safaris. Fuel and car rental are the primary costs.', 
            tipping: '10% in restaurants. $10-$15 per day for specialist desert guides is standard.', 
            visa: 'Visa-free for most Western countries for up to 90 days of tourism.', 
            health: 'Malaria-free in the south; prophylaxis essential if visiting the Zambezi or northern border regions.', 
            safety: 'Extremely safe for independent travelers. Maintain a safe speed on gravel roads (<80km/h).', 
            money: 'Namibian Dollar (NAD) pegged 1:1 with the South African Rand. Both are widely accepted.', 
            climate: 'Dry winter (May - Sept) is best for wildlife; summer (Jan - Mar) can be hot with dramatic desert storms.' 
        }
    },
    'south-africa': {
        name: 'South Africa',
        tagline: 'A World in One Country',
        about: { 
            geo: 'A massive diversity of terrain—ranging from subtropical forests and the rugged Drakensberg Mountains to the semi-arid Karoo and the Mediterranean climate of the Western Cape.', 
            people: 'The "Rainbow Nation" is a vibrant melting pot of 60 million people and 11 official languages, representing a unique intersection of African, European, and Asian heritages.', 
            history: 'From the Cradle of Humankind (the world\'s deepest fossil legacy) to the modern struggle for freedom led by Nelson Mandela and the 1994 democratic transition.' 
        },
        spots: [ 
            { name: 'Kruger National Park', desc: 'The flagship of African safaris. A world-class wilderness where the Big Five roam freely across nearly 2 million hectares.', image: '1547448415-e9f5b28e570d' }, 
            { name: 'Cape Town & Table Mountain', desc: 'A stunning coastal city dominated by a UNESCO-listed flat-topped mountain, offering a mix of high-culture and rugged nature.', image: '1580060839134-75a5edca2d99' },
            { name: 'The Garden Route', desc: '300km of breathtaking coastline, featuring ancient forests, secluded beaches, and the dramatic Storms River Mouth.', image: '1506905925344-21ddaec4d32d' },
            { name: 'The Drakensberg (uKhahlamba)', desc: 'The "Dragon Mountains"—spectacular basalt peaks and thousands of ancient San rock art sites.', image: '1541414779316-956a5084c0d4' },
            { name: 'Cape Winelands', desc: 'Tour the historic estates of Stellenbosch and Franschhoek, renowned for world-class vintages and Michelin-standard dining.', image: '1576485375217-d6a95e34d043' }
        ],
        activities: [ 
            { name: 'Big Five Safari', desc: 'Track the Big Five in the world-renowned private reserves of Sabi Sands or the flagship Kruger National Park.', image: '1547970810-dc1eef37d176' }, 
            { name: 'Shark Cage Diving', desc: 'Face-to-face encounters with Great White Sharks in the turquoise waters of Gansbaai.', image: '1568249761-0ae12982d60d' },
            { name: 'Marine Big Five Cruise', desc: 'Spot whales, dolphins, seals, penguins, and sharks from the whale-watching capital of Hermanus.', image: '1544716278-ca5e3f4abd8c' },
            { name: 'Robben Island Tour', desc: 'A poignant journey through South Africa\'s history at the former prison of Nelson Mandela.', image: '1589182337358-2cb6309475e8' },
            { name: 'Wine Tasting Safaris', desc: 'Explore historic estates by tram or bicycle while tasting world-class Pinotage and Chenin Blanc.', image: '1553331621-df65d21a2283' }
        ],
        routes: [ 
            { name: 'The Classic Garden Route', desc: 'The ultimate coastal road trip from Cape Town to the Tsitsikamma forest.' },
            { name: 'The Panorama Route', desc: 'Spectacular views of the Blyde River Canyon, God\'s Window, and Bourkes Luck Potholes.' },
            { name: 'The Diamond Coast Trail', desc: 'A rugged, remote journey along the wild Atlantic shoreline of the Northern Cape.' }
        ],
        localFlavor: { 
            food: 'Bobotie (spiced minced meat), Biltong (cured meat), and Cape Malay Curry — a spicy fusion unique to the Cape.', 
            drink: 'Pinotage wine (South Africa\'s signature grape) or refreshing Amarula liqueur on ice.', 
            lang: 'Zulu: "Sawubona" (Hello) / Xhosa: "Enkosi" (Thank you) / Afrikaans: "Dankie"' 
        },
        advice: { 
            transport: 'Excellent domestic flight network. Self-drive is world-class and highly recommended for the Cape and Garden Route.', 
            budget: 'Extremely high value for major international currencies. Options range from budget backpacking to ultra-luxury lodges.', 
            tipping: '10-15% is standard in restaurants. $10-$20 per day for specialist safari guides is appreciated.', 
            visa: 'Visa-free for up to 90 days for many nationalities including US, UK, and EU citizens.', 
            health: 'Low malaria risk in Kruger (mostly seasonal); the rest of the country is malaria-free. High-quality private healthcare.', 
            safety: 'Standard urban vigilance advised in cities. Tourist hubs and national parks are generally very safe.', 
            money: 'South African Rand (ZAR). Credit cards are accepted almost everywhere, including most stalls.', 
            climate: 'Dry winter (May-Sept) is best for safaris. Summer (Nov-Mar) is peak season for Cape Town and the coast.' 
        }
    },
    'botswana': {
        name: 'Botswana',
        tagline: 'The Pristine Heart of the Wild',
        about: { 
            geo: 'A vast, landlocked wilderness dominated by the Kalahari Desert and the seasonal flooding of the Okavango Delta, the world\'s largest inland delta system.', 
            people: 'Home to the resilient San (Bushmen) culture and the Tswana people, Botswana is a peaceful democracy known for its high-value, low-impact tourism model.', 
            history: 'From ancient rock art to modern success, Botswana has transformed from one of the world\'s poorest nations at independence in 1966 to a leading example of stable development and conservation.' 
        },
        spots: [ 
            { name: 'Okavango Delta (UNESCO)', desc: 'A crystalline labyrinth of lagoons and channels. Best explored by traditional mokoro (dugout canoe) or via a scenic flight over the "Jewel of the Kalahari".', image: '1547471080-7cc2caa01a7e' }, 
            { name: 'Chobe National Park', desc: 'The elephant capital of Africa. Witness massive herds gathering at the Chobe River and experience incredible boat-based wildlife viewing.', image: '1545199912-39077ce682b1' },
            { name: 'Makgadikgadi salt pans', desc: 'An otherworldly landscape of shimmering salt crusts, home to ancient baobabs and the spectacular zebra migration.', image: '1519181245277-cffeb31da2e3' },
            { name: 'Moremi Game Reserve', desc: 'The predator capital of the Delta, where lush wetlands meet dry mopane woodland, offering unparalleled Big Five sightings.', image: '1518709766631-a6a7f45921c3' },
            { name: 'Central Kalahari', desc: 'A remote, expansive wilderness that home to the iconic black-maned Kalahari lions and the ancestral lands of the San people.', image: '1516426122078-c23e76319801' }
        ],
        activities: [ 
            { name: 'Mokoro Safaris', desc: 'Glide silently through the Delta\'s waterways, spotting tiny reed frogs and thirsty elephants at water level.', image: '1591143890184-7f15e83ec90d' }, 
            { name: 'Fly-in Safaris', desc: 'Experience the sheer scale of the landscape with light aircraft transfers between remote, luxury bush camps.', image: '1448831338187-78296e6fdc4d' },
            { name: 'Baobab Camping', desc: 'Sleep under the stars among ancient trees in the middle of the vast, silent salt pans.', image: '1504107123655-081832049e37' },
            { name: 'Chobe Boat Cruise', desc: 'Enjoy a sunset cruise on the Chobe River for front-row seats to elephant and hippo action.', image: '1520690214124-2405c5217036' },
            { name: 'San Cultural Walk', desc: 'Learn ancient desert survival skills from the master trackers of the Kalahari.', image: '1516426122078-c23e76319801' }
        ],
        routes: [ 
            { name: 'The Desert to Delta Trail', desc: 'A classic route connecting the dry Kalahari sands with the lush Okavango Delta and Chobe River.' },
            { name: 'The Panhandle Explorer', desc: 'Focuses on the deep water channels of the northern Delta, perfect for specialist fishing and birding.' },
            { name: 'The Salt & Silk Road', desc: 'A remote journey through the Makgadikgadi and Nxai Pans, capturing the essence of the "Great Thirstland".' }
        ],
        localFlavor: { 
            food: 'Seswaa (slow-cooked pounded beef) served with thick pap — a national favorite at celebrations.', 
            drink: 'St Louis Lager — the iconic local refreshment for a hot day in the bush.', 
            lang: 'Setswana: "Dumela" (Hello) / "Ke itumetse" (Thank you)' 
        },
        advice: { 
            transport: 'Primarily fly-in via light aircraft to remote lodges. 4x4 self-drive is possible but requires extensive deep-sand driving experience.', 
            budget: 'Exclusively high-end. Botswana operates on a "High Value, Low Impact" model to protect its pristine wilderness.', 
            tipping: 'Discretionary. $10-$20 per day for professional guides; $5-$10 per day for general lodge staff.', 
            visa: 'Visa-free for many Commonwealth, EU, and US citizens. Always check current reciprocity.', 
            health: 'Malaria prophylaxis is highly recommended for the Delta and northern regions.', 
            safety: 'Extremely safe. One of the most stable and peaceful countries in Africa.', 
            money: 'Botswana Pula (BWP). US Dollars and Euros are widely accepted at luxury lodges.', 
            climate: 'Peak season is the dry winter (June - August) when the Delta floods meet the clear, blue skies.' 
        }
    },
    'zambia': {
        name: 'Zambia',
        tagline: 'The Spirit of the Real Africa',
        about: { 
            geo: 'A high-altitude plateau cut by the massive Zambezi, Kafue, and Luangwa rivers. Home to the legendary Victoria Falls and some of the largest, most pristine wilderness areas in Africa.', 
            people: 'Zambians are famously friendly and welcoming, with over 70 ethnic groups living in harmony. The nation is often cited as one of the most peaceful in Africa.', 
            history: 'From ancient Gwembe Tonga cultures to the exploration of David Livingstone. Since independence in 1964, Zambia has remained a stable and vibrant democracy.' 
        },
        spots: [ 
            { name: 'Victoria Falls (Mosi-oa-Tunya)', desc: 'The world\'s largest sheet of falling water. Experience "The Smoke That Thunders" from the knife-edge bridge or the sheer edge of the abyss.', image: '1516026672322-bc52d61a55d5' }, 
            { name: 'South Luangwa National Park', desc: 'The birthplace of the walking safari. Famous for its high concentration of leopards and the winding Luangwa river teeming with hippos.', image: '1581850106622-cf8f3a382ec3' },
            { name: 'Lower Zambezi National Park', desc: 'A spectacular wilderness where the Zambezi river meets the escarpment. Best for canoeing safaris and seeing elephants swim across the channels.', image: '1516246062751-beda751bedaf' },
            { name: 'Kasanka (The Bat Migration)', desc: 'Witness the world\'s largest mammal migration (Oct-Dec) as 10 million straw-colored fruit bats darken the sky at sunset.', image: '1583271167909-5e263fa7bce3' },
            { name: 'Bangweulu (The Shoebill Stork)', desc: 'A mystical wetland ecosystem where the rare, prehistoric-looking Shoebill stork can be found among the papyrus reeds.', image: '1516026672322-bc52d61a55d5' },
            { name: 'Nsumbu & Lake Tanganyika', desc: 'An inland sea of crystal blue water. Snorkel with endemic cichlid fish or watch elephants wander the white sandy shores.', image: '1519066629447-267fffa62d4b' }
        ],
        activities: [ 
            { name: 'Walking Safaris', desc: 'Immerse yourself in the wild on foot with expert local guides and scouts. South Luangwa is the world-renowned home of this authentic experience.', image: '1581850106622-cf8f3a382ec3' }, 
            { name: 'The Kuomboka Festival', desc: 'A spectacular Lozi tradition where the King (Litunga) moves his court to higher ground in a massive ceremonial barge (March/April).', image: '1581850106622-cf8f3a382ec3' },
            { name: 'Canoeing Safaris', desc: 'Paddle past pods of hippos and bathing elephants in the Lower Zambezi for the ultimate "silent" wildlife encounter.', image: '1516246062751-beda751bedaf' },
            { name: 'Devil\'s Pool Swim', desc: 'Feel the adrenaline by swimming in a natural rock pool at the very lip of Victoria Falls (August - December).', image: '1516026672322-bc52d61a55d5' },
            { name: 'Conservation Tracking', desc: 'Join the Carnivore Programme in South Luangwa to track wild dogs and lions with real-time research telemetry.', image: '1547970810-dc1eef37d176' }
        ],
        routes: [ 
            { name: 'The Zambezi Explorer', desc: 'A classic route connecting Victoria Falls with the Lower Zambezi and Lake Kariba.' },
            { name: 'The Luangwa Valley Loop', desc: 'Focuses on the high-density wildlife areas of the South and North Luangwa parks.' },
            { name: 'The Northern Highs Trail', desc: 'A remote journey through Kasanka bats and up to the shores of Lake Tanganyika.' }
        ],
        localFlavor: { 
            food: 'Nshima with Ifisashi (peanut-stewed greens) and Chikanda (orchid tuber "polony").', 
            drink: 'Mosi Lager or traditional Chibuku beer.', 
            lang: 'Nyanja/Bemba: "Muli bwanji" (How are you?) / "Zikomo" (Thank you)' 
        },
        advice: { 
            transport: 'Proflight connects major hubs. Max 23kg bag (soft bags only) + 5kg carry-on for bush flights.', 
            budget: 'Exclusively Mid-to-High end. Luxury camps are all-inclusive including specialized walking guides.', 
            tipping: 'Discretionary. $15/day for rangers, $15/day for lodge staff is the luxury standard.', 
            visa: 'KAZA Univisa ($50) covering Zambia/Zimbabwe/Botswana (day trips) is highly recommended on arrival.', 
            health: 'High Malaria risk; prophylaxis is essential. Avoid Blue/Black clothing as it attracts Tsetse flies.', 
            safety: 'Extremely safe. Drones are strictly regulated; registration with ZCAA is mandatory 30 days prior.', 
            money: 'Zambian Kwacha (ZMW). US Dollars (post-2013) are king for safari lodges and tips.', 
            climate: 'Dry (May-Oct) is prime game viewing. November is the "Emerald Season" and peak Bat Migration.' 
        }
    },
    'zimbabwe': {
        name: 'Zimbabwe',
        tagline: 'A World of Wonders',
        about: { 
            geo: 'A dramatic high-altitude plateau framed by the lush Eastern Highlands, the northern Zambezi Valley, and the wild southern Lowveld plains.', 
            people: 'Known for their resilience and deep-rooted cultural pride, Zimbabweans excel in art, education, and world-class hospitality.', 
            history: 'From the medieval stone city of Great Zimbabwe to the modern struggle for independence. A land rich in ancient heritage and colonial complexity.' 
        },
        spots: [ 
            { name: 'Victoria Falls (Mosi-oa-Tunya)', desc: 'The most impressive panoramic views of the "Smoke That Thunders". A world-class hub for both sightseeing and extreme adventure.' }, 
            { name: 'Hwange National Park', desc: 'The flagship wildlife reserve. Famous for its massive elephant population and the "presidential" lion prides around its diverse waterholes.' },
            { name: 'Mana Pools (UNESCO)', desc: 'A remote walking safari paradise in the Zambezi Valley, where elephants are known to stand on their hind legs to reach acacia pods.' },
            { name: 'Lake Kariba', desc: 'A vast inland sea known for its "drowning forests" and spectacular sunset safaris by boat or luxury houseboat.' },
            { name: 'Matobo Hills', desc: 'A landscape of balancing boulders and ancient San rock art, and the final resting place of Cecil Rhodes.' }
        ],
        activities: [ 
            { name: 'Walking Safaris', desc: 'Zimbabwe trains some of Africa\'s most elite guides. Mana Pools is the world center for safe, up-close walking encounters.' }, 
            { name: 'Bungee & Bridge Jump', desc: 'Leap into the abyss from the Victoria Falls bridge with the legendary falls as your backdrop.' },
            { name: 'Elephant Interaction', desc: 'Hwange offers unique opportunities to observe massive herds from "log-pile" hides at water level.' },
            { name: 'Great Zimbabwe Tour', desc: 'Explore the massive stone ruins of an ancient empire that gave the modern nation its name.' },
            { name: 'Tiger Fishing', desc: 'Lake Kariba and the Upper Zambezi offer world-class challenges for this legendary freshwater predator.' }
        ],
        routes: [ 
            { name: 'The Mosi-oa-Tunya Explorer', desc: 'Connecting the adventure of Victoria Falls with the deep wilderness of Hwange National Park.' },
            { name: 'The Wild Zambezi Transit', desc: 'A remote journey from Kariba down through the valley into the pristine Mana Pools area.' },
            { name: 'The Eastern Highlands Trail', desc: 'A scenic escape through the mountains, tea estates, and misty forests of the east.' }
        ],
        localFlavor: { 
            food: 'Sadza paired with grilled Nyama (meat) and spiced matemba (dried fish) — the soul of Zimbabwean cuisine.', 
            drink: 'Zambezi Lager — "Africa\'s Finest Beer" or refreshing Mazoe Orange Crush.', 
            lang: 'Shona: "Mhoro" (Hello) / "Ndatenda" (Thank you)' 
        },
        advice: { 
            transport: 'Domestic flights link the major hubs. Private transfers or specialist 4x4 guided tours are best for reaching Mana Pools.', 
            budget: 'Mid-range to High-end. Excellent value for world-class guiding standards.', 
            tipping: 'Tips in US Dollars are highly valued. $10-$15 per day for top-tier guides is appreciated.', 
            visa: 'KAZA Univisa (USD 50) allows seamless travel between Victoria Falls (Zim) and Livingstone (Zam) for 30 days.', 
            health: 'Malaria prophylaxis required for the Zambezi valley and lowveld. High-quality private medical care in cities.', 
            safety: 'Very safe in tourist hubs like Victoria Falls and inside the national parks. Zimbabweans are famously hospitable.', 
            money: 'US Dollars are the primary currency used by tourists. Cash is king for smaller tips and local crafts.', 
            climate: 'Best wildlife viewing is July - October (Dry season). The "Emerald Season" (Dec - March) offers stunning birdlife.' 
        }
    },
    'mozambique': {
        name: 'Mozambique',
        tagline: 'Tropical Shores & Vibrant Fusion',
        about: { 
            geo: 'A stunning 2,500km palm-fringed Indian Ocean coastline, defined by idyllic coral archipelagos and the restored, biodiversity-rich Gorongosa National Park.', 
            people: 'A warm, resilient fusion of African, Portuguese, and Arab heritage reflected in the music, architecture, and island traditions.', 
            history: 'From ancient Arab dhow trading routes to Portuguese colonial influence and modern independence. A land of incredible maritime history.' 
        },
        spots: [ 
            { name: 'Bazaruto Archipelago', desc: 'Dazzling turquoise waters and high-end luxury island lodges. A paradise for snorkeling and sunset dhow sailing.' }, 
            { name: 'Tofo Beach & Vilanculos', desc: 'The world\'s capital for manta ray and whale shark encounters. A vibrant, laid-back hub for diving and surfing.' },
            { name: 'Gorongosa National Park', desc: 'Africa\'s most successful rewilding story. A lush, diverse ecosystem now home to booming populations of wild dogs and lions.' },
            { name: 'Maputo', desc: 'The "City of Acacia"—an Art Deco urban gem famous for its Latin-flavored jazz scene and vibrant seafood markets.' },
            { name: 'Ibo Island (Quirimbas)', desc: 'Step back in time among crumbling Portuguese ruins, ancient forts, and traditional silver-smiths on this remote isle.' }
        ],
        activities: [ 
            { name: 'Swimming with Whale Sharks', desc: 'Experience the sheer scale of the ocean\'s giants in the crystal-clear waters of Tofo.' }, 
            { name: 'Sunset Dhow Sailing', desc: 'Navigate the coastal archipelagos at sunset on a traditional wooden sailing vessel.' },
            { name: 'Scuba Diving & Snorkeling', desc: 'Explore pristine coral reefs teeming with biodiversity, including rare sea turtles and dugongs.' },
            { name: 'Peri-Peri Seafood Trail', desc: 'Sample famous Mozambican prawns and grilled chicken at beachside markets in Maputo or Vilanculos.' },
            { name: 'Island Hopping', desc: 'Travel between remote islands in the Quirimbas or Bazaruto by speedboat or dhow.' }
        ],
        routes: [ 
            { name: 'The Coastal Explorer', desc: 'A scenic journey from the vibrant capital of Maputo up to the luxury islands of Bazaruto.' },
            { name: 'The Northern Heritage Trail', desc: 'Explore the remote coastline from Pemba up to the historic Ibo island and Quirimbas.' },
            { name: 'The Big Five & Beach Loop', desc: 'Connecting the wildlife of Gorongosa with the tropical beaches of the Indian Ocean.' }
        ],
        localFlavor: { 
            food: 'Peri-Peri Chicken, fresh prawns, and Matapa (cassava leaves cooked with coconut and peanuts).', 
            drink: 'Laurenita Premium or 2M (Dois M) beer — the local island quenchers.', 
            lang: 'Portuguese: "Olá" (Hello) / "Obrigado/a" (Thank you) / Swahili also spoken in the north.' 
        },
        advice: { 
            transport: 'Internal flights connect Maputo to beach hubs. A 4x4 is essential for most coastal roads outside of the main highway.', 
            budget: 'From budget-friendly diving hostels to ultra-exclusive private island resorts.', 
            tipping: '10% in urban restaurants. Small tips for boat skippers and lodge staff are greatly appreciated.', 
            visa: 'E-visa available for many; visa-on-arrival is standard for most tourists at major airports/borders.', 
            health: 'High Malaria risk nationwide; prophylaxis is strongly recommended. Drink bottled water.', 
            safety: 'Standard coastal vigilance. Remote beach areas and national parks are generally safe and welcoming.', 
            money: 'Mozambican Metical (MZN). US Dollars and South African Rands are widely accepted at lodges.', 
            climate: 'Best time is May - October (Dry season). Jan - Feb is the cyclone season on the south-east coast.' 
        }
    },
    'malawi': {
        name: 'Malawi',
        tagline: 'The Warm Heart of Africa',
        about: { 
            geo: 'Dominated by the crystalline waters of Lake Malawi, which covers a third of the country, the landscape transitions from the massive Great Rift Valley floor to the 3,000m peaks of Mount Mulanje and the lush, high-altitude Zomba Plateau.', 
            people: 'Malawians are world-famous for their incredible warmth and hospitality. The nation is a peaceful tapestry of ethnic groups, primarily Chewa, Nyanja, and Yao, with deep-rooted traditions in music, dance, and fishing.', 
            history: 'From ancient Iron Age settlements and the 15th-century Maravi Kingdom to the exploration of David Livingstone and independence in 1964. Malawi has a long history of peaceful coexistence.' 
        },
        spots: [ 
            { name: 'Lake Malawi (UNESCO)', desc: 'The "Lake of Stars"—a vast inland sea home to over 1,000 species of colorful cichlid fish. Perfect for kayaking, snorkeling, and sunset dhow cruises.' }, 
            { name: 'Mount Mulanje', desc: 'The "Island in the Sky"—a massive granite massif that rises abruptly from the tea estates, offering world-class hiking and the unique Mulanje Cedar.' },
            { name: 'Liwonde National Park', desc: 'A premier wildlife sanctuary centered on the Shire River, famous for its dense populations of elephants, hippos, and rare black rhinos.' },
            { name: 'Majete Wildlife Reserve', desc: 'Malawi\'s most successful conservation story—a rewilded paradise where the Big Five have been restored to their ancestral home.' },
            { name: 'Nyika Plateau', desc: 'A mystical high-altitude grassland resembling the Scottish Highlands, famous for its high concentration of leopards and rare orchids.' }
        ],
        activities: [ 
            { name: 'Snorkeling with Cichlids', desc: 'Swim in the crystal-clear waters of Cape Maclear amidst hundreds of vibrant, endemic fish species.' }, 
            { name: 'Mulanje Peak Trek', desc: 'Challenge yourself on a multi-day hike to Sapitwa Peak, the highest point in South-Central Africa.' },
            { name: 'Shire River Boat Safari', desc: 'Glide past massive herds of elephants and pods of hippos in the heart of Liwonde.' },
            { name: 'Tea Estate Tasting', desc: 'Tour the historic colonial-era tea plantations of Thyolo for a taste of Malawi\'s agricultural heritage.' },
            { name: 'Kayaking to Domwe Island', desc: 'Escape to a remote, uninhabited island inside the Lake Malawi National Park for a night under the stars.' }
        ],
        routes: [ 
            { name: 'The Lake of Stars Circuit', desc: 'A classic journey tracing the palm-fringed shoreline from Monkey Bay to the remote northern villages.' },
            { name: 'The Rift Valley Explorer', desc: 'Connecting the wildlife of Majete and Liwonde with the high altitudes of Mulanje and Zomba.' },
            { name: 'The Northern Highlands Trail', desc: 'A remote trek through the rolling grasslands of Nyika and the historic mission town of Livingstonia.' }
        ],
        localFlavor: { 
            food: 'Chambo (highly-prized tilapia from the lake) served with Nshima (thick maize porridge) and pumpkin leaves.', 
            drink: 'Malawi Shandy or a refreshing Kuche Kuche beer — the local favorite after a day on the water.', 
            lang: 'Chichewa: \"Moni\" (Hello) / \"Zikomo kwambiri\" (Thank you very much)' 
        },
        advice: { 
            transport: 'Guided transfers or internal flights are best. Self-drive is possible but roads can be challenging in the rainy season.', 
            budget: 'Extremely high value. One of the most affordable destinations in Southern Africa for mid-range travelers.', 
            tipping: '10% in urban restaurants. Small tips for boat skippers and lodge staff are greatly appreciated.', 
            visa: 'E-Visa or Visa on Arrival available for most Western nationalities. Check the latest e-visa portal.', 
            health: 'Malaria prophylaxis is essential, especially near the lake. Avoid swimming in stagnant water to prevent Bilharzia.', 
            safety: 'Very safe for solo and family travelers. Standard urban vigilance in Lilongwe and Blantyre.', 
            money: 'Malawian Kwacha (MWK). Cash is king; credit cards are mostly accepted at higher-end lodges and banks.', 
            climate: 'Best time is May - October (Dry season). The "Lake of Stars" music festival usually takes place in September.' 
        }
    },
    'lesotho': {
        name: 'Lesotho',
        tagline: 'The Kingdom in the Sky',
        about: { 
            geo: 'The only independent state in the world that lies entirely above 1,000m. A rugged, mountainous country defined by the dramatic Maloti and Drakensberg ranges.', 
            people: 'Home to the resilient Basotho people, known for their iconic conical hats (Mokorotlo), colorful blankets, and extraordinary mountain horsemanship.', 
            history: 'Founded by King Moshoeshoe I in the early 19th century as a mountain stronghold. Lesotho remains a proud and culturally distinct constitutional monarchy.' 
        },
        spots: [ 
            { name: 'Maletsunyane Falls', desc: 'One of Africa\'s highest single-drop waterfalls, plunging 192 meters into a spectacular, spray-filled gorge.' }, 
            { name: 'Sani Pass', desc: 'The world-famous alpine road that snakes up the Drakensberg escarpment, home to the Highest Pub in Africa (2,874m).' },
            { name: 'Sehlabathebe National Park', desc: 'A remote UNESCO-listed wilderness of unique rock formations, alpine flora, and high-altitude wetlands.' },
            { name: 'Katse Dam', desc: 'An engineering marvel nestled deep in the mountains, forming a massive sapphire-blue lake amidst the peaks.' },
            { name: 'Thaba Bosiu', desc: 'The "Mountain at Night"—the historic sandstone plateau that served as the impenetrable fortress of the first Basotho King.' }
        ],
        activities: [ 
            { name: 'Pony Trekking', desc: 'Explore the rugged highlands on a sturdy Basotho pony, the traditional and most reliable "4x4" of the mountains.' }, 
            { name: 'Abseiling the Falls', desc: 'Tackle the world\'s longest commercially operated abseil alongside the thundering Maletsunyane Falls.' },
            { name: 'Drakensberg Alpine Hiking', desc: 'Follow ancient trails across the "Roof of Africa," reaching peaks over 3,400m high.' },
            { name: 'Snow Skiing (Seasonal)', desc: 'Experience Southern Africa\'s unique winter destination at Afriski Mountain Resort (June - August).' },
            { name: 'San Rock Art Tours', desc: 'Discover ancient rock art sites hidden in the remote overhangs and caves of the Maloti Mountains.' }
        ],
        routes: [ 
            { name: 'The Roof of Africa Route', desc: 'A high-altitude journey across the dramatic mountain passes and plateaus of the central range.' },
            { name: 'The Sani Serpent Trail', desc: 'The ultimate 4x4 challenge ascending from South Africa into the Lesotho highlands via Sani Pass.' },
            { name: 'The Southern Fortress Loop', desc: 'A historic route connecting the lowlands with the mountain strongholds of Thaba Bosiu and Morija.' }
        ],
        localFlavor: { 
            food: 'Papa (maize meal) served with Moroho (spiced greens) and slow-roasted mountain lamb.', 
            drink: 'Maluti Premium Lager — the perfect refreshment after a day in the high-altitude sun.', 
            lang: 'Sesotho: \"Lumela\" (Hello) / \"Ke a leboha\" (Thank you)' 
        },
        advice: { 
            transport: 'A high-clearance 4x4 is essential for mountain passes. Local Basotho taxis connect major lowland towns.', 
            budget: 'Very affordable, but 4x4 rental and specialized mountain guides are the primary expenses.', 
            tipping: '10% in restaurants. Small tips for pony trekking guides are customary and appreciated.', 
            visa: 'Visa-free for many nationalities. Entry is primarily via South Africa; ensure your SA visa allows re-entry.', 
            health: 'High altitude means thin air and strong sun. Bring warm clothing regardless of the season—snow is possible year-round.', 
            safety: 'Extremely safe and welcoming. Hikers should be prepared for sudden, dramatic mountain weather changes.', 
            money: 'Lesotho Loti (LSL) pegged 1:1 with the South African Rand. Both are widely accepted.', 
            climate: 'Cold, snowy winters (June-Aug); mild, rainy summers (Nov-Mar). Autumn (March-May) is spectacular.' 
        }
    },
    'eswatini': {
        name: 'Eswatini',
        tagline: 'Rich Traditions & Royal Heritage',
        about: { 
            geo: 'One of the smallest countries in Africa, yet incredibly diverse—ranging from the highveld mountains of the west to the lowveld savanna and the Lebombo mountains in the east.', 
            people: 'Known for a vibrant, living culture centered on an absolute monarchy. The Swazi people are famously friendly and proud of their ancient festivals and traditions.', 
            history: 'Since the 18th-century migration of the Dlamini clan. Eswatini (formerly Swaziland) is one of the few remaining absolute monarchies in the world.' 
        },
        spots: [ 
            { name: 'Hlane Royal National Park', desc: 'Eswatini\'s largest protected area and home to the Big Five. Famous for its high concentration of white rhino and majestic lions.' }, 
            { name: 'Mlilwane Wildlife Sanctuary', desc: 'A peaceful, vehicle-free sanctuary in the beautiful Ezulwini Valley, perfect for walking, cycling, and horse-riding safaris.' },
            { name: 'Mantenga Cultural Village', desc: 'A living museum of Swazi traditions, featuring a reconstructed 19th-century village and spectacular traditional dance performances.' },
            { name: 'Mkhaya Game Reserve', desc: 'Renowned as one of Africa\'s best places for rhino tracking. Each visit supports critical conservation efforts for black and white rhinos.' },
            { name: 'Ngwenya Glass & Craft Markets', desc: 'Visit the world\'s oldest mine and see artisans transform recycled glass into world-class art at the Ngwenya workshops.' }
        ],
        activities: [ 
            { name: 'Rhino Tracking on Foot', desc: 'Get heart-stoppingly close to black and white rhinos with expert rangers in the Mkhaya Game Reserve.' }, 
            { name: 'The Umhlanga (Reed Dance)', desc: 'Experience one of Africa\'s most spectacular cultural festivals (usually in late August/early September).' },
            { name: 'Ezulwini Valley Horse Back Safari', desc: 'Ride through the "Valley of Heaven" among zebras and warthogs in Mlilwane Sanctuary.' },
            { name: 'Adventure Caving', desc: 'Explore the unique granite caves of Gobholo, navigating deep tunnels and subterranean streams.' },
            { name: 'Swazi Craft Trail', desc: 'Tour the vibrant markets of Mbabane and Manzini for world-famous handmade candles, glass, and baskets.' }
        ],
        routes: [ 
            { name: 'The Royal Heritage Trail', desc: 'A classic route connecting the cultural heart of Ezulwini with the big game parks of the lowveld.' },
            { name: 'The Lebombo Mountain Loop', desc: 'A scenic journey along the eastern border through some of the country\'s most dramatic landscapes.' },
            { name: 'The Highveld to Lowveld Transit', desc: 'Experience the rapid change in climate and scenery as you descend from the mountains to the plains.' }
        ],
        localFlavor: { 
            food: 'Umncweba (dried meat) and Sishwala (thick maize porridge) paired with roasted meat and fresh vegetables.', 
            drink: 'Sibebe Premium Lager — named after the iconic Sibebe Rock, the largest granite pluton in the world.', 
            lang: 'SiSwati: \"Sawubona\" (Hello) / \"Ngiyabonga\" (Thank you)' 
        },
        advice: { 
            transport: 'Excellent road infrastructure makes Eswatini easy to navigate by normal car. Guided transfers from South Africa are very common.', 
            budget: 'Very high value. Mid-range accommodation and guided wildlife tours are very affordable.', 
            tipping: '10% in restaurants. Small tips for park rangers and cultural performance groups are appreciated.', 
            visa: 'Visa-free for most Commonwealth and EU citizens. Entry is primarily via road from SA or Mozambique.', 
            health: 'Low malaria risk, but prophylaxis is advised for the lowveld regions during the rainy summer months.', 
            safety: 'Extremely safe and hospitable. King-size hospitality is a national point of pride.', 
            money: 'Swazi Lilangeni (SZL) pegged 1:1 with the South African Rand. Both are widely accepted.', 
            climate: 'Subtropical; hot, rainy summers (Nov-Mar) and mild, dry winters (May-Aug)—the best time for wildlife.' 
        }
    }
};

// --- Navigation & Routing for Destination Guides ---
const detailView = document.getElementById('country-detail-view');
const closeDetailBtn = document.getElementById('close-detail');

// Elements for population
const detailHeroImg = document.getElementById('detail-hero-img');
const detailTitle = document.getElementById('detail-title');
const detailTagline = document.getElementById('detail-tagline');
const detailGeo = document.getElementById('detail-geo');
const detailPeople = document.getElementById('detail-people');
const detailSpotsGrid = document.getElementById('detail-spots-grid');
const detailActivities = document.getElementById('detail-activities');
const detailTransport = document.getElementById('detail-transport');
const detailBudget = document.getElementById('detail-budget');
const detailVisa = document.getElementById('detail-visa');
const detailSafety = document.getElementById('detail-safety');
const detailMoney = document.getElementById('detail-money');
const detailFlavorInline = document.getElementById('detail-flavor-inline');
const ctaCountryName = document.querySelector('.cta-country-name');

const SUPPORT_PHONE = '260977123456';
const SUPPORT_EMAIL = 'bookings@savannaexplorer.com';

function spotImageUrl(spot) {
    if (spot.image) {
        return `https://images.unsplash.com/photo-${spot.image}?auto=format&fit=crop&q=80&w=800`;
    }
    return 'https://images.unsplash.com/photo-1519066629447-267fffa62d4b?auto=format&fit=crop&q=80&w=800';
}

function activityImageUrl(act) {
    if (act.image) {
        return `https://images.unsplash.com/photo-${act.image}?auto=format&fit=crop&q=80&w=300`;
    }
    return 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=300';
}

function populateCountryPage(countryId) {
    const data = countryData[countryId];
    if (!data) return;
    const guide = getCountryGuide(countryId, data);

    detailView.scrollTop = 0;

    detailTitle.textContent = data.name;
    detailTagline.textContent = data.tagline;

    const aboutHeading = document.getElementById('detail-about-heading');
    const aboutIntro = document.getElementById('detail-about-intro');
    if (aboutHeading) aboutHeading.textContent = `Information About ${data.name}`;
    if (aboutIntro) aboutIntro.textContent = `Discover essential information for your trip to ${data.name} — geography, history, culture, wildlife, and practical travel advice.`;

    const detailHistory = document.getElementById('detail-history');
    if (detailHistory) detailHistory.textContent = data.about.history || '';

    const detailWildlife = document.getElementById('detail-wildlife');
    if (detailWildlife) detailWildlife.textContent = guide.wildlife;

    detailGeo.textContent = data.about.geo;
    detailPeople.textContent = data.about.people;

    const cardImg = document.querySelector(`.country-card[data-country-id="${countryId}"] img`);
    if (cardImg) {
        detailHeroImg.src = cardImg.src.replace('w=800', 'w=1920');
    }

    detailSpotsGrid.innerHTML = data.spots.map(spot => `
        <div class="spot-detail-card">
            <img src="${spotImageUrl(spot)}" alt="${spot.name}" loading="lazy">
            <div class="spot-detail-info">
                <h3>${spot.name}</h3>
                <p>${spot.desc}</p>
            </div>
        </div>
    `).join('');

    detailActivities.innerHTML = data.activities.map(act => `
        <div class="activity-detail-item">
            <img src="${activityImageUrl(act)}" alt="${act.name}" loading="lazy">
            <div class="activity-text">
                <h3>${act.name}</h3>
                <p>${act.desc}</p>
            </div>
        </div>
    `).join('');

    const actCategories = document.getElementById('detail-activity-categories');
    if (actCategories) {
        actCategories.innerHTML = guide.activityCategories.map(cat => `
            <div class="activity-cat-card">
                <div class="activity-cat-header"><span>${cat.icon}</span><h4>${cat.name}</h4></div>
                <ul>${cat.items.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    detailTransport.textContent = data.advice.transport;
    detailBudget.textContent = data.advice.budget;
    detailVisa.textContent = data.advice.visa;
    detailSafety.textContent = data.advice.safety;
    detailMoney.textContent = data.advice.money;

    const detailHealth = document.getElementById('detail-health');
    const detailTipping = document.getElementById('detail-tipping');
    const detailFood = document.getElementById('detail-food');
    if (detailHealth) detailHealth.textContent = guide.health;
    if (detailTipping) detailTipping.textContent = guide.tipping;
    if (detailFood) detailFood.textContent = guide.food;

    const detailSeasons = document.getElementById('detail-seasons');
    if (detailSeasons) {
        detailSeasons.innerHTML = guide.seasons.map(s => `
            <div class="season-card">
                <span class="season-icon">${s.icon}</span>
                <h4>${s.name}</h4>
                <p>${s.desc}</p>
            </div>
        `).join('');
    }

    const detailPacking = document.getElementById('detail-packing');
    if (detailPacking) {
        detailPacking.innerHTML = guide.packing.map(item => `<li>${item}</li>`).join('');
    }

    const detailDayNarrative = document.getElementById('detail-day-narrative');
    if (detailDayNarrative) {
        detailDayNarrative.innerHTML = `
            <h3><i class="fas fa-sun"></i> A Day on Safari in ${data.name}</h3>
            <ol class="narrative-list">${guide.dayNarrative.map(line => `<li>${line}</li>`).join('')}</ol>
        `;
    }

    const detailPractical = document.getElementById('detail-practical');
    if (detailPractical) {
        const p = guide.practical;
        detailPractical.innerHTML = `
            <div class="practical-card"><i class="fas fa-language"></i><h4>Language</h4><p>${p.language}</p></div>
            <div class="practical-card"><i class="fas fa-plug"></i><h4>Electricity</h4><p>${p.electricity}</p></div>
            <div class="practical-card"><i class="fas fa-sim-card"></i><h4>Mobile & SIM</h4><p>${p.sim}</p></div>
            <div class="practical-card"><i class="fas fa-clock"></i><h4>Time Zone</h4><p>${p.time}</p></div>
        `;
    }

    const detailRoutesGrid = document.getElementById('detail-routes-grid');
    if (detailRoutesGrid && data.routes) {
        detailRoutesGrid.innerHTML = data.routes.map(route => `
            <div class="route-card">
                <h4>${route.name}</h4>
                <p>${route.desc}</p>
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('close-detail').click(); window.location.hash=''; setTimeout(() => document.getElementById('itineraries').scrollIntoView({behavior:'smooth'}), 300);">View All Itineraries</button>
            </div>
        `).join('');
    }

    if (detailFlavorInline) {
        detailFlavorInline.innerHTML = `
            <div class="flavor-item">
                <div class="flavor-icon"><i class="fa-solid fa-utensils"></i></div>
                <div class="flavor-text">
                    <span class="flavor-label">Signature Dish</span>
                    <span class="flavor-value">${data.localFlavor.food}</span>
                </div>
            </div>
            <div class="flavor-item">
                <div class="flavor-icon"><i class="fa-solid fa-glass-water"></i></div>
                <div class="flavor-text">
                    <span class="flavor-label">Local Drink</span>
                    <span class="flavor-value">${data.localFlavor.drink}</span>
                </div>
            </div>
            <div class="flavor-item">
                <div class="flavor-icon"><i class="fa-solid fa-comments"></i></div>
                <div class="flavor-text">
                    <span class="flavor-label">Greeting</span>
                    <span class="flavor-value">${data.localFlavor.lang}</span>
                </div>
            </div>
        `;
    }

    if (ctaCountryName) ctaCountryName.textContent = data.name;

    document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide-panel').forEach(p => p.classList.remove('active'));
    const firstTab = document.querySelector('.guide-tab[data-tab="about"]');
    const firstPanel = document.getElementById('panel-about');
    if (firstTab) firstTab.classList.add('active');
    if (firstPanel) firstPanel.classList.add('active');
}

function showCountryPage(countryId) {
    if (!countryData[countryId]) return;
    
    populateCountryPage(countryId);
    detailView.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeCountryPage() {
    detailView.classList.add('hidden');
    document.body.style.overflow = '';
    if (window.location.hash && Object.keys(countryData).includes(window.location.hash.substring(1))) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
    }
}

// Card Click Listeners
document.querySelectorAll('.country-card').forEach(card => {
    card.addEventListener('click', () => {
        const countryId = card.getAttribute('data-country-id');
        window.location.hash = countryId;
    });
});

if (closeDetailBtn) {
    closeDetailBtn.addEventListener('click', closeCountryPage);
}

// Router logic
function handleRouting() {
    const hash = window.location.hash.substring(1);
    const validCountries = Object.keys(countryData);
    if (hash && validCountries.includes(hash)) {
        showCountryPage(hash);
    } else {
        closeCountryPage();
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

// Country guide tab switching
document.querySelectorAll('.guide-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.guide-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(`panel-${target}`);
        if (panel) panel.classList.add('active');
    });
});

// --- Itinerary Detail Modal ---
let currentItineraryId = null;

window.openItineraryDetail = function(id) {
    const data = itineraryData[id];
    if (!data) return;
    currentItineraryId = id;

    document.getElementById('itin-type').textContent = data.type;
    document.getElementById('itin-title').textContent = data.title;
    document.getElementById('itin-countries').textContent = data.countries;
    document.getElementById('itin-duration').innerHTML = `<i class="far fa-clock"></i> ${data.duration}`;
    document.getElementById('itin-price').innerHTML = `<i class="fas fa-tag"></i> From ${data.priceFrom}`;
    document.getElementById('itin-customizable').innerHTML = data.customizable
        ? '<i class="fas fa-sliders-h"></i> Fully Customizable'
        : '<i class="fas fa-lock"></i> Fixed Departure';
    document.getElementById('itin-description').textContent = data.description;

    document.getElementById('itin-highlights').innerHTML = `
        <h4>Highlights</h4>
        <ul>${data.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    `;

    document.getElementById('itin-accordion').innerHTML = data.days.map((day, i) => `
        <div class="accordion-item">
            <button class="accordion-header" onclick="toggleAccordion(this)" aria-expanded="${i === 0}">
                <span class="accordion-day">${day.range}</span>
                <span class="accordion-title">${day.title}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="accordion-body${i === 0 ? ' open' : ''}">
                <p class="accordion-places"><i class="fas fa-map-marker-alt"></i> ${day.places}</p>
                <p>${day.narrative}</p>
            </div>
        </div>
    `).join('');

    document.getElementById('itin-included').innerHTML = data.included.map(i => `<li>${i}</li>`).join('');
    document.getElementById('itin-excluded').innerHTML = data.excluded.map(i => `<li>${i}</li>`).join('');

    document.getElementById('itin-whatsapp-btn').onclick = () => {
        inquireJourney(data.title, data.countries);
    };

    document.getElementById('itinerary-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.toggleAccordion = function(btn) {
    const body = btn.nextElementSibling;
    const isOpen = body.classList.contains('open');
    btn.closest('.itin-accordion').querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
    btn.closest('.itin-accordion').querySelectorAll('.accordion-header').forEach(h => h.setAttribute('aria-expanded', 'false'));
    if (!isOpen) {
        body.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    }
};

function closeItineraryModal() {
    document.getElementById('itinerary-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentItineraryId = null;
}

document.querySelectorAll('.itin-close').forEach(btn => {
    btn.addEventListener('click', closeItineraryModal);
});

window.requestItineraryQuote = function() {
    const data = itineraryData[currentItineraryId];
    closeItineraryModal();
    if (data) {
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        const msg = document.getElementById('q-message');
        if (msg) msg.value = `I'm interested in the "${data.title}" itinerary (${data.duration}, ${data.countries}).`;
    }
};

window.submitQuotation = function(e) {
    e.preventDefault();
    const name = document.getElementById('q-name').value;
    const email = document.getElementById('q-email').value;
    const travelers = document.getElementById('q-travelers').value;
    const style = document.getElementById('q-style').value;
    const itineraries = [...document.querySelectorAll('input[name="itinerary"]:checked')].map(c => c.value);
    const message = document.getElementById('q-message').value;

    const body = `Quotation Request from Savanna Explorer\n\nName: ${name}\nEmail: ${email}\nTravelers: ${travelers}\nStyle: ${style}\nItineraries: ${itineraries.join(', ') || 'Not specified'}\n\nMessage:\n${message}`;
    window.location.href = `mailto:bookings@savannaexplorer.com?subject=${encodeURIComponent('Quotation Request - ' + name)}&body=${encodeURIComponent(body)}`;
};


/* --- EXPERIENCES MARKETPLACE LAYER (SUPABASE BACKEND) --- */

// 1. Supabase Initialization (Add your real keys here)
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
let supabaseClient = null;

if (window.supabase) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.warn("Supabase client not initialized. Using local JSON fallback.");
    }
}

// 2. Static Fallback Data
const marketplaceData = {
    'safari': [
        { id: 'saf1', title: '5-Day Classic Kruger Safari', category: 'safari', location: 'South Africa', duration: '5 Days', price_range: '$$$', rating: 4.8, badge: 'Top Pick', best_time: 'May - October', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', description: 'Experience the raw beauty of Kruger with expert local trackers.' },
        { id: 'saf2', title: 'Delta Mokoro Expedition', category: 'safari', location: 'Botswana', duration: '3 Days', price_range: '$$$$', rating: 4.9, badge: 'Exclusive', best_time: 'June - August', image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=800&auto=format&fit=crop', description: 'Glide silently through the Okavango waterways in a traditional canoe.' },
        { id: 'saf3', title: 'Etosha Waterhole Watch', category: 'safari', location: 'Namibia', duration: '4 Days', price_range: '$$', rating: 4.6, badge: 'Popular', best_time: 'July - October', image: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=800&auto=format&fit=crop', description: 'Unrivaled game viewing at the famous floodlit waterholes.' }
    ],
    'adventure': [
        { id: 'adv1', title: 'Namib Dune Surfing', category: 'adventure', location: 'Namibia', duration: 'Half Day', price_range: '$$', rating: 4.7, badge: 'Adrenaline', best_time: 'Year-round', image: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=800&auto=format&fit=crop', description: 'Tackle the sheer slipfaces of the world\'s oldest desert.' },
        { id: 'adv2', title: 'Zambezi White Water Rafting', category: 'adventure', location: 'Zimbabwe', duration: '1 Day', price_range: '$$$', rating: 4.9, badge: 'Bestseller', best_time: 'August - December', image: 'https://images.unsplash.com/photo-1454486326938-e6727284ea44?q=80&w=800&auto=format&fit=crop', description: 'Navigate Grade 5 rapids below the majestic Victoria Falls.' }
    ],
    'culture': [
        { id: 'cul1', title: 'Himba Village Journey', category: 'culture', location: 'Namibia', duration: '2 Days', price_range: '$$', rating: 4.6, badge: 'Authentic', best_time: 'May - Sept', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', description: 'Learn the ancient desert survival skills of the Himba people.' },
        { id: 'cul2', title: 'Cape Winelands Tour', category: 'culture', location: 'South Africa', duration: '1 Day', price_range: '$$$', rating: 4.8, badge: 'Relaxing', best_time: 'Nov - April', image: 'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?q=80&w=800&auto=format&fit=crop', description: 'Taste world-class vintages across historic wine estates.' }
    ],
    'nature': [
        { id: 'nat1', title: 'Victoria Falls Flight', category: 'nature', location: 'Zambia', duration: '1 Hour', price_range: '$$$', rating: 5.0, badge: 'Bucket List', best_time: 'Feb - May', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop', description: 'Helicopter "Flight of Angels" over the thundering falls.' },
        { id: 'nat2', title: 'Drakensberg Hike', category: 'nature', location: 'South Africa', duration: '3 Days', price_range: '$$', rating: 4.7, badge: 'Scenic', best_time: 'March - May', image: 'https://images.unsplash.com/photo-1541414779316-956a5084c0d4?q=80&w=800&auto=format&fit=crop', description: 'Trek the spectacular Amphitheatre in the Drakensberg mountains.' }
    ]
};

const marketModal = document.getElementById('marketplace-modal');
const marketClosers = document.querySelectorAll('.market-close');
const marketGrid = document.getElementById('marketplace-grid');
const marketTitle = document.getElementById('market-title');

// 3. Inquiry Tracking & WhatsApp Redirect
window.handleInquiry = async function(id, title, duration, location) {
    const msg = `Hello, I'm interested in the ${title} (${duration}) in ${location}.\n\nPlease share:\n- Availability\n- Pricing details\n- What's included\n\nThank you.`;
    const waLink = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`;
    
    // Attempt tracking insert to Supabase 'inquiries' table
    if (supabaseClient && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
        try {
            await supabaseClient.from('inquiries').insert([{
                experience_id: isNaN(id) ? null : id, // Handle string fallbacks safely
                message: msg,
                source: 'whatsapp'
            }]);
        } catch (err) {
            console.error("Tracking insertion failed:", err);
        }
    }
    
    // Redirect User
    window.open(waLink, '_blank');
};

// 4. Dynamic Data Fetching
async function openMarketplace(theme) {
    // Show Modal Loading State
    marketModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    marketTitle.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">Fetching curated experiences...</div>';

    let items = [];

    // Attempt Supabase Fetch
    if (supabaseClient && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
        const { data, error } = await supabaseClient
            .from('experiences')
            .select('*')
            .eq('category', theme)
            .order('rating', { ascending: false });
            
        if (!error && data && data.length > 0) {
            items = data;
        } else {
            console.warn("Supabase fetch failed or empty, using fallback.");
            items = marketplaceData[theme] || [];
        }
    } else {
        // Fallback to local JSON immediately if keys are placeholders
        items = marketplaceData[theme] || [];
    }

    // Render Cards
    if (items.length === 0) {
        marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">No experiences found for this category yet.</div>';
        return;
    }

    marketGrid.innerHTML = items.map(item => `
        <div class="market-card">
            <div class="market-img">
                <img src="${item.image_url || item.image}" alt="${item.title}" loading="lazy">
                <span class="market-badge">${item.badge || 'Available'}</span>
            </div>
            <div class="market-info">
                <h3>${item.title}</h3>
                <div class="market-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                    <span><i class="far fa-clock"></i> ${item.duration}</span>
                </div>
                <p class="market-desc">${item.description}</p>
                <div class="market-meta-bottom">
                    <span class="m-price">${item.price_range}</span>
                    <span class="m-rating"><i class="fas fa-star"></i> ${item.rating || 4.5}</span>
                </div>
                <div class="market-action">
                    <button onclick="handleInquiry('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${item.duration}', '${item.location.replace(/'/g, "\\'")}')" class="btn btn-primary btn-inquire"><i class="fab fa-whatsapp"></i> Inquire Now</button>
                </div>
            </div>
        </div>
    `).join('');
}

function closeMarketplace() {
    marketModal.classList.remove('active');
    document.body.style.overflow = '';
}

marketClosers.forEach(btn => btn.addEventListener('click', closeMarketplace));

// Listen to Thematic Experience Hub Links
document.querySelectorAll('.exp-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = link.getAttribute('data-theme');
        if (theme) openMarketplace(theme);
    });
});

// ==============================================
// SAVANNA EXPLORER V2 — NEW INTERACTIVITY
// ==============================================

// --- National Parks Country Filter ---
document.querySelectorAll('.park-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.park-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.park-card').forEach(card => {
            if (filter === 'all' || card.getAttribute('data-country') === filter) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

// --- Journey Engine WhatsApp Inquiry ---
function inquireJourney(journeyName, route) {
    const msg = encodeURIComponent(
        `Hi! I'm interested in the "${journeyName}" journey (${route}) from Savanna Explorer. Could you help me plan this trip?`
    );
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${msg}`, '_blank');
}

// ==============================================
// UTILITY HUB — Interactive Features
// ==============================================

// --- 1. Live Currency Converter ---
const hubAmount = document.getElementById('hub-amount');
const hubFrom = document.getElementById('hub-from-currency');

function updateCurrency() {
    const amount = parseFloat(hubAmount?.value) || 0;
    const from = hubFrom?.value || 'USD';
    const rateKey = `rate${from.charAt(0).toUpperCase() + from.slice(1).toLowerCase()}`;

    document.querySelectorAll('.hub-cur-val').forEach(el => {
        const rate = parseFloat(el.dataset[rateKey]) || 0;
        const result = amount * rate;
        el.textContent = result.toLocaleString('en-US', {
            minimumFractionDigits: result > 1000 ? 0 : 2,
            maximumFractionDigits: result > 1000 ? 0 : 2
        });
    });
}

if (hubAmount) hubAmount.addEventListener('input', updateCurrency);
if (hubFrom) hubFrom.addEventListener('change', updateCurrency);

// --- 2. Visa Search Filter ---
const hubVisaSearch = document.getElementById('hub-visa-search');
if (hubVisaSearch) {
    hubVisaSearch.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        document.querySelectorAll('.hub-matrix-row').forEach(row => {
            const country = row.getAttribute('data-country') || '';
            row.style.display = country.includes(q) ? '' : 'none';
        });
    });
}

// --- 3. Packing Wizard — Tab Switching ---
const packingData = {
    safari: [
        'Binoculars', 'Neutral-tone clothing', 'Insect repellent (DEET)',
        'Headlamp / torch', 'Power bank', 'Sun hat & SPF 50',
        'Camera + zoom lens', 'Reusable water bottle'
    ],
    beach: [
        'Swimsuit & cover-up', 'Reef-safe sunscreen SPF 50', 'Snorkel & mask',
        'Waterproof phone pouch', 'Flip flops & water shoes', 'Beach towel',
        'Aloe vera gel', 'Light sarong / wrap'
    ],
    city: [
        'Comfortable walking shoes', 'Crossbody anti-theft bag', 'Portable charger',
        'Light jacket / layers', 'Travel adapter (Type M/G)', 'Copies of passport',
        'Sunglasses', 'Day backpack'
    ],
    mountain: [
        'Hiking boots (broken in)', 'Thermal base layers', 'Rain jacket',
        'Trekking poles', 'Altitude sickness meds', 'Warm fleece / down jacket',
        'Head torch + batteries', 'Trail snacks & electrolytes'
    ]
};

function renderPackList(type) {
    const list = document.getElementById('hub-pack-list');
    if (!list) return;
    const items = packingData[type] || packingData.safari;
    list.innerHTML = items.map(item =>
        `<label class="hub-pack-item"><input type="checkbox" onchange="updatePackProgress()"> <span>${item}</span></label>`
    ).join('');
    updatePackProgress();
}

document.querySelectorAll('.hub-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderPackList(this.dataset.pack);
    });
});

// --- Packing Progress Bar ---
function updatePackProgress() {
    const total = document.querySelectorAll('#hub-pack-list input[type="checkbox"]').length;
    const checked = document.querySelectorAll('#hub-pack-list input[type="checkbox"]:checked').length;
    const fill = document.getElementById('pack-progress');
    const text = document.getElementById('pack-progress-text');
    if (fill) fill.style.width = total ? `${(checked / total) * 100}%` : '0%';
    if (text) text.textContent = `${checked} of ${total} packed`;
}
