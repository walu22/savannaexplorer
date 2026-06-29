/**
 * Generates data/itinerary-budgets.json — indicative line-item budgets aligned to typicalBudget totals.
 * Run: node scripts/generate-itinerary-budgets.mjs
 */
import { writeFileSync } from 'fs';

/** @type {Record<string, { total: number, days: number, travelers: number, basis: string, lines: Array<{ category: string, item: string, amount: number, shared?: boolean, note?: string }>, tips: string[] }>} */
const SPECS = {
  'desert-to-delta': {
    total: 2450, days: 17, travelers: 2,
    basis: 'Per person · 17 days · 2 sharing a 4×4 · mid-range camps & lodges',
    lines: [
      { category: 'Vehicle', item: '4×4 rental (unlimited km, Windhoek–Maun one-way)', amount: 620, shared: true, note: 'Split between 2' },
      { category: 'Fuel', item: 'Namibia + Botswana (~3,800 km)', amount: 210, shared: true },
      { category: 'Park fees', item: 'Etosha, Mahango, Chobe day pass, Moremi', amount: 195 },
      { category: 'Accommodation', item: 'Mix camps & mid lodges (16 nights)', amount: 720 },
      { category: 'Border & insurance', item: 'Cross-border permit, COMESA, road fees (2 borders)', amount: 95 },
      { category: 'Activities', item: 'Mokoro day trip, Chobe sunset cruise', amount: 280 },
      { category: 'Food & supplies', item: 'Self-catering + lodge meals', amount: 230 },
      { category: 'Contingency', item: 'Tyre repair, tips, SIM data', amount: 100 },
    ],
    tips: ['Book Etosha camps on nwr.com.na months ahead for Jul–Oct', 'Arrange rental cross-border letter before leaving Windhoek', 'Caprivi fuel stops: Rundu and Divundu — never run empty'],
  },
  'coastal-explorer': {
    total: 2890, days: 17, travelers: 2,
    basis: 'Per person · 17 days · 2 sharing sedan/4×4 · mid-range coastal stops',
    lines: [
      { category: 'Vehicle', item: 'Rental car CPT–Maputo return leg', amount: 580, shared: true },
      { category: 'Fuel & tolls', item: 'Garden Route, KZN, Mozambique EN1', amount: 240, shared: true },
      { category: 'Park fees', item: 'SANParks (Tsitsikamma, iSimangaliso), Kosi Bay', amount: 120 },
      { category: 'Accommodation', item: 'Guesthouses & beach lodges (16 nights)', amount: 850 },
      { category: 'Border fees', item: 'Lebombo/Ressano Garcia + Mozambique TIP', amount: 85 },
      { category: 'Activities', item: 'Bazaruto dhow/snorkel day, whale watching', amount: 420 },
      { category: 'Food', item: 'Restaurants & self-catering', amount: 380 },
      { category: 'Contingency', item: 'Travel insurance share, tips', amount: 215 },
    ],
    tips: ['Mozambique e-visa before border if required for your passport', 'Avoid night driving on EN1 north of Maputo', 'Book Bazaruto transfers from Vilanculos in advance'],
  },
  'falls-beyond': {
    total: 3150, days: 12, travelers: 2,
    basis: 'Per person · 12 days · mix of internal flights & lodges',
    lines: [
      { category: 'Flights', item: 'Livingstone–Mfuwe return (Proflight estimate)', amount: 380 },
      { category: 'Accommodation', item: 'Mid-range lodges (11 nights, Luangwa/Hwange/Chobe)', amount: 1180 },
      { category: 'Park fees', item: 'South Luangwa, Hwange, Chobe, Victoria Falls NP', amount: 220 },
      { category: 'Activities', item: 'Walking safari, Falls cruise, Chobe boat', amount: 520 },
      { category: 'Transfers', item: 'Inter-lodge & border transfers', amount: 180 },
      { category: 'Visas', item: 'KAZA UniVisa + Botswana day-trip fees', amount: 55 },
      { category: 'Food & drinks', item: 'Meals not included at lodges', amount: 340 },
      { category: 'Contingency', item: 'Helicopter Flight of Angels optional extra', amount: 275 },
    ],
    tips: ['KAZA UniVisa USD 50 cash on arrival at Livingstone or VFA', 'South Luangwa walking safaris require licensed operator — book ahead', 'USD cash essential in Zimbabwe for park fees'],
  },
  'kingdom-circuit': {
    total: 1680, days: 8, travelers: 2,
    basis: 'Per person · 8 days · 2 sharing car · guesthouses & SANParks',
    lines: [
      { category: 'Vehicle', item: 'Compact SUV from JNB (cross-border to LS/SZ)', amount: 320, shared: true },
      { category: 'Fuel & tolls', item: 'Sani Pass, Ezulwini, Kruger run', amount: 140, shared: true },
      { category: 'Park fees', item: 'Kruger 3 days + Hlane/Mlilwane', amount: 110 },
      { category: 'Accommodation', item: 'Guesthouses & rest camps (7 nights)', amount: 420 },
      { category: 'Activities', item: 'Sani Pass 4×4 tour or pony trek half-day', amount: 180 },
      { category: 'Border', item: 'SA–Lesotho–Eswatini–SA re-entry', amount: 45 },
      { category: 'Food', item: 'Self-catering & local restaurants', amount: 195 },
      { category: 'Contingency', item: 'Warm gear hire, tips', amount: 70 },
    ],
    tips: ['Ensure SA visa allows multiple re-entries for Lesotho/Eswatini loops', 'Sani Pass 4×4 only — book guided ascent if not experienced', 'Hlane lion drives book out in SA school holidays'],
  },
  'lake-mountain': {
    total: 1950, days: 12, travelers: 2,
    basis: 'Per person · 12 days · Malawi lake + Zambia safari combo',
    lines: [
      { category: 'Transport', item: 'Hire car + Mwanza border crossing fuel', amount: 380, shared: true },
      { category: 'Accommodation', item: 'Lake lodges & bushcamps (11 nights)', amount: 680 },
      { category: 'Park fees', item: 'Liwonde, Nyika, South Luangwa day fees', amount: 165 },
      { category: 'Activities', item: 'Kayak, snorkel Lake Malawi, game drives', amount: 290 },
      { category: 'Internal travel', item: 'Lilongwe–Cape Maclear–Luangwa transfers', amount: 120 },
      { category: 'Visas', item: 'Malawi + Zambia e-visa/entry fees', amount: 70 },
      { category: 'Food', item: 'Local meals & lodge extras', amount: 185 },
      { category: 'Contingency', item: 'Fuel shortage buffer, malaria meds', amount: 60 },
    ],
    tips: ['Fill fuel in Lilongwe or Blantyre before lake shore drives', 'Check bilharzia advice before swimming — lodge staff know safe bays', 'May–Oct dry season best for Luangwa side trip'],
  },
  'grand-safari': {
    total: 5200, days: 24, travelers: 2,
    basis: 'Per person · 24 days · premium lodges & charter legs',
    lines: [
      { category: 'Accommodation', item: 'Premium lodges & tented camps (23 nights)', amount: 2800 },
      { category: 'Charter flights', item: 'Maun, Mfuwe, Vilanculos bush strips', amount: 680 },
      { category: 'Park & conservancy fees', item: 'Private concessions & national parks', amount: 420 },
      { category: 'Guided activities', item: 'Walking safaris, mokoro, boat cruises', amount: 580 },
      { category: 'Ground transfers', item: 'Meet-and-greet & inter-lodge', amount: 320 },
      { category: 'Visas & borders', item: 'Multi-country entry fees', amount: 120 },
      { category: 'Food & premium drinks', item: 'Excluded lodge extras', amount: 180 },
      { category: 'Contingency', item: 'Gratuities, spa, optional balloon', amount: 100 },
    ],
    tips: ['Peak season (Jul–Sep) — confirm lodge space 9–12 months ahead', 'Soft bags mandatory on most charter flights (15 kg)', 'Travel insurance with USD 250k+ evacuation cover recommended'],
  },
  'namibia-essentials': {
    total: 1890, days: 11, travelers: 2,
    basis: 'Per person · 11 days · self-drive loop · camps & lodges',
    lines: [
      { category: 'Vehicle', item: '4×4 rental Windhoek loop', amount: 480, shared: true },
      { category: 'Fuel', item: 'Sossusvlei–Swakop–Etosha (~2,200 km)', amount: 165, shared: true },
      { category: 'Park fees', item: 'Sesriem, Etosha (NWR)', amount: 145 },
      { category: 'Accommodation', item: 'Camps & lodges (10 nights)', amount: 520 },
      { category: 'Activities', item: 'Deadvlei tour, Swakop activities, Etosha drives', amount: 210 },
      { category: 'Food', item: 'Supermarket self-catering + meals', amount: 195 },
      { category: 'Visa', item: 'E-visa or VOA (non-SADC passports)', amount: 85 },
      { category: 'Contingency', item: 'Puncture repair, park shop', amount: 90 },
    ],
    tips: ['Pre-dawn Sossusvlei entry requires NWR permit — gate times strict', 'Book Etosha Okaukuejo or Halali inside the park early', 'Namibia e-visa from Apr 2025 for many Western passports'],
  },
  'south-africa-classic': {
    total: 2150, days: 13, travelers: 2,
    basis: 'Per person · 13 days · CPT + Garden Route + Kruger',
    lines: [
      { category: 'Vehicle', item: 'Rental car CPT–Kruger one-way or return', amount: 420, shared: true },
      { category: 'Fuel & tolls', item: 'Garden Route + N4 to Kruger', amount: 185, shared: true },
      { category: 'Park fees', item: 'Kruger 4 days + Tsitsikamma/iSimangaliso', amount: 195 },
      { category: 'Accommodation', item: 'Mix rest camps & guesthouses (12 nights)', amount: 580 },
      { category: 'Activities', item: 'Table Mountain, whale watch, sunset drive', amount: 290 },
      { category: 'Food & wine', item: 'Winelands tasting & restaurants', amount: 260 },
      { category: 'Contingency', item: 'SANParks Wild Card vs daily fees — compare', amount: 120 },
      { category: 'Other', item: 'Uber CPT, tips, SIM', amount: 100 },
    ],
    tips: ['SANParks Wild Card pays off with 5+ park days in one year', 'Kruger gate times enforced — plan camp inside the park', 'Book Table Mountain cable car online on wind-prone days'],
  },
  'botswana-delta-focus': {
    total: 3200, days: 9, travelers: 2,
    basis: 'Per person · 9 days · fly-in Delta + Chobe',
    lines: [
      { category: 'Accommodation', item: 'Delta camp + Kasane lodge (8 nights)', amount: 1680 },
      { category: 'Charter flights', item: 'Maun–camp–Maun + Kasane leg', amount: 520 },
      { category: 'Park fees', item: 'Moremi/Chobe concession fees', amount: 180 },
      { category: 'Activities', item: 'Mokoro, game drives, boat cruise (often included — budget extras)', amount: 240 },
      { category: 'Transfers', item: 'JNB–Maun return flight (economy estimate)', amount: 280 },
      { category: 'Food & drinks', item: 'Premium lodge exclusions', amount: 120 },
      { category: 'Contingency', item: 'Gratuities, spa', amount: 180 },
    ],
    tips: ['Most Okavango camps are fly-in only — confirm luggage weight limits', 'Jun–Oct peak — book 6+ months ahead for top camps', 'Chobe combines well as road add-on from Victoria Falls'],
  },
  'zambia-falls-safari': {
    total: 2350, days: 10, travelers: 2,
    basis: 'Per person · 10 days · Livingstone + Luangwa',
    lines: [
      { category: 'Accommodation', item: 'Falls hotel + Luangwa bushcamp (9 nights)', amount: 980 },
      { category: 'Flights', item: 'Livingstone–Mfuwe return', amount: 340 },
      { category: 'Park fees', item: 'Mosi-oa-Tunya + South Luangwa', amount: 165 },
      { category: 'Activities', item: 'Falls activities, walking safari, night drive', amount: 420 },
      { category: 'Visa', item: 'KAZA UniVisa or visa-on-arrival', amount: 50 },
      { category: 'Transfers', item: 'Airport & lodge transfers', amount: 95 },
      { category: 'Food & drinks', item: 'Meals outside lodges', amount: 180 },
      { category: 'Contingency', item: 'Malaria prophylaxis, tips', amount: 120 },
    ],
    tips: ['Emerald season (Nov–Apr) lower rates but some camps close', 'Devil\'s Pool usually Aug–Jan when water low enough', 'Malaria prophylaxis essential for Luangwa'],
  },
  'zimbabwe-wilderness': {
    total: 2100, days: 9, travelers: 2,
    basis: 'Per person · 9 days · VFA + Hwange + Mana Pools',
    lines: [
      { category: 'Accommodation', item: 'Vic Falls + Hwange + Mana camps (8 nights)', amount: 890 },
      { category: 'Park fees', item: 'Zimparks — Hwange, Mana, Falls', amount: 175 },
      { category: 'Transfers', item: 'VFA–Hwange–Mana road transfers', amount: 220 },
      { category: 'Activities', item: 'Walking safari Mana, Falls cruise', amount: 350 },
      { category: 'Visa', item: 'KAZA UniVisa USD 50', amount: 50 },
      { category: 'Food & USD cash', item: 'Meals, tips — USD small notes', amount: 245 },
      { category: 'Contingency', item: 'Optional rafting, helicopter', amount: 170 },
    ],
    tips: ['Mana Pools walking safaris require experienced guide — book licensed operator', 'USD cash in small denominations for Victoria Falls town', 'Dry season Jul–Oct for Hwange elephant concentrations'],
  },
  'mozambique-bush-beach': {
    total: 2450, days: 11, travelers: 2,
    basis: 'Per person · 11 days · Gorongosa + coast',
    lines: [
      { category: 'Accommodation', item: 'Gorongosa lodge + Tofo/Vilanculos (10 nights)', amount: 820 },
      { category: 'Transport', item: '4×4 hire Beira–Gorongosa–coast', amount: 380, shared: true },
      { category: 'Park fees', item: 'Gorongosa conservation levy', amount: 120 },
      { category: 'Activities', item: 'Diving/snorkel, whale shark trip (seasonal)', amount: 380 },
      { category: 'Visa', item: 'E-visa or VOA', amount: 55 },
      { category: 'Food', item: 'Coastal restaurants & lodge meals', amount: 265 },
      { category: 'Fuel', item: 'EN1 coastal driving', amount: 130, shared: true },
      { category: 'Contingency', item: 'Malaria meds, cyclone season buffer', amount: 100 },
    ],
    tips: ['Gorongosa dry season May–Nov best for predator viewing', 'Whale shark season Oct–Mar off Tofo', 'Register SIM with passport on arrival'],
  },
  'malawi-lake-safari': {
    total: 1750, days: 9, travelers: 2,
    basis: 'Per person · 9 days · lake + Liwonde',
    lines: [
      { category: 'Accommodation', item: 'Lake lodge + Liwonde camp (8 nights)', amount: 620 },
      { category: 'Transport', item: 'Hire car Lilongwe–lake–Liwonde', amount: 280, shared: true },
      { category: 'Park fees', item: 'Liwonde NP', amount: 85 },
      { category: 'Activities', item: 'Boat safari, kayak, snorkel', amount: 240 },
      { category: 'Visa', item: 'E-visa or VOA', amount: 50 },
      { category: 'Food', item: 'Local meals & lodge extras', amount: 195 },
      { category: 'Fuel', item: 'Lake shore circuit', amount: 95, shared: true },
      { category: 'Contingency', item: 'Fuel shortage buffer', amount: 85 },
    ],
    tips: ['Cape Maclear and Likoma popular — book lake lodges in European holidays', 'Ask locally before swimming — bilharzia in some bays', 'May–Oct dry season for Liwonde wildlife'],
  },
  'lesotho-highlands': {
    total: 980, days: 6, travelers: 2,
    basis: 'Per person · 6 days · Sani Pass & highlands · budget guesthouses',
    lines: [
      { category: 'Transport', item: '4×4 tour Sani Pass or pony trek package', amount: 220 },
      { category: 'Accommodation', item: 'Guesthouses & lodges (5 nights)', amount: 280 },
      { category: 'Activities', item: 'Sani Pass ascent, pony trekking day', amount: 165 },
      { category: 'Food', item: 'Local restaurants & lodge meals', amount: 120 },
      { category: 'Border', item: 'SA–Lesotho return via Maseru Bridge', amount: 25 },
      { category: 'Contingency', item: 'Warm layers, tips', amount: 70 },
    ],
    tips: ['Entry only via South Africa — plan SA visa for re-entry', 'Winter (Jun–Aug) snow possible on passes — check open status', 'Fill fuel in Maseru before highlands — none on Sani Pass'],
  },
  'eswatini-kingdom': {
    total: 750, days: 4, travelers: 2,
    basis: 'Per person · 4 days · Ezulwini & Hlane add-on from Kruger',
    lines: [
      { category: 'Accommodation', item: 'Ezulwini valley lodge (3 nights)', amount: 210 },
      { category: 'Park fees', item: 'Hlane or Mkhaya day visit', amount: 55 },
      { category: 'Transport', item: 'SA rental cross-border from Kruger/Mpumalanga', amount: 95, shared: true },
      { category: 'Activities', item: 'Guided rhino walk or cultural village', amount: 85 },
      { category: 'Food', item: 'Craft market & lodge meals', amount: 95 },
      { category: 'Contingency', item: 'Border time, tips', amount: 60 },
    ],
    tips: ['Oshoek border fastest from Johannesburg — 2.5 hrs to Mbabane', 'Combine with Kruger as 3–4 day extension — no intl flights needed', 'Rand and lilangeni interchangeable at 1:1'],
  },
};

