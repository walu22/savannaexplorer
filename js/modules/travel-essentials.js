import insurance from '../../data/travel-insurance.json';
import roadRules from '../../data/road-rules.json';
import tipping from '../../data/tipping-etiquette.json';
import connectivity from '../../data/connectivity.json';
import permits from '../../data/permits-restrictions.json';
import advisories from '../../data/travel-advisories.json';
import pitfalls from '../../data/travel-pitfalls.json';
import packing from '../../data/packing.json';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function linkHtml(resource) {
    const href = resource.internal ? resource.url : resource.url;
    const target = resource.internal ? '' : ' target="_blank" rel="noopener noreferrer"';
    const icon = resource.internal ? '' : ' <i class="fas fa-external-link-alt"></i>';
    return `<a class="data-source-link" href="${href}"${target}>${escapeHtml(resource.label)}${icon}</a>`;
}

function initTabs() {
    const tabs = document.querySelectorAll('[data-essentials-tab]');
    const panels = document.querySelectorAll('[data-essentials-panel]');
    const disclaimerEl = document.getElementById('essentials-disclaimer');
    const tabDisclaimers = {
        insurance: insurance.meta.disclaimer,
        'road-rules': roadRules.meta.disclaimer,
        tipping: tipping.meta.disclaimer,
        connectivity: connectivity.meta.disclaimer,
        permits: permits.meta.disclaimer,
        advisories: advisories.meta.disclaimer,
        pitfalls: pitfalls.meta.disclaimer,
        packing: packing.meta.disclaimer,
    };

    function setTabDisclaimer(tabId) {
        if (disclaimerEl && tabDisclaimers[tabId]) {
            disclaimerEl.textContent = tabDisclaimers[tabId];
        }
    }

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.dataset.essentialsTab;
            tabs.forEach(t => {
                const active = t.dataset.essentialsTab === id;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            panels.forEach(panel => {
                const show = panel.dataset.essentialsPanel === id;
                panel.classList.toggle('active', show);
                panel.hidden = !show;
            });
            setTabDisclaimer(id);
        });
    });

    const activeTab = document.querySelector('[data-essentials-tab].active');
    setTabDisclaimer(activeTab?.dataset.essentialsTab || 'insurance');
}

function renderInsurance() {
    const el = document.getElementById('essentials-insurance');
    if (!el) return;

    const cards = insurance.mustVerify.map(item => `
        <article class="essentials-card">
            <h4><i class="fas ${item.icon}"></i> ${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.body)}</p>
        </article>
    `).join('');

    const checklist = insurance.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    const resources = insurance.resources.map(r => {
        const note = r.note ? ` <span class="essentials-muted">— ${escapeHtml(r.note)}</span>` : '';
        return `<li>${linkHtml(r)}${note}</li>`;
    }).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(insurance.intro)}</p>
        <div class="essentials-card-grid">${cards}</div>
        <h3 class="essentials-subheading">Pre-purchase checklist</h3>
        <ul class="essentials-checklist">${checklist}</ul>
        <h3 class="essentials-subheading">Official resources</h3>
        <ul class="essentials-link-list">${resources}</ul>
    `;
}

function renderRoadRules() {
    const el = document.getElementById('essentials-road-rules');
    if (!el) return;

    const rows = roadRules.countries.map(c => `
        <tr>
            <td>${c.flag} ${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.driveSide)}</td>
            <td>${escapeHtml(c.speedTar)}<br><span class="essentials-muted">${escapeHtml(c.speedGravel)}</span></td>
            <td>${escapeHtml(c.nightDriving)}</td>
            <td>${escapeHtml(c.idp)}</td>
            <td>${escapeHtml(c.alcohol)}</td>
            <td>${escapeHtml(c.tolls)}</td>
            <td>${(c.highlights || []).map(h => escapeHtml(h)).join(' · ')}</td>
            <td><a class="data-source-link" href="${c.sourceUrl}" target="_blank" rel="noopener noreferrer">Source <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
    `).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(roadRules.meta.disclaimer)}</p>
        <div class="essentials-table-wrap">
            <table class="essentials-table">
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Side</th>
                        <th>Speed</th>
                        <th>Night driving</th>
                        <th>IDP</th>
                        <th>Alcohol</th>
                        <th>Tolls</th>
                        <th>Key notes</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderTipping() {
    const el = document.getElementById('essentials-tipping');
    if (!el) return;

    const roles = tipping.roles.map(r =>
        `<li><strong>${escapeHtml(r.role)}:</strong> ${escapeHtml(r.guidance)}</li>`
    ).join('');

    const rows = tipping.countries.map(c => `
        <tr>
            <td>${c.flag} ${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.currency)}</td>
            <td>${escapeHtml(c.restaurant)}</td>
            <td>${escapeHtml(c.safariGuide)}</td>
            <td>${escapeHtml(c.lodgeStaff)}</td>
            <td>${escapeHtml(c.notes)}</td>
        </tr>
    `).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(tipping.intro)}</p>
        <h3 class="essentials-subheading">By role</h3>
        <ul class="essentials-checklist">${roles}</ul>
        <h3 class="essentials-subheading">By country</h3>
        <div class="essentials-table-wrap">
            <table class="essentials-table">
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Currency</th>
                        <th>Restaurant</th>
                        <th>Guide / activity</th>
                        <th>Lodge staff</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <p class="section-disclaimer">${escapeHtml(tipping.meta.disclaimer)}</p>
    `;
}

