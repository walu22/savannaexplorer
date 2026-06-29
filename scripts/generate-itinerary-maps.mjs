/**
 * Generates data/itinerary-maps.json — Google Maps directions waypoints per route.
 */
import { writeFileSync, readFileSync } from 'fs';

const WAYPOINTS = {
  'desert-to-delta': ['Windhoek, Namibia', 'Sossusvlei, Namibia', 'Swakopmund, Namibia', 'Etosha National Park, Namibia', 'Rundu, Namibia', 'Kasane, Botswana', 'Maun, Botswana'],
  'coastal-explorer': ['Cape Town, South Africa', 'Knysna, South Africa', 'Durban, South Africa', 'Maputo, Mozambique', 'Vilanculos, Mozambique'],
  'falls-beyond': ['Livingstone, Zambia', 'South Luangwa National Park, Zambia', 'Victoria Falls, Zimbabwe', 'Hwange National Park, Zimbabwe', 'Kasane, Botswana'],
  'kingdom-circuit': ['Johannesburg, South Africa', 'Sani Pass, Lesotho', 'Mbabane, Eswatini', 'Kruger National Park, South Africa'],
  'lake-mountain': ['Lilongwe, Malawi', 'Cape Maclear, Malawi', 'Liwonde National Park, Malawi', 'South Luangwa, Zambia'],
  'grand-safari': ['Johannesburg, South Africa', 'Maun, Botswana', 'Victoria Falls, Zimbabwe', 'Livingstone, Zambia', 'Cape Town, South Africa'],
  'namibia-essentials': ['Windhoek, Namibia', 'Sossusvlei, Namibia', 'Swakopmund, Namibia', 'Etosha National Park, Namibia'],
  'south-africa-classic': ['Cape Town, South Africa', 'Knysna, South Africa', 'Port Elizabeth, South Africa', 'Kruger National Park, South Africa'],
  'botswana-delta-focus': ['Maun, Botswana', 'Okavango Delta, Botswana', 'Kasane, Botswana'],
  'zambia-falls-safari': ['Livingstone, Zambia', 'Victoria Falls, Zambia', 'Mfuwe, Zambia'],
  'zimbabwe-wilderness': ['Victoria Falls, Zimbabwe', 'Hwange National Park, Zimbabwe', 'Mana Pools, Zimbabwe'],
  'mozambique-bush-beach': ['Beira, Mozambique', 'Gorongosa National Park, Mozambique', 'Tofo Beach, Mozambique'],
  'malawi-lake-safari': ['Lilongwe, Malawi', 'Cape Maclear, Malawi', 'Liwonde National Park, Malawi'],
  'lesotho-highlands': ['Maseru, Lesotho', 'Sani Pass, Lesotho', 'Semonkong, Lesotho'],
  'eswatini-kingdom': ['Mbabane, Eswatini', 'Ezulwini Valley, Eswatini', 'Hlane Royal National Park, Eswatini'],
};

function mapsUrl(waypoints) {
  const path = waypoints.map(w => encodeURIComponent(w)).join('/');
  return `https://www.google.com/maps/dir/${path}`;
}

const output = {
  meta: {
    lastUpdated: '2026-06',
    disclaimer: 'Opens Google Maps with indicative waypoints — not turn-by-turn navigation. Verify border crossings and road conditions before driving.',
  },
  routes: {},
};

for (const [id, waypoints] of Object.entries(WAYPOINTS)) {
  output.routes[id] = {
    itineraryId: id,
    waypoints,
    mapsUrl: mapsUrl(waypoints),
    lastVerified: '2026-06',
  };
}

writeFileSync(new URL('../data/itinerary-maps.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log('Wrote itinerary-maps.json for', Object.keys(output.routes).length, 'routes');
