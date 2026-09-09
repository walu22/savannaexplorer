import routeCollection from '../../data/route-collections.json';
import {
    trackPlannerOpen,
    trackPlannerGenerateError,
    trackPlannerGenerateSuccess,
} from '../lib/planner-analytics.js';
import { TRIP_CHANGE_EVENT, getActiveTrip, updateActiveTrip } from '../lib/trip-store.js';
import { renderMarkdownLite } from '../lib/assistant-renderer.js';
export { renderMarkdownLite } from '../lib/assistant-renderer.js';

const SAVED_ITINERARY_KEY = 'se_ai_saved_itinerary_v1';
const ROUTE_MARKER_PATTERN = /\*{0,2}\[SavannaExplorer Route:\s*([^\]]+)\]\*{0,2}/gi;
const COUNTRY_ID_BY_NAME = {
    'south africa': 'south-africa',
    namibia: 'namibia',
    botswana: 'botswana',
    zambia: 'zambia',
    zimbabwe: 'zimbabwe',
    mozambique: 'mozambique',
    malawi: 'malawi',
    lesotho: 'lesotho',
    eswatini: 'eswatini',
};
const THEME_BY_CATEGORY = {
    safari: 'wildlife',
    adventure: 'adventure',
    culture: 'culture',
    nature: 'landscapes',
};
const QUICK_ASKS = [
    { emoji: '🦁', text: 'Best time for safari?' },
    { emoji: '🛂', text: 'Do I need a visa?' },
    { emoji: '🚗', text: 'Border crossing tips' },
    { emoji: '🎒', text: 'What should I pack?' },
    { emoji: '💰', text: 'How do park fees work?' },
];
let plannerInitialized = false;
let assistantMode = 'plan';

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

function setAssistantMode(mode = 'plan') {
    assistantMode = mode === 'ask' ? 'ask' : 'plan';
    document.querySelectorAll('[data-assistant-mode]').forEach(button => {
        const active = button.dataset.assistantMode === assistantMode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('[data-assistant-panel]').forEach(panel => {
        panel.hidden = panel.dataset.assistantPanel !== assistantMode;
    });
}

function routePromptShape(route) {
    return {
        id: route.id,
        title: route.title,
        countryIds: route.countryIds,
        promise: route.promise,
        duration: route.duration,
        vehicle: route.vehicle,
        bestSeason: route.bestSeason,
        highlights: route.highlights,
        warnings: route.warnings,
        officialSources: route.officialSources,
        lastReviewed: route.lastReviewed,
    };
}

export function getMatchingRouteTemplates(destination, category, duration) {
    const countryId = COUNTRY_ID_BY_NAME[String(destination || '').toLowerCase()] || null;
    const theme = THEME_BY_CATEGORY[String(category || '').toLowerCase()] || null;
    const requestedDays = Number(duration) || 0;

    return routeCollection.routes
        .filter(route => !countryId || route.countryIds.includes(countryId))
        .map(route => {
            const themeScore = !theme || route.themes.includes(theme) ? 2 : 0;
            const durationScore = requestedDays >= route.duration.min && requestedDays <= route.duration.max
                ? 2
                : Math.max(0, 1 - Math.min(
                    Math.abs(requestedDays - route.duration.min),
                    Math.abs(requestedDays - route.duration.max),
                ) / 10);
            return { route, score: themeScore + durationScore };
        })
        .sort((a, b) => b.score - a.score || a.route.title.localeCompare(b.route.title))
        .slice(0, 6)
        .map(({ route }) => routePromptShape(route));
}

function renderInlineMarkdown(value) {
    const source = String(value || '');
    const segments = [];
    let cursor = 0;
    source.replace(ROUTE_MARKER_PATTERN, (match, title, offset) => {
        segments.push({ type: 'text', value: source.slice(cursor, offset) });
        segments.push({ type: 'route', value: title.trim() });
        cursor = offset + match.length;
        return match;
    });
    segments.push({ type: 'text', value: source.slice(cursor) });

    return segments.map(segment => {
        if (segment.type === 'route') {
            const matchedRoute = routeCollection.routes.find(route => (
                route.title.toLowerCase() === segment.value.toLowerCase()
            ));
            if (!matchedRoute) {
                return `<strong class="ai-custom-highlight">${escapeHtml(segment.value)}</strong>`;
            }
            return `<a class="ai-route-reference" href="/routes/${encodeURIComponent(matchedRoute.id)}"><span>Reviewed route</span><strong>${escapeHtml(matchedRoute.title)}</strong><small>${escapeHtml(matchedRoute.duration.label)} · ${escapeHtml(matchedRoute.vehicle.label)}</small></a>`;
        }

        return escapeHtml(segment.value)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/__([^_]+)__/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/_([^_]+)_/g, '<em>$1</em>');
    }).join('');
}

export function renderSafeItineraryMarkdown(markdown) {
    const text = String(markdown || '').replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '').trim();
    const blocks = [];
    let listType = null;
    const closeList = () => {
        if (!listType) return;
        blocks.push(`</${listType}>`);
        listType = null;
    };

    text.split(/\r?\n/).forEach(line => {
        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        const unordered = line.match(/^\s*[-*]\s+(.+)$/);

        if (heading) {
            closeList();
            const level = Math.min(4, heading[1].length);
            blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
        } else if (ordered || unordered) {
            const nextType = ordered ? 'ol' : 'ul';
            if (listType !== nextType) {
                closeList();
                listType = nextType;
                blocks.push(`<${listType}>`);
            }
            blocks.push(`<li>${renderInlineMarkdown((ordered || unordered)[1])}</li>`);
        } else if (!line.trim()) {
            closeList();
        } else {
            closeList();
            blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
        }
    });
    closeList();
    return blocks.join('');
}

