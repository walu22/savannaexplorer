import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildFreshnessReport } from './lib/editorial-freshness.mjs';

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

function statusLabel(record) {
    if (record.status === 'overdue') return `${Math.abs(record.daysUntilDue)} days overdue`;
    if (record.status === 'due-soon') return `Due in ${record.daysUntilDue} days`;
    if (record.status === 'current') return `Current · ${record.daysUntilDue} days left`;
    return 'Review date missing';
}

function sourceLinks(record) {
    if (!record.sourceUrls.length) return '<span class="missing">Missing source</span>';
    return record.sourceUrls.map((url, index) => (
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${index === 0 ? 'Open source' : `Open source ${index + 1}`} ↗</a>`
    )).join('');
}

function reviewEvidence(record) {
    if (!record.review) return '<small class="missing">Evidence not captured</small>';
    return `<details class="review"><summary>${escapeHtml(record.review.outcome)} · ${escapeHtml(record.review.reviewer)}</summary><p>${escapeHtml(record.review.evidence)}</p><small>${escapeHtml(record.review.method)} · ${escapeHtml(record.review.reviewedAt)}</small></details>`;
}

function dashboardHtml(report) {
    const categoryOptions = Object.entries(report.policies)
        .map(([id, policy]) => `<option value="${escapeHtml(id)}">${escapeHtml(policy.label)}</option>`)
        .join('');
    const rows = report.records.map(record => `
        <tr data-status="${record.status}" data-category="${record.category}" data-search="${escapeHtml(`${record.subject} ${record.country} ${record.sourceFile}`.toLowerCase())}">
          <td><span class="status status--${record.status}">${escapeHtml(statusLabel(record))}</span><small>${escapeHtml(record.risk)} risk</small></td>
          <td><strong>${escapeHtml(record.subject)}</strong><small>${escapeHtml(record.detail)}</small></td>
          <td>${escapeHtml(record.country)}</td>
          <td><time datetime="${escapeHtml(record.reviewedOn || '')}">${escapeHtml(record.reviewedOn || '—')}</time><small>Due ${escapeHtml(record.dueOn || '—')}</small></td>
          <td><code>${escapeHtml(record.sourceFile)}</code>${sourceLinks(record)}${reviewEvidence(record)}</td>
        </tr>`).join('');
    const categoryCards = Object.entries(report.summary.categories).map(([id, category]) => `
        <button class="category-card" type="button" data-category-shortcut="${escapeHtml(id)}">
          <span>${escapeHtml(category.label)}</span>
          <strong>${category.overdue}</strong>
          <small>overdue · ${category.dueSoon} due soon · ${category.total} total</small>
        </button>`).join('');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Editorial Freshness | Savanna Explorer</title>
  <style>
    :root{--ink:#18332c;--muted:#62706b;--cream:#f6f1e7;--paper:#fffdf8;--rust:#b9582b;--red:#b42318;--amber:#b54708;--green:#1f7a55;--line:#ded8ca;--shadow:0 18px 45px rgba(24,51,44,.09)}
    *{box-sizing:border-box} body{margin:0;background:var(--cream);color:var(--ink);font:15px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif} a{color:var(--rust)}
    header{background:linear-gradient(135deg,#102f28 0%,#214d3f 60%,#3f654e 100%);color:white;padding:52px 24px 90px}.wrap{width:min(1240px,calc(100% - 32px));margin:auto}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800;color:#e5b27f}h1{font:700 clamp(34px,6vw,68px)/1.02 Georgia,serif;margin:10px 0 16px;max-width:850px}.lead{font-size:18px;max-width:760px;color:#d9e6df;margin:0}.stamp{margin-top:24px;color:#bad0c6;font-size:13px}
    main{margin-top:-48px;padding-bottom:64px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.metric,.panel{background:var(--paper);border:1px solid rgba(24,51,44,.08);border-radius:18px;box-shadow:var(--shadow)}.metric{padding:22px}.metric span,.metric small{display:block;color:var(--muted)}.metric strong{display:block;font:700 38px/1 Georgia,serif;margin:8px 0}.metric--danger strong{color:var(--red)}
    .alert{display:flex;justify-content:space-between;gap:24px;align-items:center;margin:18px 0;padding:20px 24px;border-radius:16px;background:#fff1ed;border:1px solid #f2c7bb}.alert strong{display:block;color:var(--red);font-size:18px}.alert p{margin:3px 0 0;color:#754337}.alert code{white-space:nowrap;background:white;border:1px solid #ecc8bd;padding:9px 12px;border-radius:10px}
    .category-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:18px 0}.category-card{appearance:none;text-align:left;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:16px;cursor:pointer}.category-card:hover,.category-card:focus-visible{border-color:var(--rust);outline:3px solid rgba(185,88,43,.15)}.category-card span,.category-card small{display:block}.category-card span{font-weight:750}.category-card strong{display:block;font:700 30px/1 Georgia,serif;color:var(--red);margin:8px 0}.category-card small{color:var(--muted)}
    .panel{overflow:hidden}.toolbar{display:grid;grid-template-columns:1.3fr .7fr .7fr auto;gap:12px;padding:18px;border-bottom:1px solid var(--line)}input,select,button{font:inherit}input,select{width:100%;border:1px solid var(--line);border-radius:10px;background:white;color:var(--ink);padding:11px 12px}button.reset{border:1px solid var(--ink);border-radius:10px;background:var(--ink);color:white;padding:10px 16px;cursor:pointer}.result-count{padding:10px 18px;background:#f5f0e6;color:var(--muted);font-size:13px}
    .table-wrap{overflow:auto;max-height:68vh}table{width:100%;border-collapse:collapse;min-width:1080px}th{position:sticky;top:0;z-index:1;text-align:left;background:#f0eadf;padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:.08em}td{padding:15px 16px;border-top:1px solid #ebe5da;vertical-align:top}td strong,td small,td a,td .missing{display:block}td small{color:var(--muted);margin-top:4px}td code{display:block;font-size:12px;color:#50605a;margin-bottom:5px}.status{display:inline-block!important;width:max-content;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800}.status--overdue,.status--unknown{background:#fee4e2;color:var(--red)}.status--due-soon{background:#fef0c7;color:var(--amber)}.status--current{background:#dcfae6;color:var(--green)}.missing{color:var(--red);font-weight:700}.review{margin-top:9px;border-top:1px solid #ebe5da;padding-top:7px;max-width:330px}.review summary{cursor:pointer;color:var(--ink);font-size:12px;font-weight:750;text-transform:capitalize}.review p{margin:7px 0;font-size:12px;line-height:1.45}.review small{font-size:11px}[hidden]{display:none!important}.empty{display:none;text-align:center;padding:40px;color:var(--muted)}
    .footnote{margin-top:18px;color:var(--muted);font-size:13px}.footnote strong{color:var(--ink)}
    @media(max-width:850px){header{padding-top:36px}.summary{grid-template-columns:repeat(2,1fr)}.category-grid{grid-template-columns:repeat(2,1fr)}.toolbar{grid-template-columns:1fr 1fr}.toolbar input{grid-column:1/-1}}
    @media(max-width:520px){.summary{grid-template-columns:1fr 1fr}.metric{padding:16px}.metric strong{font-size:30px}.alert{align-items:flex-start;flex-direction:column}.category-grid{grid-template-columns:1fr}.toolbar{grid-template-columns:1fr}.toolbar input{grid-column:auto}}
    @media print{header{padding:24px;background:white;color:var(--ink)}main{margin:0}.toolbar,.category-grid,.reset{display:none}.panel,.metric{box-shadow:none}.table-wrap{max-height:none;overflow:visible}th{position:static}}
  </style>
</head>
<body>
  <header><div class="wrap"><div class="eyebrow">Editorial control plane · internal</div><h1>Freshness before confidence.</h1><p class="lead">A review queue for the high-change facts most likely to affect a traveller's safety, entry, route or budget.</p><div class="stamp">Snapshot date ${escapeHtml(report.asOf)} · generated ${escapeHtml(report.generatedAt)}</div></div></header>
  <main class="wrap">
    <section class="summary" aria-label="Freshness summary">
      <article class="metric metric--danger"><span>Overdue</span><strong>${report.summary.overdue}</strong><small>of ${report.summary.total} tracked records</small></article>
      <article class="metric"><span>Due soon</span><strong>${report.summary.dueSoon}</strong><small>within ${report.dueSoonDays} days</small></article>
      <article class="metric"><span>Current</span><strong>${report.summary.current}</strong><small>inside review policy</small></article>
      <article class="metric"><span>Evidence captured</span><strong>${report.summary.evidenceComplete}/${report.summary.total}</strong><small>${report.summary.sourceLinked}/${report.summary.total} have HTTPS sources</small></article>
    </section>
    <section class="alert" aria-live="polite"><div><strong>${report.summary.criticalOverdue} critical-risk records need review.</strong><p>Old data is not marked current. Update the source file only after checking the linked authority.</p></div><code>npm run editorial:freshness</code></section>
    <section class="category-grid" aria-label="Overdue by category">${categoryCards}</section>
    <section class="panel">
      <div class="toolbar">
        <input id="search" type="search" placeholder="Search fact, country or file" aria-label="Search review queue">
        <select id="status" aria-label="Filter by status"><option value="">All statuses</option><option value="overdue">Overdue</option><option value="due-soon">Due soon</option><option value="current">Current</option><option value="unknown">Unknown</option></select>
        <select id="category" aria-label="Filter by category"><option value="">All categories</option>${categoryOptions}</select>
        <button class="reset" id="reset" type="button">Reset</button>
      </div>
      <div class="result-count" id="result-count">Showing ${report.summary.total} records</div>
      <div class="table-wrap"><table><thead><tr><th>Status</th><th>Fact</th><th>Country</th><th>Review</th><th>Evidence</th></tr></thead><tbody id="records">${rows}</tbody></table><p class="empty" id="empty">No records match these filters.</p></div>
    </section>
    <p class="footnote"><strong>Policy:</strong> month-only review dates are conservatively treated as the final day of that month. Travel-advisory links are checked every 30 days; visa, border, park-fee and emergency data every 90 days. Evidence is complete only when the record has a reviewer, review date, outcome, written finding and valid HTTPS evidence links. Correction ownership, approval states, change history and automated link checks come next.</p>
  </main>
  <script>
    const rows=[...document.querySelectorAll('#records tr')];const search=document.querySelector('#search');const status=document.querySelector('#status');const category=document.querySelector('#category');const count=document.querySelector('#result-count');const empty=document.querySelector('#empty');
    function filter(){const q=search.value.trim().toLowerCase();let visible=0;for(const row of rows){const show=(!q||row.dataset.search.includes(q))&&(!status.value||row.dataset.status===status.value)&&(!category.value||row.dataset.category===category.value);row.hidden=!show;if(show)visible+=1}count.textContent='Showing '+visible+' of '+rows.length+' records';empty.style.display=visible?'none':'block'}
    search.addEventListener('input',filter);status.addEventListener('change',filter);category.addEventListener('change',filter);document.querySelector('#reset').addEventListener('click',()=>{search.value='';status.value='';category.value='';filter();search.focus()});document.querySelectorAll('[data-category-shortcut]').forEach(button=>button.addEventListener('click',()=>{category.value=button.dataset.categoryShortcut;status.value='overdue';filter();document.querySelector('.panel').scrollIntoView({behavior:'smooth'})}));
  </script>
</body></html>`;
}

const asOf = argument('as-of', new Date().toISOString().slice(0, 10));
const outputDir = resolve(process.cwd(), argument('output-dir', '.reports'));
const report = buildFreshnessReport({
    countries: loadJson('countries.json'),
    practical: loadJson('practical.json'),
    visaPassport: loadJson('visa-passport.json'),
    countryResources: loadJson('country-resources.json'),
    borders: loadJson('borders.json'),
    parks: loadJson('parks.json'),
    travelAdvisories: loadJson('travel-advisories.json'),
    editorialEvidence: loadJson('editorial-review-evidence.json'),
}, { asOf });

mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, 'editorial-freshness.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(outputDir, 'editorial-freshness.html'), dashboardHtml(report));

console.log(`Editorial freshness: ${report.summary.overdue} overdue, ${report.summary.dueSoon} due soon, ${report.summary.current} current (${report.summary.total} tracked).`);
console.log(`Dashboard: ${resolve(outputDir, 'editorial-freshness.html')}`);