function renderConnectivity() {
    const el = document.getElementById('essentials-connectivity');
    if (!el) return;

    const rows = connectivity.countries.map(c => `
        <tr>
            <td>${c.flag} ${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.operators)}</td>
            <td>${escapeHtml(c.airport)}</td>
            <td>${escapeHtml(c.registration)}</td>
            <td>${escapeHtml(c.parkCoverage)}</td>
            <td>${escapeHtml(c.esim)}</td>
            <td>${escapeHtml(c.planningTip)}</td>
        </tr>
    `).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(connectivity.intro)}</p>
        <p class="essentials-note"><i class="fas fa-sim-card"></i> ${escapeHtml(connectivity.esimNote)}</p>
        <p class="essentials-muted">Also see <a href="#transport">Transport → SIM &amp; data</a> for operator booking links.</p>
        <div class="essentials-table-wrap">
            <table class="essentials-table">
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Operators</th>
                        <th>Buy at</th>
                        <th>Registration</th>
                        <th>Park coverage</th>
                        <th>eSIM</th>
                        <th>Tip</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderPermits() {
    const el = document.getElementById('essentials-permits');
    if (!el) return;

    const blocks = permits.categories.map(cat => {
        const items = cat.items.map(item => {
            const href = item.internal ? item.url : item.url;
            const target = item.internal ? '' : ' target="_blank" rel="noopener noreferrer"';
            return `
                <article class="essentials-permit-item">
                    <div class="essentials-permit-head">
                        <span>${item.flag || ''}</span>
                        <strong>${escapeHtml(item.country)}</strong>
                    </div>
                    <p>${escapeHtml(item.rule)}</p>
                    <p class="essentials-muted">${escapeHtml(item.authority)} · verified ${escapeHtml(item.lastVerified)}</p>
                    <a class="data-source-link" href="${href}"${target}>Official link <i class="fas fa-external-link-alt"></i></a>
                </article>
            `;
        }).join('');
        return `
            <div class="essentials-permit-category">
                <h3><i class="fas ${cat.icon}"></i> ${escapeHtml(cat.title)}</h3>
                <div class="essentials-permit-grid">${items}</div>
            </div>
        `;
    }).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(permits.meta.disclaimer)}</p>
        ${blocks}
    `;
}

function renderAdvisories() {
    const el = document.getElementById('essentials-advisories');
    if (!el) return;

    const services = advisories.passportServices.map(s =>
        `<li><a class="data-source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a> <span class="essentials-muted">— ${escapeHtml(s.note)}</span></li>`
    ).join('');

    const countries = advisories.countries.map(c => {
        const links = c.links.map(l =>
            `<li><a class="data-source-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} <i class="fas fa-external-link-alt"></i></a></li>`
        ).join('');
        return `
            <article class="essentials-advisory-card">
                <h4>${c.flag} ${escapeHtml(c.name)}</h4>
                <ul>${links}</ul>
            </article>
        `;
    }).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(advisories.intro)}</p>
        <h3 class="essentials-subheading">Your government's travel advice</h3>
        <ul class="essentials-link-list">${services}</ul>
        <h3 class="essentials-subheading">By destination</h3>
        <div class="essentials-advisory-grid">${countries}</div>
        <p class="section-disclaimer">${escapeHtml(advisories.meta.disclaimer)}</p>
    `;
}

function renderPitfalls() {
    const el = document.getElementById('essentials-pitfalls');
    if (!el) return;

    const cards = pitfalls.topics.map(t => `
        <article class="essentials-pitfall-card">
            <div class="essentials-pitfall-icon">${t.icon}</div>
            <h4>${escapeHtml(t.title)}</h4>
            <p>${escapeHtml(t.body)}</p>
            <p class="essentials-muted">Relevant: ${t.countries.map(escapeHtml).join(' · ')}</p>
        </article>
    `).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(pitfalls.intro)}</p>
        <div class="essentials-pitfall-grid">${cards}</div>
    `;
}

function renderPacking() {
    const el = document.getElementById('essentials-packing');
    if (!el) return;

    const tripTypes = ['safari', 'beach', 'city', 'mountain'].map(type => `
        <div class="essentials-packing-col">
            <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <ul>${packing[type].map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
    `).join('');

    const seasonal = packing.seasonalNotes.map(s => `
        <li><strong>${escapeHtml(s.region)}:</strong> ${s.items.map(escapeHtml).join(', ')}</li>
    `).join('');

    const medical = packing.medicalKit.map(i => `<li>${escapeHtml(i)}</li>`).join('');
    const docs = packing.documents.map(i => `<li>${escapeHtml(i)}</li>`).join('');
    const lodgeProvide = packing.lodgesUsuallyProvide.map(i => `<li>${escapeHtml(i)}</li>`).join('');
    const bring = packing.youShouldBring.map(i => `<li>${escapeHtml(i)}</li>`).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(packing.meta.disclaimer)}</p>
        <p class="essentials-muted">Trip planner checklist uses the safari / beach / city / mountain lists — see <a href="#plan">Travel Tools</a>.</p>
        <div class="essentials-packing-grid">${tripTypes}</div>
        <h3 class="essentials-subheading">Seasonal add-ons</h3>
        <ul class="essentials-checklist">${seasonal}</ul>
        <div class="essentials-packing-extras">
            <div>
                <h4>Medical kit</h4>
                <ul>${medical}</ul>
            </div>
            <div>
                <h4>Documents pouch</h4>
                <ul>${docs}</ul>
            </div>
            <div>
                <h4>Lodges usually provide</h4>
                <ul>${lodgeProvide}</ul>
            </div>
            <div>
                <h4>You should still bring</h4>
                <ul>${bring}</ul>
            </div>
        </div>
    `;
}

export function initTravelEssentials() {
    const section = document.getElementById('travel-essentials');
    if (!section) return;

    initTabs();
    renderInsurance();
    renderRoadRules();
    renderTipping();
    renderConnectivity();
    renderPermits();
    renderAdvisories();
    renderPitfalls();
    renderPacking();
}
