/** @typedef {'plan' | 'documents' | 'on-the-go' | 'when'} HubTabId */

const TAB_BY_ANCHOR = {
    plan: 'plan',
    'hub-trip-planner': 'plan',
    'trip-planner': 'plan',
    'hub-expense-tracker': 'plan',
    'expense-tracker': 'plan',
    documents: 'documents',
    'hub-visa': 'documents',
    visa: 'documents',
    'on-the-go': 'on-the-go',
    'hub-currency': 'on-the-go',
    currency: 'on-the-go',
    'hub-emergency': 'on-the-go',
    emergency: 'on-the-go',
    'hub-on-the-ground': 'on-the-go',
    'on-the-ground': 'on-the-go',
    when: 'when',
    'hub-seasons': 'when',
    seasons: 'when',
    'hub-weather': 'when',
    weather: 'when',
};

/** @type {Partial<Record<HubTabId, () => void>>} */
const lazyInits = {};

/** @type {Set<HubTabId>} */
const initializedTabs = new Set();

/** @type {HubTabId} */
let activeTab = 'plan';

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
    });

    document.querySelectorAll('.hub-journey-panel').forEach(panel => {
        const isActive = panel.dataset.hubPanel === tabId;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
    });

    if (updateHash) {
        const hash = tabId === 'plan' ? '#plan' : `#plan/${tabId}`;
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
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw || raw === 'plan') {
        return { tabId: 'plan', scrollTarget: null };
    }

    const parts = raw.split('/');
    const anchor = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const tabId = TAB_BY_ANCHOR[anchor] || TAB_BY_ANCHOR[parts[0]] || 'plan';
    const scrollTarget = document.getElementById(anchor) ? anchor : null;

    return { tabId, scrollTarget };
}

export function initHubTabs() {
    document.querySelectorAll('.hub-journey-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = /** @type {HubTabId} */ (btn.dataset.hubTab);
            if (tabId) setActiveTab(tabId);
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
