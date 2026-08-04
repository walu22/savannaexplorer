import phrasebookData from '../../data/phrasebook.json';

export function initPhrasebook() {
    const container = document.getElementById('phrasebook-app');
    if (!container) return;

    // Render Tabs
    let html = '<div class="phrasebook-tabs">';
    phrasebookData.languages.forEach((lang, index) => {
        html += `<button class="phrasebook-tab ${index === 0 ? 'active' : ''}" data-index="${index}">${lang.name}</button>`;
    });
    html += '</div>';

    // Render Content Area
    html += '<div class="phrasebook-content" id="phrasebook-content"></div>';
    
    container.innerHTML = html;

    const contentEl = document.getElementById('phrasebook-content');
    const tabs = document.querySelectorAll('.phrasebook-tab');

    function renderLanguage(index) {
        const lang = phrasebookData.languages[index];
        let contentHtml = `
            <div class="phrasebook-region"><i class="fas fa-map-marker-alt"></i> Spoken in: ${lang.regions}</div>
            <div class="phrase-list">
        `;

        lang.phrases.forEach(phrase => {
            contentHtml += `
                <div class="phrase-item">
                    <div class="phrase-english">${phrase.english}</div>
                    <div class="phrase-translation">
                        <div class="phrase-local">${phrase.local}</div>
                        <div class="phrase-pronunciation">${phrase.pronunciation}</div>
                    </div>
                </div>
            `;
        });

        contentHtml += '</div>';
        contentEl.innerHTML = contentHtml;
    }

    // Bind events
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderLanguage(parseInt(e.target.dataset.index, 10));
        });
    });

    // Initial render
    renderLanguage(0);
}
