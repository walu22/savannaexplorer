import { CONFIG, isSupabaseConfigured } from '../config.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { showFormFeedback, clearFormFeedback } from '../lib/form-feedback.js';

export async function subscribeNewsletter(email, { source } = {}) {
    const supabase = getSupabaseClient();
    if (supabase) {
        const { error } = await supabase.from('newsletter_subscribers').insert([{ email }]);

        if (error) {
            if (error.code === '23505') {
                return { ok: true, type: 'info', message: 'You are already subscribed — your checklist is ready.' };
            }
            return { ok: false, type: 'error', message: 'Could not subscribe right now. Please try again later.' };
        }

        if (typeof gtag === 'function') {
            gtag('event', 'newsletter_signup', { source: source || 'newsletter' });
        }

        return { ok: true, type: 'success', message: 'Check your inbox — your printable checklist is ready below.' };
    }

    if (isSupabaseConfigured()) {
        return { ok: false, type: 'error', message: 'Unable to connect. Please try again shortly.' };
    }

    const body = `Please add me to the Savanna Explorer newsletter.\n\nEmail: ${email}${source ? `\nSource: ${source}` : ''}`;
    window.location.href = `mailto:${CONFIG.supportEmail}?subject=${encodeURIComponent('Newsletter Signup')}&body=${encodeURIComponent(body)}`;
    return { ok: true, type: 'info', message: 'Opening your email app to complete signup…' };
}

export function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    const feedback = document.getElementById('newsletter-feedback');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormFeedback(feedback);

        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput?.value.trim();
        if (!email) return;

        const submitBtn = form.querySelector('[type="submit"]');
        submitBtn.disabled = true;

        const result = await subscribeNewsletter(email, { source: 'newsletter' });
        submitBtn.disabled = false;

        if (result.ok) {
            form.reset();
        }

        showFormFeedback(feedback, result.message, result.type);
    });
}
