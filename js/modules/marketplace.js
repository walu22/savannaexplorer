import marketplaceData from '../../data/marketplace.json';
import { getSupabaseClient } from '../lib/supabase.js';

async function openMarketplace(theme) {
    const marketModal = document.getElementById('marketplace-modal');
    const marketGrid = document.getElementById('marketplace-grid');
    const marketTitle = document.getElementById('market-title');

    marketModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    marketTitle.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">Loading inspiration…</div>';

    let items = [];
    const supabase = getSupabaseClient();

    if (supabase) {
        const { data, error } = await supabase
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
                <span class="market-badge">${item.badge || 'Inspiration'}</span>
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
                <p class="market-inspire-note">Typical price range for planning — book directly with local operators when you travel.</p>
            </div>
        </div>
    `).join('');
}

function closeMarketplace() {
    document.getElementById('marketplace-modal')?.classList.remove('active');
    document.body.style.overflow = '';
}

export function initMarketplace() {
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
}
