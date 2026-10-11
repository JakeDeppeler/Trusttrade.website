// Trust Trade Pro — the HVAC Designer in the browser. The same five steps as the app (House · Capture · Check · Design ·
// Send) on the app's own engine (engine.wasm, run in a worker): the same loads, zones, ducts, checks and materials.

import { call, latest } from './engine.js';
import * as store from './store.js';
import { Plan, inkImage, zoneColour, ductColour, T } from './plan.js';

// MARK: Helpers

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => (n == null || isNaN(n) ? '—' : Number(n).toFixed(d));
const g = (n) => String(Math.round(n * 10) / 10);                 // %g for kW: 14, 12.5
const uuid = () => crypto.randomUUID().toUpperCase();
const STEPS = [
  { k: 'house', t: 'House' }, { k: 'capture', t: 'Capture' }, { k: 'check', t: 'Check' }, { k: 'design', t: 'Design' }, { k: 'send', t: 'Send' },
];
const ICON = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  aircon: '<rect x="2" y="4" width="20" height="9" rx="2"/><path d="M6 9h12M7.5 16.5c0 2 1.5 2 1.5 4M12 16v4.5M16.5 16.5c0 2-1.5 2-1.5 4"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  back: '<path d="M15 18l-6-6 6-6"/>', check: '<path d="M5 12.5l4.5 4.5L19.5 7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  cursor: '<path d="M5.5 3.5l13 7.5-5.6 1.6-2.4 5.9z"/>', addvent: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  layers: '<path d="M12 3.5l8.5 4.7L12 13 3.5 8.2z"/><path d="M3.5 12.5L12 17.3l8.5-4.8"/>',
  undo: '<path d="M9 14L4.5 9.5 9 5"/><path d="M4.5 9.5H15a5 5 0 010 10h-3"/>', redo: '<path d="M15 14l4.5-4.5L15 5"/><path d="M19.5 9.5H9a5 5 0 000 10h3"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  upload: '<path d="M12 15.5V4M7 8.5l5-4.5 5 4.5M4.5 19.5h15"/>', file: '<path d="M14 3H6.5v18h11V6.5z"/><path d="M14 3v3.5h3.5"/>',
  download: '<path d="M12 4v11.5M7 11l5 4.5 5-4.5M4.5 19.5h15"/>', print: '<path d="M6.5 9V3.5h11V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  chev: '<path d="M9 6l6 6-6 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  rotate: '<path d="M20 12a8 8 0 11-2.3-5.7L20 8"/><path d="M20 3v5h-5"/>', branch: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M6 3.5v12M18 8.5c0 6-12 3-12 7"/>',
  wind: '<path d="M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h7"/>', zones: '<circle cx="8.5" cy="8.5" r="5"/><circle cx="15.5" cy="15.5" r="5"/>',
  house: '<path d="M3.5 11L12 3.5l8.5 7.5M5.5 9.5v10h13v-10"/>', ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  pin: '<path d="M12 21v-7"/><circle cx="12" cy="8" r="5"/>', send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
};
const icon = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

function toast(msg, ms = 3200) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

function ago(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  if (s < 172800) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// MARK: State

const app = {
  options: null,
  jobId: null, project: null, view: null, layout: null, air: null, cards: null, checks: null,
  backdrop: null, backdropFile: null,
  step: 'house', selection: null, closed: new Set(), balanced: true,
  layers: { plan: true, allSizes: false, air: false }, addMode: false, joining: null,
  undo: [], redo: [], designing: false, read: null, jobsTab: 'progress', jobsSearch: '', jobsPick: null,
  plan: null, checkAnswers: null,
};
try { Object.assign(app.layers, JSON.parse(localStorage.getItem('ttpro.layers') || '{}')); } catch (_) {}
const saveLayers = () => { try { localStorage.setItem('ttpro.layers', JSON.stringify(app.layers)); } catch (_) {} };

// MARK: The job and the engine

function summary() {
  const v = app.view, p = app.project;
  return {
    name: v?.title ?? p.name ?? 'Untitled job', customer: p.customer?.name ?? '', suburb: v?.suburb ?? '',
    upTo: v?.upTo ?? null, kw: v?.totals?.unit?.kw ?? null, zones: app.layout?.zones?.filter((z) => z.number !== 0).length ?? null,
    status: p.status ?? 'inProgress', hasDesign: !!p.design,
  };
}

/// The view (loads, rooms, zones), the routed layout and anything the screen shows, for the project as it is.
async function refresh() {
  const p = app.project;
  if (!p) return;
  const viewP = call('view', { project: p });
  const layoutP = p.design ? call('route', { project: p, closed: [...app.closed], balanced: app.balanced }) : Promise.resolve(null);
  const [view, layout] = await Promise.all([viewP, layoutP.catch(() => null)]);
  app.view = view;
  app.layout = layout;
  app.air = layout ? await call('air', { project: p, closed: [...app.closed], balanced: app.balanced }).catch(() => null) : null;
}

/// A changed project: kept (with an undo step for design edits), saved, and the screen redrawn.
async function commit(project, { undoable = false, rerender = true } = {}) {
  if (undoable && app.project) { app.undo.push(app.project); if (app.undo.length > 50) app.undo.shift(); app.redo = []; }
  app.project = project;
  await refresh();
  save();
  if (rerender) render();
}

function save() {
  if (!app.jobId || !app.project) return;
  if (!store.saveJob(app.jobId, app.project, summary())) toast('This browser is out of room to save jobs — delete an old one.');
}

async function edit(op, args = {}, { quiet = false } = {}) {
  try {
    const r = await call('edit', { project: app.project, op, ...args });
    if (r.ok === false) { if (!quiet) toast(editRefusal(op)); return null; }
    await commit(r.project, { undoable: true });
    return r;
  } catch (e) {
    toast(e.message);
    return null;
  }
}
function editRefusal(op) {
  return ({
    dropReturn: 'The return goes in a ceiling — not a wet area, the kitchen or the garage.',
    dropOutlet: 'An outlet goes in a conditioned room.', dropBox: 'A BDO sits over the house.',
    dropOutdoor: 'No outside wall near there.', addOutlet: 'Tap inside a conditioned room.',
    moveOutletToBox: 'That BDO can\'t take it — a BDO takes three legs at most, and a vent stays on its own zone\'s BDOs.',
    joinRooms: 'That room isn\'t on a zone.',
  })[op] ?? 'That didn\'t change anything.';
}

async function openJob(id, step) {
  const p = store.loadJob(id);
  if (!p) { toast('That job couldn\'t be opened.'); location.hash = '#/jobs'; return; }
  if (app.jobId !== id) {
    app.jobId = id; app.project = p; app.undo = []; app.redo = []; app.closed = new Set(); app.selection = null;
    app.read = null; app.checkAnswers = null; app.addMode = false; app.joining = null;
    await loadBackdrop();
    await refresh();
    save();                                           // the jobs list shows it as it is now
  }
  const reach = app.view?.reach ?? 0;
  const want = STEPS.findIndex((s) => s.k === step);
  const up = app.view?.upTo ?? 4;
  app.step = STEPS[want >= 0 ? Math.min(want, reach) : Math.min(up, reach)].k;
  if (app.step === 'design' && !app.project.design && app.view?.planChecked) designNow();
}

async function loadBackdrop() {
  const file = app.project?.backdrop?.file;
  if (!file) { app.backdrop = null; app.backdropFile = null; return; }
  if (app.backdropFile === file && app.backdrop) return;
  const blob = await store.loadImage(file);
  app.backdrop = blob ? await inkImage(blob).catch(() => null) : null;
  app.backdropFile = file;
}

async function designNow(keepOverrides = false) {
  if (app.designing) return;
  app.designing = true;
  render();
  try {
    const { design } = await call('autoDesign', { project: app.project, keepOverrides });
    const before = app.project;
    await commit({ ...app.project, design }, { undoable: !!before.design, rerender: false });
  } catch (e) {
    toast(e.message === 'Nothing to lay out' ? 'None of these rooms takes a vent — check the room types.' : e.message);
  }
  app.designing = false;
  render();
}

// MARK: Routing

async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'job' && parts[1]) {
    await openJob(parts[1], parts[2]);
    if (!app.project) return;
    render();
  } else if (parts[0] === 'settings') {
    app.jobId = null; app.project = null;
    renderSettings();
  } else {
    app.jobId = null; app.project = null;
    renderJobs();
  }
}

function go(step) {
  if (!app.jobId) return;
  const target = '#/job/' + app.jobId + '/' + step;
  if (location.hash === target) { app.step = step; render(); } else location.hash = target;
}

// MARK: Shell

function renderNav(active) {
  $('#nav').innerHTML = `
    <a href="/tools">${icon('grid')}Tools</a>
    <a href="#/jobs" class="${active === 'jobs' ? 'on' : ''}">${icon('aircon')}HVAC Designer</a>
    <a href="#/settings" class="${active === 'settings' ? 'on' : ''}">${icon('gear')}Settings</a>`;
  const b = store.business();
  const initials = (b.name || 'Your business').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  $('#biz').innerHTML = `<div class="logo">${b.logo ? `<img src="${esc(b.logo)}" alt="">` : esc(initials)}</div>
    <div><b>${esc(b.name || 'Your business')}</b><span>${b.name ? 'On your reports' : 'Add it in Settings'}</span></div>`;
}

function renderTop() {
  const v = app.view, p = app.project;
  const reach = v?.reach ?? 0, cur = STEPS.findIndex((s) => s.k === app.step);
  const sub = [p.customer?.name, p.customer?.address].filter(Boolean).join(' · ') || 'No address yet';
  const primary = primaryAction();
  $('#top').innerHTML = `
    <a class="back" href="#/jobs">${icon('back')} Jobs</a>
    <div class="title"><h1>${esc(v?.title ?? 'Job')}</h1><div>${esc(sub)}</div></div>
    <div class="spacer"></div>
    <div class="steps">${STEPS.map((s, i) => `<button data-step="${s.k}" class="${i === cur ? 'cur' : i <= reach ? 'done' : ''}" ${i > reach ? 'disabled' : ''}>
      ${i < cur ? icon('check').replace('<svg', '<svg width="14" height="14"') : `<span class="n">${i + 1}</span>`} ${s.t}</button>`).join('')}</div>
    <div class="primary">${primary ? `<button class="btn" id="primary" ${primary.disabled ? 'disabled' : ''}>${esc(primary.label)}</button>` : ''}</div>`;
  $('#top .steps').onclick = (e) => { const b = e.target.closest('button[data-step]'); if (b && !b.disabled) go(b.dataset.step); };
  if (primary) $('#primary').onclick = primary.run;
}

