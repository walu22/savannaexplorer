import insurance from '../../data/travel-insurance.json';
import roadRules from '../../data/road-rules.json';
import tipping from '../../data/tipping-etiquette.json';
import connectivity from '../../data/connectivity.json';
import permits from '../../data/permits-restrictions.json';
import advisories from '../../data/travel-advisories.json';
import pitfalls from '../../data/travel-pitfalls.json';

const PACKING_DISCLAIMER = 'Adapt every list to your route, season, activities, baggage limits and accommodation. Confirm medical needs with a qualified professional.';

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

function formatVerifiedDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
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
        packing: PACKING_DISCLAIMER,
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
        const checkedOn = formatVerifiedDate(c.lastVerified);
        return `
            <article class="essentials-advisory-card">
                <h4>${c.flag} ${escapeHtml(c.name)}</h4>
                <ul>${links}</ul>
                ${checkedOn ? `<p class="essentials-muted">Links checked ${escapeHtml(checkedOn)}</p>` : ''}
            </article>
        `;
    }).join('');

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(advisories.intro)}</p>
        <div class="pwa-notif-card">
            <div class="pwa-notif-header">
                <div class="pwa-notif-icon"><i class="fas fa-bell"></i></div>
                <div class="pwa-notif-info">
                    <h4>Travel Advisory Notifications</h4>
                    <p>Get real-time push alerts for critical border closures, road washouts, and travel warnings in Southern Africa.</p>
                </div>
            </div>
            <div class="pwa-notif-toggle-wrap">
                <span class="pwa-notif-status inactive" id="pwa-notif-status-text">Notifications Disabled</span>
                <label class="switch-label">
                    <input type="checkbox" id="pwa-notif-toggle">
                    <span class="switch-slider"></span>
                </label>
            </div>
        </div>
        <h3 class="essentials-subheading">Your government's travel advice</h3>
        <ul class="essentials-link-list">${services}</ul>
        <h3 class="essentials-subheading">By destination</h3>
        <div class="essentials-advisory-grid">${countries}</div>
        <p class="section-disclaimer">${escapeHtml(advisories.meta.disclaimer)}</p>
    `;

    // Sync initial state of toggle
    const toggle = document.getElementById('pwa-notif-toggle');
    if (toggle) {
        const isEnabled = localStorage.getItem('se_notifications_enabled') === 'true' &&
                          ('Notification' in window && Notification.permission === 'granted');
        toggle.checked = isEnabled;
        const statusText = document.getElementById('pwa-notif-status-text');
        if (statusText) {
            statusText.textContent = isEnabled ? 'Notifications Enabled' : 'Notifications Disabled';
            statusText.className = isEnabled ? 'pwa-notif-status active' : 'pwa-notif-status inactive';
        }
    }
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

    el.innerHTML = `
        <p class="essentials-intro">${escapeHtml(PACKING_DISCLAIMER)}</p>
        <div class="essentials-pitfall-grid essentials-packing-principles">
            <article class="essentials-pitfall-card"><div class="essentials-pitfall-icon">🧳</div><h4>Check baggage rules</h4><p>Light-aircraft transfers often impose stricter weight, size and soft-bag limits than international flights.</p></article>
            <article class="essentials-pitfall-card"><div class="essentials-pitfall-icon">🧥</div><h4>Pack for temperature swings</h4><p>Cool dawn drives, hot afternoons, rain and higher ground can occur in one itinerary. Use adaptable layers.</p></article>
            <article class="essentials-pitfall-card"><div class="essentials-pitfall-icon">🩹</div><h4>Prepare health essentials</h4><p>Carry prescriptions, a basic first-aid kit, sun protection and insect protection appropriate to the route.</p></article>
            <article class="essentials-pitfall-card"><div class="essentials-pitfall-icon">📄</div><h4>Protect documents</h4><p>Keep required originals accessible and encrypted copies separate. Vehicle papers belong with the border plan.</p></article>
        </div>
        <div class="essentials-packing-actions">
            <a class="btn btn-primary" href="/packing-list"><i class="fas fa-suitcase-rolling" aria-hidden="true"></i> Build a seasonal packing list</a>
            <a class="btn btn-outline" href="/my-safari">Save progress in My Safari</a>
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
