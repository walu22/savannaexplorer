import bingoData from '../../data/safari-bingo.json';

export function initSafariBingo() {
    const gridEl = document.getElementById('bingo-grid');
    const progressFill = document.getElementById('bingo-progress-fill');
    const progressText = document.getElementById('bingo-progress-text');
    const badgesEl = document.getElementById('bingo-badges');
    const resetBtn = document.getElementById('btn-bingo-reset');
    
    if (!gridEl) return;

    let spotted = new Set();
    const totalSpecies = bingoData.species.length;

    // Load from local storage
    try {
        const saved = localStorage.getItem('se_safari_bingo');
        if (saved) {
            spotted = new Set(JSON.parse(saved));
        }
    } catch { /* ignore */ }

    // Render Grid
    gridEl.innerHTML = bingoData.species.map(s => {
        const isSpotted = spotted.has(s.id);
        return `
            <div class="bingo-card ${isSpotted ? 'spotted' : ''}" data-id="${s.id}">
                <div class="bingo-checkmark"><i class="fas fa-check"></i></div>
                <div class="bingo-emoji">${s.emoji}</div>
                <div class="bingo-name">${s.name}</div>
            </div>
        `;
    }).join('');

    // Event Listeners
    gridEl.addEventListener('click', (e) => {
        const card = e.target.closest('.bingo-card');
        if (!card) return;

        const id = card.dataset.id;
        if (spotted.has(id)) {
            spotted.delete(id);
            card.classList.remove('spotted');
        } else {
            spotted.add(id);
            card.classList.add('spotted');
        }

        saveAndProcess();
    });

    resetBtn?.addEventListener('click', () => {
        if(confirm("Are you sure you want to reset your scorecard?")) {
            spotted.clear();
            document.querySelectorAll('.bingo-card').forEach(c => c.classList.remove('spotted'));
            saveAndProcess();
        }
    });

    function saveAndProcess() {
        try {
            localStorage.setItem('se_safari_bingo', JSON.stringify([...spotted]));
        } catch { /* ignore */ }
        
        updateProgress();
        checkBadges();
    }

    function updateProgress() {
        const pct = (spotted.size / totalSpecies) * 100;
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `${spotted.size} / ${totalSpecies}`;
    }

    function checkBadges() {
        if (!badgesEl) return;
        
        // Define badges logic
        const badges = [
            { id: 'big5', name: 'Big 5 Complete', icon: '🏆', check: () => hasAllCategory('big-5') },
            { id: 'predators', name: 'Apex Predator', icon: '🐾', check: () => hasAllCategory('predator') },
            { id: 'birds', name: 'Avian Watcher', icon: '🦅', check: () => hasAllCategory('bird') },
            { id: 'halfway', name: 'Halfway There', icon: '⭐', check: () => spotted.size >= totalSpecies / 2 },
            { id: 'master', name: 'Safari Master', icon: '👑', check: () => spotted.size === totalSpecies }
        ];

        // Render badges if not already rendered
        if (badgesEl.children.length === 0) {
            badgesEl.innerHTML = badges.map(b => `
                <div class="bingo-badge" id="badge-${b.id}">
                    <div class="bingo-badge-icon">${b.icon}</div>
                    <div class="bingo-badge-name">${b.name}</div>
                </div>
            `).join('');
        }

        // Evaluate earned
        badges.forEach(b => {
            const el = document.getElementById(`badge-${b.id}`);
            if (!el) return;
            if (b.check()) {
                el.classList.add('earned');
            } else {
                el.classList.remove('earned');
            }
        });
    }

    function hasAllCategory(category) {
        const categorySpecies = bingoData.species.filter(s => s.category === category).map(s => s.id);
        if (categorySpecies.length === 0) return false;
        return categorySpecies.every(id => spotted.has(id));
    }

    // Initial updates
    updateProgress();
    checkBadges();
}