function primaryAction() {
  const v = app.view, hasRooms = (v?.rooms?.length ?? 0) > 0;
  switch (app.step) {
    case 'house': return { label: hasRooms ? 'Next: Check →' : 'Next: Capture →', run: () => go(hasRooms ? 'check' : 'capture') };
    case 'capture': return { label: 'Check the rooms →', disabled: !hasRooms, run: () => go('check') };
    case 'check': return { label: 'Design the ducts →', disabled: !hasRooms, run: confirmPlan };
    case 'design': return { label: 'Check & send →', disabled: !app.layout?.outlets?.length, run: () => go('send') };
    case 'send': return { label: 'Customer report', disabled: !app.layout?.outlets?.length, run: () => openReport('customer') };
  }
  return null;
}

function render() {
  if (!app.project) return;
  renderNav('jobs');
  renderTop();
  const c = $('#content');
  ({ house: renderHouse, capture: renderCapture, check: renderCheck, design: renderDesign, send: renderSend })[app.step]?.(c);
}

// MARK: Jobs

function renderJobs() {
  renderNav('jobs');
  const all = store.jobs();
  const progress = all.filter((j) => (j.status ?? 'inProgress') === 'inProgress'), quoted = all.filter((j) => (j.status ?? 'inProgress') !== 'inProgress');
  const list = (app.jobsTab === 'progress' ? progress : quoted).filter((j) => {
    const q = app.jobsSearch.trim().toLowerCase();
    return !q || [j.name, j.customer, j.suburb].some((s) => (s || '').toLowerCase().includes(q));
  });
  if (!list.some((j) => j.id === app.jobsPick)) app.jobsPick = list[0]?.id ?? null;
  const pick = list.find((j) => j.id === app.jobsPick);
  $('#top').innerHTML = '';
  const stage = (j) => j.status && j.status !== 'inProgress' ? ({ quoted: 'Quoted', won: 'Won', lost: 'Lost' })[j.status] : STEPS[j.upTo ?? 3]?.t;
  $('#content').innerHTML = `
    <div class="jobs-head">
      <h1>HVAC Designer</h1>
      <div class="seg"><button data-tab="progress" class="${app.jobsTab === 'progress' ? 'on' : ''}">In progress · ${progress.length}</button>
        <button data-tab="quoted" class="${app.jobsTab === 'quoted' ? 'on' : ''}">Quoted · ${quoted.length}</button></div>
      <label class="search">${icon('cursor').replace('<svg', '<svg width="16" height="16" style="display:none"')}<input id="q" placeholder="Job name or suburb" value="${esc(app.jobsSearch)}"></label>
      <div class="spacer" style="flex:1"></div>
      <label class="link" style="cursor:pointer">Open a job file<input type="file" id="jobfile" accept="application/json,.json" hidden></label>
      <button class="btn" id="newjob">${icon('plus').replace('<svg', '<svg width="18" height="18"')} New job</button>
    </div>
    ${all.length === 0 ? `
      <div class="card empty"><h2>Start your first job</h2>
        <p>Upload the builder's plan, and the heat loads, ducts and reports follow.</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">
          <button class="btn" id="newjob2">New job</button><button class="btn2" id="demojob">Try the demo house</button></div></div>` : `
    <div class="jobs-grid">
      <div class="card" style="padding:8px 8px 4px">
        ${list.length ? `<table class="jobs"><thead><tr><th>Job</th><th>Suburb</th><th>Up to</th><th>System</th><th>Updated</th></tr></thead><tbody>
          ${list.map((j) => `<tr class="row ${j.id === app.jobsPick ? 'on' : ''}" data-id="${j.id}">
            <td><b>${esc(j.name)}</b>${j.customer ? `<div class="small muted">${esc(j.customer)}</div>` : ''}</td>
            <td>${esc(j.suburb || '—')}</td><td><span class="tag">${esc(stage(j) ?? '—')}</span></td>
            <td>${j.kw ? `${g(j.kw)} kW${j.zones ? ` · ${j.zones} zone${j.zones === 1 ? '' : 's'}` : ''}` : '—'}</td><td class="muted">${ago(j.updatedAt)}</td></tr>`).join('')}
          </tbody></table>` : `<div class="empty">${app.jobsSearch ? `No jobs match “${esc(app.jobsSearch)}”.` : app.jobsTab === 'progress' ? 'Nothing in progress. Start a new job.' : 'No quotes yet. A job moves here once it\'s marked quoted.'}</div>`}
      </div>
      ${pick ? jobCard(pick) : '<div></div>'}
    </div>`}`;
  const c = $('#content');
  c.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { app.jobsTab = b.dataset.tab; renderJobs(); }));
  $('#q', c)?.addEventListener('input', (e) => { app.jobsSearch = e.target.value; clearTimeout(renderJobs.t); renderJobs.t = setTimeout(() => { renderJobs(); const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 150); });
  c.querySelectorAll('tr.row').forEach((r) => {
    r.onclick = () => { app.jobsPick = r.dataset.id; renderJobs(); };
    r.ondblclick = () => (location.hash = '#/job/' + r.dataset.id);
  });
  $('#newjob', c)?.addEventListener('click', newJobDialog);
  $('#jobfile', c)?.addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) importJobFile(await f.text()); });
  $('#newjob2', c)?.addEventListener('click', newJobDialog);
  $('#demojob', c)?.addEventListener('click', () => createJob({ name: 'Demo house' }, true));
  $('#continue', c)?.addEventListener('click', () => (location.hash = '#/job/' + pick.id));
  $('#dup', c)?.addEventListener('click', () => duplicate(pick.id));
  $('#del', c)?.addEventListener('click', () => confirmDialog(`Delete ${pick.name}?`, 'The rooms, the plan and the duct design for this job are removed from this browser.', 'Delete job', () => { store.deleteJob(pick.id); renderJobs(); }));
  c.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => (location.hash = '#/job/' + pick.id + '/' + b.dataset.open)));
}

function jobCard(j) {
  const p = store.loadJob(j.id);
  const rooms = p?.rooms?.length ?? 0;
  const cust = [p?.customer?.name, p?.customer?.address].filter(Boolean).join(' · ');
  const next = STEPS[j.upTo ?? 3];
  return `<div class="card jobcard">
    <h2>${esc(j.name)}</h2><div class="small muted" style="margin-bottom:10px">${esc(cust || 'No customer yet')}</div>
    <div class="rows">
      <button data-open="house"><div><b>House</b><span>${esc(p?.site ? houseLine(p) : '—')}</span></div>${icon('chev')}</button>
      <button data-open="check"><div><b>Rooms &amp; zones</b><span>${rooms ? `${rooms} rooms${p.planConfirmed ? ' · checked' : ' · not checked yet'}` : 'No rooms yet — upload a plan'}</span></div>${icon('chev')}</button>
      <button data-open="design"><div><b>Duct design</b><span>${p?.design ? `${j.kw ? g(j.kw) + ' kW · ' : ''}${p.design.outlets.length} outlets` : 'After the plan\'s checked'}</span></div>${icon('chev')}</button>
      <button data-open="send"><div><b>Job file</b><span>Report, drawing, materials, install sheet</span></div>${icon('chev')}</button>
    </div>
    <button class="btn" id="continue" style="width:100%;margin-top:14px">Continue: ${esc(next?.t ?? 'Send')}</button>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="link" id="dup">Duplicate job</button><button class="link" id="del" style="color:var(--danger)">Delete job</button></div>
  </div>`;
}

function houseLine(p) {
  const o = app.options, s = p.site;
  const era = o?.eras.find((e) => e.id === (s.eraPref ?? 'from1980'));
  const wall = o?.wallTypes.find((w) => w.id === s.wallType)?.label ?? '';
  const city = o?.cities.find((c) => c.id === s.city)?.label ?? '';
  return [wall, era?.short, s.climateSet === false ? 'climate not set' : city].filter(Boolean).join(', ');
}

function newJobDialog() {
  dialog(`<h2>New job</h2><p class="muted small">The customer goes on their report. You can change any of it later.</p>
    <label class="field"><span>Job name</span><input id="nj-name" placeholder="Smith, Pakenham" autofocus></label>
    <label class="field"><span>Customer</span><input id="nj-cust" placeholder="Customer name"></label>
    <label class="field"><span>Mobile or email</span><input id="nj-contact"></label>
    <label class="field"><span>Address</span><input id="nj-addr" placeholder="12 Smith St, Pakenham VIC 3810"></label>`,
  [{ label: 'Cancel' }, { label: 'Create job', primary: true, run: async (d) => {
    const contact = $('#nj-contact', d).value.trim();
    const isEmail = contact.includes('@');
    await createJob({ name: $('#nj-name', d).value.trim() || null,
      customer: { name: $('#nj-cust', d).value.trim(), phone: isEmail ? '' : contact, email: isEmail ? contact : '', address: $('#nj-addr', d).value.trim() } });
  } }]);
}

async function createJob(args, demo = false) {
  let { project } = await call('newJob', args);
  if (args.customer?.address) {
    const { city } = await call('guessCity', { address: args.customer.address });
    if (city) ({ project } = await call('edit', { project, op: 'setCity', city }));
  }
  if (demo) ({ project } = await call('demo', { project }));
  const id = project.jobId;
  app.jobId = null;
  const v = await call('view', { project });
  store.saveJob(id, project, { name: v.title, customer: project.customer?.name ?? '', suburb: v.suburb, upTo: v.upTo, status: 'inProgress' });
  location.hash = '#/job/' + id + (demo ? '/check' : '/house');
}

/// A job file from Trust Trade Pro (the app's own job JSON): opened here as a new job, its design kept as it is.
async function importJobFile(text) {
  let p;
  try { p = JSON.parse(text); } catch (_) { toast('That isn\'t a job file.'); return; }
  if (!Array.isArray(p?.rooms)) { toast('That isn\'t a Trust Trade Pro job file.'); return; }
  try {
    const v = await call('view', { project: p });       // the engine reads it, or says why not
    p.jobId = uuid();
    if (p.backdrop) p.backdrop = null;                  // the plan image stays on the phone
    store.saveJob(p.jobId, p, { name: v.title, customer: p.customer?.name ?? '', suburb: v.suburb, upTo: v.upTo, status: p.status ?? 'inProgress', hasDesign: !!p.design });
    location.hash = '#/job/' + p.jobId + (p.design ? '/design' : '');
  } catch (e) {
    toast('That job file couldn\'t be read: ' + e.message);
  }
}
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__ttImport = importJobFile;

function duplicate(id) {
  const p = store.loadJob(id);
  if (!p) return;
  const copy = structuredClone(p);
  copy.jobId = uuid();
  copy.name = (p.name || 'Job') + ' (copy)';
  copy.status = null; copy.sentAt = null;
  const j = store.jobs().find((x) => x.id === id);
  store.saveJob(copy.jobId, copy, { ...j, name: copy.name, status: 'inProgress' });
  app.jobsPick = copy.jobId;
  renderJobs();
}

// MARK: Dialogs

