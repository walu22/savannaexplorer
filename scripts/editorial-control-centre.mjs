import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildFreshnessReport } from './lib/editorial-freshness.mjs';
import { buildEditorialControlReport } from './lib/editorial-workflow.mjs';

function argument(name, fallback) {
    const prefix = `--${name}=`;
    return process.argv.find(item => item.startsWith(prefix))?.slice(prefix.length) || fallback;
}

function loadJson(file) {
    return JSON.parse(readFileSync(resolve(process.cwd(), 'data', file), 'utf8'));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const ACTION_LABELS = Object.freeze({
    'resolve-correction': 'Resolve correction',
    'refresh-record': 'Refresh record',
    'capture-evidence': 'Capture evidence',
    'assign-roles': 'Assign owner + approver',
    'submit-review': 'Submit for review',
    'address-changes': 'Address requested changes',
    'resolve-blocker': 'Resolve blocker',
    'approve-review': 'Approve or request changes',
    'publish-approved': 'Publish approved change',
    none: 'No action',
});

function statusLabel(status) {
    return status.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function freshnessLabel(record) {
    if (record.status === 'overdue') return `${Math.abs(record.daysUntilDue)} days overdue`;
    if (record.status === 'due-soon') return `Due in ${record.daysUntilDue} days`;
    if (record.status === 'current') return `${record.daysUntilDue} days remain`;
    return 'Review date missing';
}

function person(person, fallback) {
    if (!person) return `<span class="missing">${escapeHtml(fallback)}</span>`;
    return `<strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)}${person.active ? '' : ' · inactive'}</small>`;
}

function gate(label, passed) {
    return `<span class="gate gate--${passed ? 'pass' : 'fail'}">${passed ? '✓' : '×'} ${escapeHtml(label)}</span>`;
}

function sourceLinks(record) {
    if (!record.sourceUrls.length) return '<span class="missing">No source captured</span>';
    return record.sourceUrls.map((url, index) => (
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Source ${index + 1} ↗</a>`
    )).join('');
}

function history(record) {
    if (!record.history.length) return '<small class="missing">No history captured</small>';
    const items = record.history.map(item => `
        <li><time datetime="${escapeHtml(item.at)}">${escapeHtml(item.at)}</time><strong>${escapeHtml(item.actor)}</strong><span>${escapeHtml(statusLabel(item.type))}: ${escapeHtml(item.note)}</span>${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ''}</li>`).join('');
    return `<details class="history"><summary>${record.history.length} history ${record.history.length === 1 ? 'entry' : 'entries'}</summary><ol>${items}</ol></details>`;
}

function corrections(record) {
    if (!record.openCorrections.length) return '';
    return `<div class="corrections"><strong>${record.openCorrections.length} open correction${record.openCorrections.length === 1 ? '' : 's'}</strong>${record.openCorrections.map(item => `<p>${escapeHtml(item.summary)}</p>`).join('')}</div>`;
}

function dashboardHtml(report) {
    const categoryOptions = Object.entries(report.policies)
        .map(([id, policy]) => `<option value="${escapeHtml(id)}">${escapeHtml(policy.label)}</option>`)
        .join('');
    const actionOptions = Object.entries(ACTION_LABELS)
        .filter(([id]) => id !== 'none')
        .map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`)
        .join('');
    const categories = Object.entries(report.policies).map(([id, policy]) => {
        const records = report.records.filter(record => record.category === id);
        const actionable = records.filter(record => record.nextAction !== 'none').length;
        return `<button class="category" type="button" data-category-shortcut="${escapeHtml(id)}"><span>${escapeHtml(policy.label)}</span><strong>${actionable}</strong><small>need action · ${records.length} tracked</small></button>`;
    }).join('');
    const rows = report.records.map(record => {
        const search = `${record.subject} ${record.country} ${record.sourceFile} ${record.owner?.name || ''} ${record.approver?.name || ''}`.toLowerCase();
        return `
        <tr data-action="${escapeHtml(record.nextAction)}" data-category="${escapeHtml(record.category)}" data-status="${escapeHtml(record.workflowStatus)}" data-search="${escapeHtml(search)}">
          <td><span class="action action--${escapeHtml(record.nextAction)}">${escapeHtml(ACTION_LABELS[record.nextAction])}</span><small>${escapeHtml(statusLabel(record.workflowStatus))}</small></td>
          <td><strong>${escapeHtml(record.subject)}</strong><span>${escapeHtml(record.country)}</span><small><code>${escapeHtml(record.id)}</code></small>${corrections(record)}</td>
          <td><span class="role-label">Owner</span>${person(record.owner, 'Owner unassigned')}<span class="role-label role-label--second">Approver</span>${person(record.approver, 'Approver unassigned')}</td>
          <td><span class="freshness freshness--${escapeHtml(record.status)}">${escapeHtml(freshnessLabel(record))}</span><small>Reviewed ${escapeHtml(record.reviewedOn || '—')} · due ${escapeHtml(record.dueOn || '—')}</small></td>
          <td><div class="gates">${gate('Source', record.gates.source)}${gate('Evidence', record.gates.evidence)}${gate('Fresh', record.gates.freshness)}${gate('Ownership', record.gates.ownership)}${gate('Approval', record.gates.approval)}${gate('Corrections', record.gates.corrections)}</div></td>
          <td><code>${escapeHtml(record.sourceFile)}</code>${sourceLinks(record)}${history(record)}</td>
        </tr>`;
    }).join('');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Editorial Control Centre | Savanna Explorer</title>
  <style>
    :root{--ink:#18332c;--muted:#66736f;--cream:#f4efe4;--paper:#fffdf8;--forest:#143d32;--rust:#b9582b;--red:#b42318;--amber:#b54708;--green:#167451;--line:#ddd5c7;--shadow:0 18px 45px rgba(24,51,44,.09)}
    *{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--rust);font-weight:700}button,input,select{font:inherit}.wrap{width:min(1420px,calc(100% - 32px));margin:auto}
    header{background:radial-gradient(circle at 82% 15%,rgba(229,178,127,.24),transparent 25%),linear-gradient(135deg,#0e2d25,#214d3f 70%,#476853);color:white;padding:46px 24px 94px}.eyebrow{color:#e7b784;font-size:12px;font-weight:850;letter-spacing:.17em;text-transform:uppercase}h1{max-width:920px;margin:10px 0 14px;font:700 clamp(38px,6vw,72px)/1 Georgia,serif}.lead{max-width:830px;margin:0;color:#dae7e1;font-size:18px}.stamp{margin-top:20px;color:#bcd1c8;font-size:13px}
    main{margin-top:-56px;padding-bottom:70px}.metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.metric,.panel,.notice,.category{background:var(--paper);border:1px solid rgba(24,51,44,.09);box-shadow:var(--shadow)}.metric{border-radius:16px;padding:19px}.metric span,.metric small{display:block;color:var(--muted)}.metric strong{display:block;margin:7px 0;font:700 34px/1 Georgia,serif}.metric--warning strong{color:var(--red)}
    .notice{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin:16px 0;padding:20px 22px;border-radius:16px;border-left:5px solid var(--amber)}.notice strong{font-size:17px}.notice p{margin:4px 0 0;color:var(--muted);max-width:900px}.notice code{white-space:nowrap;background:#f2ecdf;padding:8px 10px;border-radius:8px}
    .categories{display:grid;grid-template-columns:repeat(5,1fr);gap:11px;margin:16px 0}.category{text-align:left;border-radius:14px;padding:15px;color:var(--ink);cursor:pointer}.category:hover,.category:focus-visible{border-color:var(--rust);outline:3px solid rgba(185,88,43,.15)}.category span,.category small{display:block}.category span{font-weight:800}.category strong{display:block;margin:7px 0;font:700 29px/1 Georgia,serif;color:var(--red)}.category small{color:var(--muted)}
    .panel{overflow:hidden;border-radius:18px}.toolbar{display:grid;grid-template-columns:1.5fr .8fr .8fr auto;gap:12px;padding:17px;border-bottom:1px solid var(--line)}input,select{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:white;color:var(--ink)}.reset{padding:10px 17px;border:0;border-radius:10px;background:var(--forest);color:white;font-weight:750;cursor:pointer}.result-count{padding:10px 18px;background:#eee7da;color:var(--muted);font-size:13px}.table-wrap{max-height:70vh;overflow:auto}table{width:100%;min-width:1320px;border-collapse:collapse}th{position:sticky;top:0;z-index:2;padding:12px 14px;background:#e8e0d2;text-align:left;font-size:11px;letter-spacing:.09em;text-transform:uppercase}td{padding:14px;border-top:1px solid #e8e1d5;vertical-align:top}td>strong,td>span,td>small,td>a,td>code{display:block}td small{margin-top:4px;color:var(--muted)}td code{font-size:11px;color:#53615d}.missing{display:block;color:var(--red);font-weight:750}
    .action,.freshness{display:inline-block!important;width:max-content;max-width:220px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:850}.action{background:#fef0c7;color:var(--amber)}.action--resolve-correction,.action--refresh-record{background:#fee4e2;color:var(--red)}.action--none{background:#dcfae6;color:var(--green)}.freshness{background:#dcfae6;color:var(--green)}.freshness--due-soon{background:#fef0c7;color:var(--amber)}.freshness--overdue,.freshness--unknown{background:#fee4e2;color:var(--red)}
    .role-label{margin:0 0 2px;color:var(--muted);font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.role-label--second{margin-top:10px}.gates{display:flex;max-width:230px;flex-wrap:wrap;gap:5px}.gate{padding:3px 7px;border-radius:7px;font-size:10px;font-weight:800}.gate--pass{background:#dcfae6;color:var(--green)}.gate--fail{background:#fee4e2;color:var(--red)}
    .history{max-width:340px;margin-top:9px;padding-top:7px;border-top:1px solid #e8e1d5}.history summary{cursor:pointer;font-size:12px;font-weight:800}.history ol{padding-left:18px}.history li{margin:9px 0}.history time,.history li strong,.history li span{display:block;font-size:11px}.history li p{margin:4px 0;color:var(--muted);font-size:11px}.corrections{margin-top:8px;padding:8px;border-radius:8px;background:#fee4e2;color:var(--red);font-size:11px}.corrections p{margin:3px 0}.empty{display:none;padding:42px;text-align:center;color:var(--muted)}.footnote{color:var(--muted);font-size:13px}.footnote strong{color:var(--ink)}[hidden]{display:none!important}
    @media(max-width:1100px){.metrics{grid-template-columns:repeat(3,1fr)}.categories{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){header{padding-top:34px}.metrics{grid-template-columns:repeat(2,1fr)}.categories{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:1fr 1fr}.toolbar input{grid-column:1/-1}.notice{flex-direction:column}}@media(max-width:480px){.metrics,.categories,.toolbar{grid-template-columns:1fr}.toolbar input{grid-column:auto}}@media print{header{padding:24px;background:white;color:var(--ink)}main{margin:0}.toolbar,.categories{display:none}.panel,.metric,.notice{box-shadow:none}.table-wrap{max-height:none;overflow:visible}th{position:static}}
  </style>
</head>
<body>
  <header><div class="wrap"><div class="eyebrow">Editorial control centre · internal</div><h1>Every risky fact needs an owner.</h1><p class="lead">One operational view for freshness, evidence, named accountability, independent approval, publication gates, corrections and record history.</p><div class="stamp">Snapshot ${escapeHtml(report.asOf)} · generated ${escapeHtml(report.generatedAt)} · schema v${report.workflowSchemaVersion}</div></div></header>
  <main class="wrap">
    <section class="metrics" aria-label="Editorial workflow summary">
      <article class="metric metric--warning"><span>Need action</span><strong>${report.summary.needsAction}</strong><small>of ${report.summary.total} controlled records</small></article>
      <article class="metric metric--warning"><span>Ownership gaps</span><strong>${report.summary.ownershipGaps}</strong><small>named owner + independent approver required</small></article>
      <article class="metric"><span>Awaiting decision</span><strong>${report.summary.awaitingApproval}</strong><small>in review or approved</small></article>
      <article class="metric metric--warning"><span>Open corrections</span><strong>${report.summary.openCorrections}</strong><small>open or being investigated</small></article>
      <article class="metric"><span>Explicitly published</span><strong>${report.summary.explicitlyPublished}</strong><small>${report.summary.publishedUnassigned} legacy published records</small></article>
      <article class="metric"><span>Evidence complete</span><strong>${report.summary.evidenceComplete}/${report.summary.total}</strong><small>${report.summary.publishable} pass every publication gate</small></article>
    </section>
    <section class="notice" aria-live="polite"><div><strong>${report.summary.ownershipGaps} records still lack named, independent accountability.</strong><p>The public facts remain evidence-backed, but legacy review evidence is not treated as a dual-control approval. Add real people and record assignments in <code>data/editorial-workflow.json</code>; never use placeholder identities.</p></div><code>npm run editorial:control</code></section>
    <section class="categories" aria-label="Actionable records by category">${categories}</section>
    <section class="panel">
      <div class="toolbar">
        <input id="search" type="search" placeholder="Search fact, country, record, file or owner" aria-label="Search editorial records">
        <select id="action" aria-label="Filter by next action"><option value="">All next actions</option>${actionOptions}</select>
        <select id="category" aria-label="Filter by category"><option value="">All categories</option>${categoryOptions}</select>
        <button class="reset" id="reset" type="button">Reset</button>
      </div>
      <div class="result-count" id="result-count">Showing ${report.summary.total} records</div>
      <div class="table-wrap"><table><thead><tr><th>Next action</th><th>Record</th><th>Accountability</th><th>Freshness</th><th>Publication gates</th><th>Sources & history</th></tr></thead><tbody id="records">${rows}</tbody></table><p class="empty" id="empty">No records match these filters.</p></div>
    </section>
    <p class="footnote"><strong>Publication rule:</strong> a record passes only when its official sources, evidence, freshness, named owner, independent approver, approval decision and correction state all pass. Existing public records without explicit workflow assignments are labelled “published unassigned”; this exposes the governance gap without rewriting history.</p>
  </main>
  <script>
    const rows=[...document.querySelectorAll('#records tr')];const search=document.querySelector('#search');const action=document.querySelector('#action');const category=document.querySelector('#category');const count=document.querySelector('#result-count');const empty=document.querySelector('#empty');function filter(){const q=search.value.trim().toLowerCase();let visible=0;for(const row of rows){const show=(!q||row.dataset.search.includes(q))&&(!action.value||row.dataset.action===action.value)&&(!category.value||row.dataset.category===category.value);row.hidden=!show;if(show)visible+=1}count.textContent='Showing '+visible+' of '+rows.length+' records';empty.style.display=visible?'none':'block'}search.addEventListener('input',filter);action.addEventListener('change',filter);category.addEventListener('change',filter);document.querySelector('#reset').addEventListener('click',()=>{search.value='';action.value='';category.value='';filter();search.focus()});document.querySelectorAll('[data-category-shortcut]').forEach(button=>button.addEventListener('click',()=>{category.value=button.dataset.categoryShortcut;action.value='';filter();document.querySelector('.panel').scrollIntoView({behavior:'smooth'})}));
  </script>
</body></html>`;
}

const asOf = argument('as-of', new Date().toISOString().slice(0, 10));
const outputDir = resolve(process.cwd(), argument('output-dir', '.reports'));
const freshnessReport = buildFreshnessReport({
    countries: loadJson('countries.json'),
    practical: loadJson('practical.json'),
    visaPassport: loadJson('visa-passport.json'),
    countryResources: loadJson('country-resources.json'),
    borders: loadJson('borders.json'),
    parks: loadJson('parks.json'),
    travelAdvisories: loadJson('travel-advisories.json'),
    editorialEvidence: loadJson('editorial-review-evidence.json'),
}, { asOf });
const report = buildEditorialControlReport(freshnessReport, loadJson('editorial-workflow.json'));

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, 'editorial-control-centre.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(outputDir, 'editorial-control-centre.html'), dashboardHtml(report));

console.log(`Editorial control: ${report.summary.needsAction} need action, ${report.summary.ownershipGaps} ownership gaps, ${report.summary.openCorrections} open corrections (${report.summary.total} records).`);
console.log(`Control centre: ${resolve(outputDir, 'editorial-control-centre.html')}`);
