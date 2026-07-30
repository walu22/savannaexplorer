// Dark Mode Toggle
// Handles theme switching and persistence

const DARK_MODE_KEY = 'dark-mode-enabled';

function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function isDarkModeEnabled() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
        return saved === 'true';
    }
    return getSystemPreference();
}

function setDarkMode(enabled) {
    if (enabled) {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
    } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
    }
    localStorage.setItem(DARK_MODE_KEY, String(enabled));
    
    // Update icon
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = enabled ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

function toggleDarkMode() {
    const isEnabled = document.documentElement.classList.contains('dark-theme');
    setDarkMode(!isEnabled);
}

function initDarkMode() {
    // Set initial state based on saved preference or system setting
    setDarkMode(isDarkModeEnabled());
    
    // Add event listener to toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDarkMode();
        });
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
        // Only change if user hasn't explicitly set a preference
        const hasUserPreference = localStorage.getItem(DARK_MODE_KEY) !== null;
        if (!hasUserPreference) {
            setDarkMode(e.matches);
        }
    });
}

export { initDarkMode };