function dialog(html, buttons) {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="dialog">${html}<div class="actions">${buttons.map((b, i) => `<button class="${b.primary ? 'btn' : 'btn2'}" data-i="${i}" ${b.danger ? 'style="background:var(--danger);color:#fff;box-shadow:none"' : ''}>${esc(b.label)}</button>`).join('')}</div></div>`;
  document.body.append(o);
  const close = () => o.remove();
  o.onclick = async (e) => {
    if (e.target === o) return close();
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const spec = buttons[+b.dataset.i];
    if (spec.run) { const keep = await spec.run(o); if (keep === true) return; }
    close();
  };
  o.querySelector('[autofocus]')?.focus();
  o.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter' && e.target.tagName === 'INPUT') o.querySelector('.btn')?.click(); });
  return o;
}

function confirmDialog(title, text, label, run) {
  dialog(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>`, [{ label: 'Cancel' }, { label, primary: true, danger: true, run }]);
}

// MARK: House

function renderHouse(c) {
  const p = app.project, s = p.site, o = app.options, v = app.view;
  const era = s.eraPref;
  const row = (title, key, list, value) => `<div class="rowpick"><label>${title}</label><select data-site="${key}">
    ${list.map((it) => `<option value="${it.id}" ${it.id === value ? 'selected' : ''}>${esc(it.label)}</option>`).join('')}</select></div>`;
  const cityKnown = s.climateSet !== false;
  c.innerHTML = `<div class="three">
    <div>
      <div class="card"><span class="eyebrow">Job &amp; customer</span>
        <label class="field"><span>Job name</span><input data-p="name" value="${esc(p.name ?? '')}" placeholder="Smith, Pakenham"></label>
        <label class="field"><span>Customer</span><input data-c="name" value="${esc(p.customer?.name ?? '')}" placeholder="Customer name"></label>
        <label class="field"><span>Mobile or email</span><input data-contact value="${esc([p.customer?.phone, p.customer?.email].filter(Boolean).join(' '))}"></label>
        <label class="field"><span>Address</span><input data-c="address" value="${esc(p.customer?.address ?? '')}" placeholder="Start typing the address"></label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <label class="chip ${cityKnown ? 'cool' : 'warn'}" style="cursor:pointer">${cityKnown ? '' : 'Climate not set · '}<select id="city" style="border:0;background:none;font-weight:700;color:inherit">
            ${o.cities.map((x) => `<option value="${x.id}" ${x.id === s.city ? 'selected' : ''}>${esc(x.label)} climate${cityKnown ? '' : '?'}</option>`).join('')}</select></label>
          <span class="chip">Duct ${esc(v.ductR)}</span>
        </div>
        ${cityKnown ? '' : '<p class="small muted" style="margin:8px 0 0">The climate comes from the address. Pick it here if the address doesn\'t give it.</p>'}
      </div>
      <div class="card"><span class="eyebrow">Site notes</span>
        <textarea data-p="siteNotes" class="text" style="width:100%;min-height:110px;border:0;background:var(--tint);border-radius:12px;padding:10px 12px"
          placeholder="Gate code, dogs, roof access, where the manhole is…">${esc(p.siteNotes ?? '')}</textarea>
        <p class="small muted" style="margin:6px 0 0">For the installer and the install sheet, not the customer's report.</p></div>
    </div>
    <div class="card"><span class="eyebrow">When was it built?</span>
      <div class="pills">${o.eras.map((e) => `<button data-era="${e.id}" class="${e.id === era ? 'on' : ''}">${esc(e.short)}</button>`).join('')}</div>
      <p class="small muted" style="margin:10px 0 6px">${esc(o.eras.find((e) => e.id === (era ?? 'from1980'))?.note ?? '')}${era ? '' : ' Pick the era and the rest is filled in.'}</p>
      ${row('Storeys', 'storeysPref', o.storeys, s.storeysPref ?? 'single')}
      ${row('Walls', 'wallType', o.wallTypes, s.wallType)}
      ${row('Roof', 'roofTypePref', o.roofTypes, s.roofTypePref ?? 'tile')}
      ${row('Roof colour', 'roofColour', o.roofColours, s.roofColour)}
      ${row('Floor', 'floorType', o.floorTypes, s.floorType)}
      ${row('Ceiling insulation', 'ceilingInsulation', o.ceilingInsulation, s.ceilingInsulation)}
      ${row('Windows', 'glazing', o.glazing, s.glazing)}
      ${row('Draughtiness', 'airtightness', o.airtightness, s.airtightness)}
      <p class="small muted" style="margin:8px 0 0">Filled in from the build era. Change anything you can see in the roof space or at the windows.</p>
    </div>
    <div>${v.rooms.length ? `<div class="card"><span class="eyebrow">The house</span>
        <h2>${v.rooms.length} rooms</h2><p class="muted small">${g(v.totals.area)} m² · ${fmt(v.totals.connectedKW, 1)} kW connected${p.planConfirmed ? ' · plan checked' : ''}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn2" data-go="check">Check the rooms</button><button class="btn2" id="replace">Upload a different plan</button></div></div>` : ''}
      ${v.rooms.length ? '' : getHouseIn()}</div>
  </div>`;
  bindHouse(c);
}

function getHouseIn() {
  return `<div class="card"><span class="eyebrow">Get the house in</span>
    <div class="drop" id="drop">${icon('upload')}<h3>Drop the builder's plan here</h3>
      <p class="small muted">A JPEG or PNG of the floor plan (a screenshot of a PDF works). AI reads the rooms, sizes and windows.</p>
      <label class="btn ink" style="margin-top:10px;height:42px">Choose a file<input type="file" id="planfile" accept="image/png,image/jpeg,image/webp" hidden></label></div>
    <p class="small muted" style="text-align:center;margin:12px 0 0">or <button class="link" id="demo" style="padding:0;color:var(--accent-deep)">try the demo house</button></p>
    <p class="small muted" style="margin:14px 0 0">Scanning on site? Open the job in Trust Trade Pro on an iPhone Pro.</p></div>`;
}

function bindHouse(c) {
  const p = () => app.project;
  // Typing saves after a pause; leaving a field saves straight away (so nothing typed is lost to a redraw).
  let pending = null;
  const later = (fn) => { clearTimeout(bindHouse.t); pending = fn; bindHouse.t = setTimeout(flush, 350); };
  const flush = async () => { clearTimeout(bindHouse.t); const fn = pending; pending = null; if (fn) { await fn(); renderTop(); } };
  c.addEventListener('focusout', flush);
  c.querySelectorAll('[data-p]').forEach((el) => el.addEventListener('input', () => later(() => commit({ ...p(), [el.dataset.p]: el.value || null }, { rerender: false }))));
  c.querySelectorAll('[data-c]').forEach((el) => el.addEventListener('input', () => later(() => commit({ ...p(), customer: { name: '', phone: '', email: '', address: '', ...p().customer, [el.dataset.c]: el.value } }, { rerender: false }))));
  c.querySelector('[data-c="address"]')?.addEventListener('change', async (e) => {
    await flush();
    if (p().site.climateSet !== false) return;
    const { city } = await call('guessCity', { address: e.target.value });
    if (city) { await edit('setCity', { city }); toast('Climate set from the address'); }
  });
  c.querySelector('[data-contact]')?.addEventListener('input', (e) => later(() => {
    const v = e.target.value.trim(), isEmail = v.includes('@');
    return commit({ ...p(), customer: { name: '', address: '', ...p().customer, phone: isEmail ? '' : v, email: isEmail ? v : '' } }, { rerender: false });
  }));
  $('#city', c).onchange = (e) => edit('setCity', { city: e.target.value });
  c.querySelectorAll('[data-era]').forEach((b) => (b.onclick = () => edit('setEra', { era: b.dataset.era })));
  c.querySelectorAll('[data-site]').forEach((s) => (s.onchange = () => commit({ ...p(), site: { ...p().site, [s.dataset.site]: s.value } })));
  c.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go)));
  $('#replace', c)?.addEventListener('click', () => pickPlan(true));
  bindUpload(c);
}

function bindUpload(c) {
  const input = $('#planfile', c), drop = $('#drop', c);
  input?.addEventListener('change', () => input.files[0] && startRead(input.files[0]));
  $('#demo', c)?.addEventListener('click', async () => {
    const { project } = await call('demo', { project: app.project });
    app.read = null;
    await commit(project);
    go('check');
  });
  if (!drop) return;
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) startRead(f); });
}

function pickPlan(replacing) {
  const go2 = () => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/png,image/jpeg,image/webp';
    i.onchange = () => i.files[0] && startRead(i.files[0]);
    i.click();
  };
  if (replacing && app.view.rooms.length) {
    confirmDialog(`This job already has ${app.view.rooms.length} rooms`, 'A new plan replaces them, and the plan\'s checked again.', 'Upload a new plan', go2);
  } else go2();
}

// MARK: Capture — reading a plan

const READ_URL = 'https://pvcblfpxgrznzqgxbujy.supabase.co/functions/v1/read-plan-web';
function installId() {
  try {
    let id = localStorage.getItem('tt_dd_install');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) { id = crypto.randomUUID(); localStorage.setItem('tt_dd_install', id); }
    return id;
  } catch (_) { return crypto.randomUUID(); }
}

async function startRead(file) {
  if (!/^image\//.test(file.type)) { toast('Use a JPEG or PNG of the plan (a screenshot of a PDF works).'); return; }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) { toast('That image couldn\'t be opened.'); return; }
  // The plan kept for the job (≤2400 px) and the copy sent to be read (≤1568 px), both JPEG on white.
  const jpeg = async (max, q) => {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k)), x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(bmp, 0, 0, cv.width, cv.height);
    return { blob: await cv.convertToBlob({ type: 'image/jpeg', quality: q }), w: cv.width, h: cv.height };
  };
  const keep = await jpeg(2400, 0.88), send = await jpeg(1568, 0.9);
  const fileName = 'plans/' + uuid() + '.jpg';
  app.read = { status: 'reading', url: URL.createObjectURL(keep.blob), keep, send, fileName, result: null, error: null, north: null };
  go('capture');
  render();
  try {
    const b64 = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1]); r.readAsDataURL(send.blob); });
    const res = await fetch(READ_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-install-id': installId() },
      body: JSON.stringify({ image: b64, media_type: 'image/jpeg' }) });
    let data = {};
    try { data = JSON.parse((await res.text()).trim()); } catch (_) { data = { error: 'no_json' }; }
    if (!res.ok || data.error) throw new Error(({
      forbidden: 'Plan reading works on trusttrade.au.', rate_limited: 'Too many reads just now — give it a minute.',
      daily_limit: 'You\'ve used today\'s free plan reads — try again tomorrow, or get in touch to unlock more.',
      busy: 'Plan reading is busy — try again shortly.', unavailable: 'Plan reading is turned off right now.',
      bad_image: 'That didn\'t look like a plan — try a clearer JPEG or PNG.', refused: 'That image couldn\'t be read.',
      no_json: 'No usable rooms came back from that plan.', truncated: 'That plan was too complex to read in one pass.',
    })[data.error] || ('The plan couldn\'t be read' + (res.status ? ' (' + res.status + ')' : '') + '.'));
    const result = data.result;
    if (!result?.rooms?.length) throw new Error('No rooms came back — is that definitely a floor plan?');
    app.read.result = result;
    app.read.north = result.north;
    await importRead();
  } catch (e) {
    if (app.read) { app.read.status = 'error'; app.read.error = e.message; }
    render();
  }
}

async function importRead(overallMetres) {
  const r = app.read;
  const result = { ...r.result, north: r.north ?? r.result.north };
  try {
    const { project } = await call('importPlan', { project: app.project, result, imageWidth: r.keep.w, imageHeight: r.keep.h, file: r.fileName, overallMetres });
    await store.saveImage(r.fileName, r.keep.blob);
    const old = app.project.backdrop?.file;
    if (old && old !== r.fileName) store.deleteImage(old);
    app.selection = null; app.closed = new Set(); app.checkAnswers = null; app.undo = []; app.redo = [];
    await commit(project, { rerender: false });
    await loadBackdrop();
    r.status = 'done';
  } catch (e) {
    r.status = e.message === 'noScale' ? 'noscale' : 'error';
    r.error = e.message === 'noScale' ? null : e.message;
  }
  render();
}

function renderCapture(c) {
  const r = app.read, v = app.view;
  if (!r && !v.rooms.length) {
    c.innerHTML = `<div style="max-width:560px;margin:20px auto">${getHouseIn()}</div>`;
    bindUpload(c);
    return;
  }
  const steps = r ? [
    { ok: r.status === 'done' || r.status === 'noscale', wait: r.status === 'reading', text: r.status === 'reading' ? 'Reading the rooms off the plan…' : r.result ? `Found ${r.result.rooms.length} rooms` : 'Reading the rooms' },
    { ok: r.status === 'done', wait: r.status === 'reading', text: r.status === 'noscale' ? 'No printed room sizes to scale from' : 'Scale from the printed room sizes' },
  ] : [];
  const north = r?.north ?? 'up';
  c.innerHTML = `<div class="work">
    <div class="stage">
      <div class="bar"><b>${r ? 'The builder\'s plan' : 'The rooms'}</b><div class="spacer" style="flex:1"></div><button class="link" id="another">Use a different plan</button></div>
      <div class="canvas-card" id="cap-stage">${r && r.status !== 'done' ? `<img src="${r.url}" alt="" style="width:100%;height:100%;object-fit:contain;background:#fff">` : '<canvas id="cv"></canvas>'}</div>
    </div>
    <div class="panel">
      ${r ? `<div class="card"><h2>Reading your plan</h2>
        <div class="checklist" style="margin-top:6px">${steps.map((s) => `<div class="item ${s.ok ? 'ok' : s.wait ? 'info' : 'warn'}"><div class="mark">${s.ok ? '✓' : s.wait ? '<div class="spinner" style="width:12px;height:12px;border-width:2px"></div>' : '!'}</div><div><b>${esc(s.text)}</b></div></div>`).join('')}</div>
        ${r.status === 'error' ? `<p style="color:var(--danger);font-weight:600;margin:10px 0 0">${esc(r.error)}</p><div class="actions-row"><button class="btn2" id="again">Try another plan</button><button class="btn2" id="demo2">Try the demo house</button></div>` : ''}
        ${r.status === 'noscale' ? `<p class="small muted" style="margin:10px 0 6px">The plan has no printed room sizes to scale from. How long is the house, end to end?</p>
          <div style="display:flex;gap:8px"><input class="text" id="len" type="number" min="4" max="60" step="0.1" placeholder="Metres, e.g. 18.5"><button class="btn2" id="uselen">Use it</button></div>` : ''}
        ${r.result?.notes ? `<p class="small muted" style="margin:10px 0 0">${esc(r.result.notes)}</p>` : ''}
      </div>` : ''}
      ${r?.result ? `<div class="card"><span class="eyebrow">Where does north point on the plan?</span>
        <div class="seg">${[['up', '↑ Up'], ['right', '→ Right'], ['down', '↓ Down'], ['left', '← Left']].map(([k, l]) => `<button data-north="${k}" class="${north === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="small muted" style="margin:8px 0 0">${r.result.north && r.result.north !== 'unknown' ? 'Read off the plan\'s north arrow. Change it if it\'s wrong.' : 'The plan has no north arrow — pick it so the windows face the right way.'}</p></div>` : ''}
      ${v.rooms.length && (!r || r.status === 'done') ? `<div class="card"><h2>${v.rooms.length} rooms</h2><p class="small muted" style="margin:0 0 8px">${g(v.totals.area)} m² · ${fmt(v.totals.connectedKW, 1)} kW connected</p>
        ${v.rooms.map((x) => `<div class="kv"><span>${esc(x.name)}</span><b>${x.conditioned ? `${fmt(x.area, 1)} m² · ${fmt(x.kw, 1)} kW` : `${fmt(x.area, 1)} m² · not ducted`}</b></div>`).join('')}</div>` : ''}
    </div></div>`;
  $('#another', c).onclick = () => pickPlan(true);
  $('#again', c)?.addEventListener('click', () => pickPlan(false));
  $('#demo2', c)?.addEventListener('click', async () => { const { project } = await call('demo', { project: app.project }); app.read = null; await commit(project); go('check'); });
  $('#uselen', c)?.addEventListener('click', () => { const m = parseFloat($('#len', c).value); if (m >= 4 && m <= 60) importRead(m); else toast('A house between 4 and 60 m long.'); });
  c.querySelectorAll('[data-north]').forEach((b) => (b.onclick = () => { app.read.north = b.dataset.north; importRead(); }));
  const cv = $('#cv', c);
  if (cv) mountPlan(cv, { interactive: false, labels: true, compact: false });
}

// MARK: Check

async function renderCheck(c) {
  const v = app.view;
  if (!v.rooms.length) { c.innerHTML = `<div style="max-width:560px;margin:20px auto">${getHouseIn()}</div>`; bindUpload(c); return; }
  if (!app.checkAnswers) {
    c.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto 12px"></div>Checking the plan…</div>';
    const pc = await call('planCheck', { project: app.project });
    const confirmed = app.project.planConfirmed === true;
    app.checkAnswers = {
      pc, openAreas: confirmed || pc.openAreas.length ? pc.openAreas : pc.suggestedOpenAreas,
      suites: { ...pc.suites }, gapsOn: new Set(pc.gaps.filter((x) => !x.outdoorish && !x.leftOut).map((x) => x.key)),
    };
    app.cards = await call('systemCards', { project: app.project });
  }
  const a = app.checkAnswers, o = app.options, p = app.project;
  const roomName = (id) => v.rooms.find((r) => r.id === id)?.name ?? '?';
  const beds = v.rooms.filter((r) => r.designerType === 'bed');
  const wet = v.rooms.filter((r) => r.type === 'bathroom');
  const inArea = new Map(); a.openAreas.forEach((grp, i) => grp.forEach((id) => inArea.set(id, i)));
  const t = v.totals, cards = app.cards;
  c.innerHTML = `<div class="work" style="grid-template-columns:1fr 400px">
    <div class="stage" style="overflow:auto">
      <div class="card" style="padding:12px 14px 6px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><h2 style="flex:1">Rooms · ${v.rooms.length}</h2><span class="small muted">Tap a name to fix it</span></div>
        <table class="rooms"><thead><tr><th></th><th>Room</th><th>Type</th><th class="num">Area</th><th class="num">Load</th></tr></thead><tbody>
        ${v.rooms.map((r) => `<tr><td><span class="sw" style="background:${r.zone != null ? zoneColour(r.zone) : '#C9C4BA'}"></span></td>
          <td><input class="text" data-name="${r.id}" value="${esc(r.name)}"></td>
          <td><select data-type="${r.id}">${o.roomTypes.map((x) => `<option value="${x.id}" ${x.id === r.type ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></td>
          <td class="num">${fmt(r.area, 1)} m²</td><td class="num">${r.conditioned ? fmt(r.kw, 1) + ' kW' : '—'}</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="card"><h2>Open areas</h2><p class="small muted" style="margin:2px 0 10px">Rooms with no doors between them — say kitchen, dining and family — are heated and cooled as one space, on one zone.</p>
        ${a.openAreas.map((grp, i) => `<div class="kv"><span>${grp.map(roomName).map(esc).join(' + ')}</span><button class="link" data-split="${i}">Split</button></div>`).join('') || '<p class="small muted">No open areas.</p>'}
        <button class="btn2" id="addarea" style="margin-top:8px">${a.openAreas.length ? 'Add another open area' : 'Add an open area'}</button></div>
      ${wet.length && beds.length ? `<div class="card"><h2>Ensuite</h2><p class="small muted" style="margin:2px 0 8px">An ensuite goes on its bedroom's zone.</p>
        ${wet.map((r) => `<div class="kv"><span>${esc(r.name)}</span><select data-suite="${r.id}" class="text" style="width:auto">
          <option value="">Not an ensuite</option>${beds.map((b) => `<option value="${b.id}" ${a.suites[r.id] === b.id ? 'selected' : ''}>Ensuite to ${esc(b.name)}</option>`).join('')}</select></div>`).join('')}</div>` : ''}
    </div>
    <div class="panel">
      <div class="card" style="padding:8px"><div class="canvas-card" style="height:300px;box-shadow:none"><canvas id="cv"></canvas></div>
        <p class="small muted" style="margin:6px 8px">${a.pc.gaps.length ? 'Shaded: floor the plan reading left out between rooms.' : 'The rooms as read off the plan.'}</p></div>
      ${a.pc.gaps.length ? `<div class="card"><h2>Gaps between rooms</h2><p class="small muted" style="margin:2px 0 8px">Floor the plan reading left out. On, it becomes part of the room it opens off.</p>
        ${a.pc.gaps.map((x) => `<label class="kv" style="cursor:pointer"><span><b style="font-weight:700">${x.outdoorish ? 'Outside, by the look of it' : x.joins ? 'Part of the ' + esc(roomName(x.joins)) : 'A hallway of its own'}</b><br><span class="small muted">${fmt(x.area, 1)} m²${x.outdoorish ? ' · runs through to the outside — left out unless you switch it on' : ''}</span></span>
          <input type="checkbox" data-gap="${esc(x.key)}" ${a.gapsOn.has(x.key) ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--ink)"></label>`).join('')}</div>` : ''}
      <div class="card"><h2>Unit size</h2><p class="small muted" style="margin:2px 0 10px">Sized so the whole home can run fully open on a design day. Inverters ramp down to about 5 kW, so a bigger unit still runs one zone.</p>
        ${unitOptions(t, p.site)}</div>
      <div class="card"><h2>Spill</h2>${spillCard(cards, p)}</div>
      <div class="card"><h2>Zoning</h2><p class="small muted" style="margin:2px 0 8px">${esc(o.zonings.find((z) => z.id === (p.site.zoningPref ?? 'perroom'))?.note ?? '')}</p>
        <div class="seg" style="flex-wrap:wrap">${o.zonings.map((z) => `<button data-zoning="${z.id}" class="${z.id === (p.site.zoningPref ?? 'perroom') ? 'on' : ''}">${esc(z.label)}</button>`).join('')}</div></div>
    </div></div>`;
  const plan = mountPlan($('#cv', c), { interactive: false, labels: true, compact: true, gaps: a.pc.gaps.map((x) => ({ ...x, on: a.gapsOn.has(x.key) })) });
  c.querySelectorAll('[data-name]').forEach((inp) => inp.addEventListener('change', () => roomEdit(inp.dataset.name, { name: inp.value })));
  c.querySelectorAll('[data-type]').forEach((sel) => sel.addEventListener('change', () => roomEdit(sel.dataset.type, { type: sel.value })));
  c.querySelectorAll('[data-split]').forEach((b) => (b.onclick = () => { a.openAreas.splice(+b.dataset.split, 1); renderCheck(c); }));
  c.querySelectorAll('[data-suite]').forEach((s) => (s.onchange = () => { if (s.value) a.suites[s.dataset.suite] = s.value; else delete a.suites[s.dataset.suite]; }));
  c.querySelectorAll('[data-gap]').forEach((cb) => (cb.onchange = () => { cb.checked ? a.gapsOn.add(cb.dataset.gap) : a.gapsOn.delete(cb.dataset.gap); plan.set({ gaps: a.pc.gaps.map((x) => ({ ...x, on: a.gapsOn.has(x.key) })) }); }));
  $('#addarea', c).onclick = () => pickOpenArea(c);
  bindUnitOptions(c);
  bindSpill(c);
  c.querySelectorAll('[data-zoning]').forEach((b) => (b.onclick = async () => { await commit({ ...app.project, site: { ...app.project.site, zoningPref: b.dataset.zoning } }, { rerender: false }); app.cards = await call('systemCards', { project: app.project }); render(); }));
}

async function roomEdit(id, change) {
  const r = await call('edit', { project: app.project, op: 'setRoom', room: id, ...change });
  await commit(r.project, { rerender: false });
  if (app.checkAnswers) app.checkAnswers.pc = await call('planCheck', { project: app.project });
  render();
}

function pickOpenArea(c) {
  const open = app.view.rooms.filter((r) => ['kitchen', 'dining', 'family', 'living'].includes(r.type));
  const taken = new Set(app.checkAnswers.openAreas.flat());
  const d = dialog(`<h2>One open area</h2><p class="muted small">Pick the rooms with no doors between them.</p>
    ${open.filter((r) => !taken.has(r.id)).map((r) => `<label class="kv" style="cursor:pointer"><span>${esc(r.name)}</span><input type="checkbox" value="${r.id}" style="width:20px;height:20px;accent-color:var(--ink)"></label>`).join('') || '<p class="muted">No more living rooms to add.</p>'}`,
  [{ label: 'Cancel' }, { label: 'Make it one open area', primary: true, run: (o) => {
    const ids = [...o.querySelectorAll('input:checked')].map((i) => i.value);
    if (ids.length < 2) { toast('Pick two or more rooms'); return true; }
    app.checkAnswers.openAreas.push(ids);
    renderCheck(c);
  } }]);
  return d;
}

function unitOptions(t, site) {
  const opt = (sizing, title, detail, badge) => `<button class="option ${!t.byHand && (site.unitSizingPref ?? 'wholeHome') === sizing ? 'on' : ''}" data-sizing="${sizing}">
    <span class="radio"></span><span><b>${esc(title)}</b>${badge ? ` <span class="tag">${badge}</span>` : ''}<p>${esc(detail)}</p></span></button>`;
  const ch = t.choices;
  let html = '';
  if (ch.wholeHome) html += opt('wholeHome', `${g(ch.wholeHome.kw)} kW · whole home open`, `${fmt(t.wholeHomeKW, 1)} kW with every zone on (${fmt(app.view.coincidence * 100)}% of the ${fmt(t.connectedKW, 1)} kW if every room peaked at once)`, 'RECOMMENDED');
  if (ch.margin && ch.margin.kw !== ch.wholeHome?.kw) html += opt('margin', `${g(ch.margin.kw)} kW · more margin`, 'One size up: the hottest days, bigger windows than the plan shows, a room added later.');
  if (ch.zoned && ch.zoned.kw !== ch.wholeHome?.kw) html += opt('zoned', `${g(ch.zoned.kw)} kW · zoned use only`, `${fmt(t.designKW, 1)} kW: never every zone on at once (${(app.options.zonings.find((z) => z.id === (site.zoningPref ?? 'perroom'))?.label ?? '').toLowerCase()} zoning, ${fmt(t.diversity * 100)}% diversity).`);
  html += `<label class="rowpick" style="border-top:0"><label>${t.byHand ? `Picked by hand: ${g(t.unit?.kw ?? 0)} kW` : 'Pick another size…'}</label>
    <select id="unitkw"><option value="">${t.byHand ? 'Back to the recommended' : 'Choose…'}</option>${app.options.units.map((u) => `<option value="${u.kw}" ${t.byHand && t.unit?.kw === u.kw ? 'selected' : ''}>${esc(u.label)}</option>`).join('')}</select></label>
    <span class="eyebrow" style="display:block;margin-top:6px">Power supply</span>
    <div class="seg"><button data-phase="0" class="${site.threePhasePref ? '' : 'on'}">Single phase</button><button data-phase="1" class="${site.threePhasePref ? 'on' : ''}">Three phase</button></div>
    <p class="small muted" style="margin:6px 0 0">Most homes are single phase. Pick three phase only if the switchboard has it.</p>`;
  return html;
}
function bindUnitOptions(c) {
  const set = (site) => commit({ ...app.project, site: { ...app.project.site, ...site } });
  c.querySelectorAll('[data-sizing]').forEach((b) => (b.onclick = () => set({ unitSizingPref: b.dataset.sizing, unitKWPref: null })));
  $('#unitkw', c)?.addEventListener('change', (e) => set({ unitKWPref: e.target.value ? parseFloat(e.target.value) : null }));
  c.querySelectorAll('[data-phase]').forEach((b) => (b.onclick = () => set({ threePhasePref: b.dataset.phase === '1' ? true : null })));
}

function spillCard(s, p) {
  if (!s) return '';
  if (s.oneZone) return '<p class="small muted">One zone: the whole house is always on, so there\'s no spill to fit.</p>';
  if (!s.needsSpill) return `<p class="small muted">The constant zone is always on and takes the spare air: nothing more to fit (the fan won't go under ~${fmt(s.floorLps)} L/s).</p>`;
  const name = (z) => s.zones.find((x) => x.zone === z)?.name ?? 'Zone ' + z;
  const lps = (z) => s.zones.find((x) => x.zone === z)?.lps ?? 0;
  let h = `<p class="small muted" style="margin:2px 0 10px">With only a zone or two on, the fan can't slow below about ${fmt(s.floorLps)} L/s: the spare air goes to the spill. Set it on the zone controller.</p>`;
  if (s.common != null) h += `<button class="option ${s.current === s.common ? 'on' : ''}" data-spill-zone="${s.common}"><span class="radio"></span><span><b>${esc(name(s.common))} · common area</b> <span class="tag">RECOMMENDED</span><p>Zone ${s.common} opens when too few zones are on (${fmt(lps(s.common))} L/s).</p></span></button>`;
  h += `<button class="option ${s.outlet ? 'on' : ''}" data-spill-outlet><span class="radio"></span><span><b>Spill outlet in the hallway</b>${s.common == null ? ' <span class="tag">RECOMMENDED</span>' : ''}<p>A vent of its own on a spill damper, by the return — for a house with no common area to spill into.</p></span></button>`;
  const others = s.zones.filter((z) => z.zone !== s.common);
  if (others.length) h += `<label class="rowpick" style="border-top:0"><label>${s.current != null && s.current !== s.common ? 'Spill zone: ' + esc(name(s.current)) : 'Another zone…'}</label>
    <select id="spillzone"><option value="">Choose…</option>${others.map((z) => `<option value="${z.zone}" ${s.current === z.zone ? 'selected' : ''}>Zone ${z.zone} · ${esc(z.name)} · ${fmt(z.lps)} L/s</option>`).join('')}</select></label>`;
  if (s.tooSmall) h += '<p style="color:var(--danger);font-weight:600;font-size:12.5px;margin:6px 0 0">That zone\'s too small to take it all — pick a bigger one or the spill outlet.</p>';
  return h;
}
function bindSpill(c) {
  const pickZone = async (z) => {
    // The zone by its biggest room, so it holds if the zones are renumbered.
    const rooms = app.view.rooms.filter((r) => r.zone === z && r.conditioned).sort((a, b) => b.area - a.area);
    await spillTo({ kind: 'zone', room: rooms[0]?.id });
  };
  c.querySelectorAll('[data-spill-zone]').forEach((b) => (b.onclick = () => pickZone(+b.dataset.spillZone)));
  $('[data-spill-outlet]', c)?.addEventListener('click', () => spillTo({ kind: 'outlet' }));
  $('#spillzone', c)?.addEventListener('change', (e) => e.target.value && pickZone(+e.target.value));
}
async function spillTo(spill) {
  const r = await call('edit', { project: app.project, op: 'setSpill', spill });
  await commit(r.project, { undoable: !!app.project.design, rerender: false });
  app.cards = await call('systemCards', { project: app.project });
  render();
}

async function confirmPlan() {
  const a = app.checkAnswers;
  if (!a) { go('design'); return; }
  const suites = {};
  for (const [k, v] of Object.entries(a.suites)) if (v) suites[k] = v;
  const { project } = await call('confirmPlan', { project: app.project, openAreas: a.openAreas, suites, gaps: [...a.gapsOn] });
  app.checkAnswers = null;
  // Rooms changed: the design is made again (the app designs once the plan's checked).
  const roomsChanged = JSON.stringify(project.rooms) !== JSON.stringify(app.project.rooms);
  await commit(roomsChanged ? { ...project, design: null } : project, { rerender: false });
  go('design');
  if (!app.project.design) designNow(true);
}

// MARK: Design

function mountPlan(cv, opts) {
  const { handlers, layout, ...rest } = opts;
  const plan = new Plan(cv, handlers ?? {});
  plan.set({
    project: app.project, view: app.view, layout: layout === false ? null : app.layout, air: app.air, backdrop: app.backdrop,
    showPlan: app.layers.plan, allSizes: app.layers.allSizes, showAir: false, selection: null, ...rest,
  });
  return plan;
}

let liveRoute = latest();

function renderDesign(c) {
  const l = app.layout, v = app.view, p = app.project;
  if (!v.planChecked && !p.design) {
    c.innerHTML = `<div class="card empty" style="max-width:560px;margin:20px auto"><h2>Check the plan first</h2><p>The ducts are laid out once the rooms, open areas and ensuite are checked.</p><button class="btn" data-go="check" style="margin-top:12px">Check the plan</button></div>`;
    c.querySelector('[data-go]').onclick = () => go('check');
    return;
  }
  const bags = (l?.flex ?? []).reduce((s, f) => s + f.bags, 0);
  const zones = (l?.zones ?? []).filter((z) => z.number !== 0).length;
  c.innerHTML = `<div class="work with-rail">
    <div class="rail">
      <button id="t-select" class="${app.addMode ? '' : 'on'}">${icon('cursor')}<span class="tip">Select and drag</span></button>
      <button id="t-add" class="${app.addMode ? 'on' : ''}">${icon('addvent')}<span class="tip">${app.addMode ? 'Done adding outlets' : 'Add an outlet'}</span></button>
      <button id="t-layers">${icon('layers')}<span class="tip">Layers</span></button>
      <button id="t-undo" ${app.undo.length ? '' : 'disabled'}>${icon('undo')}<span class="tip">Undo</span></button>
      <button id="t-redo" ${app.redo.length ? '' : 'disabled'}>${icon('redo')}<span class="tip">Redo</span></button>
      <button id="t-fit">${icon('fit')}<span class="tip">Fit the plan</span></button>
    </div>
    <div class="stage">
      <div class="bar">
        <div class="stats"><div><b>${v.totals.unit ? g(v.totals.unit.kw) + ' kW' : '—'}</b><span>unit</span></div><div><b>${zones || '—'}</b><span>zones</span></div>
          <div><b>${l ? l.outlets.length : '—'}</b><span>outlets</span></div><div><b>${l ? bags : '—'}</b><span>flex bags</span></div></div>
        <div class="spacer" style="flex:1"></div>
        <div class="seg"><button data-mode="plan" class="${app.layers.air ? '' : 'on'}">Plan</button><button data-mode="air" class="${app.layers.air ? 'on' : ''}">Air</button></div>
      </div>
      <div class="canvas-card"><canvas id="cv"></canvas>
        <div class="north">${'<svg width="14" height="16" viewBox="0 0 14 16"><path d="M7 0l6 16-6-4-6 4z" fill="#E0342F"/></svg>'}<div>N</div></div>
        ${app.designing ? '<div class="busy"><div><div class="spinner"></div>Designing the ducts…</div></div>' : ''}
      </div>
      <div class="hint">${app.joining ? `Tap the room to join ${esc(v.rooms.find((r) => r.id === app.joining)?.name ?? '')} with. <button class="link" id="cancel-join">Cancel</button>`
        : app.addMode ? 'Tap inside a room to drop an outlet.' : 'Drag a vent, a BDO, the fan coil or the return and the ducts re-route as you go. Tap a room, vent or duct to see it on the right.'}</div>
    </div>
    <div class="panel" id="insp"></div>
  </div>`;
  const plan = mountPlan($('#cv', c), {
    selection: app.selection, showAir: app.layers.air, addMode: app.addMode, interactive: true, labels: true, compact: true,
    handlers: {
      select: (item) => select(item),
      add: (pos) => addVent(pos),
      dragMove: (item, pos) => dragMove(item, pos),
      drop: (item, pos) => drop(item, pos),
    },
  });
  app.plan = plan;
  renderInspector();
  $('#t-select', c).onclick = () => { app.addMode = false; render(); };
  $('#t-add', c).onclick = () => { app.addMode = !app.addMode; if (app.addMode) app.selection = null; render(); };
  $('#t-undo', c).onclick = undo;
  $('#t-redo', c).onclick = redo;
  $('#t-fit', c).onclick = () => plan.fit();
  $('#t-layers', c).onclick = (e) => layersMenu(e.currentTarget);
  $('#cancel-join', c)?.addEventListener('click', () => { app.joining = null; render(); });
  c.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = async () => {
    app.layers.air = b.dataset.mode === 'air'; saveLayers();
    if (app.layers.air && !app.air && app.layout) app.air = await call('air', { project: app.project, closed: [...app.closed], balanced: app.balanced });
    render();
  }));
}

function layersMenu(anchor) {
  document.querySelector('.menu')?.remove();
  const m = document.createElement('div');
  m.className = 'menu';
  const r = anchor.getBoundingClientRect();
  m.style.left = r.right + 8 + 'px'; m.style.top = r.top + 'px'; m.style.position = 'fixed';
  m.innerHTML = `${app.project.backdrop ? `<label><input type="checkbox" data-l="plan" ${app.layers.plan ? 'checked' : ''}> Plan drawing</label>` : ''}
    <label><input type="checkbox" data-l="allSizes" ${app.layers.allSizes ? 'checked' : ''}> All duct sizes</label>
    <label><input type="checkbox" data-l="air" ${app.layers.air ? 'checked' : ''}> Airflow</label>`;
  document.body.append(m);
  m.onchange = async (e) => {
    const k = e.target.dataset.l;
    app.layers[k] = e.target.checked; saveLayers();
    if (k === 'air' && app.layers.air && !app.air) app.air = await call('air', { project: app.project, closed: [...app.closed], balanced: app.balanced });
    app.plan?.set({ showPlan: app.layers.plan, allSizes: app.layers.allSizes, showAir: app.layers.air, air: app.air });
  };
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off); render(); } }), 0);
}

