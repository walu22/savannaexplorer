import about from '../../data/about.json';

function bindAccordion(listEl) {
    listEl?.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const expanded = header.getAttribute('aria-expanded') === 'true';
            listEl.querySelectorAll('.accordion-header').forEach(h => {
                h.setAttribute('aria-expanded', 'false');
                h.nextElementSibling?.classList.remove('open');
            });
            if (!expanded) {
                header.setAttribute('aria-expanded', 'true');
                header.nextElementSibling?.classList.add('open');
            }
        });
    });
}

function renderPublishLists() {
    const publishList = document.getElementById('about-publish-list');
    const dontList = document.getElementById('about-dont-list');
    const publishTitle = document.getElementById('about-publish-title');
    const dontTitle = document.getElementById('about-dont-title');
    if (publishTitle) publishTitle.textContent = about.publish.title;
    if (dontTitle) dontTitle.textContent = about.dont.title;
    if (publishList) {
        publishList.innerHTML = about.publish.items.map(item => `<li>${item}</li>`).join('');
    }
    if (dontList) {
        dontList.innerHTML = about.dont.items.map(item => `<li>${item}</li>`).join('');
    }
}

function renderHowToUse() {
    const grid = document.getElementById('about-how-grid');
    if (!grid) return;
    grid.innerHTML = about.howToUse.steps.map((step, i) => `
        <article class="about-step-card">
            <span class="about-step-num">${i + 1}</span>
            <span class="about-step-icon"><i class="fas ${step.icon}"></i></span>
            <h3>${step.title}</h3>
            <p>${step.desc}</p>
        </article>
    `).join('');
}

function renderDataPolicy() {
    const intro = document.getElementById('about-data-intro');
    if (intro) {
        intro.innerHTML = about.dataPolicy.paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    const principles = document.getElementById('about-data-principles');
    if (principles) {
        principles.innerHTML = about.dataPolicy.principles.map(p => `<li>${p}</li>`).join('');
    }

    const table = document.getElementById('about-data-table');
    if (table) {
        table.innerHTML = `
            <div class="about-data-table-head">
                <span>Content</span>
                <span>What it covers</span>
                <span>Primary sources</span>
            </div>
            ${about.dataFiles.map(row => `
                <div class="about-data-table-row">
                    <span>${row.file}</span>
                    <span>${row.content}</span>
                    <span>${row.sources}</span>
                </div>
            `).join('')}
        `;
    }

    const maintenance = document.getElementById('about-maintenance-list');
    if (maintenance) {
        maintenance.innerHTML = about.maintenance.map(row => `
            <li><strong>${row.type}</strong> — reviewed ${row.frequency.toLowerCase()}</li>
        `).join('');
    }

    const reviewed = document.getElementById('about-last-reviewed');
    if (reviewed) {
        reviewed.textContent = `Last reviewed ${about.meta.lastReviewed}`;
    }
}

function renderPartners() {
    const block = document.getElementById('about-partners-copy');
    if (block) {
        block.innerHTML = about.partners.paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    const topics = document.getElementById('about-partner-topics');
    if (topics) {
        topics.innerHTML = about.partners.topics.map(topic => `
            <div class="about-partner-topic">
                <strong>${topic.label}</strong>
                <span>${topic.desc}</span>
            </div>
        `).join('');
    }
}

function renderHubFaqs() {
    const list = document.getElementById('about-hub-faq-list');
    if (!list) return;

    list.innerHTML = about.hubFaqs.map((item, i) => `
        <div class="accordion-item faq-item">
            <button class="accordion-header" aria-expanded="${i === 0}" data-about-faq="${i}">
                <span class="accordion-title">${item.q}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="accordion-body${i === 0 ? ' open' : ''}">
                <p>${item.a}</p>
            </div>
        </div>
    `).join('');

    bindAccordion(list);
}

export function initAbout() {
    const introTitle = document.getElementById('about-title');
    const introLead = document.getElementById('about-lead');
    if (introTitle) introTitle.textContent = about.intro.title;
    if (introLead) introLead.textContent = about.intro.lead;

    renderPublishLists();
    renderHowToUse();
    renderDataPolicy();
    renderPartners();
    renderHubFaqs();
}
