import packingData from '../../data/packing-rules.json';

export function initPackingList() {
    const container = document.getElementById('packing-generator');
    if (!container) return;

    const monthSelect = document.getElementById('pack-month');
    const styleSelect = document.getElementById('pack-style');
    const listContainer = document.getElementById('packing-list-output');
    const progressEl = document.getElementById('packing-progress');
    const resetBtn = document.getElementById('btn-packing-reset');

    let packedItems = new Set();
    
    // Load saved state
    try {
        const saved = localStorage.getItem('se_packing_list');
        if (saved) {
            packedItems = new Set(JSON.parse(saved));
        }
    } catch { /* ignore */ }

    function getSeason(month) {
        const winterMonths = ['jun', 'jul', 'aug'];
        return winterMonths.includes(month) ? 'winter' : 'summer';
    }

    function renderList() {
        const currentMonth = monthSelect.value;
        const currentStyle = styleSelect.value;
        const currentSeason = getSeason(currentMonth);

        // Filter items based on conditions
        const activeItems = packingData.items.filter(item => {
            return item.condition === 'always' || 
                   item.condition === currentSeason || 
                   item.condition === currentStyle;
        });

        // Group by category
        const grouped = {};
        packingData.categories.forEach(cat => grouped[cat.id] = { ...cat, items: [] });
        
        activeItems.forEach(item => {
            if(grouped[item.category]) {
                grouped[item.category].items.push(item);
            }
        });

        // Render HTML
        let html = '<div class="packing-categories">';
        let totalItems = 0;
        let totalPacked = 0;

        Object.values(grouped).forEach(cat => {
            if (cat.items.length === 0) return;
            
            html += `<div class="packing-category">
                        <h3>${cat.icon} ${cat.name}</h3>
                        <div class="packing-items">`;
            
            cat.items.forEach(item => {
                totalItems++;
                const isPacked = packedItems.has(item.id);
                if (isPacked) totalPacked++;
                
                html += `<div class="packing-item ${isPacked ? 'packed' : ''}" data-id="${item.id}">
                            <div class="packing-checkbox"><i class="fas fa-check"></i></div>
                            <div class="packing-item-name">${item.name}</div>
                         </div>`;
            });
            
            html += `</div></div>`;
        });
        
        html += '</div>';
        listContainer.innerHTML = html;
        
        progressEl.textContent = `${totalPacked} / ${totalItems} Packed`;
    }

    // Events
    monthSelect.addEventListener('change', renderList);
    styleSelect.addEventListener('change', renderList);
    
    listContainer.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.packing-item');
        if (!itemEl) return;
        
        const id = itemEl.dataset.id;
        if (packedItems.has(id)) {
            packedItems.delete(id);
            itemEl.classList.remove('packed');
        } else {
            packedItems.add(id);
            itemEl.classList.add('packed');
        }
        
        try {
            localStorage.setItem('se_packing_list', JSON.stringify([...packedItems]));
        } catch {}
        
        renderList(); // Re-render to update counts
    });

    resetBtn?.addEventListener('click', () => {
        if(confirm("Reset packing list?")) {
            packedItems.clear();
            try {
                localStorage.setItem('se_packing_list', JSON.stringify([]));
            } catch {}
            renderList();
        }
    });

    renderList();
}
