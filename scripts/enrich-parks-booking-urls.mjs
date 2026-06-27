import fs from 'fs';

const parksPath = new URL('../data/parks.json', import.meta.url);
const parks = JSON.parse(fs.readFileSync(parksPath, 'utf8'));

const bookingByCountry = {
    'south-africa': 'https://www.sanparks.org/reservations/',
    namibia: 'https://www.nwr.com.na/',
    botswana: 'https://www.botswanatourism.co.bw/',
    zambia: 'https://www.znp.co.zm/',
    zimbabwe: 'https://www.zimparks.org/',
    mozambique: 'https://www.anac.gov.mz/',
    malawi: 'https://www.malawiparks.org/',
    lesotho: 'https://www.forestry.gov.ls/',
    eswatini: 'https://www.biggameparks.org/',
};

for (const park of parks) {
    if (!park.bookingUrl && bookingByCountry[park.country]) {
        park.bookingUrl = bookingByCountry[park.country];
    }
}

fs.writeFileSync(parksPath, `${JSON.stringify(parks, null, 2)}\n`);