function select(item) {
  if (app.joining && item?.kind === 'room') {
    const a = app.joining;
    app.joining = null;
    if (item.id !== a) edit('joinRooms', { a, b: item.id }).then((r) => r && toast('Joined — one zone and one BDO between them'));
    else render();
    return;
  }
  app.selection = item;
  app.plan?.set({ selection: item });
  renderInspector();
}

async function addVent(pos) {
  const r = await edit('addOutlet', { pos });
  if (r?.id) { app.selection = { kind: 'outlet', id: r.id }; render(); }
}

/// While dragging: the design as if dropped here, routed (the quick route for the fan coil), drawn as it comes back.
function dragMove(item, pos) {
  const d = structuredClone(app.project.design);
  if (!d) return;
  if (item.kind === 'unit') d.unit = pos;
  else if (item.kind === 'ret') d.returnGrille = pos;
  else if (item.kind === 'outdoor') d.outdoor = pos;
  else if (item.kind === 'box') d.boxPins = { ...(d.boxPins ?? {}), [item.id]: pos };
  else if (item.kind === 'outlet') { const o = d.outlets.find((x) => x.id === item.id); if (o) o.pos = pos; }
  else return;
  liveRoute('route', { project: { ...app.project, design: d }, closed: [...app.closed], balanced: app.balanced, fast: item.kind === 'unit' },
    (layout) => { if (app.plan?.drag?.active) app.plan.set({ layout }); });
}

