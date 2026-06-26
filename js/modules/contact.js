import { CONFIG } from '../config.js';

export function initContact() {
    document.getElementById('quotation-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('q-name').value;
        const email = document.getElementById('q-email').value;
        const travelers = document.getElementById('q-travelers').value;
        const style = document.getElementById('q-style').value;
        const itineraries = [...document.querySelectorAll('input[name="itinerary"]:checked')].map(c => c.value);
        const message = document.getElementById('q-message').value;

        const body = `Quotation Request from Savanna Explorer\n\nName: ${name}\nEmail: ${email}\nTravelers: ${travelers}\nStyle: ${style}\nItineraries: ${itineraries.join(', ') || 'Not specified'}\n\nMessage:\n${message}`;
        window.location.href = `mailto:${CONFIG.supportEmail}?subject=${encodeURIComponent('Quotation Request - ' + name)}&body=${encodeURIComponent(body)}`;
    });
}
