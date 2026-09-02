import { COUNTRY_META, COUNTRY_ORDER } from './country-meta.js';
import { countryPath } from './router.js';

export const NAV_CTA = {
    href: '#plan',
    desktopLabel: 'Travel tools',
    mobileLabel: 'Plan my trip',
};

/** Utility hub journey tabs — hash routes handled by utility-hub/tabs.js */
export const NAV_HUB_TABS = [
    { href: '#plan', label: 'Plan & checklist' },
    { href: '#plan/documents', label: 'Visa & documents' },
    { href: '#plan/on-the-go', label: 'On the trip' },
    { href: '#plan/when', label: 'When to go' },
];

export const NAV_DESKTOP_TOP = [
    { href: '#news', label: 'News' },
];

/** Journey groups — shared labels; mobile adds a Site group separately. */
export const NAV_JOURNEY_GROUPS = [
    {
        id: 'discover',
        label: 'Discover',
        items: [
            { href: '#top-destinations', label: 'Top highlights' },
            { href: '#experiences', label: 'Experiences' },
            { href: '#parks', label: 'National parks' },
            { href: '#cultures', label: 'Cultures' },
            { href: '#gastronomy', label: 'Gastronomy' },
        ],
    },
    {
        id: 'plan-trip',
        label: 'Plan trip',
        items: [
            { href: '#hub-my-safari', label: 'My Safari' },
            { href: '#itineraries', label: 'Itineraries' },
            { href: '#book-direct', label: 'Book direct' },
            { href: '#guides', label: 'Planning guides' },
        ],
    },
    {
        id: 'on-the-ground',
        label: 'On the ground',
        items: [
            { href: '#transport', label: 'Transport & logistics' },
            { href: '#travel-essentials', label: 'Travel essentials' },
            { href: '#borders', label: 'Border crossings' },
            { href: '#health', label: 'Health & safety' },
            { href: '#embassies', label: 'Foreign missions' },
            { href: '#events', label: 'Events calendar' },
        ],
    },
];

export const NAV_MOBILE_SITE_GROUP = {
    id: 'site',
    label: 'Site',
    items: [
        { href: '#planning-checklist', label: 'Free planning checklist' },
        { href: '#tourism-stats', label: 'Tourism statistics' },
        { href: '#about', label: 'About this site' },
        { href: '#faq', label: 'Travel FAQ' },
        { href: '#contact', label: 'Contact' },
    ],
};

export function getCountryNavLinks() {
    return COUNTRY_ORDER.map(id => ({
        href: countryPath(id),
        label: COUNTRY_META[id]?.name || id,
        flag: COUNTRY_META[id]?.flag || '🌍',
    }));
}
