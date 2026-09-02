import marketplaceData from '../../data/marketplace.json';
import DOMPurify from 'dompurify';
import {
    trackPlannerOpen,
    trackPlannerGenerateError,
    trackPlannerGenerateSuccess,
} from '../lib/planner-analytics.js';
import { TRIP_CHANGE_EVENT, getActiveTrip, updateActiveTrip } from '../lib/trip-store.js';

const SAVED_ITINERARY_KEY = 'se_ai_saved_itinerary_v1';

// Helper: Find matching local catalog experiences with robust mappings
function getMatchingExperiences(destination, style, budget) {
    let matched = [];

    // Normalize style mapping to keys in marketplaceData (safari, adventure, culture, nature)
    const styleMap = {
        'safari': 'safari',
        'luxury safari': 'safari',
        'safari & wildlife': 'safari',
        'adventure': 'adventure',
        'high adventure': 'adventure',
        'scenic & adventure': 'adventure',
        'culture': 'culture',
        'cultural immersion': 'culture',
        'nature': 'nature',
        'scenic & nature': 'nature'
    };

    // Normalize budget mapping to price_range strings ($, $$, $$$, $$$$)
    const budgetMap = {
        '$': '$$', // Map single dollar to $$ to ensure we get results and don't end up empty
        'value ($)': '$$',
        '$$': '$$',
        'classic ($$)': '$$',
        'comfort ($$)': '$$',
        '$$$': '$$$',
        'luxury ($$$)': '$$$',
        '$$$$': '$$$$',
        'ultra luxe ($$$$)': '$$$$',
        'ultra luxury ($$$$)': '$$$$'
    };

    const targetKey = styleMap[style.toLowerCase()] || null;
    const targetBudgetStr = budgetMap[budget.toLowerCase()] || null;

    // Read keys to scan
    const keysToScan = targetKey ? [targetKey] : Object.keys(marketplaceData);

    keysToScan.forEach(key => {
        const items = marketplaceData[key] || [];
        items.forEach(item => {
            let isMatch = true;

            // Filter by Destination (Country)
            if (destination && destination !== 'All' && destination !== 'Southern Africa') {
                if (item.location.toLowerCase() !== destination.toLowerCase()) {
                    isMatch = false;
                }
            }

            // Filter by Budget (allow soft-matching to prevent empty results)
            if (budget && budget !== 'All' && targetBudgetStr) {
                if (budget.toLowerCase().includes('$') && !budget.includes('$$')) {
                    // This matches '$' or 'value ($)'
                    if (item.price_range !== '$' && item.price_range !== '$$') {
                        isMatch = false;
                    }
                } else if (item.price_range !== targetBudgetStr) {
                    isMatch = false;
                }
            }

            if (isMatch) {
                matched.push(item);
            }
        });
    });

    return matched;
}

