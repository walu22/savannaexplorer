// OFFLINE & PWA MANAGER

const CACHE_NAME = 'savanna-explorer-v2';
let deferredPrompt = null;

/**
 * Initializes the PWA Offline Manager
 */
export function initOfflineManager() {
    setupInstallBanner();
    setupNotificationToggles();
    setupOfflineButtonListeners();
}

/**
 * Sets up the custom PWA installation banner
 */
function setupInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-btn-install');
    const dismissBtn = document.getElementById('pwa-btn-dismiss');

    if (!banner || !installBtn || !dismissBtn) return;

    // Listen for the browser's install prompt request
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar from showing on mobile
        e.preventDefault();
        // Save the event so it can be triggered later
        deferredPrompt = e;

        // Show the banner if not dismissed in this session
        if (!sessionStorage.getItem('se_pwa_install_dismissed')) {
            banner.classList.add('active');
        }
    });

    // Handle installation click
    installBtn.addEventListener('click', () => {
        if (!deferredPrompt) return;
        
        // Hide the banner immediately — yield to let the browser paint
        banner.classList.remove('active');
        
        // Capture prompt reference and clear module-level variable synchronously
        const prompt = deferredPrompt;
        deferredPrompt = null;

        // Yield to the browser so the banner-hide paints before the
        // blocking install-prompt dialog appears (fixes INP spike).
        requestAnimationFrame(() => {
            setTimeout(async () => {
                prompt.prompt();
                const { outcome } = await prompt.userChoice;
                console.log(`[PWA] Install prompt outcome: ${outcome}`);
            }, 0);
        });
    });

    // Handle dismissal
    dismissBtn.addEventListener('click', () => {
        banner.classList.remove('active');
        sessionStorage.setItem('se_pwa_install_dismissed', 'true');
    });

    // Handle successful installation
    window.addEventListener('appinstalled', (e) => {
        console.log('[PWA] Savanna Explorer successfully installed!');
        banner.classList.remove('active');
    });
}

/**
 * Syncs the visual state of the offline buttons based on cache storage
 */
export async function syncOfflineButtonState(type, id, btn) {
    if (!btn) return;

    const route = type === 'country' ? `/countries/${id}` : `/itineraries/${id}`;
    let isSaved = false;
    try {
        const cache = await caches.open(CACHE_NAME);
        isSaved = Boolean(await cache.match(route));
    } catch (error) {
        console.warn('[PWA] Could not inspect offline cache:', error);
    }

    if (isSaved) {
        localStorage.setItem(`se_offline_saved_${type}_${id}`, 'true');
        setButtonSaved(btn);
    } else {
        localStorage.removeItem(`se_offline_saved_${type}_${id}`);
        setButtonDefault(btn);
    }
}

function setButtonState(btn, state) {
    btn.classList.remove('saved', 'saving');
    if (state) btn.classList.add(state);
}

function setButtonSaved(btn) {
    setButtonState(btn, 'saved');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = 'fas fa-check';
    }
    const text = btn.querySelector('span');
    if (text) {
        text.textContent = 'Saved Offline';
    }
}

function setButtonDefault(btn) {
    setButtonState(btn, '');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = 'fas fa-download';
    }
    const text = btn.querySelector('span');
    if (text) {
        text.textContent = 'Save for Offline';
    }
}

/**
 * Downloads a country guide or itinerary and its assets to Cache Storage
 */
