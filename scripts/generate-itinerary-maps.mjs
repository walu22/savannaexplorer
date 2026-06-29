/**
 * Generates data/itinerary-maps.json — waypoints, Google Maps URL, and map coordinates.
 */
import { writeFileSync } from 'fs';

const COORDS = {
  'Windhoek, Namibia': { lat: -22.5609, lng: 17.0658 },
  'Sossusvlei, Namibia': { lat: -24.7594, lng: 15.2922 },
  'Swakopmund, Namibia': { lat: -22.6784, lng: 14.5267 },
  'Etosha National Park, Namibia': { lat: -18.8556, lng: 16.3297 },
  'Rundu, Namibia': { lat: -17.9156, lng: 19.7728 },
  'Kasane, Botswana': { lat: -17.8133, lng: 25.15 },
  'Maun, Botswana': { lat: -19.9833, lng: 23.4167 },
  'Okavango Delta, Botswana': { lat: -19.2667, lng: 23.15 },
  'Cape Town, South Africa': { lat: -33.9249, lng: 18.4241 },
  'Knysna, South Africa': { lat: -34.0351, lng: 23.0471 },
  'Durban, South Africa': { lat: -29.8587, lng: 31.0218 },
  'Port Elizabeth, South Africa': { lat: -33.9608, lng: 25.6022 },
  'Johannesburg, South Africa': { lat: -26.2041, lng: 28.0473 },
  'Kruger National Park, South Africa': { lat: -24.0115, lng: 31.4854 },
  'Maputo, Mozambique': { lat: -25.9692, lng: 32.5732 },
  'Vilanculos, Mozambique': { lat: -22.0006, lng: 35.3132 },
  'Beira, Mozambique': { lat: -19.8436, lng: 34.8389 },
  'Gorongosa National Park, Mozambique': { lat: -18.6775, lng: 34.5081 },
  'Tofo Beach, Mozambique': { lat: -23.8597, lng: 35.5483 },
  'Livingstone, Zambia': { lat: -17.8419, lng: 25.8544 },
  'Victoria Falls, Zambia': { lat: -17.9244, lng: 25.8567 },
  'South Luangwa National Park, Zambia': { lat: -13.3333, lng: 31.6667 },
  'South Luangwa, Zambia': { lat: -13.3333, lng: 31.6667 },
  'Mfuwe, Zambia': { lat: -13.2583, lng: 31.9361 },
  'Victoria Falls, Zimbabwe': { lat: -17.9244, lng: 25.8567 },
  'Hwange National Park, Zimbabwe': { lat: -18.8667, lng: 27.0333 },
  'Mana Pools, Zimbabwe': { lat: -15.7167, lng: 29.3667 },
  'Lilongwe, Malawi': { lat: -13.9626, lng: 33.7741 },
  'Cape Maclear, Malawi': { lat: -14.0167, lng: 34.85 },
  'Liwonde National Park, Malawi': { lat: -15.0667, lng: 35.2333 },
  'Sani Pass, Lesotho': { lat: -29.5857, lng: 29.4942 },
  'Maseru, Lesotho': { lat: -29.3158, lng: 27.4869 },
  'Semonkong, Lesotho': { lat: -29.9833, lng: 28.05 },
  'Mbabane, Eswatini': { lat: -26.3054, lng: 31.1367 },
  'Ezulwini Valley, Eswatini': { lat: -26.4417, lng: 31.1167 },
  'Hlane Royal National Park, Eswatini': { lat: -26.2333, lng: 31.8333 },
};

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

function toPoints(waypoints) {
  return waypoints.map(label => {
    const c = COORDS[label];
    if (!c) throw new Error(`Missing coordinates for waypoint: ${label}`);
    return { label, lat: c.lat, lng: c.lng };
  });
}

const output = {
  meta: {
    lastUpdated: '2026-06',
    disclaimer: 'Indicative route on OpenStreetMap — not turn-by-turn navigation. Verify border crossings and road conditions before driving.',
  },
  routes: {},
};

for (const [id, waypoints] of Object.entries(WAYPOINTS)) {
  output.routes[id] = {
    itineraryId: id,
    waypoints,
    points: toPoints(waypoints),
    mapsUrl: mapsUrl(waypoints),
    lastVerified: '2026-06',
  };
}

writeFileSync(new URL('../data/itinerary-maps.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log('Wrote itinerary-maps.json for', Object.keys(output.routes).length, 'routes');