async function drop(item, pos) {
  const ops = { unit: ['dropUnit', {}], ret: ['dropReturn', {}], outdoor: ['dropOutdoor', {}], box: ['dropBox', { bid: item.id }], outlet: ['dropOutlet', { id: item.id }] };
  const op = ops[item.kind];
  if (!op) return;
  const r = await edit(op[0], { ...op[1], pos });
  if (!r) app.plan?.set({ layout: app.layout });            // didn't take: back where it was
}

async function undo() {
  if (!app.undo.length) return;
  app.redo.push(app.project);
  app.project = app.undo.pop();
  await refresh(); save(); render();
}
async function redo() {
  if (!app.redo.length) return;
  app.undo.push(app.project);
  app.project = app.redo.pop();
  await refresh(); save(); render();
}

function renderInspector() {
  const el = $('#insp');
  if (!el) return;
  const s = app.selection, l = app.layout, v = app.view, p = app.project;
  const room = (id) => v.rooms.find((r) => r.id === id);
  const close = `<button class="iconbtn close" id="insp-close">${icon('x')}</button>`;
  let html = '';
  if (s?.kind === 'room' && room(s.id)) {
    const r = room(s.id);
    const mates = v.rooms.filter((m) => m.id !== r.id && m.conditioned && r.zone != null && m.zone === r.zone);
    const byHand = p.design?.zoneOverrides ?? {};
    const joined = byHand[r.id] != null || mates.some((m) => byHand[m.id] != null);
    const outs = (l?.outlets ?? []).filter((o) => o.roomId === r.id && !o.spill);
    const gets = outs.reduce((sum, o) => sum + o.lps, 0);
    const share = r.lps > 0 ? gets / r.lps : 0;
    html = `<div class="card"><div class="insp-head"><h2>${esc(r.name)}</h2>${close}</div>
      <div class="insp-sub">${fmt(r.area, 1)} m² · ${r.windows.length} window${r.windows.length === 1 ? '' : 's'} · ${r.zone === 0 ? 'constant, no damper' : r.zone != null ? 'zone ' + r.zone : 'no zone'}${mates.length ? ' with ' + mates.map((m) => esc(m.name)).join(', ') : ''}</div>
      <div class="needs"><div><span>Needs</span><b>${fmt(r.kw, 1)} kW</b><small>${fmt(r.lps)} L/s</small></div>
        <div class="${share >= 0.85 ? 'good' : ''}"><span>Gets, ${app.balanced ? 'balanced' : 'as installed'}</span><b>${fmt(gets)} L/s</b><small>${outs.length ? fmt(share * 100) + '%' : 'no vents'}</small></div></div>
      ${outs.map((o) => { const a = app.air?.outlets.find((x) => x.id === o.id); return `<div class="kv"><span>Vent Ø${o.sizeMM}</span><b>${fmt(o.lps)} L/s${a ? ` · ${fmt(o.dbA)} dB(A)` : ''}</b></div>`; }).join('')}
      <details style="margin-top:8px"><summary class="small muted" style="cursor:pointer">How the load's worked out</summary>${r.factors.map(([k, val]) => `<div class="kv small"><span>${esc(k)}</span><b>${esc(val)}</b></div>`).join('')}</details>
      <div class="actions-row">${joined && mates.length ? '<button class="btn2" id="unjoin">Unjoin</button>' : `<button class="btn2 soft" id="join">${icon('link').replace('<svg', '<svg width="16" height="16"')} Join with another room</button>`}
        <button class="btn2" id="addhere">${icon('plus').replace('<svg', '<svg width="16" height="16"')} Add a vent</button></div></div>`;
  } else if (s?.kind === 'outlet' && l?.outlets.find((o) => o.id === s.id)) {
    const o = l.outlets.find((x) => x.id === s.id), r = room(o.roomId), a = app.air?.outlets.find((x) => x.id === o.id);
    const run = l.runs.find((x) => x.outlet === o.id);
    const auto = run?.autoMM ?? o.sizeMM;
    const targets = (o.moveTargets ?? []).map((bid) => l.boxes.find((b) => b.bid === bid)).filter(Boolean);
    html = `<div class="card"><div class="insp-head"><h2>${esc(r?.name ?? 'Outlet')}</h2>${close}</div>
      <div class="insp-sub">${o.open ? `${fmt(o.lps)} L/s · ${fmt(o.dbA)} dB(A)${a ? ` · throws ${fmt(a.throwM, 1)} m` : ''}${o.overridden ? ' · size set' : ''}` : `Zone shut · sized for ${fmt(o.designLps)} L/s`}</div>
      <span class="eyebrow">Vent size</span>
      <div class="sizes"><button data-vsize="0" class="${o.overridden ? '' : 'on'}">Auto (Ø${auto})</button>${app.options.ventSizes.map((mm) => `<button data-vsize="${mm}" class="${o.overridden && o.sizeMM === mm ? 'on' : ''}">Ø${mm}</button>`).join('')}</div>
      ${a ? `<div class="kv"><span>Throw</span><b>${fmt(a.ratio, 1)}× the walls · ${esc(a.coverage === 'good' ? 'mixes well' : a.coverage === 'short' ? 'falls short' : 'strong')}</b></div>
        <div class="kv"><span>Noise</span><b>NC ${fmt(a.nc)} · ${esc(a.ncWord)}</b></div><div class="kv"><span>Neck speed</span><b>${fmt(a.faceVelocity, 1)} m/s</b></div>` : ''}
      ${targets.length ? `<label class="rowpick"><label>Put this vent on another BDO</label><select id="movebox"><option value="">Choose…</option>${targets.map((b) => `<option value="${esc(b.bid)}">BDO with ${esc(feeds(b))}</option>`).join('')}</select></label>` : ''}
      <div class="actions-row"><button class="btn2 danger" id="delvent">${icon('trash').replace('<svg', '<svg width="16" height="16"')} Take this vent out</button></div></div>`;
  } else if (s?.kind === 'box' && l?.boxes.find((b) => b.bid === s.id)) {
    const b = l.boxes.find((x) => x.bid === s.id), feed = [...l.runs].reverse().find((r) => r.keyBox === b.bid);
    html = `<div class="card"><div class="insp-head"><h2>BDO · ${b.branches}-way · Ø${b.inletMM} in</h2>${close}</div>
      <div class="insp-sub">Feeds ${esc(feeds(b))}${feed?.manual ? ' · feed sized by hand' : ''}${b.pinned ? ' · moved by hand' : ' · drag to move'}</div>
      ${feed ? feedSizes(b, feed) : ''}
      ${b.pinned ? '<div class="actions-row"><button class="btn2" id="unpin">Put the BDO back where Auto-design had it</button></div>' : ''}</div>`;
  } else if (s?.kind === 'feed' && l?.runs.some((r) => r.keyBox === s.id)) {
    const runs = l.runs.filter((r) => r.keyBox === s.id), r = runs[runs.length - 1], b = l.boxes.find((x) => x.bid === s.id);
    const len = runs.reduce((sum, x) => sum + x.length, 0);
    html = `<div class="card"><div class="insp-head"><h2>Flex to the BDO · Ø${r.sizeMM}</h2>${close}</div>
      <div class="insp-sub">${fmt(r.designLps)} L/s · ${fmt(velocity(r.designLps, r.sizeMM), 1)} m/s · ${fmt(len, 1)} m${b ? ` · into a ${b.branches}-way, ${esc(legList(b))}` : ''}${r.manual ? ' · size set' : ''}</div>
      ${b ? feedSizes(b, r) : ''}</div>`;
  } else if (s?.kind === 'unit' && l) {
    const u = v.totals.unit;
    html = `<div class="card"><div class="insp-head"><h2>Fan coil</h2>${close}</div>
      <div class="insp-sub">${u ? `${g(u.kw)} kW, ${fmt(u.lps)} L/s fan` : '—'} · ${fmt(l.totalLps)} L/s now · drag to move</div>
      <div class="actions-row"><button class="btn2" id="rotate">${icon('rotate').replace('<svg', '<svg width="16" height="16"')} Turn it 90°</button></div></div>`;
  } else if (s?.kind === 'ret' && l) {
    html = `<div class="card"><div class="insp-head"><h2>Return air grille ${l.returnGrilleSize[0]} × ${l.returnGrilleSize[1]}</h2>${close}</div>
      <div class="insp-sub">${fmt(l.fanLps)} L/s at under 2 m/s · filter box · Ø${l.returnMM} flex to the fan coil · drag to move</div></div>`;
  } else if (s?.kind === 'outdoor' && l) {
    const moved = p.design?.outdoor != null;
    html = `<div class="card"><div class="insp-head"><h2>Outdoor unit</h2>${close}</div>
      <div class="insp-sub">Refrigerant pair about ${fmt(Math.ceil(l.pipeRun))} m to the fan coil · ${moved ? 'moved by hand' : 'on the wall nearest the fan coil · drag it along the outside walls'}</div>
      ${moved ? '<div class="actions-row"><button class="btn2" id="outback">Put it back on the wall nearest the fan coil</button></div>' : ''}</div>`;
  } else {
    app.selection = null;
    html = designSummary();
  }
  el.innerHTML = html;
  bindInspector(el);
}