// Main initialization function
export function initAiPlanner() {
    const sidebar = document.getElementById('ai-planner-sidebar');
    const closeSidebarBtn = document.getElementById('close-ai-planner');

    const sidebarCountry = document.getElementById('sidebar-country');
    const sidebarDuration = document.getElementById('sidebar-duration');
    const sidebarCategory = document.getElementById('sidebar-category');
    const sidebarBudget = document.getElementById('sidebar-budget');
    const sidebarGenerateBtn = document.getElementById('sidebar-generate-itinerary-btn');

    const sidebarLoading = document.getElementById('ai-loading');
    const sidebarResult = document.getElementById('ai-result');
    const sidebarBackBtn = document.getElementById('ai-back-btn');
    const saveItineraryBtn = document.getElementById('ai-save-itinerary-btn');
    const restoreItineraryBtn = document.getElementById('ai-restore-itinerary-btn');
    const saveStatus = document.getElementById('ai-save-status');

    if (sidebar) {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('#open-ai-planner, .open-ai-planner, [data-trigger="ai-planner"]');
            if (btn) {
                e.preventDefault();
                sidebar.classList.add('open');
                sidebar.setAttribute('aria-hidden', 'false');
                trackPlannerOpen();

                // Dismiss mobile navigation menu if it is currently open
                if (typeof window.closeMobileNav === 'function') {
                    window.closeMobileNav();
                } else {
                    document.getElementById('mobile-nav-panel')?.classList.remove('is-open');
                    document.body.classList.remove('nav-open');
                }
            }
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebar.setAttribute('aria-hidden', 'true');
        });
    }

    // State for conversational planner
    let plannerHistory = [];
    let plannerBusy = false;
    let plannerPreferences = null;

    // UI Elements for Chat
    const messagesContainer = document.getElementById('ai-planner-messages');
    const chatInput = document.getElementById('ai-planner-chat-input');
    const chatSendBtn = document.getElementById('ai-planner-chat-send');

    // Helper to append a message bubble
    function appendMessage(role, contentHtml) {
        if (!messagesContainer) return;
        const bubble = document.createElement('div');
        bubble.className = `ai-message-bubble ${role}`;

        // Premium High-Class Styles for Chat Bubbles
        bubble.style.padding = '18px 22px';
        bubble.style.borderRadius = '16px';
        bubble.style.maxWidth = '92%';
        bubble.style.marginBottom = '10px';
        bubble.style.lineHeight = '1.6';
        bubble.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        bubble.style.fontSize = '0.95em';

        if (role === 'user') {
            // Elegant user bubble (Gold background with dark text for contrast)
            bubble.style.backgroundColor = 'var(--primary)';
            bubble.style.color = '#1a1a1a';
            bubble.style.alignSelf = 'flex-end';
            bubble.style.borderBottomRightRadius = '4px';
            bubble.style.fontWeight = '500';
            bubble.innerHTML = `<p style="margin:0">${escapeHtml(contentHtml)}</p>`;
        } else {
            // Elegant assistant bubble (Glassmorphism dark background)
            bubble.style.backgroundColor = 'rgba(25, 35, 30, 0.85)';
            bubble.style.backdropFilter = 'blur(10px)';
            bubble.style.border = '1px solid rgba(212, 175, 55, 0.3)';
            bubble.style.color = '#f4f4f4';
            bubble.style.alignSelf = 'flex-start';
            bubble.style.borderBottomLeftRadius = '4px';
            bubble.innerHTML = `<div class="markdown-body" style="font-size: 1em;">${contentHtml}</div>`;
        }

        messagesContainer.appendChild(bubble);
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    }

    // Helper to escape HTML safely
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    function readSavedItinerary() {
        try {
            const activeTrip = getActiveTrip();
            const saved = activeTrip
                ? activeTrip.aiItinerary
                : JSON.parse(localStorage.getItem(SAVED_ITINERARY_KEY));
            const validHistory = Array.isArray(saved?.history)
                && saved.history.length > 0
                && saved.history.every(item => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string');
            if (saved?.version !== 1 || !validHistory) return null;
            return saved;
        } catch {
            return null;
        }
    }

    function syncSavedItineraryControls() {
        if (restoreItineraryBtn) restoreItineraryBtn.hidden = !readSavedItinerary();
    }

    function markCurrentPlanSaved(saved) {
        if (!saveItineraryBtn) return;
        saveItineraryBtn.classList.toggle('is-saved', saved);
        saveItineraryBtn.querySelector('i')?.classList.toggle('far', !saved);
        saveItineraryBtn.querySelector('i')?.classList.toggle('fas', saved);
        const label = saveItineraryBtn.querySelector('span');
        if (label) label.textContent = saved ? 'Saved' : 'Save Itinerary';
    }

    // Helper to process markdown and inject catalog cards
    function processItineraryMarkdown(markdown) {
        let text = markdown.replace(/^```markdown\s*/i, '').replace(/```$/, '');
        text = text.replace(/\*{0,2}\[SavannaExplorer Experience:\s*([^\]]+)\]\*{0,2}/gi, (match, title) => {
            const cleanTitle = title.trim();
            let matchedItem = null;
            for (const category in marketplaceData) {
                const found = marketplaceData[category].find(x => x.title.toLowerCase().trim() === cleanTitle.toLowerCase() || x.title.toLowerCase().includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(x.title.toLowerCase()));
                if (found) {
                    matchedItem = found;
                    break;
                }
            }
            if (matchedItem) {
                return `
<div class="ai-product-card" data-experience-id="${escapeHtml(matchedItem.id)}" role="button" tabindex="0">
    <div class="ai-product-img">
        <img src="${matchedItem.image}" alt="${matchedItem.title}" loading="lazy">
    </div>
    <div class="ai-product-info">
        <div class="ai-product-header">
            <span class="ai-product-badge">${matchedItem.badge || 'Experience'}</span>
            <span class="ai-product-rating"><i class="fas fa-star" style="color: var(--primary);"></i> ${matchedItem.rating || '4.8'}</span>
        </div>
        <h4 class="ai-product-title">${matchedItem.title}</h4>
        <div class="ai-product-meta">
            <span><i class="fas fa-map-marker-alt"></i> ${matchedItem.location}</span>
            <span><i class="far fa-clock"></i> ${matchedItem.duration}</span>
            <span><i class="fas fa-wallet"></i> ${matchedItem.price_range}</span>
        </div>
    </div>
</div>`.trim();
            }
            return `<strong class="ai-custom-highlight">${cleanTitle}</strong>`;
        });

        if (typeof marked !== 'undefined') {
            return DOMPurify.sanitize(marked.parse(text), {
                USE_PROFILES: { html: true },
                ADD_ATTR: ['target', 'data-experience-id'],
            });
        }
        return `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(text)}</pre>`;
    }

    function renderPlannerHistory() {
        if (messagesContainer) messagesContainer.innerHTML = '';
        plannerHistory.forEach(item => {
            appendMessage(item.role, item.role === 'assistant' ? processItineraryMarkdown(item.content) : item.content);
        });
    }

    saveItineraryBtn?.addEventListener('click', () => {
        if (!plannerHistory.some(item => item.role === 'assistant')) return;

        try {
            const savedItinerary = {
                version: 1,
                savedAt: new Date().toISOString(),
                preferences: plannerPreferences,
                history: plannerHistory,
            };
            const activeTrip = getActiveTrip();
            if (activeTrip) {
                updateActiveTrip({ aiItinerary: savedItinerary });
            } else {
                localStorage.setItem(SAVED_ITINERARY_KEY, JSON.stringify(savedItinerary));
            }
            markCurrentPlanSaved(true);
            syncSavedItineraryControls();
            if (saveStatus) saveStatus.textContent = activeTrip
                ? `Saved to “${activeTrip.name}” on this device.`
                : 'Saved on this device. You can reopen it after refreshing.';
        } catch {
            if (saveStatus) saveStatus.textContent = 'This itinerary could not be saved on this device.';
        }
    });

    restoreItineraryBtn?.addEventListener('click', () => {
        const saved = readSavedItinerary();
        if (!saved) {
            syncSavedItineraryControls();
            return;
        }

        plannerHistory = saved.history;
        plannerPreferences = saved.preferences || null;
        if (sidebarCountry && plannerPreferences?.country) sidebarCountry.value = plannerPreferences.country;
        if (sidebarDuration && plannerPreferences?.duration) sidebarDuration.value = plannerPreferences.duration;
        if (sidebarCategory && plannerPreferences?.category) sidebarCategory.value = plannerPreferences.category;
        if (sidebarBudget && plannerPreferences?.budget) sidebarBudget.value = plannerPreferences.budget;
        renderPlannerHistory();
        document.getElementById('ai-planner-form')?.classList.add('hidden');
        sidebarLoading?.classList.add('hidden');
        sidebarResult?.classList.remove('hidden');
        markCurrentPlanSaved(true);
        if (saveStatus) saveStatus.textContent = 'Saved itinerary restored from this device.';
    });

    syncSavedItineraryControls();
    window.addEventListener(TRIP_CHANGE_EVENT, () => {
        const saved = readSavedItinerary();
        const matchesCurrentPlan = Boolean(saved)
            && JSON.stringify(saved.history) === JSON.stringify(plannerHistory);
        syncSavedItineraryControls();
        markCurrentPlanSaved(matchesCurrentPlan);
        if (saveStatus) saveStatus.textContent = '';
    });

    function openExperienceFromCard(card) {
        const experienceId = card?.dataset.experienceId;
        if (experienceId && typeof window.openExperienceDetails === 'function') {
            window.openExperienceDetails(experienceId);
        }
    }

    messagesContainer?.addEventListener('click', (event) => {
        openExperienceFromCard(event.target.closest('[data-experience-id]'));
    });
    messagesContainer?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const card = event.target.closest('[data-experience-id]');
        if (!card) return;
        event.preventDefault();
        openExperienceFromCard(card);
    });

    // Generate function for initial itinerary
    if (sidebarGenerateBtn) {
        sidebarGenerateBtn.addEventListener('click', async () => {
            const country = sidebarCountry ? sidebarCountry.value : 'All';
            const duration = sidebarDuration ? sidebarDuration.value : 5;
            const category = sidebarCategory ? sidebarCategory.value : 'All';
            const budget = sidebarBudget ? sidebarBudget.value : 'All';

            // Show loading state
            const inputContainer = document.getElementById('ai-planner-form');
            if (inputContainer) inputContainer.classList.add('hidden');
            if (sidebarLoading) sidebarLoading.classList.remove('hidden');
            if (sidebarResult) sidebarResult.classList.add('hidden');

            const localMatches = getMatchingExperiences(
                country,
                category === 'All' ? 'luxury safari' : category,
                budget === 'All' ? 'classic ($$)' : budget
            );

            const destination = country === 'All' ? 'Southern Africa' : country;
            const startedAt = performance.now();
            plannerPreferences = { country, duration: String(duration), category, budget };
            markCurrentPlanSaved(false);
            if (saveStatus) saveStatus.textContent = '';

            // Clear history and UI
            plannerHistory = [];
            if (messagesContainer) messagesContainer.innerHTML = '';

            const initialRequest = `Generate a ${duration}-day ${category !== 'All' ? category : 'luxury'} itinerary to ${destination} on a ${budget !== 'All' ? budget : 'standard'} budget.`;
            appendMessage('user', initialRequest);

            try {
                const response = await fetch('/api/itinerary/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        country: destination,
                        duration,
                        category,
                        budget,
                        matches: localMatches
                    })
                });

                if (!response.ok) throw new Error(`Relay API Error: Status ${response.status}`);
                const data = await response.json();
                if (!data.itinerary) throw new Error("Invalid or empty response.");

                plannerHistory.push({ role: 'user', content: initialRequest });
                plannerHistory.push({ role: 'assistant', content: data.itinerary });

                const processedHtml = processItineraryMarkdown(data.itinerary);
                appendMessage('assistant', processedHtml);

                if (sidebarLoading) sidebarLoading.classList.add('hidden');
                if (sidebarResult) sidebarResult.classList.remove('hidden');

                trackPlannerGenerateSuccess({
                    country: destination,
                    duration,
                    category,
                    budget,
                    catalogMatches: localMatches.length,
                    latencyMs: Math.round(performance.now() - startedAt),
                    generationMethod: data.method || null,
                });

            } catch (error) {
                console.error("Failed to generate sidebar itinerary:", error);
                if (sidebarLoading) sidebarLoading.classList.add('hidden');
                if (inputContainer) inputContainer.classList.remove('hidden');
                alert("Sorry, there was an issue generating your itinerary. Please try again.");
                trackPlannerGenerateError(error.message || 'Unknown generation error');
            }
        });
    }

    // Follow-up Chat functionality
    async function handleChatSubmit() {
        if (!chatInput || !chatInput.value.trim() || plannerBusy) return;

        const message = chatInput.value.trim();
        plannerBusy = true;
        chatInput.disabled = true;
        if (chatSendBtn) chatSendBtn.disabled = true;
        chatInput.value = '';
        chatInput.style.height = 'auto'; // Reset height

        appendMessage('user', message);

        // Show a temporary typing indicator bubble
        const typingId = 'typing-' + Date.now();
        const typingBubble = document.createElement('div');
        typingBubble.id = typingId;
        typingBubble.className = 'ai-message-bubble assistant';
        typingBubble.style.padding = '18px 22px';
        typingBubble.style.borderRadius = '16px';
        typingBubble.style.maxWidth = '92%';
        typingBubble.style.marginBottom = '10px';
        typingBubble.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        typingBubble.style.backgroundColor = 'rgba(25, 35, 30, 0.85)';
        typingBubble.style.backdropFilter = 'blur(10px)';
        typingBubble.style.border = '1px solid rgba(212, 175, 55, 0.3)';
        typingBubble.style.alignSelf = 'flex-start';
        typingBubble.style.borderBottomLeftRadius = '4px';
        typingBubble.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 auto;"></div>`;
        messagesContainer.appendChild(typingBubble);
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

        try {
            const response = await fetch('/api/itinerary/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: plannerHistory,
                    message: message
                })
            });

            if (!response.ok) throw new Error(`Relay API Error: Status ${response.status}`);
            const data = await response.json();
            if (!data.itinerary) throw new Error("Invalid or empty response.");

            // Remove typing indicator
            document.getElementById(typingId)?.remove();

            // Save to history
            plannerHistory.push({ role: 'user', content: message });
            plannerHistory.push({ role: 'assistant', content: data.itinerary });
            markCurrentPlanSaved(false);
            if (saveStatus) saveStatus.textContent = 'Updated itinerary is not saved yet.';

            const processedHtml = processItineraryMarkdown(data.itinerary);
            appendMessage('assistant', processedHtml);

        } catch (error) {
            console.error("Failed to generate follow-up:", error);
            document.getElementById(typingId)?.remove();
            appendMessage('assistant', `<p style="color: var(--danger);">Sorry, I encountered an error while updating your itinerary. Please try again.</p>`);
        } finally {
            plannerBusy = false;
            chatInput.disabled = false;
            if (chatSendBtn) chatSendBtn.disabled = false;
            chatInput.focus();
        }
    }

    if (chatSendBtn) chatSendBtn.addEventListener('click', handleChatSubmit);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
        });
    }

    // Reset / Back functionality
    if (sidebarBackBtn) {
        sidebarBackBtn.addEventListener('click', () => {
            const inputContainer = document.getElementById('ai-planner-form');
            if (inputContainer) inputContainer.classList.remove('hidden');
            if (sidebarResult) sidebarResult.classList.add('hidden');
            if (sidebarLoading) sidebarLoading.classList.add('hidden');
            plannerHistory = [];
            plannerPreferences = null;
            markCurrentPlanSaved(false);
            if (saveStatus) saveStatus.textContent = '';
        });
    }
}
