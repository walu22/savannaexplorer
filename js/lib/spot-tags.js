const TAG_RULES = [
    ['UNESCO', /unesco|world heritage/],
    ['Safari', /safari|game reserve|big five|wildlife|elephant|rhino|lion|leopard|cheetah/],
    ['Coast & marine', /beach|coast|ocean|marine|island|reef|whale|penguin|lagoon|dolphin/],
    ['Mountains & hiking', /mountain|hiking|hike|trail|canyon|highland|peak|cliff|escarpment|waterfall/],
    ['Culture & heritage', /culture|heritage|historic|history|museum|village|rock art|palace|kingdom|archaeolog/],
    ['Food & wine', /wine|vineyard|food|culinary|cuisine|tea estate|coffee/],
    ['Desert landscapes', /desert|dune|salt pan|karoo|kalahari|arid/],
    ['Adventure', /4x4|diving|snorkel|rafting|kayak|bungee|cycling|trek|climb/],
    ['City break', /city|capital|urban|waterfront|market|architecture/],
    ['Family-friendly', /family|malaria-free/],
];

export function inferSpotTags(spot, limit = 3) {
    const source = `${spot?.name || ''} ${spot?.desc || ''}`.toLowerCase();
    const tags = TAG_RULES.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
    return (tags.length ? tags : ['Signature stop']).slice(0, Math.max(1, limit));
}
