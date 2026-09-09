/** @typedef {'entry' | 'journey' | 'money' | 'health' | 'road'} HubTabId */

const TAB_BY_ANCHOR = {
    plan: 'entry',
    entry: 'entry',
    documents: 'entry',
    'hub-visa': 'entry',
    visa: 'entry',
    journey: 'journey',
    'hub-my-safari': 'journey',
    'hub-trip-planner': 'journey',
    'trip-planner': 'journey',
    money: 'money',
    'hub-expense-tracker': 'money',
    'expense-tracker': 'money',
    'hub-currency': 'money',
    currency: 'money',
    health: 'health',
    road: 'road',
    'on-the-go': 'road',
    'hub-emergency': 'road',
    emergency: 'road',
    'hub-on-the-ground': 'road',
    'on-the-ground': 'road',
    when: 'road',
    'hub-seasons': 'road',
    seasons: 'road',
    'hub-weather': 'road',
    weather: 'road',
};

/** @type {Partial<Record<HubTabId, () => void>>} */
const lazyInits = {};

/** @type {Set<HubTabId>} */
const initializedTabs = new Set();

/** @type {HubTabId} */
let activeTab = 'entry';

export function registerHubTabInit(tabId, initFn) {
    lazyInits[tabId] = initFn;
}

function runTabInit(tabId) {
    if (initializedTabs.has(tabId)) return;
    lazyInits[tabId]?.();
    initializedTabs.add(tabId);
}

function setActiveTab(tabId, { updateHash = true, scrollTarget = null } = {}) {
    if (TAB_BY_ANCHOR[tabId]) {
        tabId = TAB_BY_ANCHOR[tabId];
    }

    activeTab = tabId;
    runTabInit(tabId);

    document.querySelectorAll('.hub-journey-tab').forEach(btn => {
        const isActive = btn.dataset.hubTab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.tabIndex = isActive ? 0 : -1;
    });

    document.querySelectorAll('.hub-journey-panel').forEach(panel => {
        const isActive = panel.dataset.hubPanel === tabId;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
    });

    if (updateHash) {
        const hash = tabId === 'entry' ? '#plan' : `#plan/${tabId}`;
        if (window.location.hash !== hash) {
            history.replaceState(null, '', hash);
        }
    }

    if (scrollTarget) {
        const el = document.getElementById(scrollTarget);
        if (el) {
            requestAnimationFrame(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }
}

function resolveTabFromHash() {
    if (window.location.pathname === '/expenses' || window.location.pathname === '/expenses/') {
        return { tabId: 'money', scrollTarget: 'hub-expense-tracker' };
    }
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw || raw === 'plan') {
        return { tabId: 'entry', scrollTarget: null };
    }

    const parts = raw.split('/');
    const anchor = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const tabId = TAB_BY_ANCHOR[anchor] || TAB_BY_ANCHOR[parts[0]] || 'entry';
    const scrollTarget = document.getElementById(anchor) ? anchor : null;

    return { tabId, scrollTarget };
}

export function initHubTabs() {
    const tabs = [...document.querySelectorAll('.hub-journey-tab')];
    tabs.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tabId = /** @type {HubTabId} */ (btn.dataset.hubTab);
            if (tabId) setActiveTab(tabId);
        });
        btn.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            let nextIndex = index;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = tabs.length - 1;
            if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
            const nextTab = tabs[nextIndex];
            setActiveTab(/** @type {HubTabId} */ (nextTab.dataset.hubTab));
            nextTab.focus();
        });
    });

    window.addEventListener('hashchange', () => {
        const { tabId, scrollTarget } = resolveTabFromHash();
        setActiveTab(tabId, { updateHash: false, scrollTarget });
    });

    const { tabId, scrollTarget } = resolveTabFromHash();
    setActiveTab(tabId, { updateHash: false, scrollTarget });
}

export function getActiveHubTab() {
    return activeTab;
}
