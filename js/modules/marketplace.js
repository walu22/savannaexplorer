import marketplaceData from '../../data/marketplace.json';
import marketplaceResources from '../../data/marketplace-resources.json';
import { getSupabaseClient } from '../lib/supabase.js';
import { formatCostBand } from '../lib/planning-format.js';
import { createModalFocusManager } from '../lib/modal-focus.js';

let marketplaceModalFocus = null;

function getMarketplaceModalFocus() {
    if (!marketplaceModalFocus) {
        marketplaceModalFocus = createModalFocusManager(document.getElementById('marketplace-modal'));
    }
    return marketplaceModalFocus;
}

function getResourceMeta(item) {
    const byId = marketplaceResources[item.id] || {};
    return {
        planningTip: item.planning_tip || byId.planning_tip || 'Compare licensed local operators and confirm seasonal availability before you travel.',
        resourceUrl: item.resource_url || byId.resource_url || '',
        resourceLabel: item.resource_label || byId.resource_label || 'Official tourism info',
    };
}

function renderMarketCard(item) {
    const { planningTip, resourceUrl, resourceLabel } = getResourceMeta(item);
    const costBand = formatCostBand(item.price_range);
    const resourceLink = resourceUrl
        ? `<a class="market-resource-link" href="${resourceUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> ${resourceLabel}</a>`
        : '';

    return `
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
                    ${item.best_time ? `<span><i class="fas fa-sun"></i> ${item.best_time}</span>` : ''}
                </div>
                <p class="market-desc">${item.description}</p>
                <div class="market-meta-bottom">
                    ${costBand ? `<span class="m-price" title="Typical cost band for planning">${costBand}</span>` : ''}
                </div>
                <p class="market-planning-tip"><i class="fas fa-lightbulb"></i> ${planningTip}</p>
                ${resourceLink}
            </div>
        </div>
    `;
}

async function openMarketplace(theme) {
    const marketModal = document.getElementById('marketplace-modal');
    const marketGrid = document.getElementById('marketplace-grid');
    const marketTitle = document.getElementById('market-title');

    marketModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    getMarketplaceModalFocus().open();
    marketTitle.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">Loading inspiration…</div>';

    let items = [];
    const supabase = getSupabaseClient();

    if (supabase) {
        const { data, error } = await supabase
            .from('experiences')
            .select('*')
            .eq('category', theme)
            .order('title', { ascending: true });

        items = (!error && data?.length) ? data : (marketplaceData[theme] || []);
    } else {
        items = marketplaceData[theme] || [];
    }

    if (!items.length) {
        marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:2rem;">No experiences found for this category yet.</div>';
        return;
    }

    marketGrid.innerHTML = items.map(renderMarketCard).join('');
}

function closeMarketplace() {
    document.getElementById('marketplace-modal')?.classList.remove('active');
    document.body.style.overflow = '';
    getMarketplaceModalFocus().close();
}

/** Global detailed view modal trigger for a single experience card */
window.openExperienceDetails = async function(itemId) {
    const marketModal = document.getElementById('marketplace-modal');
    const marketGrid = document.getElementById('marketplace-grid');
    const marketTitle = document.getElementById('market-title');

    if (!marketModal || !marketGrid) return;

    // Show modal and loading state
    marketModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    getMarketplaceModalFocus().open();
    if (marketTitle) marketTitle.textContent = "Experience Details";
    marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:3rem;"><i class="fas fa-circle-notch fa-spin" style="font-size: 1.5rem; color: var(--primary);"></i> Loading experience details…</div>';

    let item = null;

    // 1. Scan offline marketplace.json configuration file first
    for (const category in marketplaceData) {
        const found = marketplaceData[category].find(x => x.id === itemId);
        if (found) {
            item = found;
            break;
        }
    }

    // 2. Fetch live from Supabase if online to capture real-time edits
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('experiences')
                .select('*')
                .eq('id', itemId)
                .single();
            if (!error && data) {
                item = data;
            }
        }
    } catch (e) {
        console.warn("Could not query Supabase experiences, falling back to local dataset:", e);
    }

    if (!item) {
        marketGrid.innerHTML = '<div style="color:white;text-align:center;width:100%;padding:3rem;">Experience details not found.</div>';
        return;
    }

    // Render single card
    marketGrid.innerHTML = renderMarketCard(item);
};

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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('marketplace-modal')?.classList.contains('active')) {
            closeMarketplace();
        }
    });
}
