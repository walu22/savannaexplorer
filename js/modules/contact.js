import { CONFIG, isSupabaseConfigured } from '../config.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { showFormFeedback, clearFormFeedback } from '../lib/form-feedback.js';

function submitViaMailto({ name, email, travelers, style, itineraries, message }) {
    const body = `Quotation Request from Savanna Explorer\n\nName: ${name}\nEmail: ${email}\nTravelers: ${travelers}\nStyle: ${style}\nItineraries: ${itineraries.join(', ') || 'Not specified'}\n\nMessage:\n${message}`;
    window.location.href = `mailto:${CONFIG.supportEmail}?subject=${encodeURIComponent('Quotation Request - ' + name)}&body=${encodeURIComponent(body)}`;
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
            travelers: document.getElementById('q-travelers').value,
            style: document.getElementById('q-style').value,
            itineraries: [...document.querySelectorAll('input[name="itinerary"]:checked')].map(c => c.value),
            message: document.getElementById('q-message').value.trim(),
        };

        const submitBtn = form.querySelector('[type="submit"]');
        submitBtn.disabled = true;

        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase.from('quotations').insert([{
                name: payload.name,
                email: payload.email,
                travelers: payload.travelers,
                travel_style: payload.style,
                itineraries: payload.itineraries,
                message: payload.message,
            }]);

            submitBtn.disabled = false;

            if (error) {
                showFormFeedback(feedback, 'Something went wrong. Please try again or email us directly.', 'error');
                return;
            }

            form.reset();
            showFormFeedback(feedback, 'Thank you! We received your request and will reply within 24 hours.', 'success');
            return;
        }

        submitBtn.disabled = false;

        if (isSupabaseConfigured()) {
            showFormFeedback(feedback, 'Unable to connect to our booking system. Please try again shortly.', 'error');
            return;
        }

        submitViaMailto(payload);
        showFormFeedback(feedback, 'Opening your email app to send the request…', 'info');
    });
}