export async function savePageOffline(type, id, btn) {
    if (!btn || btn.classList.contains('saving') || btn.classList.contains('saved')) return;

    // Transition to saving state
    setButtonState(btn, 'saving');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = 'fas fa-spinner fa-spin';
    }
    const text = btn.querySelector('span');
    if (text) {
        text.textContent = 'Saving...';
    }

    try {
        const urlsToCache = new Set();

        // 1. Add current virtual route path
        if (type === 'country') {
            urlsToCache.add(`/countries/${id}`);
            urlsToCache.add(`/countries/${id}/`);
        } else if (type === 'itinerary') {
            urlsToCache.add(`/itineraries/${id}`);
            urlsToCache.add(`/itineraries/${id}/`);
        }

        // 2. Extract stylesheet and script dependencies loaded in DOM
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href) urlsToCache.add(link.href);
        });
        document.querySelectorAll('script[src]').forEach(script => {
            if (script.src) urlsToCache.add(script.src);
        });

        // 3. Extract active images in the relative container
        const containerSelector = type === 'country' ? '#country-detail-view' : '#itinerary-modal';
        const container = document.querySelector(containerSelector);
        if (container) {
            container.querySelectorAll('img').forEach(img => {
                if (img.src && !img.src.startsWith('data:')) {
                    urlsToCache.add(img.src);
                }
            });
        }

        // 4. Fallbacks for icons and common layouts
        urlsToCache.add('/favicon.png');
        urlsToCache.add('/manifest.json');
        urlsToCache.add('/offline.html');
        urlsToCache.add('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

        // Open cache and save
        const cache = await caches.open(CACHE_NAME);
        const urlArray = Array.from(urlsToCache);
        
        // We use individual add calls or Promise.all to avoid a single network failure 
        // from breaking the entire precache (e.g. if one unsplash image returns 404).
        const results = await Promise.allSettled(urlArray.map(url => cache.add(url)));
        const failures = results
            .map((result, index) => ({ result, url: urlArray[index] }))
            .filter(({ result }) => result.status === 'rejected');

        failures.forEach(({ result, url }) => {
            console.warn(`[PWA] Failed to cache: ${url}`, result.reason);
        });

        const routeUrls = type === 'country'
            ? [`/countries/${id}`, `/countries/${id}/`]
            : [`/itineraries/${id}`, `/itineraries/${id}/`];
        const requiredUrls = [...routeUrls, '/offline.html', '/manifest.json'];
        const requiredResults = await Promise.all(requiredUrls.map(url => cache.match(url)));
        if (requiredResults.some(response => !response)) {
            throw new Error('Required offline files could not be cached.');
        }

        // Save status in localStorage
        localStorage.setItem(`se_offline_saved_${type}_${id}`, 'true');

        // Transition to saved state
        setButtonSaved(btn);
        
        // If native notifications are enabled, trigger a success alert
        if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('se_notifications_enabled') === 'true') {
            new Notification('Destination Saved', {
                body: `${type === 'country' ? 'Country guide' : 'Itinerary'} successfully downloaded for offline safari use!`,
                icon: '/favicon.png'
            });
        }

    } catch (err) {
        console.error('[PWA] Failed to save page offline: ', err);
        setButtonDefault(btn);
    }
}

/**
 * Setup event listeners for offline buttons
 */
function setupOfflineButtonListeners() {
    // Listen for Country guide save clicks
    document.addEventListener('click', (e) => {
        const countryBtn = e.target.closest('#btn-save-country-offline');
        if (countryBtn) {
            // Find active country from the URL pathname or state
            const pathname = window.location.pathname;
            const match = pathname.match(/^\/countries\/([a-z-]+)\/?$/);
            if (match) {
                savePageOffline('country', match[1], countryBtn);
            }
        }

        const itinBtn = e.target.closest('#btn-save-itinerary-offline');
        if (itinBtn) {
            // Find active itinerary from pathname
            const pathname = window.location.pathname;
            const match = pathname.match(/^\/itineraries\/([a-z0-9-]+)\/?$/);
            if (match) {
                savePageOffline('itinerary', match[1], itinBtn);
            }
        }
    });
}

/**
 * Handle local notification preference.
 */
function setupNotificationToggles() {
    document.addEventListener('change', async (e) => {
        if (e.target && e.target.id === 'pwa-notif-toggle') {
            const checked = e.target.checked;
            const statusText = document.getElementById('pwa-notif-status-text');

            if (checked) {
                // Request browser permission
                if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        localStorage.setItem('se_notifications_enabled', 'true');
                        if (statusText) {
                            statusText.textContent = 'Notifications Enabled';
                            statusText.className = 'pwa-notif-status active';
                        }
                    } else {
                        // Reset toggle if permission denied
                        e.target.checked = false;
                        localStorage.setItem('se_notifications_enabled', 'false');
                        if (statusText) {
                            statusText.textContent = 'Permission Denied';
                            statusText.className = 'pwa-notif-status inactive';
                        }
                    }
                }
            } else {
                // Disable notifications
                localStorage.setItem('se_notifications_enabled', 'false');
                if (statusText) {
                    statusText.textContent = 'Notifications Disabled';
                    statusText.className = 'pwa-notif-status inactive';
                }
            }
        }
    });
}
