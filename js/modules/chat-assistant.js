/**
 * AI Travel Chat Assistant
 * Floating chat widget powered by Groq for Southern Africa travel Q&A.
 */

import visaData from '../../data/visa-passport.json';
import bordersData from '../../data/borders.json';
import parksData from '../../data/parks.json';
import healthData from '../../data/health.json';
import countriesData from '../../data/countries.json';
import practicalData from '../../data/practical.json';
import packingData from '../../data/packing.json';

/* ---------- context builder ---------- */
function buildContextPayload() {
    const parts = [];

    // Countries overview
    if (countriesData?.countries) {
        parts.push('COUNTRIES COVERED: ' + countriesData.countries.map(c => `${c.name} (${c.tagline})`).join('; '));
    }

    // Visa quick-ref
    if (visaData?.rules) {
        const visaSummary = Object.entries(visaData.rules).map(([country, passports]) => {
            const ukRule = passports.uk;
            return `${country}: UK=${ukRule?.label || '?'}, US=${passports.us?.label || '?'}`;
        }).join('; ');
        parts.push('VISA RULES (sample): ' + visaSummary);
    }

    // Top parks
    if (parksData?.parks) {
        const parkList = parksData.parks.slice(0, 15).map(p =>
            `${p.name} (${p.country}) — ${p.highlight || p.tagline || ''}`
        ).join('; ');
        parts.push('NATIONAL PARKS: ' + parkList);
    }

    // Key borders
    if (bordersData?.crossings) {
        const borderList = bordersData.crossings.slice(0, 12).map(b =>
            `${b.name}: ${b.countries?.join('↔') || ''}, hours: ${b.hours || '?'}`
        ).join('; ');
        parts.push('BORDER CROSSINGS: ' + borderList);
    }

    // Health essentials
    if (healthData?.essentials) {
        const healthList = healthData.essentials.map(h => `${h.title}: ${h.summary || h.description || ''}`).join('; ');
        parts.push('HEALTH & SAFETY: ' + healthList);
    }

    // Practical tips
    if (practicalData?.tips) {
        const tips = practicalData.tips.slice(0, 8).map(t => t.title || t.tip).join('; ');
        parts.push('PRACTICAL TIPS: ' + tips);
    }

    // Packing highlights
    if (packingData?.categories) {
        const packItems = packingData.categories.map(c => `${c.name}: ${(c.items || []).slice(0, 5).join(', ')}`).join('; ');
        parts.push('PACKING: ' + packItems);
    }

    // Trim to ~3000 chars to stay under token limits
    let context = parts.join('\n\n');
    if (context.length > 3000) context = context.slice(0, 3000) + '…';
    return context;
}

/* ---------- markdown-lite renderer ---------- */
function renderMarkdownLite(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((#[a-z-]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
}

/* ---------- quick-ask chips ---------- */
const QUICK_ASKS = [
    { emoji: '🦁', text: 'Best time for safari?' },
    { emoji: '🛂', text: 'Do I need a visa?' },
    { emoji: '🚗', text: 'Border crossing tips' },
    { emoji: '🎒', text: 'What should I pack?' },
    { emoji: '💰', text: 'Park entry fees?' },
];

/* ---------- main init ---------- */
export function initChatAssistant() {
    const fab = document.getElementById('chat-fab');
    const panel = document.getElementById('chat-panel');
    if (!fab || !panel) return;

    const messagesEl = panel.querySelector('.chat-messages');
    const inputEl = panel.querySelector('.chat-input');
    const sendBtn = panel.querySelector('.chat-send-btn');
    const chipsEl = panel.querySelector('.chat-chips');
    const closeBtn = panel.querySelector('.chat-close-btn');

    let history = [];
    let isLoading = false;
    const context = buildContextPayload();

    // Restore session
    try {
        const saved = sessionStorage.getItem('se_chat_history');
        if (saved) {
            history = JSON.parse(saved);
            history.forEach(msg => appendMessage(msg.role === 'user' ? 'user' : 'bot', msg.content, false));
            if (history.length > 0) chipsEl.style.display = 'none';
        }
    } catch { /* ignore */ }

    // Render quick-ask chips
    QUICK_ASKS.forEach(chip => {
        const el = document.createElement('button');
        el.className = 'chat-chip';
        el.textContent = `${chip.emoji} ${chip.text}`;
        el.addEventListener('click', () => sendMessage(chip.text));
        chipsEl.appendChild(el);
    });

    // Toggle panel
    fab.addEventListener('click', () => {
        panel.classList.add('open');
        fab.classList.add('hidden');
        inputEl.focus();
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.remove('open');
        fab.classList.remove('hidden');
    });

    // Send on Enter (shift+enter for newline)
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputEl.value.trim());
        }
    });

    sendBtn.addEventListener('click', () => sendMessage(inputEl.value.trim()));

    // Auto-resize textarea
    inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
    });

    /* ---------- core send/receive ---------- */
    async function sendMessage(text) {
        if (!text || isLoading) return;

        // Hide chips after first message
        chipsEl.style.display = 'none';

        // Add user message
        appendMessage('user', text);
        history.push({ role: 'user', content: text });
        inputEl.value = '';
        inputEl.style.height = 'auto';

        // Show typing indicator
        isLoading = true;
        sendBtn.disabled = true;
        const typingEl = showTyping();

        try {
            const res = await fetch('/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-6),
                    context,
                }),
            });

            const data = await res.json();

            typingEl.remove();

            if (res.ok && data.reply) {
                appendMessage('bot', data.reply);
                history.push({ role: 'assistant', content: data.reply });
            } else {
                appendMessage('bot', '😔 Sorry, I couldn\'t process that. Please try again in a moment.');
            }
        } catch {
            typingEl.remove();
            appendMessage('bot', '🔌 Connection issue — please check your internet and try again.');
        }

        isLoading = false;
        sendBtn.disabled = false;
        saveHistory();
    }

    function appendMessage(type, content, animate = true) {
        // Remove welcome if present
        const welcome = messagesEl.querySelector('.chat-welcome');
        if (welcome) welcome.remove();

        const div = document.createElement('div');
        div.className = `chat-msg chat-msg--${type}`;
        if (!animate) div.style.animation = 'none';

        if (type === 'bot') {
            div.innerHTML = renderMarkdownLite(content);
        } else {
            div.textContent = content;
        }

        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function saveHistory() {
        try {
            // Keep last 20 messages max
            const trimmed = history.slice(-20);
            sessionStorage.setItem('se_chat_history', JSON.stringify(trimmed));
        } catch { /* quota exceeded, ignore */ }
    }
}
