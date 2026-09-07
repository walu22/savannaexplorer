let searchModulePromise = null;

function loadSearch() {
    if (!searchModulePromise) searchModulePromise = import('./site-search.js');
    return searchModulePromise;
}

async function openSearch(source) {
    const module = await loadSearch();
    module.openSiteSearch(source);
}

function isTypingTarget(target) {
    return target instanceof HTMLElement
        && (target.matches('input, textarea, select') || target.isContentEditable);
}

export function initSearchLauncher() {
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-site-search-open]');
        if (!trigger) return;
        event.preventDefault();
        openSearch(trigger.dataset.searchSource || 'nav').catch(error => console.error('[Search] Could not open search', error));
    });

    document.addEventListener('keydown', event => {
        const commandShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
        const slashShortcut = event.key === '/' && !isTypingTarget(event.target);
        if (!commandShortcut && !slashShortcut) return;
        event.preventDefault();
        openSearch('keyboard').catch(error => console.error('[Search] Could not open search', error));
    });
}
