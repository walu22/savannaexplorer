import { CONFIG, isSupabaseConfigured } from '../config.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { showFormFeedback, clearFormFeedback } from '../lib/form-feedback.js';

function submitViaMailto({ name, email, topic, message }) {
    const body = `Message from Savanna Explorer\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`;
    window.location.href = `mailto:${CONFIG.supportEmail}?subject=${encodeURIComponent(`Savanna Explorer — ${topic}`)}&body=${encodeURIComponent(body)}`;
}

export function initContact() {
    const form = document.getElementById('quotation-form');
    const feedback = document.getElementById('quotation-feedback');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormFeedback(feedback);

        const payload = {
            name: document.getElementById('q-name').value.trim(),
            email: document.getElementById('q-email').value.trim(),
            topic: document.getElementById('q-topic').value,
            message: document.getElementById('q-message').value.trim(),
        };

        const submitBtn = form.querySelector('[type="submit"]');
        submitBtn.disabled = true;

        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase.from('quotations').insert([{
                name: payload.name,
                email: payload.email,
                travelers: null,
                travel_style: payload.topic,
                itineraries: [],
                message: payload.message,
            }]);

            submitBtn.disabled = false;

            if (error) {
                showFormFeedback(feedback, 'Something went wrong. Please try again or email us directly.', 'error');
                return;
            }

            form.reset();
            showFormFeedback(feedback, 'Thank you! We received your message and will reply when we can.', 'success');
            return;
        }

        submitBtn.disabled = false;

        if (isSupabaseConfigured()) {
            showFormFeedback(feedback, 'Unable to connect right now. Please try again shortly or email us directly.', 'error');
            return;
        }

        submitViaMailto(payload);
        showFormFeedback(feedback, 'Opening your email app to send the message…', 'info');
    });
}