function velocity(lps, mm) { return lps / 1000 / (Math.PI * (mm / 2000) ** 2); }
function legList(b) {
  const sizes = b.legMM ?? [];
  if (sizes.length && sizes.every((x) => x === sizes[0])) return `${sizes.length} × Ø${sizes[0]}`;
  return sizes.map((x) => 'Ø' + x).join(' + ');
}
function feeds(b) {
  const l = app.layout, v = app.view, counts = new Map();
  for (const id of b.outlets) {
    const o = l.outlets.find((x) => x.id === id), n = v.rooms.find((r) => r.id === o?.roomId)?.name;
    if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  const parts = [...counts].map(([n, k]) => (k > 1 ? `${n} ×${k}` : n));
  const sub = b.branches - b.outlets.length;
  if (sub > 0) parts.push(sub === 1 ? 'another BDO' : `${sub} more BDOs`);
  return parts.length ? parts.join(', ') : '—';
}
function feedSizes(b, r) {
  return `<span class="eyebrow">Flex into the BDO</span><div class="sizes"><button data-fsize="0" data-bid="${esc(b.bid)}" class="${r.manual ? '' : 'on'}">Auto (Ø${r.autoMM})</button>
    ${app.options.ductSizes.filter((mm) => mm <= 450).map((mm) => `<button data-fsize="${mm}" data-bid="${esc(b.bid)}" class="${r.manual && r.sizeMM === mm ? 'on' : ''}">Ø${mm}</button>`).join('')}</div>`;
}

function designSummary() {
  const l = app.layout, v = app.view, p = app.project;
  if (!l) return `<div class="card"><h2>Duct design</h2><p class="muted small">${app.designing ? 'Designing the ducts…' : 'No outlets yet.'}</p>${app.designing ? '' : '<button class="btn" id="redesign">Auto-design</button>'}</div>`;
  const zones = l.zones.filter((z) => z.outlets > 0);
  const zoning = p.site.zoningPref ?? 'perroom';
  return `<div class="card"><div style="display:flex;align-items:center"><h2 style="flex:1">Zones</h2>${app.closed.size ? '<button class="link" id="openall">Open every zone</button>' : ''}</div>
      <p class="small muted" style="margin:2px 0 6px">Tap a zone to shut or open it</p>
      ${zones.map((z) => `<div class="zone-row ${z.open ? '' : 'shut'}" data-zone="${z.number}"><span class="dot" style="background:${zoneColour(z.number)}"></span><b>${z.number === 0 ? 'Constant · ' + esc(z.name) : esc(z.name)}</b><span>${fmt(z.lps)} L/s</span></div>`).join('')}
      <div class="seg" style="margin-top:10px"><button data-bal="1" class="${app.balanced ? 'on' : ''}">Balanced</button><button data-bal="0" class="${app.balanced ? '' : 'on'}">As installed</button></div></div>
    <div class="card"><h2>System &amp; zoning</h2>
      <div class="rowpick"><label>Zoning</label><select id="zoning">${app.options.zonings.map((z) => `<option value="${z.id}" ${z.id === zoning ? 'selected' : ''}>${esc(z.label)}</option>`).join('')}</select></div>
      <div class="rowpick"><label>Trunks off the plenum</label><select id="takeoffs"><option value="">Auto (2 or 3)</option>${[1, 2, 3].map((n) => `<option value="${n}" ${p.design?.takeoffs === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="rowpick"><label>Air speed</label><select id="velocity">${app.options.velocities.map((x) => `<option value="${x.id}" ${x.id === (p.site.velocityPref ?? 'standard') ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>
      <div class="kv"><span>Fan</span><b>${fmt(l.network.externalPa)} of ${fmt(l.network.ratedEsp)} Pa${l.network.limitedByFan ? ' · can\'t reach its airflow' : ''}</b></div>
      ${(p.design?.boxPins || p.design?.stations) ? '<button class="btn2" id="unhand" style="margin-top:10px">Undo hand-placed BDOs</button>' : ''}</div>
    <div class="card"><h2>Flex to order</h2>
      ${l.flex.map((f) => `<div class="kv"><span><span class="dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${ductColour(f.sizeMM)};margin-right:8px"></span>Ø${f.sizeMM}</span><b>${fmt(f.metres, 1)} m · ${f.bags} bag${f.bags === 1 ? '' : 's'}</b></div>`).join('')}
      <div class="kv"><span><b>Total</b></span><b>${l.flex.reduce((s, f) => s + f.bags, 0)} bags</b></div></div>
    <div style="text-align:center"><button class="link" id="restart">Start the layout again</button></div>`;
}

function bindInspector(el) {
  const s = app.selection;
  $('#insp-close', el)?.addEventListener('click', () => select(null));
  $('#join', el)?.addEventListener('click', () => { app.joining = s.id; app.selection = null; render(); });
  $('#unjoin', el)?.addEventListener('click', () => edit('unjoinRoom', { room: s.id }));
  $('#addhere', el)?.addEventListener('click', () => { app.addMode = true; render(); });
  el.querySelectorAll('[data-vsize]').forEach((b) => (b.onclick = () => edit('setRunSize', { id: s.id, mm: +b.dataset.vsize })));
  el.querySelectorAll('[data-fsize]').forEach((b) => (b.onclick = () => edit('setRunSize', { bid: b.dataset.bid, mm: +b.dataset.fsize })));
  $('#movebox', el)?.addEventListener('change', (e) => e.target.value && edit('moveOutletToBox', { id: s.id, bid: e.target.value }));
  $('#delvent', el)?.addEventListener('click', async () => { const id = s.id; app.selection = null; await edit('removeOutlet', { id }); });
  $('#unpin', el)?.addEventListener('click', () => edit('pinBox', { bid: s.id, pos: null }));
  $('#rotate', el)?.addEventListener('click', () => edit('rotateUnit'));
  $('#outback', el)?.addEventListener('click', () => edit('resetOutdoor'));
  $('#redesign', el)?.addEventListener('click', () => designNow(true));
  $('#restart', el)?.addEventListener('click', () => confirmDialog('Re-run Auto-design?', 'Outlets, fan coil and return go back to the automatic positions. You can undo this.', 'Replace my layout', () => designNow(true)));
  $('#openall', el)?.addEventListener('click', async () => { app.closed = new Set(); await refresh(); render(); });
  el.querySelectorAll('[data-zone]').forEach((r) => (r.onclick = async () => {
    const z = +r.dataset.zone;
    if (z === 0) { toast('The constant zone has no damper — it\'s always on.'); return; }
    app.closed.has(z) ? app.closed.delete(z) : app.closed.add(z);
    await refresh(); render();
  }));
  el.querySelectorAll('[data-bal]').forEach((b) => (b.onclick = async () => { app.balanced = b.dataset.bal === '1'; await refresh(); render(); }));
  $('#zoning', el)?.addEventListener('change', (e) => commit({ ...app.project, site: { ...app.project.site, zoningPref: e.target.value } }, { undoable: true }));
  $('#velocity', el)?.addEventListener('change', (e) => commit({ ...app.project, site: { ...app.project.site, velocityPref: e.target.value } }, { undoable: true }));
  $('#takeoffs', el)?.addEventListener('change', (e) => edit('setTakeoffs', { n: e.target.value ? +e.target.value : null }));
  $('#unhand', el)?.addEventListener('click', () => edit('resetHandBoxes'));
}

// MARK: Send

async function renderSend(c) {
  const l = app.layout;
  if (!l?.outlets?.length) {
    c.innerHTML = '<div class="card empty" style="max-width:560px;margin:20px auto"><h2>Design the ducts first</h2><p>The report, materials and install sheet are made once the ducts are designed.</p></div>';
    return;
  }
  c.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto 12px"></div>Checking the design…</div>';
  const [{ checks }, takeoff] = await Promise.all([call('checks', { project: app.project }), call('takeoff', { project: app.project })]);
  app.checks = checks;
  app.takeoff = takeoff;
  const warn = checks.filter((x) => x.level !== 'ok'), ok = checks.filter((x) => x.level === 'ok');
  const p = app.project, v = app.view;
  c.innerHTML = `<div class="send-grid">
    <div>
      <div class="card"><span class="eyebrow">Must pass before sending</span><div class="checklist">${ok.map(checkItem).join('') || '<p class="small muted">—</p>'}</div></div>
      ${warn.length ? `<div class="card"><span class="eyebrow">${warn.length === 1 ? 'One warning before you send' : warn.length + ' warnings before you send'}</span><div class="checklist">${warn.map(checkItem).join('')}</div>
        <p class="small muted" style="margin:8px 0 0">Amber warnings don't stop you sending.</p></div>` : ''}
    </div>
    <div class="card"><span class="eyebrow">Job file</span>
      <div class="file"><div class="ic">${icon('file')}</div><div><b>Customer report</b><span>Loads, the design and your logo</span></div><div class="go"><button class="btn2 small" data-report="customer">Open</button></div></div>
      <div class="file"><div class="ic">${icon('aircon')}</div><div><b>Duct drawing</b><span>Sizes, zones, dampers</span></div><div class="go"><button class="btn2 small" id="png">PNG</button></div></div>
      <div class="file"><div class="ic">${icon('ruler')}</div><div><b>Materials</b><span>Flex, fittings, return air</span></div><div class="go"><button class="btn2 small" data-report="materials">Print</button><button class="btn2 small" id="csv">CSV</button></div></div>
      <div class="file"><div class="ic">${icon('print')}</div><div><b>Install sheet</b><span>Duct plan, vent settings, zones</span></div><div class="go"><button class="btn2 small" data-report="install">Open</button></div></div>
      <p class="small muted" style="margin:10px 0 0">Each file is made from the design as it is now. Open one and save it as a PDF from the print window.</p>
      <div class="actions-row">${(p.status ?? 'inProgress') === 'inProgress' ? '<button class="btn2" id="quoted">Mark as quoted</button>' : `<span class="chip ok">Quoted</span><button class="link" id="unquote">Back to in progress</button>`}</div>
    </div>
    <div class="card"><span class="eyebrow">Materials</span>
      <table class="mat">${takeoff.groups.map((grp) => `<tr><th colspan="2">${esc(grp.name)}</th></tr>${grp.lines.map((ln) => `<tr><td>${esc(ln.desc)}${ln.note ? `<div class="small muted">${esc(ln.note)}</div>` : ''}</td><td class="qty">${esc(ln.qtyText)} <a href="${esc(ln.url)}" target="_blank" rel="noopener" title="Search Reece">↗</a></td></tr>`).join('')}`).join('')}</table>
      <p class="small muted" style="margin:10px 0 0">A first-pass ordering list from the drawn job — check quantities before you buy. The arrows open a Reece search.</p></div>
  </div>`;
  c.querySelectorAll('[data-report]').forEach((b) => (b.onclick = () => openReport(b.dataset.report)));
  $('#csv', c).onclick = () => download(`${v.title} — materials.csv`, new Blob([takeoff.csv], { type: 'text/csv' }));
  $('#png', c).onclick = drawingPNG;
  $('#quoted', c)?.addEventListener('click', () => commit({ ...p, status: 'quoted' }));
  $('#unquote', c)?.addEventListener('click', () => commit({ ...p, status: null }));
}

function checkItem(x) {
  return `<div class="item ${x.level}"><div class="mark">${x.level === 'ok' ? '✓' : x.level === 'warn' ? '!' : 'i'}</div><div><b>${esc(x.title)}</b><p>${esc(x.detail)}</p></div></div>`;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[\\/:*?"<>|]/g, '-');
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/// The duct drawing as a PNG, the way the plan draws it (no plan image underneath).
async function drawingPNG() {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;left:-9999px;top:0;width:1600px;height:1100px';
  document.body.append(cv);
  const plan = new Plan(cv, {});
  plan.set({ project: app.project, view: app.view, layout: app.layout, showPlan: false, interactive: false, labels: true, compact: false });
  plan.draw();
  const ctx = cv.getContext('2d');
  ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  cv.toBlob((b) => { download(`${app.view.title} — duct drawing.png`, b); cv.remove(); }, 'image/png');
}

// MARK: Reports (printable pages)

function openReport(kind) {
  // A preview over the designer: the report's own page in a frame, printed (or saved as PDF) from there — no pop-up.
  const o = document.createElement('div');
  o.className = 'overlay report-view';
  o.innerHTML = `<div class="report-bar"><b>Building the report…</b><div class="spacer" style="flex:1"></div>
    <button class="btn" id="rp-print" disabled>${icon('print').replace('<svg', '<svg width="18" height="18"')} Print or save as PDF</button>
    <button class="iconbtn" id="rp-close" style="background:#fff">${icon('x')}</button></div><iframe title="Report"></iframe>`;
  document.body.append(o);
  const close = () => o.remove();
  $('#rp-close', o).onclick = close;
  o.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  import('./reports.js').then(async (m) => {
    // Reports are always the design as installed: every zone open, balanced.
    app.designLayout = await call('route', { project: app.project, closed: [], balanced: true });
    const r = await m.build(kind, { app, call, Plan });
    if (r.error) { $('.report-bar b', o).textContent = r.error; return; }
    const frame = $('iframe', o);
    frame.srcdoc = r.html;
    $('.report-bar b', o).textContent = r.title;
    const print = $('#rp-print', o);
    print.disabled = false;
    print.onclick = () => frame.contentWindow.print();
  });
}

// MARK: Settings

function renderSettings() {
  renderNav('settings');
  $('#top').innerHTML = '';
  const b = store.business();
  $('#content').innerHTML = `<div style="max-width:620px">
    <h1 style="font-size:30px;margin:4px 0 16px">Settings</h1>
    <div class="card"><span class="eyebrow">Your business — on every report</span>
      <label class="field"><span>Business name</span><input data-b="name" value="${esc(b.name ?? '')}"></label>
      <label class="field"><span>Your name</span><input data-b="contact" value="${esc(b.contact ?? '')}"></label>
      <label class="field"><span>Phone</span><input data-b="phone" value="${esc(b.phone ?? '')}"></label>
      <label class="field"><span>Email</span><input data-b="email" value="${esc(b.email ?? '')}"></label>
      <label class="field"><span>ABN</span><input data-b="abn" value="${esc(b.abn ?? '')}"></label>
      <label class="field"><span>Licence</span><input data-b="licence" value="${esc(b.licence ?? '')}"></label>
      <div style="display:flex;gap:12px;align-items:center"><div class="logo" style="width:64px;height:64px;border-radius:16px;background:var(--tile);display:grid;place-items:center;overflow:hidden">${b.logo ? `<img src="${esc(b.logo)}" style="width:100%;height:100%;object-fit:contain">` : '<span class="small muted">Logo</span>'}</div>
        <label class="btn2">Choose a logo<input type="file" id="logo" accept="image/png,image/jpeg" hidden></label>${b.logo ? '<button class="link" id="nologo">Remove</button>' : ''}</div>
    </div>
    <p class="small muted">Saved in this browser only.</p></div>`;
  const c = $('#content');
  c.querySelectorAll('[data-b]').forEach((i) => i.addEventListener('input', () => { store.saveBusiness({ ...store.business(), [i.dataset.b]: i.value }); renderNav('settings'); }));
  $('#logo', c).onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 400 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    store.saveBusiness({ ...store.business(), logo: cv.toDataURL('image/png') });
    renderSettings();
  };
  $('#nologo', c)?.addEventListener('click', () => { const x = store.business(); delete x.logo; store.saveBusiness(x); renderSettings(); });
}

// MARK: Boot

(async function boot() {
  try {
    app.options = await call('options');
  } catch (e) {
    $('#content').innerHTML = `<div class="card empty"><h2>The designer couldn't start</h2><p>${esc(e.message)}. Try a current version of Chrome, Safari, Edge or Firefox.</p></div>`;
    return;
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('keydown', (e) => {
    if (app.step !== 'design' || !app.project || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if (e.key === 'Escape') { app.addMode = false; app.joining = null; select(null); render(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && app.selection?.kind === 'outlet') { const id = app.selection.id; app.selection = null; edit('removeOutlet', { id }); }
  });
  route();
})();
