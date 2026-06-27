import fs from 'fs';

const path = new URL('../data/itineraries.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const budgetNotes = {
    'Self-Drive Route': 'Per person, mid-range self-drive — excludes international flights',
    'Guided & Self-Drive': 'Per person mix of guided activities and self-drive — excludes flights',
    'Mountain & Culture Route': 'Per person budget trip — guesthouses, camps, and park fees extra',
    'Adventure Route': 'Per person active travel — mixed camping and lodges',
    'Signature Safari': 'Per person fly-in safari estimate — lodge rates vary by season',
    'Single-Country Route': 'Per person planning estimate — excludes international flights',
};

const planningRewrites = {
    '4×4 rental vehicle with unlimited kilometres': 'Plan for 4×4 rental — compare unlimited-km deals at pick-up city',
    'Suggested accommodation stops (lodges, guesthouses, or campsites)': 'Suggested lodging stops — book camps and lodges directly',
    'Cross-border paperwork assistance': 'Cross-border document checklist — carnet, insurance, and permits',
    'Detailed route maps and GPS waypoints': 'Route maps and GPS waypoints for self-navigation',
    'All accommodation (mid-range lodges and camps)': 'Mid-range lodge and camp options along the route',
    'Internal flights (Livingstone–Mfuwe)': 'Suggested internal flight route (Livingstone–Mfuwe)',
    'Guided walking safaris in South Luangwa': 'South Luangwa walking safari — book with licensed operators',
    'Park fees and conservation levies': 'Park fee and conservation levy budget line',
    'KAZA Univisa assistance': 'KAZA Univisa eligibility notes for Zambia/Zimbabwe',
    '4×4 rental or light aircraft transfers between regions': 'Mix of 4×4 rental or light aircraft between regions',
    'All accommodation (mix of lodges and camps)': 'Mix of lodge and camp options by region',
    'Guided game drives in Kruger, Etosha, and Moremi': 'Guided drive options in Kruger, Etosha, and Moremi',
    'Scenic flight over Skeleton Coast': 'Optional scenic flight over Skeleton Coast',
    'Mokoro excursion in the Delta': 'Mokoro excursion planning in the Delta',
};

for (const itin of Object.values(data)) {
    if (itin.priceFrom) {
        itin.typicalBudget = itin.priceFrom;
        delete itin.priceFrom;
    }
    if (!itin.budgetNote) {
        itin.budgetNote = budgetNotes[itin.type] || budgetNotes['Single-Country Route'];
    }

    const notes = itin.planningNotes || itin.included;
    if (notes) {
        itin.planningNotes = notes.map((item) => planningRewrites[item] || item);
        delete itin.included;
    }

    if (itin.excluded) {
        itin.arrangeYourself = itin.excluded;
        delete itin.excluded;
    }
}

fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
