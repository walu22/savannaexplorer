import marketplaceData from '../../data/marketplace.json';
import { CONFIG, isSupabaseConfigured } from '../config.js';

let supabaseClient = null;

function initSupabase() {
    if (!window.supabase || !isSupabaseConfigured()) return;
    try {
        supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    } catch {
        console.warn('Supabase client not initialized. Using local JSON fallback.');
    }
}

async function handleInquiry(id, title, duration, location) {
    const msg = `Hello, I'm interested in the ${title} (${duration}) in ${location}.\n\nPlease share:\n- Availability\n- Pricing details\n- What's included\n\nThank you.`;

    if (supabaseClient) {
        try {
            await supabaseClient.from('inquiries').insert([{
                experience_id: isNaN(id) ? null : id,
                message: msg,
                source: 'whatsapp',
            }]);
        } catch (err) {
            console.error('Tracking insertion failed:', err);
        }
    }

    window.open(`https://wa.me/${CONFIG.supportPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

async function openMarketplace(theme) {
    const marketModal = document.getElementById('marketplace-modal');
    const marketGrid = document.getElementById('marketplace-grid');
    const marketTitle = document.getElementById('market-title');

    marketModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    marketTitle.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">Fetching curated experiences...</div>';

    let items = [];

    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('experiences')
            .select('*')
            .eq('category', theme)
            .order('rating', { ascending: false });

        items = (!error && data?.length) ? data : (marketplaceData[theme] || []);
    } else {
        items = marketplaceData[theme] || [];
    }

    if (!items.length) {
        marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">No experiences found for this category yet.</div>';
        return;
    }

    marketGrid.innerHTML = items.map(item => `
        <div class="market-card">
            <div class="market-img">
                <img src="${item.image_url || item.image}" alt="${item.title}" loading="lazy">
                <span class="market-badge">${item.badge || 'Available'}</span>
            </div>
            <div class="market-info">
                <h3>${item.title}</h3>
                <div class="market-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                    <span><i class="far fa-clock"></i> ${item.duration}</span>
                </div>
                <p class="market-desc">${item.description}</p>
                <div class="market-meta-bottom">
                    <span class="m-price">${item.price_range}</span>
                    <span class="m-rating"><i class="fas fa-star"></i> ${item.rating || 4.5}</span>
                </div>
                <div class="market-action">
                    <button class="btn btn-primary btn-inquire" data-inquire
                        data-id="${item.id}"
                        data-title="${item.title.replace(/"/g, '&quot;')}"
                        data-duration="${item.duration}"
                        data-location="${item.location.replace(/"/g, '&quot;')}">
                        <i class="fab fa-whatsapp"></i> Inquire Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function closeMarketplace() {
    document.getElementById('marketplace-modal')?.classList.remove('active');
    document.body.style.overflow = '';
}

export function initMarketplace() {
    initSupabase();

    document.querySelectorAll('.market-close').forEach(btn => {
        btn.addEventListener('click', closeMarketplace);
    });

    document.querySelectorAll('.exp-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const theme = link.getAttribute('data-theme');
            if (theme) openMarketplace(theme);
        });
    });

    document.getElementById('marketplace-grid')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-inquire]');
        if (!btn) return;
        handleInquiry(btn.dataset.id, btn.dataset.title, btn.dataset.duration, btn.dataset.location);
    });
}