export function openAiPlanner(mode = 'plan') {
    const sidebar = document.getElementById('ai-planner-sidebar');
    if (!sidebar) return;
    setAssistantMode(mode);
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    document.getElementById('chat-fab')?.classList.add('hidden');
    trackPlannerOpen();

    if (typeof window.closeMobileNav === 'function') {
        window.closeMobileNav();
    } else {
        document.getElementById('mobile-nav-panel')?.classList.remove('is-open');
        document.body.classList.remove('nav-open');
    }

    const focusTarget = assistantMode === 'ask'
        ? document.getElementById('assistant-ask-input')
        : document.getElementById('sidebar-country');
    requestAnimationFrame(() => focusTarget?.focus());
}

// Main initialization function
export function initAiPlanner() {
    if (plannerInitialized) return;
    plannerInitialized = true;
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
                openAiPlanner('plan');
            }
        });
    }

    const closeAssistant = () => {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden', 'true');
        document.getElementById('chat-fab')?.classList.remove('hidden');
    };

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', closeAssistant);
    }

    document.querySelectorAll('[data-assistant-mode]').forEach(button => {
        button.addEventListener('click', () => {
            setAssistantMode(button.dataset.assistantMode);
            const target = assistantMode === 'ask'
                ? document.getElementById('assistant-ask-input')
                : document.getElementById('sidebar-country');
            target?.focus();
        });
        button.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            const nextMode = assistantMode === 'ask' ? 'plan' : 'ask';
            setAssistantMode(nextMode);
            document.querySelector(`[data-assistant-mode="${nextMode}"]`)?.focus();
        });
    });
    setAssistantMode(assistantMode);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && sidebar?.classList.contains('open')) closeAssistant();
    });

    // Q&A mode shares this assistant surface but uses its evidence-grounded question endpoint.
    const askMessages = document.getElementById('assistant-ask-messages');
    const askInput = document.getElementById('assistant-ask-input');
    const askSend = document.getElementById('assistant-ask-send');
    const askChips = document.getElementById('assistant-ask-chips');
    let askHistory = [];
    let askBusy = false;

    function appendAskMessage(role, content, animate = true) {
        if (!askMessages) return;
        askMessages.querySelector('.assistant-ask-welcome')?.remove();
        const message = document.createElement('div');
        message.className = `assistant-ask-message assistant-ask-message--${role}`;
        if (!animate) message.style.animation = 'none';
        if (role === 'assistant') message.innerHTML = renderMarkdownLite(content);
        else message.textContent = content;
        askMessages.appendChild(message);
        askMessages.scrollTop = askMessages.scrollHeight;
    }

    function saveAskHistory() {
        try {
            sessionStorage.setItem('se_chat_history', JSON.stringify(askHistory.slice(-20)));
        } catch {
            // Q&A history is a convenience only; the assistant still works without storage.
        }
    }

    async function sendAskMessage(rawText) {
        const text = String(rawText || '').trim();
        if (!text || askBusy || !askMessages) return;

        askBusy = true;
        askChips?.classList.add('hidden');
        appendAskMessage('user', text);
        askHistory.push({ role: 'user', content: text });
        if (askInput) {
            askInput.value = '';
            askInput.style.height = 'auto';
            askInput.disabled = true;
        }
        if (askSend) askSend.disabled = true;

        const typing = document.createElement('div');
        typing.className = 'assistant-ask-typing';
        typing.setAttribute('aria-label', 'Savanna Guide is responding');
        typing.innerHTML = '<span></span><span></span><span></span>';
        askMessages.appendChild(typing);
        askMessages.scrollTop = askMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: askHistory.slice(0, -1).slice(-6),
                }),
            });
            const data = await response.json();
            typing.remove();
            if (!response.ok || !data.reply) throw new Error('The travel answer could not be generated.');
            appendAskMessage('assistant', data.reply);
            askHistory.push({ role: 'assistant', content: data.reply });
            saveAskHistory();
        } catch {
            typing.remove();
            appendAskMessage('assistant', 'I could not answer that just now. Check your connection and try again.');
        } finally {
            askBusy = false;
            if (askInput) askInput.disabled = false;
            if (askSend) askSend.disabled = false;
            askInput?.focus();
        }
    }

    try {
        const savedHistory = JSON.parse(sessionStorage.getItem('se_chat_history') || '[]');
        if (Array.isArray(savedHistory)) {
            askHistory = savedHistory
                .filter(item => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string')
                .slice(-20);
            askHistory.forEach(item => appendAskMessage(item.role, item.content, false));
            if (askHistory.length) askChips?.classList.add('hidden');
        }
    } catch {
        askHistory = [];
    }

    QUICK_ASKS.forEach(item => {
        if (!askChips) return;
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'assistant-ask-chip';
        chip.textContent = `${item.emoji} ${item.text}`;
        chip.addEventListener('click', () => sendAskMessage(item.text));
        askChips.appendChild(chip);
    });
    askSend?.addEventListener('click', () => sendAskMessage(askInput?.value));
    askInput?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendAskMessage(askInput.value);
        }
    });
    askInput?.addEventListener('input', () => {
        askInput.style.height = 'auto';
        askInput.style.height = `${Math.min(askInput.scrollHeight, 120)}px`;
    });

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

    function renderPlannerHistory() {
        if (messagesContainer) messagesContainer.innerHTML = '';
        plannerHistory.forEach(item => {
            appendMessage(item.role, item.role === 'assistant' ? renderSafeItineraryMarkdown(item.content) : item.content);
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

            const localMatches = getMatchingRouteTemplates(country, category, duration);

            const destination = country === 'All' ? 'Southern Africa' : country;
            const startedAt = performance.now();
            plannerPreferences = { country, duration: String(duration), category, budget };
            markCurrentPlanSaved(false);
            if (saveStatus) saveStatus.textContent = '';

            // Clear history and UI
            plannerHistory = [];
            if (messagesContainer) messagesContainer.innerHTML = '';

            const initialRequest = `Generate a ${duration}-day ${category !== 'All' ? category.toLowerCase() : 'independent travel'} itinerary to ${destination} on a ${budget !== 'All' ? budget : 'standard'} budget.`;
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

                const processedHtml = renderSafeItineraryMarkdown(data.itinerary);
                appendMessage('assistant', processedHtml);

                if (sidebarLoading) sidebarLoading.classList.add('hidden');
                if (sidebarResult) sidebarResult.classList.remove('hidden');

                trackPlannerGenerateSuccess({
                    country: destination,
                    duration,
                    category,
                    budget,
                    routeMatches: localMatches.length,
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

            const processedHtml = renderSafeItineraryMarkdown(data.itinerary);
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
