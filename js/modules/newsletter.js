import { CONFIG, isSupabaseConfigured } from '../config.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { showFormFeedback, clearFormFeedback } from '../lib/form-feedback.js';

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

        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase.from('newsletter_subscribers').insert([{ email }]);

            submitBtn.disabled = false;

            if (error) {
                if (error.code === '23505') {
                    showFormFeedback(feedback, 'You are already subscribed. Thank you!', 'info');
                } else {
                    showFormFeedback(feedback, 'Could not subscribe right now. Please try again later.', 'error');
                }
                return;
            }

            form.reset();
            showFormFeedback(feedback, 'Welcome aboard! Check your inbox for travel inspiration soon.', 'success');
            return;
        }

        submitBtn.disabled = false;

        if (isSupabaseConfigured()) {
            showFormFeedback(feedback, 'Unable to connect. Please try again shortly.', 'error');
            return;
        }

        const body = `Please add me to the Savanna Explorer newsletter.\n\nEmail: ${email}`;
        window.location.href = `mailto:${CONFIG.supportEmail}?subject=${encodeURIComponent('Newsletter Signup')}&body=${encodeURIComponent(body)}`;
        showFormFeedback(feedback, 'Opening your email app to complete signup…', 'info');
    });
}