const output = {
  meta: {
    lastUpdated: '2026-06',
    currency: 'USD',
    disclaimer: 'Indicative planning estimates only — not quotes. Costs vary by season, exchange rate, and booking channel. Book transport, lodges, and activities directly with providers.',
    travelersNote: 'Most self-drive totals assume 2 travellers sharing vehicle costs marked "shared".',
  },
  budgets: {},
};

for (const [id, spec] of Object.entries(SPECS)) {
  const perPersonLines = spec.lines.map(line => {
    const share = line.shared ? spec.travelers : 1;
    return {
      category: line.category,
      item: line.item,
      amountPerPerson: Math.round(line.amount / share),
      note: line.note || (line.shared ? `~USD ${line.amount} total ÷ ${spec.travelers}` : undefined),
    };
  });
  const computed = perPersonLines.reduce((s, l) => s + l.amountPerPerson, 0);
  output.budgets[id] = {
    itineraryId: id,
    basis: spec.basis,
    travelers: spec.travelers,
    durationDays: spec.days,
    totalPerPerson: spec.total,
    computedPerPerson: computed,
    lastVerified: '2026-06',
    lines: perPersonLines,
    tips: spec.tips,
  };
}

writeFileSync(new URL('../data/itinerary-budgets.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log('Wrote itinerary-budgets.json for', Object.keys(output.budgets).length, 'routes');
