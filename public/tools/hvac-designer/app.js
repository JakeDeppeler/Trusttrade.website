// Trust Trade Pro — the HVAC Designer in the browser. The same five steps as the app (House · Capture · Check · Design ·
// Send) on the app's own engine (engine.wasm, run in a worker): the same loads, zones, ducts, checks and materials.

import { call as engineCall, latest } from './engine.js?v=f11c00d-202611241727';
import { jobCalls, isMixed as mixedJob, ductedPart, ductedPartOf, splitSet, withSplitRooms, defaultRange, isDuctedB, activeSys, swapSystems, isVrfB, sharesVrf, pickVrf } from './systems.js?v=f11c00d-202611241727';
import * as store from './store.js?v=f11c00d-202611241727';
import { Plan, inkImage, zoneColour, ductColour, splitColour, T, pointInPolygon, SIDE_STYLES, movesOnly, wheelMoves, ZOOM_MAX } from './plan.js?v=f11c00d-202611241727';
import { RoomEditor, metres, signedArea, onLine } from './roomeditor.js?v=f11c00d-202611241727';

/// Every engine call: a two-system job's go with the part they're about (systems.js).
const call = jobCalls(engineCall);

// MARK: Helpers

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => (n == null || isNaN(n) ? '—' : Number(n).toFixed(d));
const g = (n) => String(Math.round(n * 10) / 10);                 // %g for kW: 14, 12.5
const uuid = () => crypto.randomUUID().toUpperCase();
const STEPS = [
  { k: 'job', t: 'New job' }, { k: 'plan', t: 'Rooms' }, { k: 'equipment', t: 'Equipment' }, { k: 'design', t: 'Air & pipes' }, { k: 'send', t: 'Outputs' },
];
/// The stages (mock v14, chosen 16 Nov 2026): the job, customer and house on one page; the rooms (upload, scale, draw
/// and check them); the equipment (the unit, zoning and spill, or a split's heads); air and pipes (the fan coil, outlets,
/// flex and drain); the outputs. The engine's steps (house, capture, check, design, send) map onto them, and the old
/// step names in saved links still land.
const STEP_ALIAS = { house: 'job', capture: 'plan', check: 'plan', rooms: 'plan', air: 'design', outputs: 'send' };
const normStep = (k) => STEP_ALIAS[k] ?? k;
const fromEngineStep = (n) => [0, 1, 1, 3, 4][n ?? 4] ?? 4;
const ICON = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  aircon: '<rect x="2" y="4" width="20" height="9" rx="2"/><path d="M6 9h12M7.5 16.5c0 2 1.5 2 1.5 4M12 16v4.5M16.5 16.5c0 2-1.5 2-1.5 4"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  back: '<path d="M15 18l-6-6 6-6"/>', check: '<path d="M5 12.5l4.5 4.5L19.5 7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  cursor: '<path d="M5.5 3.5l13 7.5-5.6 1.6-2.4 5.9z"/>', addvent: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  pen: '<path d="M4 20l1.2-4.2L15.6 5.4a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8.2 18.8z"/><path d="M13.5 7.5l3 3M4 20h6"/>',
  bdo: '<rect x="7" y="9" width="10" height="6" rx="1.5"/><path d="M12 3v6M7 12H3M17 12h4M12 15v6"/>',
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
  minus: '<path d="M5 12h14"/>',
  window: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 4v16M4 12h16"/>',
  dropper: '<circle cx="12" cy="5.5" r="2.5"/><path d="M12 8v11M8 15.5l4 4 4-4"/>',
  drop: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 01-12 0c0-3.3 3-6.5 6-10.5z"/>',
  pipe: '<path d="M4 7h9a4 4 0 014 4v9M4 11h9v9"/>',
  hand: '<path d="M8 12.5V6a1.5 1.5 0 013 0v5.5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v7.5c0 4-2.6 7-6.4 7-2.4 0-4.1-1.1-5.3-3.2L3.6 14a1.4 1.4 0 012.3-1.6L8 15"/>',
};
const icon = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

/// Zoom in and out, fit, and the hand (every drag moves the plan) over a plan: Space-and-drag, a right-drag or a
/// trackpad's two-finger scroll move it too.
function zoomCtl() {
  return `<div class="zoomctl">
    <button data-z="hand" title="Move the plan (or hold Space and drag)">${icon('hand')}</button>
    <button data-z="in" title="Zoom in">${icon('plus')}</button>
    <button data-z="out" title="Zoom out">${icon('minus')}</button>
    <button data-z="fit" title="Fit the plan">${icon('fit')}</button></div>`;
}
function bindZoomCtl(root, api) {
  root.querySelectorAll('.zoomctl [data-z]').forEach((b) => (b.onclick = () => {
    const z = b.dataset.z;
    if (z === 'in') api.zoomBy(1.5);
    else if (z === 'out') api.zoomBy(1 / 1.5);
    else if (z === 'fit') api.fit();
    else { const on = !b.classList.contains('on'); b.classList.toggle('on', on); api.setHand(on); }
  }));
}

document.addEventListener('click', (e) => { if (e.target.closest?.('[data-sizehow]')) sizeBreakdown(); });

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
  backdrop: null, backdropFile: null, upperBackdrop: null, upperBackdropFile: null, topBackdrop: null, topBackdropFile: null,
  step: 'job', selection: null, closed: new Set(), balanced: true,
  layers: { plan: true, allSizes: true, air: false, zones: true, sound: true }, addMode: false, joining: null,
  undo: [], redo: [], designing: false, read: null, jobsTab: 'progress', jobsSearch: '', jobsPick: null,
  plan: null, checkAnswers: null,
  /// The room editor while it's open (it shows in place of the step), and whether rooms changed since the design.
  editorOpen: null, roomsEdited: false,
};
try {
  // Saved before every duct's size was shown by default (13 Oct): keep the airflow choice, show the sizes.
  const saved = JSON.parse(localStorage.getItem('ttpro.layers') || '{}');
  if (saved.zones === undefined) delete saved.allSizes;
  Object.assign(app.layers, saved);
} catch (_) {}
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
  const split = isSplit(), mixed = isMixed();
  const layoutP = p.design && !split ? call('route', { project: p, closed: [...app.closed], balanced: app.balanced }) : Promise.resolve(null);
  const ductB = isDuctedB(p);
  const splitP = (split || mixed) && !ductB && p.rooms.length ? call('splitPlan', { project: p }) : Promise.resolve(null);
  // Two systems: the ducted system's own loads and unit (A's, the house less B's rooms; or B's, when B is ducted and in front).
  const ductViewP = mixed ? call('view', { project: ductedPart(p) }) : Promise.resolve(null);
  // Two ducted systems: the other one too (its unit for the Systems card, its ducts drawn faint behind).
  const other = ductB ? (activeSys(p) === 'B' ? 'A' : 'B') : null;
  const otherP = other ? ductedPartOf(p, other) : null;
  const otherViewP = otherP ? call('view', { project: otherP }) : Promise.resolve(null);
  const otherLayoutP = otherP?.design ? call('route', { project: otherP, closed: [], balanced: true }) : Promise.resolve(null);
  const [view, layout, sp, ductView, otherView, otherLayout] = await Promise.all([viewP, layoutP.catch(() => null), splitP.catch(() => null),
    ductViewP.catch(() => null), otherViewP.catch(() => null), otherLayoutP.catch(() => null)]);
  app.view = view;
  app.ductView = ductView;
  app.layout = layout;
  app.split = sp;
  app.otherView = otherView;
  app.otherLayout = otherLayout;
  // B's heads on A's VRF outdoor: piped to where A's outdoor stands (B's plan again once that's known or moves).
  if (isVrfB(p)) {
    const aOut = layout?.outdoor, spot = aOut ? [aOut[0], aOut[1]] : null;
    if (JSON.stringify(spot) !== JSON.stringify(p.vrfSpot ?? null)) {
      if (spot) p.vrfSpot = spot; else delete p.vrfSpot;
      app.split = await call('splitPlan', { project: p }).catch(() => app.split);
    }
  }
  // One VRF outdoor for both: where A's stands is where B's fan coil is piped to. Kept on the job (B's part reads it);
  // when it moves, B is routed again to it.
  if (ductB) {
    const aOut = (other === 'A' ? otherLayout : layout)?.outdoor, spot = aOut ? [aOut[0], aOut[1]] : null;
    if (JSON.stringify(spot) !== JSON.stringify(p.vrfSpot ?? null)) {
      if (spot) p.vrfSpot = spot; else delete p.vrfSpot;
      if (other === 'A' && p.design) app.layout = await call('route', { project: p, closed: [...app.closed], balanced: app.balanced }).catch(() => app.layout);
      else if (other === 'B' && otherP?.design) app.otherLayout = await call('route', { project: ductedPartOf(p, 'B'), closed: [], balanced: true }).catch(() => app.otherLayout);
    }
  }
  app.air = layout ? await call('air', { project: p, closed: [...app.closed], balanced: app.balanced }).catch(() => null) : null;
}

/// A multi-head split job (wall heads on outdoor units), not ducted.
const isSplit = () => app.project?.system === 'multiSplit';
/// Two systems: ducted (A) with some rooms on a split (B).
const isMixed = () => mixedJob(app.project);
/// A room on system B.
const onB = (id) => splitSet(app.project).has(id);
/// A room on the ducted system on screen (A's, or B's when B is ducted and in front).
const onDucts = (id) => (ductedB() && activeSys(app.project) === 'B' ? onB(id) : !onB(id));
/// The ducted system's view: its own unit and loads on a two-system job (A's, or B's when B is ducted and in front),
/// the job's otherwise.
const ductedView = () => (isMixed() && app.ductView) || app.view;
/// System B is ducted too: two ducted systems, each in its own roof space, on one VRF outdoor.
const ductedB = () => isDuctedB(app.project);
/// The whole job on one VRF outdoor (ducted B, or B's heads on the PUMY).
const vrfShared = () => sharesVrf(app.project);
/// Which system's on screen on a two-system job: a ducted B's is the job's own (it swaps the designs over), a split
/// B's the page's.
const sysView = () => (ductedB() ? activeSys(app.project) : app.sysView ?? 'A');
/// What system B is: ducted, bulkhead heads, wall heads or VRF.
const bKind = () => (ductedB() ? 'ducted' : SPLIT_KIND[app.project?.split?.range ?? defaultRange] ?? 'bulkhead');
const B_KINDS = [['ducted', 'Ducted'], ['bulkhead', 'Bulkhead'], ['vrf', 'VRF'], ['wall', 'Wall split']];
/// The helpers (the AI plan read, Auto-design) are off the main path for now (Jake, 15 Nov 2026: build the system and
/// the workflow first, the AI to help later). localStorage ttpro.assist = 1 brings them back for a look.
const ASSIST = () => { try { return localStorage.getItem('ttpro.assist') === '1'; } catch (_) { return false; } };

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
    dropReturn: 'The return goes in a ceiling over the house.',
    dropOutlet: 'An outlet goes in a conditioned room.', dropBox: 'A BDO sits over the house.',
    dropOutdoor: 'No outside wall near there.', addOutlet: 'Tap inside a conditioned room.',
    moveOutletToBox: 'That BDO can\'t take it: a BDO takes three legs at most.',
    refeed: 'It won\'t go from that BDO: a BDO takes three ducts at most, and a duct can\'t go round in a circle.',
    makeBox: 'Those vents can\'t share a BDO: pick 2 or 3 vents on the ducted system.',
    addHandRun: 'That duct won\'t go: three ducts off the fan coil or a BDO at most, never round in a circle, and a new BDO goes over the house.',
    joinRooms: 'That room isn\'t on a zone.',
    moveCorner: 'That would make a room too small, too thin or cross its own walls.',
    moveWall: 'That would squash a room — or cover all but a sliver of the one next door.',
    reshapeRoom: 'That shape won\'t do — too small, too thin, crossing itself, or covering the room next door.',
    addRoom: 'That room won\'t do — at least 0.8 m², no crossing lines, and not right over another room.',
    makeRoom: 'That gap has changed — pick it again.',
    addWindow: 'Windows go in outside walls, with room to spare.',
    drawWindow: 'Windows go in outside walls (dashed blue), with half a metre of wall for one.',
    rescale: 'That scale doesn\'t look right.',
    addDropper: 'Droppers are for a two-storey home: draw both floors first (on New job).',
    moveDropper: 'A dropper\'s top goes on the upper floor and its foot in a ground floor room.',
  })[op] ?? 'That didn\'t change anything.';
}

/// A BDO put together by hand (New BDO, or a vent moved onto it): its outlets are one of the design's stations.
function handBox(b) {
  const set = new Set(b.outlets ?? []);
  return (app.project?.design?.stations ?? []).some((s) => s.length === set.size && s.every((id) => set.has(id)));
}

/// The return's size by hand: one or two ducts, and each one's size (Auto = sized to the fan).
function returnSizer(l) {
  const lim = app.options.velocityLimits?.[app.project?.site?.velocityPref ?? 'standard']?.ret;
  const [ac, amm] = l.returnAuto ?? [l.returnCount ?? 1, l.returnMM];
  const n = l.returnCount ?? 1, sp = velocity(l.fanLps / n, l.returnMM), over = lim != null && sp > lim * RETURN_TOL + 0.01;
  const sizes = RETURN_SIZES;
  return `<span class="eyebrow" style="display:block;margin-top:10px">Return duct</span>
    <div class="seg" style="margin-bottom:6px"><button data-rcount="0" class="${l.returnManual ? '' : 'on'}">Auto (${ac > 1 ? ac + ' × ' : ''}Ø${amm})</button>
      <button data-rcount="1" class="${l.returnManual && n === 1 ? 'on' : ''}">1 duct</button><button data-rcount="2" class="${l.returnManual && n === 2 ? 'on' : ''}">2 ducts</button></div>
    <div class="sizes">${sizes.map((mm) => `<button data-rsize="${mm}" class="${l.returnManual && l.returnMM === mm ? 'on' : ''}">Ø${mm}</button>`).join('')}</div>
    <div class="kv"><span>Air speed</span><b style="${over ? 'color:var(--danger)' : ''}">${fmt(sp, 1)} m/s${lim != null ? ` <span class="muted small" style="font-weight:500">· limit ${lim} m/s (+15%)${over ? ', over: go up a size or to 2 ducts' : ''}</span>` : ''}</b></div>`;
}
const RETURN_SIZES = [250, 300, 350, 400, 450, 500, 600];
/// The return's allowance over the class's speed: the engine sizes it to within 15% (`Designer.returnPlan`).
const RETURN_TOL = 1.15;
/// The smallest return size that keeps each of `n` ducts under the limit.
function returnSizeFor(l, n) {
  const lim = app.options.velocityLimits?.[app.project?.site?.velocityPref ?? 'standard']?.ret ?? 4;
  return RETURN_SIZES.find((mm) => velocity(l.fanLps / n, mm) <= lim * RETURN_TOL) ?? RETURN_SIZES[RETURN_SIZES.length - 1];
}

async function openJob(id, step) {
  const p = store.loadJob(id);
  if (!p) { toast('That job couldn\'t be opened.'); location.hash = '#/jobs'; return; }
  if (app.jobId !== id) {
    shutEditor();
    app.roomsEdited = false;
    app.jobId = id; app.project = p; app.undo = []; app.redo = []; app.closed = new Set(); app.selection = null;
    app.read = null; app.checkAnswers = null; app.addMode = false; app.joining = null;
    await loadBackdrop();
    await refresh();
    save();                                           // the jobs list shows it as it is now
  }
  const reach = reachNow();
  const want = STEPS.findIndex((s) => s.k === normStep(step));
  // A new job starts on the job and customer; one with its house details in, at its plan.
  const up = app.view?.upTo === 0 && !app.project.name && !app.project.customer?.name ? 0 : fromEngineStep(app.view?.upTo ?? 4);
  app.step = STEPS[want >= 0 ? Math.min(want, reach) : Math.min(up, reach)].k;
  if (app.step === 'design' && !app.project.design && app.view?.planChecked && !isSplit()) startDesign();
}

/// A plan drawn by hand over an image that hasn't been sized yet (drawn first, sized after from a wall you know).
const unsizedKey = () => 'ttpro.unsized.' + app.jobId;
function isUnsized() { try { return localStorage.getItem(unsizedKey()) === '1'; } catch (_) { return false; } }
function setUnsized(on) { try { if (on) localStorage.setItem(unsizedKey(), '1'); else localStorage.removeItem(unsizedKey()); } catch (_) {} }

/// The furthest step that opens: the job's own, or Capture while a plan's just been picked (before the era is).
function reachNow() {
  // New job and Rooms are always open (the house details have defaults); Equipment and Air & pipes once the rooms
  // are checked.
  return Math.max(fromEngineStep(app.view?.reach ?? 0), 1);
}

/// The plan images under the rooms: the ground floor's (or the only one) and, two storeys, the upper floor's.
async function loadBackdrop() {
  const keys = ['backdrop', 'upperBackdrop', 'topBackdrop'];
  for (const key of keys) {
    const fileKey = key + 'File';
    const file = app.project?.[key]?.file;
    if (!file) { app[key] = null; app[fileKey] = null; continue; }
    if (app[fileKey] === file && app[key]) continue;
    // Floors on one sheet: the same image.
    const other = keys.find((k) => k !== key && app[k + 'File'] === file && app[k]);
    if (other) { app[key] = app[other]; app[fileKey] = file; continue; }
    const blob = await store.loadImage(file);
    app[key] = blob ? await inkImage(blob).catch(() => null) : null;
    app[fileKey] = file;
  }
}

/// More than one storey: set so on the New job step, or more than one floor drawn.
const isDouble = () => ['double', 'triple'].includes(app.project?.site?.storeysPref) || !!app.view?.twoStorey;
/// How many floors: as the New job step has it, or as many as are drawn.
const storeyCount = () => Math.max(({ double: 2, triple: 3 })[app.project?.site?.storeysPref] ?? 1, new Set((app.view?.rooms ?? []).map((r) => r.level ?? 0)).size);
const FLOOR_NAMES = ['ground floor', 'first floor', 'second floor'];
const floorName = (lv) => FLOOR_NAMES[lv] ?? 'ground floor';
const FloorName = (lv) => floorName(lv).replace(/^./, (c) => c.toUpperCase());
const BACKDROP_KEY = ['backdrop', 'upperBackdrop', 'topBackdrop'];
/// The next floor's plan that came in with the first (another page or image), waiting to be drawn.
const nextQueued = () => app.queued?.[0] ?? null;
/// New ducted, a re-duct onto the unit that's there, or a multi-head split.
/// The job's kind as the switch shows it: ducted, a re-duct, bulkhead heads, a VRF on branch boxes, or wall heads.
const SPLIT_KIND = { 'mitsubishi-pumy': 'vrf', 'mitsubishi-msz': 'wall', 'kaden-ksi': 'wall' };
const jobKind = () => (isSplit() ? (SPLIT_KIND[app.project?.split?.range] ?? 'bulkhead') : app.project?.existing ? 'reduct' : 'ducted');

/// By hand: the fan coil and its return go in, then the outlets room by room — the router draws and sizes the ducts
/// as each one lands. Starting again clears the outlets (undoable).
async function startDesign() {
  if (app.designing) return;
  app.designing = true;
  render();
  try {
    const { design } = await call('startDesign', { project: app.project });
    const before = app.project;
    await commit({ ...app.project, design }, { undoable: !!before.design, rerender: false });
  } catch (e) {
    toast(e.message === 'Nothing to lay out' ? 'None of these rooms takes a vent — check the room types.' : e.message);
  }
  app.designing = false;
  render();
}

/// The helper: outlets, fan coil, return and BDOs placed and routed for you (off the main path, see ASSIST).
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
    shutEditor();
    app.jobId = null; app.project = null;
    renderSettings();
  } else {
    shutEditor();
    app.jobId = null; app.project = null;
    renderJobs();
  }
}

function go(step) {
  if (!app.jobId) return;
  step = normStep(step);
  shutEditor();
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
  const shown = app.step === 'design' && isSplit() ? 'equipment' : app.step; // a split has no Air & pipes: its heads are on Equipment
  const reach = reachNow(), cur = STEPS.findIndex((s) => s.k === shown);
  const sub = [p.customer?.name, p.customer?.address].filter(Boolean).join(' · ') || 'No address yet';
  const primary = primaryAction();
  $('#top').innerHTML = `
    <div class="jobisl"><a class="back" href="#/jobs">${icon('back')} Jobs</a>
    <div class="title"><h1>${esc(v?.title ?? 'Job')}</h1><div>${esc(sub)}</div></div></div>
    <div class="spacer"></div>
    <div class="steps">${STEPS.map((s, i) => ({ ...s, i })).filter((s) => !(s.k === 'design' && isSplit())).map((s, n) => { const i = s.i; return `<button data-step="${s.k}" class="${i === cur ? 'cur' : i <= reach ? 'done' : ''}" ${i > reach ? 'disabled' : ''}>
      ${i < cur ? icon('check').replace('<svg', '<svg width="14" height="14"') : `<span class="n">${n + 1}</span>`} ${esc(s.t)}</button>`; }).join('')}</div>
    <div class="primary">${primary ? `<button class="btn" id="primary" ${primary.disabled ? 'disabled' : ''}>${ctaLabel(primary.label)}</button>` : ''}</div>`;
  $('#top .steps').onclick = (e) => { const b = e.target.closest('button[data-step]'); if (b && !b.disabled) go(b.dataset.step); };
  if (primary) $('#primary').onclick = primary.run;
}

/// The top-right button's label, with a trailing arrow moved into its own little circle (the modern skin's CTA).
function ctaLabel(label) {
  const arrow = /\s*→\s*$/.test(label);
  const text = esc(label.replace(/\s*→\s*$/, ''));
  return arrow ? `${text}<span class="ca"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>` : text;
}

function primaryAction() {
  const v = app.view, hasRooms = (v?.rooms?.length ?? 0) > 0;
  if (app.editorOpen) {
    const next = hasRooms && (app.editorOpen.edited || app.editorOpen.from !== 'design');
    return { label: next ? 'Next: check the rooms →' : 'Done', run: closeEditor };
  }
  switch (app.step) {
    case 'job': return { label: 'Next: the rooms →', run: () => go('plan') };
    case 'plan': return hasRooms && !app.read ? { label: isSplit() ? 'Lay out the heads →' : 'Equipment →', run: confirmPlan } : { label: 'Draw the rooms first', disabled: true, run: () => {} };
    case 'equipment':
      if (isSplit()) return { label: 'Check & send →', disabled: !app.split?.heads?.length, run: () => go('send') };
      return { label: 'Air & pipes →', disabled: !v?.planChecked || !v?.totals?.unit, run: () => go('design') };
    case 'design': return { label: 'Check & send →', disabled: isSplit() ? !app.split?.heads?.length : !app.layout?.outlets?.length, run: () => go('send') };
    case 'send':
      if (isSplit()) return { label: 'Install sheet', disabled: !app.split?.heads?.length, run: () => openReport('install') };
      return { label: 'Customer report', disabled: !app.layout?.outlets?.length, run: () => openReport('customer') };
  }
  return null;
}

function render() {
  if (!app.project) return;
  renderNav('jobs');
  renderTop();
  const c = $('#content');
  if (app.editorOpen) { renderRoomEditor(c); return; }
  ({ job: renderJob, plan: renderPlan, equipment: renderEquipment, design: isSplit() ? renderEquipment : isMixed() && sysView() === 'B' && !ductedB() ? renderSplitDesign : renderDesign, send: renderSend })[app.step]?.(c);
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
  const stage = (j) => j.status && j.status !== 'inProgress' ? ({ quoted: 'Quoted', won: 'Won', lost: 'Lost' })[j.status] : STEPS[j.upTo === 0 && !j.name ? 0 : fromEngineStep(j.upTo ?? 3)]?.t;
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
        <p>Upload the builder's plan, set its scale and draw the rooms over it. Place the fan coil and the vents, and the ducts, sizes and materials follow.</p>
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
  const next = STEPS[fromEngineStep(j.upTo ?? 3)];
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
  location.hash = '#/job/' + id + (demo ? '/plan' : '/job');
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
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { window.__ttImport = importJobFile; window.__ttApp = () => app; }

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

// MARK: Catalogue

/// The catalogue (Jake, 15 Nov 2026: "view a catalogue and then add my unit, BDO, duct … or bulkhead"): each brand's
/// ducted units, the bulkhead and wall heads, City Multi, BDOs, flex and the outlets. A unit or range can be put on the
/// job; anything can go on the materials as a line added by hand.
const CAT_TABS = [['ducted', 'Ducted units'], ['bulkhead', 'Bulkhead units'], ['vrf', 'VRF'], ['wall', 'Wall heads'], ['bdo', 'BDOs'], ['flex', 'Flex duct'], ['outlets', 'Outlets & grilles']];
function addExtra(desc, qty = 1, uom = 'ea', note = null) {
  const extras = [...(app.project.extras ?? [])];
  const have = extras.find((x) => x.desc === desc && x.uom === uom);
  if (have) have.qty += qty; else extras.push({ desc, qty, uom, ...(note ? { note } : {}) });
  commit({ ...app.project, extras }, { undoable: true });
  toast(`Added to the materials: ${desc}`);
}
function catRow(title, sub, actions) {
  return `<div class="kv" style="align-items:center;gap:10px"><span><b>${esc(title)}</b><br><span class="small muted">${sub}</span></span>
    <span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${actions}</span></div>`;
}
const catBtn = (attrs, label, primary = false) => `<button class="${primary ? 'btn' : 'btn2'} small" ${attrs}>${label}</button>`;
function catalogueBody(tab) {
  const o = app.options, add = (d, uom = 'ea') => catBtn(`data-add="${esc(d)}" data-uom="${uom}"`, 'Add to materials');
  const ranges = (o.splitRanges ?? []);
  const rangeBlock = (r) => `<div class="card" style="margin:10px 0;box-shadow:none;background:var(--tile)"><div style="display:flex;align-items:center;gap:8px">
      <h3 style="flex:1;margin:0">${esc(r.brand)} · ${esc(r.name)}</h3>${catBtn(`data-range="${r.id}"`, isSplit() && app.project.split?.range === r.id ? 'On this job' : 'Use on this job', true)}</div>
    ${r.heads.map((h) => catRow(h.model, `${g(h.kw)} kW cooling${h.heatKW ? ` · ${g(h.heatKW)} kW heating` : ''}${h.lps ? ` · ${fmt(h.lps)} L/s` : ''}${h.esp.length ? ` · ${h.esp.length > 1 ? h.esp.join('/') : '0–' + h.esp[0]} Pa` : ''}${h.widthMM ? ` · ${h.widthMM} × ${h.depthMM ?? '—'} × ${h.heightMM ?? '—'} mm` : ''}`, add(`${r.brand} ${h.model} ${h.wall ? 'wall head' : 'bulkhead unit'}`))).join('')}
    <span class="eyebrow" style="display:block;margin-top:8px">Outdoor units</span>
    ${r.outdoors.map((u) => catRow(u.model, `${g(u.kw)} kW · up to ${u.ports} heads · ${esc(u.phase)} · carries ${g(u.connect[0])}–${g(u.connect[1])} kW of heads`, add(`${r.brand} ${u.model} outdoor unit`))).join('')}
    ${r.branchBoxes.length ? `<span class="eyebrow" style="display:block;margin-top:8px">Branch boxes</span>${r.branchBoxes.map((b) => catRow(b, b.includes('54') ? '5 ports' : '3 ports', add(`${r.brand} ${b} branch box`))).join('')}` : ''}</div>`;
  switch (tab) {
    case 'ducted': return (o.brands ?? []).map((b) => `<div class="card" style="margin:10px 0;box-shadow:none;background:var(--tile)"><h3 style="margin:0 0 4px">${esc(b.label)} ducted</h3>
      ${b.units.map((u) => catRow(u.model || `${g(u.kw)} kW`, `${g(u.kw)} kW · ${fmt(u.lps)} L/s fan on high · up to ${fmt(u.esp)} Pa${u.espConfirmed === false ? ' (check the manual)' : ''}`,
        catBtn(`data-unit="${u.kw}" data-brand-id="${b.id}"`, !isSplit() && brandId() === b.id && app.project.site.unitKWPref === u.kw ? 'On this job' : 'Use on this job', true) + add(`${b.label} ${u.model} ducted unit ${g(u.kw)} kW`))).join('')}</div>`).join('');
    case 'bulkhead': return ranges.filter((r) => !r.wall && !r.vrf).map(rangeBlock).join('');
    case 'vrf': return ranges.filter((r) => r.vrf).map(rangeBlock).join('');
    case 'wall': return ranges.filter((r) => r.wall).map(rangeBlock).join('');
    case 'bdo': {
      const two = [250, 300, 350, 400], three = [300, 350, 400, 450];
      return `<p class="small muted">The router puts the BDOs in and sizes them for the air. Add spares or extras here.</p>
        ${two.map((mm) => catRow(`BDO 2-way Ø${mm}`, `branch take-off, 2 legs`, add(`Branch take-off, 2-way (DBTO) Ø${mm}`))).join('')}
        ${three.map((mm) => catRow(`BDO 3-way Ø${mm}`, `branch take-off, 3 legs`, add(`Branch take-off, 3-way (DBTO) Ø${mm}`))).join('')}
        ${[150, 200, 250, 300, 350, 400].map((mm) => catRow(`Zone damper Ø${mm}`, 'motorised, with its cable', add(`Zone damper Ø${mm}`))).join('')}`;
    }
    case 'flex': return `<p class="small muted">Insulated flexible duct in 6 m bags.</p>${(o.ductSizes ?? []).map((mm) => catRow(`Flex duct Ø${mm}`, `6 m bag · ${fmt(Math.PI * (mm / 2000) ** 2 * 3000)} L/s at 3 m/s`, catBtn(`data-add="Insulated flex duct Ø${mm}" data-uom="bag"`, 'Add a bag'))).join('')}
      ${[150, 200, 250, 300, 350, 400].map((mm) => catRow(`Flex duct joiner Ø${mm}`, 'joins two lengths', add(`Flex duct joiner Ø${mm}`))).join('')}`;
    case 'outlets': return `${[150, 200, 250, 300].map((mm) => catRow(`Round ceiling diffuser Ø${mm}`, 'multijet, adjustable', add(`Round ceiling diffuser Ø${mm} (multijet)`))).join('')}
      ${[600, 900, 1200, 1500, 1800].map((l) => catRow(`Linear slot diffuser 2-slot × ${l}`, 'with plenum box', add(`Linear slot diffuser 2-slot × ${l}`))).join('')}
      ${[[600, 100], [900, 100], [1200, 100], [900, 150], [1200, 150]].map(([l, h]) => catRow(`Linear bar grille ${l} × ${h}`, 'supply or return, with plenum box', add(`Linear bar grille ${l} × ${h}`))).join('')}
      ${[[300, 100], [400, 150], [450, 200]].map(([l, w]) => catRow(`Floor grille ${l} × ${w}`, 'with plenum box', add(`Floor grille ${l} × ${w}`))).join('')}
      ${[[600, 300], [900, 450], [1200, 500]].map(([l, w]) => catRow(`Return air filter grille ${l} × ${w}`, 'with G3 filter box', add(`Return air filter grille ${l} × ${w}`))).join('')}`;
  }
  return '';
}
function openCatalogue(tab) {
  tab ??= isSplit() ? ({ vrf: 'vrf', wall: 'wall' })[jobKind()] ?? 'bulkhead' : 'ducted';
  const extras = app.project.extras ?? [];
  const d = dialog(`<h2>Catalogue</h2>
    <div class="seg" style="flex-wrap:wrap;margin:0 0 6px">${CAT_TABS.map(([k, t]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div id="cat-body" style="max-height:58vh;overflow:auto;padding-right:4px">${catalogueBody(tab)}</div>
    ${extras.length ? `<details style="margin-top:10px"><summary class="small" style="cursor:pointer;font-weight:700">Added by hand · ${extras.length} line${extras.length === 1 ? '' : 's'}</summary>
      ${extras.map((x, i) => `<div class="kv"><span>${esc(x.desc)}</span><b>${g(x.qty)} ${esc(x.uom)} <button class="link" data-rm="${i}" style="padding:0 0 0 6px">Take off</button></b></div>`).join('')}</details>` : ''}`,
    [{ label: 'Done', primary: true }]);
  d.querySelector('.dialog').classList.add('wide');
  d.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab],[data-add],[data-unit],[data-range],[data-rm]');
    if (!t) return;
    e.stopPropagation();
    if (t.dataset.tab) { d.remove(); openCatalogue(t.dataset.tab); return; }
    if (t.dataset.add) { addExtra(t.dataset.add, 1, t.dataset.uom || 'ea'); return; }
    if (t.dataset.rm != null) {
      const extras = (app.project.extras ?? []).filter((_, i) => i !== +t.dataset.rm);
      d.remove(); await commit({ ...app.project, extras: extras.length ? extras : null }, { undoable: true }); openCatalogue(tab); return;
    }
    if (t.dataset.unit) {
      d.remove();
      if (isSplit()) await setJobKind('ducted');
      await commit({ ...app.project, site: { ...app.project.site, brandPref: t.dataset.brandId === 'mitsubishi' ? null : t.dataset.brandId, unitKWPref: +t.dataset.unit } }, { undoable: true });
      toast('Unit picked by hand. Back to the recommended size under Unit on the Equipment step.');
      return;
    }
    if (t.dataset.range) {
      d.remove();
      if (!isSplit()) await edit('setSystem', { system: 'multiSplit' });
      if (app.project.split?.range !== t.dataset.range) await edit('setSplitRange', { key: t.dataset.range });
    }
  });
}

function confirmDialog(title, text, label, run) {
  dialog(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>`, [{ label: 'Cancel' }, { label, primary: true, danger: true, run }]);
}

// MARK: House

/// Step 1: the job and the customer, site notes, and what the job is.
function renderJob(c) {
  // The New job page as the mock has it (Jake, 22 Nov 2026: "I like the new job mock, looks way better"): one card to
  // start the job — who, where, what, when it was built and the plan — with the climate and the house beside it.
  const p = app.project, s = p.site, o = app.options, v = app.view, r = app.read;
  const cityKnown = s.climateSet !== false, k = jobKind(), split = isSplit();
  const storeys = s.storeysPref ?? 'single', era = s.eraPref;
  const next = v.rooms.length ? 'Open the rooms →' : r ? 'Carry on with the plan →' : p.backdrop ? 'Draw the rooms →' : isDouble() ? 'Scale the ground floor →' : 'Choose the plan →';
  c.innerHTML = `<div class="nj">
    <div class="card nj-main" id="drop">
      <span class="eyebrow">Step 1 of ${STEPS.length} · about 30 seconds</span>
      <h1>Start a job</h1>
      <p class="muted" style="margin:6px 0 18px">Everything here can be changed later on the plan.</p>
      <div class="nj-grid">
        <label class="field"><span>Customer</span><input data-c="name" value="${esc(p.customer?.name ?? '')}" placeholder="Customer name"></label>
        <label class="field"><span>Mobile or email</span><input data-contact value="${esc([p.customer?.phone, p.customer?.email].filter(Boolean).join(' '))}" placeholder="Optional"></label>
        <label class="field full"><span>Address</span><span class="nj-addr"><input data-c="address" value="${esc(p.customer?.address ?? '')}" placeholder="Start typing the address">${cityKnown && p.customer?.address ? `<i class="tick">${icon('check')}</i>` : ''}</span></label>
        <div class="field"><span>Job</span><div class="seg fill"><button data-njkind="ducted" class="${k !== 'reduct' ? 'on' : ''}">New install</button><button data-njkind="reduct" class="${k === 'reduct' ? 'on' : ''}" ${split ? 'disabled' : ''}>Re-duct</button></div></div>
        <div class="field"><span>Storeys</span><div class="seg fill">${o.storeys.map((x, i) => `<button data-storeys="${x.id}" class="${x.id === storeys ? 'on' : ''}">${['One', 'Two', 'Three'][i] ?? esc(x.label)}</button>`).join('')}</div></div>
        ${k === 'reduct' ? `<div class="field full" style="margin-top:-4px"><div class="rowpick" style="padding:0;border:0"><label style="font-size:13px;color:var(--muted)">What's there now</label><select id="ex-kind">
          <option value="aircon" ${p.existing?.kind !== 'heater' ? 'selected' : ''}>Ducted air conditioner</option>
          <option value="heater" ${p.existing?.kind === 'heater' ? 'selected' : ''}>Gas ducted heater</option></select></div></div>` : ''}
        <div class="field full"><span>Built${era ? '' : ' · pick the era and the house is filled in'}</span><div class="seg fill">${o.eras.map((e) => `<button data-era="${e.id}" class="${e.id === era ? 'on' : ''}">${esc(e.short)}</button>`).join('')}</div></div>
        <div class="field full" style="margin-bottom:0"><span>Plan</span>${planSection()}</div>
      </div>
      <div class="nj-foot"><span class="muted small">${split ? 'A split job: the heads are laid out on Equipment.' : 'Ducted, bulkhead, VRF or wall split is picked on Equipment.'}</span>
        <button class="btn" id="nj-go">${ctaLabel(next)}</button></div>
    </div>
    <div class="nj-side">
      <div class="card nj-clim">
        <label class="zbadge ${cityKnown ? '' : 'unset'}"><small>${cityKnown ? 'Climate' : 'Climate?'}</small><select id="city">${o.cities.map((x) => `<option value="${x.id}" ${x.id === s.city ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label>
        <div><span class="eyebrow" style="color:#3E6CF0">Winter</span><b>${fmt(v.winterDB)}<i>°C</i></b></div>
        <div><span class="eyebrow" style="color:#E0562F">Summer</span><b>${fmt(v.summerDB)}<i>°C</i></b></div>
      </div>
      ${houseCard()}
      ${floorsCard()}
      <div class="card"><div class="ih"><b>Job file</b><span class="imono mut">not on the customer's report</span></div>
        <label class="field" style="margin-top:10px"><span>Job name</span><input data-p="name" value="${esc(p.name ?? '')}" placeholder="Smith, Pakenham"></label>
        <label class="field" style="margin-bottom:0"><span>Site notes</span><textarea data-p="siteNotes" placeholder="Gate code, dogs, roof access, where the manhole is…">${esc(p.siteNotes ?? '')}</textarea></label></div>
    </div>
  </div>`;
  bindHouse(c);
}

/// The house as chips (the mock's "House defaults"): what the build era filled in, and Change to set any of it.
function houseCard() {
  const s = app.project.site, o = app.options, open = !!app.houseOpen;
  const label = (list, id) => list?.find((x) => x.id === id)?.label ?? '';
  const chips = [label(o.wallTypes, s.wallType), 'Ceiling ' + label(o.ceilingInsulation, s.ceilingInsulation).replace(/^None$/, 'not insulated'), 'Windows ' + label(o.glazing, s.glazing).toLowerCase(),
    `${(s.ceilingPref ?? 2.4).toFixed(1)} m ceilings`, label(o.roofTypes, s.roofTypePref ?? 'tile') + ', ' + label(o.roofColours, s.roofColour).toLowerCase(),
    label(o.floorTypes, s.floorType), label(o.airtightness, s.airtightness)].filter(Boolean);
  const row = (title, key, list, value) => `<div class="rowpick"><label>${title}</label><select data-site="${key}">
    ${list.map((it) => `<option value="${it.id}" ${it.id === value ? 'selected' : ''}>${esc(it.label)}</option>`).join('')}</select></div>`;
  return `<div class="card"><div class="ih"><b>House defaults</b><span class="imono mut">${s.eraPref ? 'from the build era' : 'pick when it was built'}</span></div>
    <div class="nj-chips">${chips.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}<button class="chip link2" id="house-edit">${open ? 'Done' : 'Change'}</button></div>
    ${open ? `<div style="margin-top:10px">
      <div class="rowpick"><label>Ceiling height</label><span style="display:flex;align-items:center;gap:6px"><input class="text" id="ceiling" type="number" min="2.1" max="6" step="0.05" value="${(s.ceilingPref ?? 2.4).toFixed(2)}" style="width:84px;text-align:right;padding:7px 9px"><span class="small muted">m</span></span></div>
      ${row('Walls', 'wallType', o.wallTypes, s.wallType)}${row('Roof', 'roofTypePref', o.roofTypes, s.roofTypePref ?? 'tile')}${row('Roof colour', 'roofColour', o.roofColours, s.roofColour)}
      ${row('Floor', 'floorType', o.floorTypes, s.floorType)}${row('Ceiling insulation', 'ceilingInsulation', o.ceilingInsulation, s.ceilingInsulation)}${row('Windows', 'glazing', o.glazing, s.glazing)}${row('Draughtiness', 'airtightness', o.airtightness, s.airtightness)}
      <p class="small muted" style="margin:8px 0 0">An extension built later gets its own on the Rooms step: tap its rooms.</p></div>` : ''}</div>`;
}

/// New job's plan: three ways in, each a tile that acts when it's tapped (a plan can be dropped anywhere on the card).
/// Once there's a plan it's the rooms drawn, with the way back to them.
function planSection() {
  const v = app.view, p = app.project, r = app.read;
  if (v.rooms.length) {
    return `<div class="ptiles"><button class="ptile on" data-go="plan"><i>${icon('house')}</i><b>${v.rooms.length} room${v.rooms.length === 1 ? '' : 's'} drawn</b><small>${g(v.totals.area)} m² · ${fmt(v.totals.wholeHomeKW ?? v.totals.connectedKW, 1)} kW whole home${p.planConfirmed ? ' · checked' : ''}</small></button>
      <button class="ptile" id="replace"><i>${icon('upload')}</i><b>A different plan</b><small>Upload another: the rooms start again.</small></button></div>`;
  }
  if (r) return `<div class="ptiles"><button class="ptile on" data-go="plan"><i>${icon('ruler')}</i><b>Plan chosen</b><small>Set its scale, then trace the rooms.</small></button></div>`;
  if (p.backdrop) return `<div class="ptiles"><button class="ptile on" data-go="plan"><i>${icon('pen')}</i><b>The plan's in</b><small>It's scaled: draw the rooms over it.</small></button>
    <button class="ptile" id="replace"><i>${icon('upload')}</i><b>A different plan</b><small>Upload another.</small></button></div>`;
  if (isDouble()) return getHouseIn().replace('<div class="card">', '<div class="nj-slots">');
  return `<div class="ptiles"><label class="ptile on"><input type="file" id="planfile" accept="${PLAN_TYPES}" multiple hidden><i>${icon('upload')}</i><b>Upload a plan</b><small>PDF or photo, or drop it here. Set the scale, then trace.</small></label>
    <button class="ptile" id="grid"><i>${icon('pen')}</i><b>Draw it</b><small>On a grid, from your own measurements.</small></button>
    <button class="ptile" id="demo"><i>${icon('house')}</i><b>Try the demo house</b><small>A sample home, to see how it works.</small></button></div>`;
}

/// Step 3: the plan — upload it, scale it, draw the rooms and windows; once there are rooms, check them.
function renderPlan(c) {
  const v = app.view, r = app.read;
  if (r && r.status !== 'done') { renderCapture(c); return; }
  if (!v?.rooms?.length) { renderCapture(c); return; }
  renderCheck(c);
}

/// A two-storey home: each floor's plan (Jake, 31 Oct: "if we have two storeys we need to be able to read both floors"),
/// the upstairs rooms when both floors are on one sheet, and whether the ground floor's ducts are new or joined.
function floorsCard() {
  if (!isDouble()) return '';
  const v = app.view, p = app.project, n = storeyCount();
  const count = (lv) => v.rooms.filter((r) => (r.level ?? 0) === lv).length;
  const img = (lv) => p[BACKDROP_KEY[lv]];
  const sameSheet = (lv) => lv > 0 && img(lv) && p.backdrop && img(lv).file === p.backdrop.file;
  const q = nextQueued();
  const row = (lv) => `<div class="kv"><span><b>${FloorName(lv)}</b> · ${count(lv) ? `${count(lv)} room${count(lv) === 1 ? '' : 's'}` : img(lv) ? 'plan in, no rooms yet' : 'no plan yet'}</span>
    ${sameSheet(lv) ? '<span class="muted small">same sheet</span>' : q && q.level === lv && !count(lv) ? '<button class="link" id="upper-q2" style="padding:0;white-space:nowrap">Draw it now</button>'
      : `<button class="link" data-floor="${lv}" style="padding:0;white-space:nowrap">${count(lv) || img(lv) ? 'New plan' : 'Upload its plan'}</button>`}</div>`;
  return `<div class="card"><span class="eyebrow">${n >= 3 ? 'Three storeys' : 'Two storeys'}</span>
    ${Array.from({ length: n }, (_, lv) => row(lv)).join('')}
    <p class="small muted" style="margin:8px 0 0">A plan for each floor.${isSplit() ? '' : ' The fan coil goes in the roof over the top floor; the floors below get their air down droppers, marked on Air &amp; pipes.'}</p>
    ${v.rooms.length ? `<details style="margin-top:8px" ${v.rooms.every((r) => !r.level) ? 'open' : ''}><summary class="small" style="cursor:pointer;font-weight:700">Floors on one plan? Set each room's floor</summary>
      <p class="small muted" style="margin:6px 0 0">On the Rooms step's list, under Floor.</p></details>` : ''}
    ${isSplit() ? '' : `<div class="rowpick" style="margin-top:10px"><label>Lower floor ducts</label><select id="downstairs">
      <option value="1" ${p.twoStorey?.ductDownstairs !== false ? 'selected' : ''}>New ducts</option>
      <option value="0" ${p.twoStorey?.ductDownstairs === false ? 'selected' : ''}>Join existing droppers</option></select></div>`}
  </div>`;
}

function getHouseIn() {
  // Two storeys: a slot for each floor's plan (a PDF or an image each), the ground floor drawn first.
  if (isDouble()) {
    const u = app.upload ?? {}, n = storeyCount();
    const slot = (lv) => `<div class="drop" data-slot="${lv}" style="padding:16px">${icon('upload')}<h3 style="margin:6px 0 2px">${FloorName(lv)} plan</h3>
      <p class="small muted" style="margin:0">${u[lv] ? `<b style="color:var(--ink)">${esc(u[lv].name)}</b>` : 'A PDF, JPEG or PNG'}</p>
      <label class="btn2 small" style="margin-top:8px">${u[lv] ? 'Change' : 'Choose'}<input type="file" data-slotfile="${lv}" accept="${PLAN_TYPES}" hidden></label></div>`;
    return `<div class="card"><span class="eyebrow">Get the house in · ${n >= 3 ? 'three' : 'two'} storeys</span>
      <div style="display:grid;grid-template-columns:repeat(${n}, minmax(0, 1fr));gap:10px">${Array.from({ length: n }, (_, lv) => slot(lv)).join('')}</div>
      <p class="small muted" style="margin:10px 0 0">All the floors on one PDF? Put it in the ground floor and tap each floor's page. All on one sheet? Just the ground floor, then set each room's floor.</p>
      <div class="actions-row"><button class="btn" id="slots-go" ${u[0] ? '' : 'disabled'}>Next: scale the ground floor →</button></div>
      <p class="small muted" style="text-align:center;margin:12px 0 0">or <button class="link" id="demo" style="padding:0;color:var(--accent-deep)">try the demo house</button>
        · no plan? <button class="link" id="grid" style="padding:0;color:var(--accent-deep)">draw the rooms on a grid</button></p></div>`;
  }
  return `<div class="card"><span class="eyebrow">Get the house in</span>
    <div class="drop" id="drop">${icon('upload')}<h3>Drop the builder's plan here</h3>
      <p class="small muted">The builder's PDF (pick the page, or the ground and upper floor pages), or a JPEG or PNG of each floor. You set the scale from a printed size, then draw the rooms over it.</p>
      <label class="btn ink" style="margin-top:10px;height:42px">Choose a file<input type="file" id="planfile" accept="${PLAN_TYPES}" multiple hidden></label></div>
    <p class="small muted" style="text-align:center;margin:12px 0 0">or <button class="link" id="demo" style="padding:0;color:var(--accent-deep)">try the demo house</button>
      · no plan? <button class="link" id="grid" style="padding:0;color:var(--accent-deep)">draw the rooms on a grid</button></p>
    <p class="small muted" style="margin:10px 0 0;text-align:center">Two storeys with a plan for each floor? <button class="link" id="two-plans" style="padding:0;color:var(--accent-deep)">Add each floor's plan</button></p>
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
  $('#city', c)?.addEventListener('change', (e) => edit('setCity', { city: e.target.value }));
  $('#ceiling', c)?.addEventListener('change', (e) => { const h = parseFloat(e.target.value); if (h >= 2.1 && h <= 6) edit('setCeiling', { by: h }); else toast('A ceiling between 2.1 and 6 m.'); });
  c.querySelectorAll('[data-era]').forEach((b) => (b.onclick = () => edit('setEra', { era: b.dataset.era })));
  c.querySelectorAll('[data-site]').forEach((s) => (s.onchange = () => commit({ ...p(), site: { ...p().site, [s.dataset.site]: s.value } })));
  c.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go)));
  $('#replace', c)?.addEventListener('click', () => pickPlan(true));
  c.querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => setJobKind(b.dataset.kind)));
  // New install or a re-duct (a split job stays a split: its kind is on Equipment).
  c.querySelectorAll('[data-njkind]').forEach((b) => (b.onclick = async () => {
    if (isSplit() || (b.dataset.njkind === 'reduct') === (jobKind() === 'reduct')) return;
    await setJobKind(b.dataset.njkind);
    if (app.step === 'job') render();
  }));
  c.querySelectorAll('[data-storeys]').forEach((b) => (b.onclick = () => commit({ ...p(), site: { ...p().site, storeysPref: b.dataset.storeys } })));
  $('#house-edit', c)?.addEventListener('click', () => { app.houseOpen = !app.houseOpen; render(); });
  $('#nj-go', c)?.addEventListener('click', async () => {
    await flush();
    const pick = $('#planfile', c);
    if (pick && !app.view.rooms.length && !app.read && !p().backdrop) pick.click(); else go('plan');
  });
  $('#ex-kind', c)?.addEventListener('change', (e) => edit('setExisting', { choice: e.target.value }));
  c.querySelectorAll('[data-floor]').forEach((b) => (b.onclick = () => pickPlan(true, +b.dataset.floor)));
  $('#upper-q2', c)?.addEventListener('click', useQueuedUpper);
  c.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => edit('setRoomLevel', { room: b.dataset.up, level: b.classList.contains('on') ? 0 : 1 })));
  $('#downstairs', c)?.addEventListener('change', (e) => edit('setDuctDownstairs', { on: e.target.value === '1' }));
  bindUpload(c);
}

function bindUpload(c) {
  const input = $('#planfile', c), drop = $('#drop', c);
  $('#two-plans', c)?.addEventListener('click', async () => { await ensureTwoStorey(); render(); });
  // The two floors' slots.
  c.querySelectorAll('[data-slotfile]').forEach((inp) => inp.addEventListener('change', () => {
    if (!inp.files[0]) return;
    app.upload = { ...(app.upload ?? {}), [inp.dataset.slotfile]: inp.files[0] };
    render();
  }));
  c.querySelectorAll('[data-slot]').forEach((z) => {
    z.addEventListener('dragover', (e) => { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', () => z.classList.remove('over'));
    z.addEventListener('drop', (e) => { e.preventDefault(); z.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) { app.upload = { ...(app.upload ?? {}), [z.dataset.slot]: f }; render(); } });
  });
  $('#slots-go', c)?.addEventListener('click', async () => {
    const u = app.upload ?? {};
    if (!u[0]) return;
    app.upload = null;
    app.queued = [];
    for (const lv of [1, 2]) {
      const f = u[lv];
      if (!f) continue;
      try {
        const pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        const before = app.queued.length;
        const bmp = pdf ? await pdfPlan(f, { single: true }) : await createImageBitmap(f);
        if (bmp) app.queued.splice(before, 0, { level: lv, bitmap: bmp, label: f.name });
      } catch (_) { toast(`${f.name} couldn't be opened.`); }
    }
    await ensureTwoStorey();
    choosePlan(u[0], 0);
  });
  input?.addEventListener('change', () => input.files.length && choosePlans([...input.files]));
  $('#grid', c)?.addEventListener('click', drawOnGrid);
  $('#demo', c)?.addEventListener('click', async () => {
    const { project } = await call('demo', { project: app.project });
    app.read = null;
    await commit(project);
    go('plan');
  });
  if (!drop) return;
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const fs = [...e.dataTransfer.files]; if (fs.length) choosePlans(fs); });
}

/// `level`: two storeys, the floor the plan is (0 ground, 1 upper); a single storey has none.
function pickPlan(replacing, level) {
  const lv = level ?? (isDouble() ? (app.read?.level ?? 0) : undefined);
  const go2 = () => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = PLAN_TYPES;
    if (level == null) i.multiple = true;
    i.onchange = () => { if (!i.files.length) return; if (level == null && i.files.length > 1) choosePlans([...i.files]); else choosePlan(i.files[0], lv); };
    i.click();
  };
  const have = lv == null ? app.view.rooms.length : app.view.rooms.filter((r) => (r.level ?? 0) === lv).length;
  if (replacing && have) {
    confirmDialog(`This job already has ${have} rooms${lv == null ? '' : ' on the ' + floorName(lv)}`,
      `A new plan replaces ${lv == null ? 'them' : 'that floor\'s rooms'}, and the plan's checked again.`, 'Upload a new plan', go2);
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

const PLAN_TYPES = 'application/pdf,.pdf,image/png,image/jpeg,image/webp';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfjsLoad = null;

/// A builder's PDF: the page with the floor plan (asked when there's more than one) drawn at about 2400 px across.
async function pdfPlan(file, { single = false } = {}) {
  pdfjsLoad ??= new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = PDFJS + 'pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(window.pdfjsLib); };
    s.onerror = () => { pdfjsLoad = null; fail(new Error('The PDF reader didn\'t load — check the connection and try again.')); };
    document.head.append(s);
  });
  const pdfjs = await pdfjsLoad;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = doc.numPages === 1 ? [1] : await pickPdfPage(doc, single ? 1 : 3);
  if (!pages?.length) return null;
  // Floors on several pages: the upper floors' pages wait until the ground floor's drawn (Jake, 15–16 Nov 2026).
  app.queued ??= [];
  for (let k = 1; k < pages.length; k++) app.queued.push({ level: k, bitmap: await renderPdfPage(doc, pages[k]), label: `page ${pages[k]}` });
  return renderPdfPage(doc, pages[0]);
}

async function renderPdfPage(doc, n) {
  const page = await doc.getPage(n), base = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: Math.min(2400 / Math.max(base.width, base.height), 8) });
  const cv = document.createElement('canvas');
  cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: g, viewport: vp }).promise;
  return createImageBitmap(cv);
}

/// Which page of a builder's set has the floor plan: each page small, tap one.
function pickPdfPage(doc, most = 3) {
  return new Promise((resolve) => {
    const n = Math.min(doc.numPages, 24);
    // Tap the pages to use, in order: the first is the ground floor (or the only floor), the second the upper floor.
    const picked = [];
    const d = dialog(`<h2>Which pages are the floor plans?</h2>
      <p class="muted small" style="margin:0 0 10px">${doc.numPages} pages in this PDF${doc.numPages > n ? ` (the first ${n} shown)` : ''}. Tap the floor plan page.${most > 1 ? ' More than one storey? Tap the ground floor\'s page, then the first floor\'s, then the second floor\'s.' : ''}</p>
      <div id="pdf-pages" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;max-height:56vh;overflow:auto">${Array.from({ length: n }, (_, i) =>
        `<button data-pg="${i + 1}" style="border:1px solid var(--line);border-radius:12px;background:#fff;padding:6px;cursor:pointer;text-align:center"><canvas style="width:100%;display:block;background:var(--tile);border-radius:6px;aspect-ratio:1.414"></canvas><span class="small" style="display:block;margin-top:4px;font-weight:700">Page ${i + 1}</span></button>`).join('')}</div>`,
      [{ label: 'Cancel', run: () => resolve(null) },
       { label: 'Use the page', primary: true, run: () => { if (!picked.length) { toast('Tap the floor plan page first.'); return true; } resolve([...picked]); } }]);
    d.querySelector('.dialog').classList.add('wide');
    d.addEventListener('click', (e) => { if (e.target === d) resolve(null); });
    const useBtn = [...d.querySelectorAll('.actions button')].pop();
    const mark = () => {
      d.querySelectorAll('[data-pg]').forEach((b) => {
        const k = +b.dataset.pg, at = picked.indexOf(k), tag = at < 0 ? '' : picked.length > 1 ? FloorName(at) : 'Floor plan';
        b.style.borderColor = tag ? 'var(--accent)' : ''; b.style.boxShadow = tag ? '0 0 0 3px var(--accent)' : '';
        b.querySelector('span').textContent = `Page ${k}` + (tag ? ` · ${tag}` : '');
      });
      useBtn.textContent = picked.length > 2 ? 'Use the three pages (three storeys)' : picked.length > 1 ? 'Use both pages (two storeys)' : 'Use the page';
    };
    d.querySelector('#pdf-pages').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pg]');
      if (!b) return;
      e.stopPropagation();
      const k = +b.dataset.pg, at = picked.indexOf(k);
      if (at >= 0) picked.splice(at, 1); else { if (picked.length === most) picked.shift(); picked.push(k); }
      mark();
    });
    (async () => {
      for (const b of d.querySelectorAll('[data-pg]')) {
        if (!d.isConnected) return;
        const page = await doc.getPage(+b.dataset.pg), base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 260 / Math.max(base.width, base.height) }), cv = b.querySelector('canvas');
        cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); cv.style.aspectRatio = `${vp.width} / ${vp.height}`;
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.catch(() => {});
      }
    })();
  });
}

/// A plan picked (a PDF or an image): kept as a JPEG, then read by AI or measured and drawn over by hand (the tradie
/// picks).
/// One plan, or two (the ground floor's and the upper floor's, as two images): the first is drawn now, the second
/// waits for the ground floor to be done. Two of them make the job two storeys.
async function choosePlans(files) {
  files = files.filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name) || /^image\//.test(f.type));
  if (!files.length) { toast('Use the builder\'s PDF, or a JPEG or PNG of the floor plan.'); return; }
  app.queued = [];
  if (files.length >= 2) {
    const [a, b] = files;
    const go2 = async (ground, upper) => {
      try { app.queued = [{ level: 1, bitmap: await createImageBitmap(upper), label: upper.name }]; } catch (_) { toast(`${upper.name} couldn't be opened.`); }
      await ensureTwoStorey();
      choosePlan(ground, 0);
    };
    dialog(`<h2>Two plans: which is which?</h2><p class="muted small">The ground floor's plan is drawn first, then the upper floor's.</p>`,
      [{ label: `${a.name} is the ground floor`, primary: true, run: () => { go2(a, b); } },
       { label: `${b.name} is the ground floor`, run: () => { go2(b, a); } }]);
    return;
  }
  choosePlan(files[0], isDouble() ? 0 : undefined);
}

/// Mark the job two storeys (both floors' plans are coming).
async function ensureTwoStorey() {
  const want = (app.queued?.some((q) => q.level >= 2) || app.project.site.storeysPref === 'triple') ? 'triple' : 'double';
  if (app.project.site.storeysPref === want) return;
  await commit({ ...app.project, site: { ...app.project.site, storeysPref: want } }, { rerender: false });
}

/// The upper floor's plan that came in with the ground floor's (a second page or image), drawn now.
async function useQueuedUpper() {
  const q = app.queued?.shift();
  if (!q) return;
  await ensureTwoStorey();
  planFromBitmap(q.bitmap, q.level);
}

async function choosePlan(file, level) {
  const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!pdf && !/^image\//.test(file.type)) { toast('Use the builder\'s PDF, or a JPEG or PNG of the floor plan.'); return; }
  let bmp = null;
  try {
    bmp = pdf ? await pdfPlan(file) : await createImageBitmap(file);
  } catch (e) {
    toast(pdf ? (e?.message?.startsWith('The PDF reader') ? e.message : 'That PDF couldn\'t be opened — try a screenshot of the floor plan page.')
      : 'That image couldn\'t be opened (a HEIC photo? Save it as a JPEG).');
    return;
  }
  if (!bmp) return;
  if (app.queued?.length && level == null) { await ensureTwoStorey(); level = 0; }
  planFromBitmap(bmp, level);
}

async function planFromBitmap(bmp, level) {
  // The plan kept for the job (≤2400 px) and the copy sent to be read (≤1568 px), both JPEG on white.
  const jpeg = async (max, q) => {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k)), x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(bmp, 0, 0, cv.width, cv.height);
    return { blob: await cv.convertToBlob({ type: 'image/jpeg', quality: q }), w: cv.width, h: cv.height };
  };
  // One JPEG: kept for the job, and read at full size (Opus reads up to 2576 px 1:1, so its pixel coordinates are ours).
  const keep = await jpeg(2400, 0.88);
  const fileName = 'plans/' + uuid() + '.jpg';
  app.read = { status: ASSIST() ? 'chosen' : 'measure', url: URL.createObjectURL(keep.blob), keep, fileName, result: null, error: null, north: null,
    measure: { pts: [], mm: '' }, view: null, fitted: false, level: level ?? (isDouble() ? 0 : undefined) };
  go('plan');
  render();
}

/// A safety net on the reading: rooms can't spread wider (or taller) than anything drawn on the image. If they do — the
/// reading stretched the house across the plan's white margins — they're mapped back over the drawing's own ink, that
/// axis only. Returns the corrected result, or null when it's already inside the drawing.
async function fitToInk(result, blob) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
  const g2 = new OffscreenCanvas(w, h).getContext('2d');
  g2.drawImage(bmp, 0, 0, w, h);
  const px = g2.getImageData(0, 0, w, h).data;
  const cols = new Float64Array(w), rows = new Float64Array(h);
  let total = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2] < 205) { cols[x]++; rows[y]++; total++; }
  }
  if (total < 200) return null;
  // The ink's extent, ignoring the odd speck: from the first 0.2% of it to the last.
  const span = (hist, n) => {
    let acc = 0, lo = 0, hi = n - 1;
    for (let i = 0; i < n; i++) { acc += hist[i]; if (acc >= total * 0.002) { lo = i; break; } }
    acc = 0;
    for (let i = n - 1; i >= 0; i--) { acc += hist[i]; if (acc >= total * 0.002) { hi = i; break; } }
    return [lo / n, (hi + 1) / n];
  };
  const ink = { x: span(cols, w), y: span(rows, h) };
  const pts = result.rooms.flatMap((r) => r.points ?? []);
  if (!pts.length) return null;
  const read = { x: [Math.min(...pts.map((p) => p.x)), Math.max(...pts.map((p) => p.x))], y: [Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.y))] };
  const fit = {};
  for (const ax of ['x', 'y']) {
    const rs = read[ax][1] - read[ax][0], is = ink[ax][1] - ink[ax][0];
    if (rs > 0.05 && is > 0.05 && rs > is * 1.08) fit[ax] = (v) => ink[ax][0] + (v - read[ax][0]) * is / rs;
  }
  if (!fit.x && !fit.y) return null;
  const mapP = (p) => ({ x: fit.x ? fit.x(p.x) : p.x, y: fit.y ? fit.y(p.y) : p.y });
  return { ...result, rooms: result.rooms.map((r) => {
    const points = (r.points ?? []).map(mapP);
    if (!points.length) return r;
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    return { ...r, points, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }) };
}

/// The plan read by AI (read-plan-web, up to 10 a day): its rooms, shapes, sizes and windows.
/// The plan read by AI (read-plan-web): its rooms and their printed sizes. Throws with a message to show.
async function aiReadPlan(send) {
    const b64 = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1]); r.readAsDataURL(send.blob); });
    const res = await fetch(READ_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-install-id': installId() },
      body: JSON.stringify({ image: b64, media_type: 'image/jpeg' }) });
    let data = {};
    try { data = JSON.parse((await res.text()).trim()); } catch (_) { data = { error: 'no_json' }; }
    if (!res.ok || data.error) throw new Error(({
      forbidden: 'Plan reading works on trusttrade.au.', rate_limited: 'Too many reads just now — give it a minute.',
      daily_limit: 'You\'ve used today\'s 10 free plan reads — draw this one yourself, or try again tomorrow.',
      busy: 'Plan reading is busy — try again shortly.', unavailable: 'Plan reading is turned off right now.',
      bad_image: 'That didn\'t look like a plan — try a clearer JPEG or PNG.', refused: 'That image couldn\'t be read.',
      no_json: 'No usable rooms came back from that plan.', truncated: 'That plan was too complex to read in one pass.',
    })[data.error] || ('The plan couldn\'t be read' + (res.status ? ' (' + res.status + ')' : '') + '.'));
    const result = data.result;
    if (!result?.rooms?.length) throw new Error('No rooms came back — is that definitely a floor plan?');
    return result;
}

/// The scale found by AI from the plan's printed room sizes (Jake, 16 Nov 2026: "use AI to help with the plan
/// sizing"): only the scale is taken — the rooms are still drawn by hand.
async function aiScale() {
  const r = app.read;
  if (!r || r.aiScale?.busy) return;
  r.aiScale = { busy: true };
  render();
  try {
    const result = await aiReadPlan(r.keep);
    const sc = await call('planScale', { result, imageWidth: r.keep.w, imageHeight: r.keep.h });
    r.aiScale = { mpp: sc.mpp, source: sc.source };
    if (result.north && result.north !== 'unknown' && !r.north) r.north = result.north;
  } catch (e) {
    r.aiScale = { error: e.message === 'noScale' ? 'No printed room sizes to work the scale out from. Measure a length you know instead.'
      : e instanceof TypeError ? 'AI scale works on trusttrade.au (not on a preview copy). Measure a length you know instead.' : e.message };
  }
  render();
}

async function readPlan() {
  const r = app.read;
  if (!r) return;
  r.status = 'reading';
  render();
  try {
    const result = await aiReadPlan(r.keep);
    const fitted = await fitToInk(result, r.keep.blob).catch(() => null);
    app.read.fitted = !!fitted;
    app.read.result = fitted ?? result;
    app.read.north = result.north;
    await importRead();
  } catch (e) {
    if (app.read) { app.read.status = 'error'; app.read.error = e.message; }
    render();
  }
}

/// The plan image a new one replaces, deleted (unless the other floor's on the same sheet).
function dropOldPlan(level, keep) {
  const p = app.project, files = BACKDROP_KEY.map((k) => p[k]?.file);
  const old = files[level ?? 0];
  const others = files.filter((_, lv) => lv !== (level ?? 0));
  if (old && old !== keep && !others.includes(old)) store.deleteImage(old);
  if (level == null) for (const f of files.slice(1)) if (f && f !== keep && f !== old) store.deleteImage(f);
}

async function importRead(overallMetres, mpp) {
  const r = app.read;
  const result = { ...r.result, north: r.north ?? r.result.north };
  try {
    const { project } = await call('importPlan', { project: app.project, result, imageWidth: r.keep.w, imageHeight: r.keep.h, file: r.fileName, overallMetres, mpp, level: r.level });
    await store.saveImage(r.fileName, r.keep.blob);
    dropOldPlan(r.level, r.fileName);
    app.selection = null; app.closed = new Set(); app.checkAnswers = null; app.undo = []; app.redo = [];
    await commit(project, { rerender: false });
    await loadBackdrop();
    setUnsized(false);
    r.status = 'done';
  } catch (e) {
    r.status = e.message === 'noScale' ? 'noscale' : 'error';
    r.error = e.message === 'noScale' ? null : e.message;
  }
  render();
}

/// The next floor still to draw (more than one storey): the first with no rooms and no plan, else null.
function nextFloor() {
  const v = app.view, p = app.project;
  for (let lv = 1; lv < storeyCount(); lv++) if (!v.rooms.some((x) => (x.level ?? 0) === lv) && !p[BACKDROP_KEY[lv]]) return lv;
  return null;
}
function nextFloorCard(v, r) {
  const lv = nextFloor(), q = nextQueued();
  if (!isDouble() || !v.rooms.length || (r && r.status !== 'done') || lv == null) return '';
  return `<div class="card"><h2>Now the ${floorName(lv)}</h2>
    <p class="small muted" style="margin:0 0 8px">Draw the ${floorName(lv)} from its plan. If it's on the same sheet, set each room's floor on the room list instead.</p>
    <div class="actions-row">${q ? `<button class="btn" id="upper-q">Draw the ${floorName(q.level)} (${esc(q.label)})</button>` : ''}<button class="${q ? 'btn2' : 'btn'}" id="upper">Upload its plan</button></div></div>`;
}

function renderCapture(c) {
  const r = app.read, v = app.view;
  if (!v) return;                                     // drawn again once the job's view is in
  if (r && (r.status === 'chosen' || r.status === 'measure')) { renderPlanStart(c); return; }
  if (!r && !v.rooms.length && app.project.backdrop) {
    c.innerHTML = `<div class="card" style="max-width:560px;margin:20px auto"><h2>No rooms drawn yet</h2>
      <p class="muted">The plan's in and scaled. Draw the rooms over it, corner by corner.</p>
      <div class="actions-row"><button class="btn" id="drawrooms">Draw the rooms</button><button class="btn2" id="another">Use a different plan</button></div></div>`;
    $('#drawrooms', c).onclick = () => openEditor({ mode: 'draw', guide: true });
    $('#another', c).onclick = () => pickPlan(false);
    return;
  }
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
      ${r ? `<div class="card"><h2>Reading ${r.level != null && isDouble() ? `the ${floorName(r.level)}'s plan` : 'your plan'}</h2>
        <div class="checklist" style="margin-top:6px">${steps.map((s) => `<div class="item ${s.ok ? 'ok' : s.wait ? 'info' : 'warn'}"><div class="mark">${s.ok ? '✓' : s.wait ? '<div class="spinner" style="width:12px;height:12px;border-width:2px"></div>' : '!'}</div><div><b>${esc(s.text)}</b></div></div>`).join('')}</div>
        ${r.status === 'error' ? `<p style="color:var(--danger);font-weight:600;margin:10px 0 0">${esc(r.error)}</p><div class="actions-row"><button class="btn2" id="drawit">Draw the rooms myself</button><button class="btn2" id="again">Try another plan</button><button class="btn2" id="demo2">Try the demo house</button></div>` : ''}
        ${r.status === 'noscale' ? `<p class="small muted" style="margin:10px 0 6px">The plan has no printed room sizes to scale from. How long is the house, end to end?</p>
          <div style="display:flex;gap:8px"><input class="text" id="len" type="number" min="4" max="60" step="0.1" placeholder="Metres, e.g. 18.5"><button class="btn2" id="uselen">Use it</button></div>
          <p class="small muted" style="margin:10px 0 6px">Or measure a length you know on the plan — a dimension line or the scale bar.</p><button class="btn2" id="measure">Measure it on the plan</button>` : ''}
        ${r.fitted ? '<p class="small" style="margin:10px 0 0;color:var(--accent-deep);font-weight:600">The reading had spread the rooms past the drawing; they\'ve been pulled back over it. Check them over with Fix the rooms.</p>' : ''}
        ${r.result?.notes ? `<p class="small muted" style="margin:10px 0 0">${esc(r.result.notes)}</p>` : ''}
      </div>` : ''}
      ${r?.result ? `<div class="card"><span class="eyebrow">Where does north point on the plan?</span>
        <div class="seg">${[['up', '↑ Up'], ['right', '→ Right'], ['down', '↓ Down'], ['left', '← Left']].map(([k, l]) => `<button data-north="${k}" class="${north === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="small muted" style="margin:8px 0 0">${r.result.north && r.result.north !== 'unknown' ? 'Read off the plan\'s north arrow. Change it if it\'s wrong.' : 'The plan has no north arrow — pick it so the windows face the right way.'}</p></div>` : ''}
      ${nextFloorCard(v, r)}
      ${v.rooms.length && (!r || r.status === 'done') ? `<div class="card"><div style="display:flex;align-items:center;gap:8px"><h2 style="flex:1">${v.rooms.length} rooms</h2><button class="btn small" id="fixrooms">Fix the rooms</button></div>
        <p class="small muted" style="margin:2px 0 10px">${g(v.totals.area)} m² · ${fmt(v.totals.connectedKW, 1)} kW connected${v.twoStorey ? ` · ${v.rooms.filter((x) => x.level === 1).length} upstairs` : ''}</p>
        <table class="rooms" style="width:100%"><thead><tr><th>Room</th><th class="num">Area</th><th class="num">Load</th></tr></thead><tbody>
        ${[...v.rooms].sort((x, y) => (y.level ?? 0) - (x.level ?? 0)).map((x) => `<tr><td><b style="font-weight:650">${esc(x.name)}</b>${v.twoStorey ? ` <span class="chip" style="padding:2px 8px;font-size:11px">${x.level === 1 ? 'Upper' : 'Ground'}</span>` : ''}</td>
          <td class="num">${fmt(x.area, 1)} m²</td><td class="num">${x.conditioned ? fmt(x.kw, 1) + ' kW' : '<span class="muted">not ducted</span>'}</td></tr>`).join('')}
        </tbody></table>
        <p class="small muted" style="margin:10px 0 0">Next, check the room types, open areas and the unit.</p></div>` : ''}
    </div></div>`;
  $('#another', c).onclick = () => pickPlan(true);
  $('#again', c)?.addEventListener('click', () => pickPlan(false));
  $('#demo2', c)?.addEventListener('click', async () => { const { project } = await call('demo', { project: app.project }); app.read = null; await commit(project); go('plan'); });
  $('#uselen', c)?.addEventListener('click', () => { const m = parseFloat($('#len', c).value); if (m >= 4 && m <= 60) importRead(m); else toast('A house between 4 and 60 m long.'); });
  $('#measure', c)?.addEventListener('click', () => { app.read.status = 'measure'; render(); });
  $('#drawit', c)?.addEventListener('click', () => { app.read.result = null; app.read.status = 'measure'; render(); });
  $('#fixrooms', c)?.addEventListener('click', () => openEditor());
  $('#upper', c)?.addEventListener('click', () => pickPlan(false, nextFloor()));
  $('#upper-q', c)?.addEventListener('click', useQueuedUpper);
  $('#markup', c)?.addEventListener('click', () => go('job'));
  c.querySelectorAll('[data-north]').forEach((b) => (b.onclick = () => { app.read.north = b.dataset.north; importRead(); }));
  const cv = $('#cv', c);
  if (cv) mountPlan(cv, { interactive: false, labels: true, compact: false, zoneCards: false });
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
  // The check as a few questions down the side of a big plan, one open at a time (Jake, 15 Nov 2026: "the check page
  // layout is very messy").
  const open = app.checkOpen ?? 'rooms';
  const nSuites = Object.keys(a.suites).length;
  const sec = (k, n, title, summary, body) => `<section class="q-sec ${open === k ? 'open' : ''}">
    <button class="q-head" data-q="${k}"><span class="q-n">${n}</span><span class="q-t"><b>${title}</b><small>${summary}</small></span>${icon('chev', 'q-chev')}</button>
    ${open === k ? `<div class="q-body">${body}</div>` : ''}</section>`;
  const roomsBody = `
      <table class="rooms"><thead><tr><th></th><th>Room</th><th>Type</th>${storeyCount() > 1 ? '<th>Floor</th>' : ''}<th>Built</th><th class="num">Ceiling</th></tr></thead><tbody>
        ${v.rooms.map((r) => `<tr><td><span class="sw" style="background:${r.zone != null ? zoneColour(r.zone) : '#C6CBD3'}"></span></td>
          <td><input class="text" data-name="${r.id}" value="${esc(r.name)}"></td>
          <td><select data-type="${r.id}">${o.roomTypes.map((x) => `<option value="${x.id}" ${x.id === r.type ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></td>
          ${storeyCount() > 1 ? `<td><select data-level="${r.id}">${Array.from({ length: Math.max(storeyCount(), (r.level ?? 0) + 1) }, (_, lv) => `<option value="${lv}" ${lv === (r.level ?? 0) ? 'selected' : ''}>${FloorName(lv).replace(' floor', '')}</option>`).join('')}</select></td>` : ''}
          <td><select data-built="${r.id}" title="An extension or the old part: built at another time than the house">${eraOptions(r.era)}</select></td>
          <td class="num"><input class="text" data-ceil="${r.id}" type="number" min="2.1" max="6" step="0.05" value="${(r.ceiling ?? 2.4).toFixed(2)}" style="width:68px;text-align:right" title="Ceiling height, m${r.ceilingHigh ? ' (its low side)' : ''}">${r.ceilingHigh ? `<div class="small muted" style="white-space:nowrap">${r.ceilingStyle === 'cathedral' ? 'cathedral' : 'raked'}, to ${fmt(r.ceilingHigh, 2)}</div>` : ''}</td></tr>`).join('')}
      </tbody></table>
      ${a.pc.gaps.length ? `<span class="eyebrow" style="display:block;margin:12px 0 4px">Gaps between rooms</span><p class="small muted" style="margin:0 0 6px">Floor no room covers. On, it becomes part of the room it opens off.</p>
        ${a.pc.gaps.map((x) => `<label class="kv" style="cursor:pointer"><span><b style="font-weight:700">${x.outdoorish ? 'Outside, by the look of it' : x.joins ? 'Part of the ' + esc(roomName(x.joins)) : 'A hallway of its own'}</b><br><span class="small muted">${fmt(x.area, 1)} m²</span></span>
          <input type="checkbox" data-gap="${esc(x.key)}" ${a.gapsOn.has(x.key) ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--ink)"></label>`).join('')}` : ''}
      <p class="small muted" style="margin:8px 0 0">Ceilings come from New job; change a room's here, or tap the room on the plan to make it raked or cathedral (a high ceiling adds to its load). An extension? Set <b>Built</b> on its rooms: their walls, insulation and glass then go by that era, not the house's.</p>
      <div class="actions-row"><button class="btn2" id="editrooms">Edit the rooms on the plan</button></div>`;
  const areasBody = `<p class="small muted" style="margin:0 0 8px">Rooms with no doors between them, say kitchen, dining and family, are heated and cooled as one space, on one zone.</p>
      ${a.openAreas.map((grp, i) => `<div class="kv"><span>${grp.map(roomName).map(esc).join(' + ')}</span><button class="link" data-split="${i}">Split</button></div>`).join('') || '<p class="small muted">No open areas.</p>'}
      <button class="btn2" id="addarea" style="margin-top:8px">${a.openAreas.length ? 'Add another open area' : 'Add an open area'}</button>
      ${wet.length && beds.length ? `<span class="eyebrow" style="display:block;margin:14px 0 4px">Ensuites</span><p class="small muted" style="margin:0 0 6px">An ensuite goes on its bedroom's zone.</p>
        ${wet.map((r) => `<div class="kv"><span>${esc(r.name)}</span><select data-suite="${r.id}" class="text" style="width:auto">
          <option value="">Not an ensuite</option>${beds.map((b) => `<option value="${b.id}" ${a.suites[r.id] === b.id ? 'selected' : ''}>Ensuite to ${esc(b.name)}</option>`).join('')}</select></div>`).join('')}` : ''}`;
  c.innerHTML = `<div class="work check-work">
    <div class="stage">
      ${isUnsized() ? `<div class="card" style="border:2px solid var(--accent);margin-bottom:10px"><h2>The plan isn't sized yet</h2><p class="small muted" style="margin:2px 0 10px">The rooms were drawn by hand: set the size from one wall you know before the loads and ducts mean anything.</p><button class="btn" id="sizeit">Set the size</button></div>` : ''}
      <div class="bar"><b>${v.rooms.length} rooms · ${fmt(t.area)} m² · ${fmt(t.connectedKW, 1)} kW</b><div class="spacer" style="flex:1"></div><button class="btn2 small" id="editrooms2">Edit the rooms</button></div>
      <div class="canvas-card" style="cursor:pointer"><canvas id="cv"></canvas></div>
      <div class="hint">${a.pc.gaps.length ? 'Shaded: floor no room covers. ' : ''}Click a room on the plan to move its walls and corners, reshape it or draw one in.</div>
    </div>
    <div class="panel q-panel">
      ${isUnsized() ? '' : `<section class="q-sec" style="padding:16px 16px 12px">${houseFacts(v, 'data-openroom')}</section>`}
      ${sec('rooms', 1, 'Rooms', `${v.rooms.length} rooms · ${v.rooms.filter((r) => r.conditioned).length} air conditioned${a.pc.gaps.length ? ` · ${a.pc.gaps.length} gap${a.pc.gaps.length === 1 ? '' : 's'}` : ''}`, roomsBody)}
      ${sec('areas', 2, 'Open areas and ensuites', `${a.openAreas.length || 'No'} open area${a.openAreas.length === 1 ? '' : 's'}${wet.length && beds.length ? ` · ${nSuites || 'no'} ensuite${nSuites === 1 ? '' : 's'}` : ''}`, areasBody)}
      <section class="q-sec ifoot" style="border-radius:18px;border:0"><span><small>${v.rooms.length} room${v.rooms.length === 1 ? '' : 's'} drawn</small><b>${fmt(t.wholeHomeKW ?? t.connectedKW, 1)} kW whole home</b></span>
        <button class="btn" id="check-next">${ctaLabel(isSplit() ? 'Lay out the heads →' : 'Place the unit →')}</button></section>
    </div></div>`;
  const plan = mountPlan($('#cv', c), { interactive: false, labels: true, compact: true, zoneCards: false, gaps: a.pc.gaps.map((x) => ({ ...x, on: a.gapsOn.has(x.key) })),
    handlers: { tapRoom: (w) => openEditor({ room: w && v.rooms.find((r) => pointInPolygon(w, r.polygon))?.id }) } });
  $('#check-next', c)?.addEventListener('click', confirmPlan);
  c.querySelectorAll('[data-openroom]').forEach((b) => (b.onclick = () => openEditor({ room: b.dataset.openroom })));
  $('#editrooms', c)?.addEventListener('click', () => openEditor());
  $('#editrooms2', c)?.addEventListener('click', () => openEditor());
  $('#sizeit', c)?.addEventListener('click', () => openEditor({ mode: 'measure' }));
  c.querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => { app.checkOpen = app.checkOpen === b.dataset.q || (!app.checkOpen && b.dataset.q === 'rooms') ? 'none' : b.dataset.q; renderCheck(c); }));
  c.querySelectorAll('[data-name]').forEach((inp) => inp.addEventListener('change', () => roomEdit(inp.dataset.name, { name: inp.value })));
  c.querySelectorAll('[data-type]').forEach((sel) => sel.addEventListener('change', () => roomEdit(sel.dataset.type, { type: sel.value })));
  c.querySelectorAll('[data-built]').forEach((sel) => sel.addEventListener('change', () => roomEdit(sel.dataset.built, { era: sel.value })));
  c.querySelectorAll('[data-level]').forEach((sel) => sel.addEventListener('change', async () => {
    await edit('setRoomLevel', { room: sel.dataset.level, level: +sel.value });
    app.checkAnswers = null; render();
  }));
  c.querySelectorAll('[data-ceil]').forEach((inp) => inp.addEventListener('change', () => { const h = parseFloat(inp.value); if (h >= 2.1 && h <= 6) roomEdit(inp.dataset.ceil, { height: h }); }));
  c.querySelectorAll('[data-split]').forEach((b) => (b.onclick = () => { a.openAreas.splice(+b.dataset.split, 1); renderCheck(c); }));
  c.querySelectorAll('[data-suite]').forEach((s) => (s.onchange = () => { if (s.value) a.suites[s.dataset.suite] = s.value; else delete a.suites[s.dataset.suite]; }));
  c.querySelectorAll('[data-gap]').forEach((cb) => (cb.onchange = () => { cb.checked ? a.gapsOn.add(cb.dataset.gap) : a.gapsOn.delete(cb.dataset.gap); plan.set({ gaps: a.pc.gaps.map((x) => ({ ...x, on: a.gapsOn.has(x.key) })) }); }));
  $('#addarea', c)?.addEventListener('click', () => pickOpenArea(c));
}

/// When a room was built: as the house, or an era of its own (an extension).
function eraOptions(era) {
  const house = app.options.eras.find((e) => e.id === app.project.site.eraPref);
  return `<option value="house" ${era ? '' : 'selected'}>As the house${house ? ` (${esc(house.short)})` : ''}</option>`
    + app.options.eras.map((e) => `<option value="${e.id}" ${e.id === era ? 'selected' : ''}>${esc(e.short)}</option>`).join('');
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

/// The unit's too big for a single-phase house (20 kW and up are three phase only).
function needsThreePhase(t, site) { return !!t.unit && t.unit.brand !== 'kaden' && t.unit.kw > 18 && !site.threePhasePref; }

/// The job's brand of ducted unit, and its range (the engine's Designer.units(brand)).
const brandId = () => app.project?.site?.brandPref ?? 'mitsubishi';
const brandNow = () => app.options.brands?.find((b) => b.id === brandId()) ?? { id: 'mitsubishi', label: 'Mitsubishi Electric', units: app.options.units };
/// The biggest ducted unit in the job's brand.
function biggestUnitKW(site = app.project?.site ?? {}) { return Math.max(...unitsOnSupply(site).map((u) => u.kw)); }
/// The units the house's power supply can run: single phase never lists a three-phase-only unit (Jake, 19 Nov 2026).
function unitsOnSupply(site = app.project?.site ?? {}) {
  const all = brandNow().units;
  if (brandId() === 'kaden' || site.threePhasePref) return all;
  const one = all.filter((u) => !u.threePhaseOnly);
  return one.length ? one : all;
}
function bindBrand(c) {
  c.querySelectorAll('[data-brand]').forEach((b) => (b.onclick = () => {
    if (b.dataset.brand === brandId()) return;
    commit({ ...app.project, site: { ...app.project.site, brandPref: b.dataset.brand === 'mitsubishi' ? null : b.dataset.brand, unitKWPref: null } }, { undoable: true });
  }));
}

function bindUnitOptions(c) {
  const set = (site) => commit({ ...app.project, site: { ...app.project.site, ...site } });
  c.querySelectorAll('[data-sizing]').forEach((b) => (b.onclick = () => set({ unitSizingPref: b.dataset.sizing, unitKWPref: null })));
  $('#unitkw', c)?.addEventListener('change', (e) => set({ unitKWPref: e.target.value ? parseFloat(e.target.value) : null }));
  c.querySelectorAll('[data-phase]').forEach((b) => (b.onclick = () => {
    const three = b.dataset.phase === '1', kw = app.project.site.unitKWPref;
    // Going single phase drops a hand-picked three-phase-only size.
    const drop = !three && kw != null && brandNow().units.some((u) => u.threePhaseOnly && Math.abs(u.kw - kw) < 0.01);
    set({ threePhasePref: three ? true : null, ...(drop ? { unitKWPref: null } : {}) });
  }));
  bindBrand(c);
  c.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => openCatalogue()));
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

/// JSON with every object's keys sorted: the engine writes the same room back with its keys in another order, which
/// a plain JSON.stringify read as a change (and so wiped the ducts every time the rooms were confirmed again).
function stableJSON(x) {
  if (Array.isArray(x)) return '[' + x.map(stableJSON).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + stableJSON(x[k])).join(',') + '}';
  return JSON.stringify(x);
}

async function confirmPlan() {
  const a = app.checkAnswers;
  if (!a) { go('equipment'); return; }
  const suites = {};
  for (const [k, v] of Object.entries(a.suites)) if (v) suites[k] = v;
  const { project } = await call('confirmPlan', { project: app.project, openAreas: a.openAreas, suites, gaps: [...a.gapsOn] });
  app.checkAnswers = null;
  // Rooms changed: the design is made again (the app designs once the plan's checked).
  const roomsChanged = app.roomsEdited || stableJSON(project.rooms) !== stableJSON(app.project.rooms);
  app.roomsEdited = false;
  await commit(roomsChanged ? { ...project, design: null } : project, { rerender: false });
  go('equipment');
}

/// The Equipment stage: what goes in — the unit and its size, the zoning, and where the spare air spills — beside the
/// plan with its zones. A multi-head split's heads and outdoor units are laid out here instead (renderSplitDesign).
async function renderEquipment(c) {
  const v = app.view, p = app.project, o = app.options;
  if (!v.planChecked) {
    c.innerHTML = `<div class="card empty" style="max-width:560px;margin:20px auto"><h2>Check the rooms first</h2><p>The equipment is sized once the rooms, open areas and ensuites are checked.</p><button class="btn" data-go="plan" style="margin-top:12px">Check the rooms</button></div>`;
    c.querySelector('[data-go]').onclick = () => go('plan');
    return;
  }
  if (isSplit()) { renderSplitDesign(c); return; }
  const cards = app.cards = await call('systemCards', { project: p });
  if (app.step !== 'equipment' && app.step !== 'design') return;           // moved on while the engine answered
  // A two-system job: the unit, zoning and spill are system A's (the house less B's rooms).
  const mixed = isMixed(), dv = ductedView();
  const t = dv.totals, zl = o.zonings.find((z) => z.id === (p.site.zoningPref ?? 'perroom'));
  const zones = new Set(dv.rooms.filter((r) => r.conditioned && r.zone != null && r.zone !== 0).map((r) => r.zone)).size;
  // Every choice laid out to tap, top to bottom (Jake, 22 Nov 2026: "like build a bear where you have options to just
  // click"): the system, the brand, the power, the size, the zoning, the spill, then a second system if it wants one.
  const site = p.site, kaden = brandId() === 'kaden', k = jobKind();
  let n = 0;
  const step = (title, summary, body, done = true) => {
    const num = ++n;
    return `<section class="cfg ${done ? 'done' : ''}"><div class="cfg-head"><span class="q-n">${done ? icon('check') : num}</span><b>${title}</b><small>${summary}</small></div>${body}</section>`;
  };
  const tile = (attr, on, title, sub = '', tag = '') => `<button class="tile ${on ? 'on' : ''}" ${attr}>${tag ? `<span class="tag">${tag}</span>` : ''}<b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const KINDS = [['ducted', 'Ducted', 'New unit, ducts and zones'], ['reduct', 'Re-duct', 'New ducts, the unit stays'], ['bulkhead', 'Bulkhead', 'A slim unit in each room'],
    ['vrf', 'VRF', 'City Multi, any head'], ['wall', 'Wall split', 'Wall heads, room by room']];
  const kindBody = `<div class="tilegrid">${KINDS.map(([id, tt, sub]) => tile(`data-sys="${id}"`, k === id, tt, sub)).join('')}</div>
    ${k === 'reduct' ? `<div class="rowpick" style="margin-top:8px"><label>What's there</label><select id="ex-kind">
      <option value="aircon" ${p.existing?.kind !== 'heater' ? 'selected' : ''}>Ducted air conditioner</option>
      <option value="heater" ${p.existing?.kind === 'heater' ? 'selected' : ''}>Gas ducted heater</option></select></div>` : ''}`;
  const brands = o.brands ?? [];
  const brandBody = `<div class="tilegrid two">${brands.map((b) => tile(`data-brand="${b.id}"`, b.id === brandId(), esc(b.label), b.id === 'kaden' ? 'Single phase, 7 to 17 kW' : 'Up to 18 kW single, 24.5 kW three phase')).join('')}</div>`;
  const phaseBody = kaden ? '<p class="small muted" style="margin:0">Kaden\'s ducted range is single phase only.</p>'
    : `<div class="tilegrid two">${tile('data-phase="0"', !site.threePhasePref, 'Single phase', 'Up to 18 kW')}${tile('data-phase="1"', !!site.threePhasePref, 'Three phase', 'Up to 24.5 kW')}</div>
      <p class="small muted">Check the switchboard if you're not sure.</p>`;
  const ch = t.choices ?? {}, load = t.wholeHomeKW ?? t.connectedKW;
  const pct = t.unit && load ? Math.round(t.unit.kw / load * 100) : null;
  const rec = ch.balanced ?? ch.wholeHome, share = t.homeShare ?? 0.75, sized = t.balancedKW ?? load * share;
  const sizeTag = (u) => (u.kw === rec?.kw ? 'Recommended' : u.kw === ch.zoned?.kw ? 'Zoned use' : u.kw === ch.margin?.kw ? 'More margin' : u.kw === ch.wholeHome?.kw ? 'Whole home peak' : '');
  const zl2 = (zl?.label ?? '').toLowerCase();
  const why = !t.unit ? '' : t.byHand ? `Picked by hand: ${pct}% of the full open home's ${fmt(load, 1)} kW.`
    : t.sizing === 'zoned' ? `Zoned use only: ${fmt(t.designKW, 1)} kW with never every zone on at once (${zl2} zoning, ${fmt(t.diversity * 100)}% diversity). The full open home is ${fmt(load, 1)} kW.`
    : t.sizing === 'margin' ? `One size up from the recommended: the hottest days, bigger windows than the plan shows, a room added later.`
    : t.sizing === 'wholeHome' ? `Sized for every room flat out at the same moment (${fmt(load, 1)} kW). It turns down as zones shut.`
    : `Sized for ${fmt(sized, 1)} kW: three-quarters of the ${fmt(load, 1)} kW with every room flat out at once. It runs the whole home open and brings a zone or two down quickly.`;
  const over = sized > biggestUnitKW(site) * 1.06;
  const sizeBody = `<div class="tilegrid sizes-grid">${unitsOnSupply(site).map((u) => tile(`data-unitkw="${u.kw}"`, t.unit?.kw === u.kw, `${g(u.kw)} kW`, `${fmt(u.lps)} L/s · ${load ? Math.round(u.kw / load * 100) : '—'}% of peak`, sizeTag(u))).join('')}</div>
    <p class="small muted">${why}</p>
    ${over ? `<p class="small" style="color:var(--accent-deep);font-weight:600">This home wants more than ${g(biggestUnitKW(site))} kW, the biggest ${!kaden && !site.threePhasePref ? 'unit on single phase: go three phase if the switchboard has it, or add a second system below.' : 'ducted unit: add a second system below.'}</p>` : ''}
    ${needsThreePhase(t, site) ? `<p class="small" style="color:var(--danger);font-weight:600">${g(t.unit.kw)} kW needs a three-phase supply.</p>` : ''}
    ${t.unit ? `<div class="kv" style="margin-top:8px"><span>Fan on high</span><b>${fmt(t.unit.lps)} L/s · up to ${fmt(t.unit.esp)} Pa${t.unit.espConfirmed === false ? ' <span class="muted small" style="font-weight:500">(check the manual)</span>' : ''}</b></div>` : ''}
    <div class="actions-row"><button class="btn2 small" data-sizehow>How it's worked out</button><button class="btn2 small" data-cat>Browse the catalogue</button></div>`;
  const zoningBody = `<div class="tilegrid two">${o.zonings.map((z) => tile(`data-zoning="${z.id}"`, z.id === (site.zoningPref ?? 'perroom'), esc(z.label), esc(z.note ?? ''))).join('')}</div>
    <p class="small muted">Tap a room on Air &amp; pipes to give it its own zone or leave it always on.</p>`;
  const spillDone = !!cards && (cards.oneZone || cards.needsSpill === false || cards.current != null || !!cards.outlet);
  const unitTitle = mixed ? `Size · system ${ductedB() ? sysView() : 'A'}` : 'Size';
  c.innerHTML = `<div class="work check-work">
    <div class="stage">
      <div class="bar"><div class="stats"><div><b>${t.unit ? g(t.unit.kw) + ' kW' : '—'}</b><span>unit</span></div><div><b>${fmt(t.wholeHomeKW ?? t.connectedKW, 1)} kW</b><span>whole home peak</span></div>
        <div><b>${pct != null ? pct + '%' : '—'}</b><span>of the peak</span></div><div><b>${zones || '—'}</b><span>zones</span></div></div>
        <div class="spacer" style="flex:1"></div>${ductedB() ? sysTabs() : ''}</div>
      <div class="canvas-card"><canvas id="cv"></canvas>${zoomCtl()}</div>
      <div class="hint">${app.assigning ? `<b>Tap a room to put it on system B</b> (green), and tap it again to put it back on the ducts. An open area moves as one. <button class="link" id="assign-done">Done</button>`
        : `Rooms are coloured by zone${mixed ? '; system B\'s are green' : ''}.${app.project.design?.outlets?.length ? ' The ducts are changed on Air &amp; pipes.' : ' The ducts, outlets and fan coil come next, on Air &amp; pipes.'}`}</div>
    </div>
    <div class="panel q-panel cfg-panel">
      ${step('System', esc(KINDS.find(([id]) => id === k)?.[1] ?? ''), kindBody)}
      ${p.existing ? '' : step('Brand', esc(brandNow().label), brandBody)}
      ${p.existing ? '' : step('Power', kaden || !site.threePhasePref ? 'Single phase' : 'Three phase', phaseBody)}
      ${step(p.existing ? 'Size nearest the unit that\'s there' : unitTitle, t.unit ? esc(t.unit.label) : 'Not sized yet', sizeBody, !!t.unit)}
      ${step('Zoning', esc(zl?.label ?? ''), zoningBody)}
      ${step('Spill', cards?.needsSpill === false ? 'Nothing more to fit' : cards?.oneZone ? 'One zone' : 'Where spare air goes', spillCard(cards, p), spillDone)}
      ${step('Second system', mixed ? `A ducted · B ${esc(B_KINDS.find(([kk]) => kk === bKind())[1].toLowerCase())}` : 'Optional', systemsBody(p, dv), mixed)}
    </div></div>`;
  const plan = mountPlan($('#cv', c), {
    interactive: false, labels: true, compact: true, split: mixed && !ductedB() ? app.split : null, both: mixed && !ductedB(), splitAir: false,
    handlers: { tapRoom: (w) => { if (app.assigning && w) toggleRoomOnB(w); } },
  });
  bindSystems(c);
  bindZoomCtl(c, plan);
  bindSystemSwitch(c);
  bindSysTabs(c);
  bindUnitOptions(c);
  bindSpill(c);
  $('#ex-kind', c)?.addEventListener('change', (e) => edit('setExisting', { choice: e.target.value }));
  // A size tapped: the recommended, zoned or margin pick by name (so it follows the load), any other by hand.
  c.querySelectorAll('[data-unitkw]').forEach((b) => (b.onclick = () => {
    const kw = parseFloat(b.dataset.unitkw);
    const sizing = kw === (ch.balanced ?? ch.wholeHome)?.kw ? (ch.balanced ? 'balanced' : 'wholeHome') : kw === ch.zoned?.kw ? 'zoned' : kw === ch.margin?.kw ? 'margin' : kw === ch.wholeHome?.kw ? 'wholeHome' : null;
    commit({ ...app.project, site: { ...app.project.site, ...(sizing ? { unitSizingPref: sizing, unitKWPref: null } : { unitKWPref: kw }) } });
  }));
  c.querySelectorAll('[data-zoning]').forEach((b) => (b.onclick = async () => { await commit({ ...app.project, site: { ...app.project.site, zoningPref: b.dataset.zoning } }, { rerender: false }); render(); }));
}

/// Equipment's Systems section: one ducted system, or ducted (A) plus a split (B) for some rooms (Jake, 16 Nov 2026:
/// "ducted plus bulkhead on one job").
function systemsBody(p, dv) {
  if (!isMixed()) {
    return `<p class="small muted" style="margin:0 0 10px">One system: ducted, to every room. Add a second for rooms the ducts can't reach, like an extension with no roof space: bulkhead, wall or VRF heads on an outdoor unit of their own.</p>
      ${app.assigning ? '<p class="small" style="margin:0 0 8px;font-weight:600">Tap the rooms for system B on the plan.</p><button class="btn2 small" id="sys-cancel">Cancel</button>'
        : '<button class="btn2" id="sys-add">+ Add a second system</button>'}`;
  }
  if (ductedB()) return ductedSystemsBody(p);
  const sp = app.split, heads = sp?.heads ?? [], kw = heads.reduce((s, h) => s + h.coolKW, 0);
  const aRooms = dv.rooms.filter((r) => r.conditioned).length, bRooms = p.rooms.filter((r) => onB(r.id));
  const vrf = isVrfB(p) ? vrfPick(dv, null, heads) : null;
  const kinds = [...new Set(heads.map((h) => HEAD_KINDS[h.kind]).filter(Boolean))].join(', ').toLowerCase();
  return `<div class="sys-row"><span class="sys-tag a">A</span><span class="grow"><b>Ducted</b><small>${aRooms} room${aRooms === 1 ? '' : 's'} · ${dv.totals.unit ? g(dv.totals.unit.kw) + ' kW unit' : 'not sized yet'}</small></span></div>
    <div class="sys-row"><span class="sys-tag b">B</span><span class="grow"><b>${vrf ? 'VRF heads' + (kinds ? ' · ' + esc(kinds) : '') : esc(sp?.range?.name ?? B_KINDS.find(([k]) => k === bKind())[1])}</b><small>${bRooms.map((r) => esc(r.name)).join(', ')} · ${heads.length} head${heads.length === 1 ? '' : 's'}${kw ? ', ' + g(Math.round(kw * 10) / 10) + ' kW' : ''} · ${vrf ? "on A's outdoor" : (sp?.outdoors?.length ?? 0) + ' outdoor'}</small></span></div>
    ${vrf ? vrfRow(vrf, 'fan coil and heads') : ''}
    ${bKindSeg()}
    ${vrf ? '<p class="small muted" style="margin:8px 0 0">On the VRF each room\'s head can be a bulkhead, wall head, cassette or ducted unit: tap a head on Air &amp; pipes, under B.</p>' : ''}
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px"><button class="btn2 small" id="sys-assign">${app.assigning ? 'Done moving rooms' : 'Move rooms between A and B'}</button><span style="flex:1"></span><button class="link" id="sys-remove">Remove system B</button></div>
    <p class="small muted" style="margin:8px 0 0">B's heads and outdoor unit are laid out on Air &amp; pipes, under B.</p>`;
}
/// Two ducted systems on one VRF outdoor: each one's rooms and unit, and the outdoor that runs both.
function ductedSystemsBody(p) {
  const views = activeSys(p) === 'A' ? { A: app.ductView, B: app.otherView } : { A: app.otherView, B: app.ductView };
  const row = (n) => {
    const v = views[n], rooms = p.rooms.filter((r) => onB(r.id) === (n === 'B') && v?.rooms.find((q) => q.id === r.id)?.conditioned);
    const u = v?.totals?.unit, designed = n === activeSys(p) ? !!p.design : !!p.other?.design;
    return `<div class="sys-row"><span class="sys-tag ${n.toLowerCase()}">${n}</span><span class="grow"><b>Ducted${n === activeSys(p) ? ' · on screen' : ''}</b><small>${rooms.map((r) => esc(r.name)).join(', ') || 'No rooms'} · ${u ? g(u.kw) + ' kW fan coil' : 'not sized yet'}${designed ? '' : ' · not designed yet'}</small></span></div>`;
  };
  const vrf = vrfPick(views.A, views.B);
  return `${row('A')}${row('B')}
    ${vrfRow(vrf, 'fan coils')}
    ${bKindSeg()}
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px"><button class="btn2 small" id="sys-assign">${app.assigning ? 'Done moving rooms' : 'Move rooms between A and B'}</button><span style="flex:1"></span><button class="link" id="sys-remove">Remove system B</button></div>
    <p class="small muted" style="margin:8px 0 0">Each has its own fan coil and ducts in its own roof space. Pick A or B up top to size and lay out that one; the outdoor unit is A's (B's pipes run to it).</p>`;
}
/// The one VRF outdoor for two ducted systems: the smallest City Multi PUMY that covers the whole home and takes both
/// fan coils (single phase: the SP models).
function vrfPick(va, vb, heads = null) {
  const range = app.options?.splitRanges?.find((r) => r.id === 'mitsubishi-pumy');
  const load = (va?.totals?.wholeHomeKW ?? va?.totals?.connectedKW ?? 0)
    + (heads ? heads.reduce((t, h) => t + h.loadKW, 0) : (vb?.totals?.wholeHomeKW ?? vb?.totals?.connectedKW ?? 0));
  const indoor = (va?.totals?.unit?.kw ?? 0) + (heads ? heads.reduce((t, h) => t + h.coolKW, 0) : (vb?.totals?.unit?.kw ?? 0));
  const single = !app.project?.site?.threePhasePref, branch = !!heads?.some((h) => h.kind !== 'ducted');
  return { pick: pickVrf(range, load, indoor, single, branch), load, indoor, single, branch };
}
/// The Systems card's VRF outdoor row.
function vrfRow(vrf, what) {
  return `<div class="sys-row"><span class="sys-tag" style="background:var(--ink,#1B1F24);color:#fff">V</span><span class="grow"><b>${vrf.pick ? 'VRF outdoor · Mitsubishi Electric ' + esc(vrf.pick.model) : 'VRF outdoor · none fits'}</b><small>${vrf.pick ? g(vrf.pick.kw) + ' kW, runs the ' + what : 'Past a ' + (vrf.single ? 'single phase ' : '') + 'PUMY'} · ${fmt(vrf.load, 1)} kW of home, ${fmt(vrf.indoor, 1)} kW of indoor units${vrf.branch ? ' (100% most with branch boxes)' : ''}</small></span></div>`;
}
function bindSystems(c) {
  const on = (sel, f) => { const b = $(sel, c); if (b) b.onclick = f; };
  on('#sys-add', () => { app.assigning = true; render(); });
  on('#sys-cancel', () => { app.assigning = false; render(); });
  on('#assign-done', () => { app.assigning = false; render(); });
  on('#sys-assign', () => { app.assigning = !app.assigning; render(); });
  on('#sys-remove', async () => {
    app.assigning = false; app.sysView = 'A';
    let p = app.project;
    if (ductedB() && activeSys(p) === 'B') p = swapSystems(p);
    p = { ...p }; delete p.systemB; delete p.other; delete p.vrfSpot; delete p.activeSys;
    await commit(withSplitRooms(p, []), { undoable: true });
  });
  bindSysTabs(c);
}
/// B's kind: bulkhead, VRF or wall heads (each brand's own range).
function bKindSeg() {
  return `<div class="seg" title="System B">${B_KINDS.map(([id, t]) => `<button data-bkind="${id}" class="${bKind() === id ? 'on' : ''}">${t}</button>`).join('')}</div>`;
}
/// Air & pipes on a two-system job: the ducts (A) or the split's heads (B).
function sysTabs() {
  return `<div class="seg sys-tabs"><button data-sysview="A" class="${sysView() !== 'B' ? 'on' : ''}"><i class="sys-tag a">A</i>Ducts</button><button data-sysview="B" class="${sysView() === 'B' ? 'on' : ''}"><i class="sys-tag b">B</i>${ductedB() ? 'Ducts' : esc(B_KINDS.find(([k]) => k === bKind())[1])}</button></div>`;
}
function bindSysTabs(c) {
  c.querySelectorAll('[data-sysview]').forEach((b) => (b.onclick = () => showSys(b.dataset.sysview)));
  c.querySelectorAll('[data-bkind]').forEach((b) => (b.onclick = () => setBKind(b.dataset.bkind)));
}
async function setBKind(kind) {
  if (kind === bKind()) return;
  app.selection = null; app.addMode = false;
  if (kind === 'ducted') {
    // Ducted: B gets a fan coil, ducts and vents of its own (Air & pipes, under B), on the same VRF outdoor as A.
    await commit({ ...app.project, systemB: 'ducted' }, { undoable: true });
    toast('System B is ducted: its own fan coil and ducts, on one VRF outdoor with A.');
    return;
  }
  // From ducted: A back in front, B's ducted design kept aside (back if it's made ducted again).
  let p = app.project;
  if (ductedB()) { if (activeSys(p) === 'B') p = swapSystems(p); p = { ...p }; delete p.systemB; delete p.vrfSpot; }
  const kaden = brandId() === 'kaden';
  const key = kind === 'vrf' ? 'mitsubishi-pumy' : kind === 'wall' ? (kaden ? 'kaden-ksi' : 'mitsubishi-msz') : (kaden ? 'kaden-km' : 'mitsubishi-mxz');
  const r = await call('edit', { project: p, op: 'setSplitRange', key }).catch(() => null);
  await commit(r?.ok === false || !r?.project ? p : r.project, { undoable: true });
}
/// A two-system job's A or B on screen. Two ducted systems: their designs swap over, so every screen works on the one
/// in front; B's ducts start (fan coil and return in its rooms) the first time it's opened on Air & pipes.
async function showSys(sys) {
  app.selection = null; app.addMode = false;
  if (!ductedB()) { app.sysView = sys; render(); return; }
  if (sys === activeSys(app.project)) return;
  await commit(swapSystems(app.project));
  if (app.step === 'design' && !app.project.design) startDesign();
}
/// A tap on Equipment's plan while moving rooms: the room (or its whole open area) to system B, or back to the ducts.
async function toggleRoomOnB(w) {
  const p = app.project;
  const vr = app.view.rooms.find((r) => r.polygon?.length >= 3 && pointInPolygon(w, r.polygon));
  if (!vr) return;
  if (!vr.conditioned) { toast(`${vr.name} isn't heated or cooled.`); return; }
  const pr = p.rooms.find((r) => r.id === vr.id);
  const group = pr?.openArea != null ? p.rooms.filter((r) => r.openArea === pr.openArea).map((r) => r.id) : [vr.id];
  const on = new Set(p.splitRooms ?? []);
  const adding = !on.has(vr.id);
  for (const id of group) { if (adding) on.add(id); else on.delete(id); }
  if (!app.view.rooms.some((r) => r.conditioned && !on.has(r.id))) { toast('Leave a room on the ducts, or make it a split job on New job.'); return; }
  await commit(withSplitRooms(p, [...on]), { undoable: true });
}

// MARK: Capture by hand — the scale measured on the plan

/// The plan image on its own, to pick the two ends of a length on it (in the image's pixels). Scroll or pinch to zoom,
/// drag to pan, drag an end to fine-tune it, click to start a new length.
function mountMeasure(cv, url, m, { interactive, onChange, view }) {
  const img = new Image();
  const st = view ?? { zoom: 1, pan: { x: 0, y: 0 } };
  let k = 1, ox = 0, oy = 0;
  const place = () => {
    const W = cv.clientWidth, H = cv.clientHeight;
    const k0 = Math.min((W - 24) / img.naturalWidth, (H - 24) / img.naturalHeight);
    k = k0 * st.zoom;
    ox = (W - img.naturalWidth * k) / 2 + st.pan.x; oy = (H - img.naturalHeight * k) / 2 + st.pan.y;
  };
  const toImg = (q) => ({ x: (q.x - ox) / k, y: (q.y - oy) / k });
  const toScr = (p) => ({ x: ox + p.x * k, y: oy + p.y * k });
  const draw = () => {
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H || !img.naturalWidth) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g2 = cv.getContext('2d');
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    g2.clearRect(0, 0, W, H);
    place();
    g2.imageSmoothingQuality = 'high';
    g2.drawImage(img, ox, oy, img.naturalWidth * k, img.naturalHeight * k);
    const pts = m.pts.map(toScr);
    if (pts.length === 2) {
      g2.beginPath(); g2.moveTo(pts[0].x, pts[0].y); g2.lineTo(pts[1].x, pts[1].y);
      g2.strokeStyle = T.cool; g2.lineWidth = 3; g2.stroke();
    } else if (pts.length === 1 && hover) {
      const h = toScr(hover);
      g2.save(); g2.setLineDash([7, 5]);
      g2.beginPath(); g2.moveTo(pts[0].x, pts[0].y); g2.lineTo(h.x, h.y);
      g2.strokeStyle = T.cool; g2.lineWidth = 2.5; g2.stroke(); g2.restore();
      g2.beginPath(); g2.arc(h.x, h.y, 5, 0, Math.PI * 2); g2.fillStyle = T.cool; g2.fill();
    }
    for (const p of pts) {
      g2.beginPath(); g2.arc(p.x, p.y, 9, 0, Math.PI * 2); g2.fillStyle = 'rgba(43,108,176,0.15)'; g2.fill();
      g2.beginPath(); g2.moveTo(p.x - 12, p.y); g2.lineTo(p.x + 12, p.y); g2.moveTo(p.x, p.y - 12); g2.lineTo(p.x, p.y + 12);
      g2.strokeStyle = T.cool; g2.lineWidth = 2; g2.stroke();
    }
  };
  img.onload = draw;
  img.src = url;
  new ResizeObserver(draw).observe(cv);
  let hand = false, hover = null;
  /// The length is always dead level or plumb with its other end (Jake, 22 Nov 2026: "when drawing this line it should
  /// always be straight"): a plan's sizes run across or up the page. Alt lets it go at an angle (a plan scanned skew).
  const straight = (p, from, e) => {
    if (!from || e?.altKey) return p;
    return Math.abs(p.x - from.x) >= Math.abs(p.y - from.y) ? { x: p.x, y: from.y } : { x: from.x, y: p.y };
  };
  cv.addEventListener('pointerleave', () => { if (hover) { hover = null; draw(); } });
  const rest = () => (hand || !interactive ? 'grab' : 'crosshair');
  cv.style.cursor = rest();
  const local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    const q = local(e);
    const moveOnly = movesOnly(e, hand) || !interactive;
    const end = !moveOnly ? m.pts.findIndex((p) => { const s2 = toScr(p); return Math.hypot(s2.x - q.x, s2.y - q.y) <= 12; }) : -1;
    drag = { start: q, pan: { ...st.pan }, end, moved: false, moveOnly };
    if (moveOnly) cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointermove', (e) => {
    if (!drag) {
      // One end down: the line follows the pointer to where the other end would land.
      if (interactive && m.pts.length === 1 && !movesOnly(e, hand)) { hover = straight(toImg(local(e)), m.pts[0], e); draw(); }
      return;
    }
    const q = local(e);
    if (!drag.moved && Math.hypot(q.x - drag.start.x, q.y - drag.start.y) > 4) drag.moved = true;
    if (!drag.moved) return;
    if (drag.end >= 0) m.pts[drag.end] = straight(toImg(q), m.pts[1 - drag.end], e);
    else st.pan = { x: drag.pan.x + q.x - drag.start.x, y: drag.pan.y + q.y - drag.start.y };
    draw();
  });
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    cv.style.cursor = rest();
    if (d.moveOnly) return;
    if (d.moved && d.end >= 0) onChange();
    else if (!d.moved && interactive && e.type === 'pointerup') {
      let p = toImg(local(e));
      if (p.x < 0 || p.y < 0 || p.x > img.naturalWidth || p.y > img.naturalHeight) return;
      if (m.pts.length === 1) p = straight(p, m.pts[0], e);
      hover = null;
      m.pts = m.pts.length >= 2 ? [p] : [...m.pts, p];
      draw();
      onChange();
    }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  const zoomBy = (f, q = { x: cv.clientWidth / 2, y: cv.clientHeight / 2 }) => {
    const before = toImg(q);
    st.zoom = Math.min(Math.max(st.zoom * f, 0.5), ZOOM_MAX * 2);
    place();
    const after = toScr(before);
    st.pan = { x: st.pan.x + q.x - after.x, y: st.pan.y + q.y - after.y };
    draw();
  };
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelMoves(e)) { st.pan = { x: st.pan.x - e.deltaX, y: st.pan.y - e.deltaY }; draw(); return; }
    zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), local(e));
  }, { passive: false });
  return {
    draw, zoomBy,
    fit: () => { st.zoom = 1; st.pan = { x: 0, y: 0 }; draw(); },
    setHand: (on) => { hand = on; cv.style.cursor = rest(); },
  };
}

/// Metres a pixel from the length measured on the plan, or null until it's measured and typed.
function measuredScale(m) {
  if (m.pts.length !== 2) return null;
  const px = Math.hypot(m.pts[0].x - m.pts[1].x, m.pts[0].y - m.pts[1].y), mm = parseFloat(m.mm);
  return px > 4 && mm >= 100 && mm <= 100000 ? mm / 1000 / px : null;
}

/// A plan just picked: read it by AI or draw the rooms by hand; drawing by hand starts with the scale.
function renderPlanStart(c) {
  const r = app.read, measuring = r.status === 'measure';
  r.view ??= { zoom: 1, pan: { x: 0, y: 0 } };
  c.innerHTML = `<div class="work">
    <div class="stage">
      <div class="bar"><b>The builder's plan</b><div class="spacer" style="flex:1"></div><button class="link" id="another">Use a different plan</button></div>
      <div class="canvas-card"><canvas id="mcv"></canvas>${zoomCtl()}</div>
      <div class="hint">${measuring ? 'Click one end of a length you know, then the other: the line stays dead straight, across or up the plan (hold Alt for an angled one). Drag an end to fine-tune it. Zoom in with + (or scroll) to be exact; move around with the hand, Space-and-drag or a right-drag.' : 'Zoom with + and −; move around with the hand, Space-and-drag or a right-drag.'}</div>
    </div>
    <div class="panel" id="ps-panel"></div></div>`;
  $('#another', c).onclick = () => pickPlan(true);
  const panel = $('#ps-panel', c);
  const paint = () => {
    const m = r.measure, mpp = measuredScale(m), north = r.north ?? 'up';
    if (!measuring) {
      panel.innerHTML = `<div class="card"><h2>The rooms</h2><p class="small muted" style="margin:2px 0 10px">How do you want them off the plan?</p>
        <button class="option" id="pick-read" style="width:100%;text-align:left"><span class="radio"></span><span><b>Read them for me</b> <span class="tag">RECOMMENDED</span><p>AI finds each room — L-shapes and angled walls too — its windows and the scale from the printed sizes. You check and fix them after. Up to 10 plans a day.</p></span></button>
        <button class="option" id="pick-draw" style="width:100%;text-align:left;margin-top:8px"><span class="radio"></span><span><b>Draw them myself</b><p>1 · Set the scale: click both ends of a printed size (like 3600) and type it.<br>2 · Click round each room's corners over the plan.</p></span></button></div>`;
      $('#pick-read', panel).onclick = readPlan;
      $('#pick-draw', panel).onclick = () => { r.status = 'measure'; render(); };
      return;
    }
    const across = mpp ? r.keep.w * mpp : 0, odd = mpp && (across > 70 || Math.max(across, r.keep.h * mpp) < 6);
    const ai = r.aiScale;
    const aiCard = r.result ? '' : `<div class="card"><span class="eyebrow">Or let AI find the scale</span>
      ${ai?.mpp ? `<p class="small" style="margin:4px 0 8px">From ${esc(ai.source)}: the drawing is <b>${fmt(r.keep.w * ai.mpp, 1)} × ${fmt(r.keep.h * ai.mpp, 1)} m</b>.</p>
        <div class="actions-row"><button class="btn" id="ai-use">Use this scale →</button></div>`
        : ai?.busy ? '<p class="small muted" style="margin:4px 0 0"><span class="spinner" style="display:inline-block;width:12px;height:12px;border-width:2px;vertical-align:-2px"></span> Reading the printed sizes… about a minute.</p>'
        : `<p class="small muted" style="margin:4px 0 8px">AI reads the room sizes printed on the plan and works out the scale. You still draw the rooms. Up to 10 plans a day, on trusttrade.au.</p>
          ${ai?.error ? `<p class="small" style="color:var(--danger);font-weight:600;margin:0 0 8px">${esc(ai.error)}</p>` : ''}<button class="btn2" id="ai-find">Find the scale for me</button>`}</div>`;
    panel.innerHTML = `<div class="card">${r.result ? '<h2>Set the scale</h2>' : '<span class="eyebrow">Step 1 of 2</span><h2>Set the scale</h2><p class="small muted" style="margin:2px 0 6px">Then step 2: draw the rooms over the plan.</p>'}
        <div class="checklist" style="margin-top:4px">
          <div class="item ${m.pts.length === 2 ? 'ok' : 'info'}"><div class="mark">${m.pts.length === 2 ? '✓' : '1'}</div><div><b>Click both ends of a length you know</b>
            <p class="small muted" style="margin:2px 0 0">A room's printed size (3600 across a bedroom), a dimension line or the plan's scale bar. The longer it is, the truer the scale.</p></div></div>
          <div class="item ${mpp ? 'ok' : 'info'}" id="ps-len"><div class="mark">${mpp ? '✓' : '2'}</div><div style="flex:1"><b>How long is it?</b>
            <div style="display:flex;gap:8px;align-items:center;margin-top:6px"><input class="text" id="mm" type="number" min="100" step="10" placeholder="e.g. 3600" value="${esc(m.mm)}" style="flex:1"><span class="small muted">mm</span></div></div></div>
        </div>
        <p class="small muted" id="ps-across" style="margin:8px 0 0">${mpp ? `At that scale the drawing is ${fmt(r.keep.w * mpp, 1)} × ${fmt(r.keep.h * mpp, 1)} m.` : ''}</p>
        <p class="small" id="ps-odd" style="margin:6px 0 0;color:var(--danger);font-weight:600;${odd ? '' : 'display:none'}">That's an odd size for a house plan — check you clicked both ends of the same dimension, and the length is in mm.</p></div>
      <div class="card"><span class="eyebrow">Where does north point on the plan?</span>
        <div class="seg">${[['up', '↑ Up'], ['right', '→ Right'], ['down', '↓ Down'], ['left', '← Left']].map(([k, l]) => `<button data-north="${k}" class="${north === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="small muted" style="margin:8px 0 0">So the windows face the right way for the sun.</p></div>
      <div class="actions-row"><button class="btn" id="ps-go" ${mpp ? '' : 'disabled'}>${ctaLabel(r.result ? 'Use this scale' : 'Next: draw the rooms →')}</button>
        <button class="btn2" id="ps-back">Back</button></div>
      ${aiCard}`;
    $('#ai-find', panel)?.addEventListener('click', aiScale);
    $('#ai-use', panel)?.addEventListener('click', () => startDrawing(r.aiScale.mpp));
    const input = $('#mm', panel);
    input.oninput = () => {
      m.mm = input.value;
      const k = measuredScale(m);
      $('#ps-go', panel).disabled = !k;
      $('#ps-across', panel).textContent = k ? `At that scale the drawing is ${fmt(r.keep.w * k, 1)} × ${fmt(r.keep.h * k, 1)} m.` : '';
      const w2 = k ? r.keep.w * k : 0;
      $('#ps-odd', panel).style.display = k && (w2 > 70 || Math.max(w2, r.keep.h * k) < 6) ? '' : 'none';
      $('#ps-len', panel).className = 'item ' + (k ? 'ok' : 'info');
      $('#ps-len .mark', panel).textContent = k ? '✓' : '2';
    };
    input.onkeydown = (e) => { if (e.key === 'Enter' && measuredScale(m)) $('#ps-go', panel).click(); };
    panel.querySelectorAll('[data-north]').forEach((b) => (b.onclick = () => { r.north = b.dataset.north; paint(); }));
    $('#ps-back', panel).onclick = () => { if (!r.result && !ASSIST()) { pickPlan(true); return; } r.status = r.result ? 'noscale' : 'chosen'; render(); };
    $('#ps-go', panel).onclick = () => {
      const k = measuredScale(m);
      if (!k) return;
      if (r.result) { r.status = 'reading'; render(); importRead(undefined, k); } else startDrawing(k);
    };
    if (m.pts.length === 2 && !m.mm) input.focus();
  };
  paint();
  const mc = mountMeasure($('#mcv', c), r.url, r.measure, { interactive: measuring, onChange: paint, view: r.view });
  bindZoomCtl(c, mc);
}

/// The plan image under an empty house and the editor open to draw the rooms over it. With no scale measured it goes in
/// at a guess (the drawing about 25 m across) and is sized after, from a wall you know.
async function startDrawing(mpp) {
  const r = app.read;
  if (!mpp) { r.status = 'measure'; render(); return; }                        // the scale comes first
  const guess = false;
  try {
    const { project } = await call('blankPlan', { project: app.project, file: r.fileName, imageWidth: r.keep.w, imageHeight: r.keep.h, mpp, north: r.north ?? 'up', level: r.level });
    await store.saveImage(r.fileName, r.keep.blob);
    dropOldPlan(r.level, r.fileName);
    app.selection = null; app.closed = new Set(); app.checkAnswers = null; app.undo = []; app.redo = [];
    await commit(project, { rerender: false });
    await loadBackdrop();
    app.read = null;
    setUnsized(guess);
    openEditor({ mode: 'draw', guide: true });
  } catch (e) {
    toast(e.message);
  }
}

/// No plan at all: the rooms drawn on a metre grid.
function drawOnGrid() {
  const run = async () => {
    const { project } = await call('blankPlan', { project: app.project });
    const old = app.project.backdrop?.file;
    if (old) store.deleteImage(old);
    app.selection = null; app.closed = new Set(); app.checkAnswers = null; app.undo = []; app.redo = []; app.read = null;
    await commit(project, { rerender: false });
    await loadBackdrop();
    setUnsized(false);
    if (app.step === 'house' || app.step === 'job') { app.step = 'plan'; history.replaceState(null, '', '#/job/' + app.jobId + '/plan'); }
    openEditor({ mode: 'draw' });
  };
  if (app.view.rooms.length) confirmDialog(`This job already has ${app.view.rooms.length} rooms`, 'Drawing the house on a grid starts again with none.', 'Start again', run);
  else run();
}

// MARK: The room editor

/// Where the editor looks: the house (with room round it to draw more), else the whole plan image, else 20 × 14 m of grid.
function editorBounds() {
  const p = app.project, pts = app.view.rooms.flatMap((r) => r.polygon);
  for (const lv of [1, 2]) {
    const u = p[BACKDROP_KEY[lv]];
    if (!(pts.length && u && app[BACKDROP_KEY[lv]] && !app.view.rooms.some((r) => r.level === lv))) continue;
    const o = u.origin;
    pts.push(o, { x: o.x + u.across.x, y: o.y + u.across.y }, { x: o.x + u.down.x, y: o.y + u.down.y }, { x: o.x + u.across.x + u.down.x, y: o.y + u.across.y + u.down.y });
  }
  if (pts.length) {
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
    const pad = Math.max(2, 0.12 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)));
    return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
  }
  const b = p.backdrop;
  if (b && app.backdrop) {
    const o = b.origin, c = [o, { x: o.x + b.across.x, y: o.y + b.across.y }, { x: o.x + b.down.x, y: o.y + b.down.y },
      { x: o.x + b.across.x + b.down.x, y: o.y + b.across.y + b.down.y }];
    return [Math.min(...c.map((q) => q.x)), Math.min(...c.map((q) => q.y)), Math.max(...c.map((q) => q.x)), Math.max(...c.map((q) => q.y))];
  }
  return [0, 0, 20, 14];
}

async function editorGaps() {
  if (app.view.rooms.length < 2) return [];
  return (await call('planCheck', { project: app.project }).catch(() => null))?.gaps ?? [];
}

/// Open the room editor in place of the step (Capture, Check or Design), on a room or drawing.
async function openEditor({ room = null, mode = 'edit', guide = false } = {}) {
  if (!app.project) return;
  shutEditor();
  const st = { showImage: true, undoBase: app.undo.length, redoBase: app.redo.length, edited: false, zoom: null, pan: null, from: app.step, guide };
  st.ed = new RoomEditor({
    commit: (op, args) => edEdit(op, args),
    changed: () => edPanel(),
    redraw: () => st.plan?.draw(),
    finishRoom: (pts) => newRoomDialog(pts),
    measured: (a, b, wall) => scaleDialog(a, b, wall),
  });
  st.bounds = editorBounds();
  st.gaps = await editorGaps();
  st.ed.mode = mode;
  if (room) st.ed.sel = { kind: 'room', id: room };
  app.editorOpen = st;
  window.addEventListener('keydown', edKeys);
  render();
}

function shutEditor() {
  if (!app.editorOpen) return;
  window.removeEventListener('keydown', edKeys);
  app.editorOpen = null;
}

/// Done: back to Check (the plan's checked again: the gaps and the open areas as the rooms are now), or to where it was
/// opened from if nothing changed.
async function closeEditor() {
  const st = app.editorOpen;
  if (!st) return;
  if (isUnsized() && app.view.rooms.length) {
    dialog(`<h2>Set the size first</h2><p class="muted">The rooms are drawn but the plan isn't sized yet, so their areas and loads would be wrong. Click one wall you know the length of and type it.</p>`,
      [{ label: 'Not yet' }, { label: 'Set the size', primary: true, run: () => st.ed.setMode('measure') }]);
    return;
  }
  shutEditor();
  if (!st.edited) { if (app.view.rooms.length && st.from !== 'design') go('plan'); else render(); return; }
  app.roomsEdited = !!app.project.design;
  const a = app.checkAnswers;
  if (a) {
    const ids = new Set(app.view.rooms.map((r) => r.id)), known = new Set(a.pc.gaps.map((x) => x.key));
    a.pc = await call('planCheck', { project: app.project });
    a.openAreas = a.openAreas.map((grp) => grp.filter((id) => ids.has(id))).filter((grp) => grp.length > 1);
    for (const k of Object.keys(a.suites)) if (!ids.has(k) || !ids.has(a.suites[k])) delete a.suites[k];
    const now = new Set(a.pc.gaps.map((x) => x.key));
    a.gapsOn = new Set([...a.gapsOn].filter((k) => now.has(k)));
    for (const x of a.pc.gaps) if (!known.has(x.key) && !x.outdoorish) a.gapsOn.add(x.key);
    app.cards = await call('systemCards', { project: app.project });
  }
  if (app.view.rooms.length) go('plan'); else render();
}

function renderRoomEditor(c) {
  const st = app.editorOpen, p = app.project;
  const hasImage = !!((p.backdrop && app.backdrop) || (p.upperBackdrop && app.upperBackdrop) || (p.topBackdrop && app.topBackdrop));
  c.innerHTML = `<div class="work with-rail ed-work">
    <div class="rail lab" id="ed-tools">${[['edit', 'cursor', 'Select'], ['draw', 'pen', 'Room'], ['window', 'window', 'Windows'], ['measure', 'ruler', 'Size']]
      .map(([k, ic, l]) => `<button data-tool="${k}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>
    <div class="stage">
      <div class="bar">
        <div class="spacer" style="flex:1"></div>
        <button class="btn2 small" id="ed-undo" title="Undo the last change">${icon('undo').replace('<svg', '<svg width="15" height="15"')} Back</button>
        <button class="btn2 small" id="ed-redo" title="Redo it">Forward ${icon('redo').replace('<svg', '<svg width="15" height="15"')}</button>
      </div>
      <div class="canvas-card"><canvas id="cv"></canvas><div class="mode-tip" id="ed-tip"></div>${zoomCtl()}</div>
      <div class="hint" id="ed-hint"></div>
    </div>
    <div class="panel" id="ed-panel"></div>
  </div>`;
  const plan = new Plan($('#cv', c), { changed: () => { st.zoom = plan.zoom; st.pan = { ...plan.pan }; } });
  if (st.zoom) { plan.zoom = st.zoom; plan.pan = { ...st.pan }; }
  st.plan = plan;
  st.ed.set({ rooms: app.view.rooms, gaps: st.gaps, hasImage: hasImage && st.showImage, canvas: plan.canvas, sized: !isUnsized() });
  edPanel();                                          // the hint's in place before the first draw, so the canvas doesn't jump
  plan.set({ project: p, view: app.view, layout: null, backdrop: app.backdrop, upperBackdrop: app.upperBackdrop, topBackdrop: app.topBackdrop, showPlan: st.showImage, labels: true, compact: true,
    editor: st.ed, bounds: st.bounds, gaps: st.gaps.map((x) => ({ ...x, on: false })) });
  c.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => st.ed.setMode(b.dataset.tool)));
  $('#ed-undo', c).onclick = edUndo;
  $('#ed-redo', c).onclick = edRedo;
  bindZoomCtl(c, { zoomBy: (k) => plan.zoomBy(k), setHand: (on) => plan.setHand(on),
    fit: () => { st.bounds = editorBounds(); plan.set({ bounds: st.bounds }); plan.fit(); } });
  plan.canvas.style.cursor = st.ed.mode === 'edit' ? '' : 'crosshair';
  edPanel();
  // Back to the step's own primary once the panel's drawn (Next: check the rooms).
  renderTop();
}

/// A change made in the editor: through the engine, kept with an undo step, the plan and the panel brought up to date
/// (without redrawing the screen, so the view stays where it is).
async function edEdit(op, args) {
  const st = app.editorOpen;
  if (!st) return null;
  try {
    const r = await call('edit', { project: app.project, op, ...args });
    if (r.ok === false) { toast(editRefusal(op)); return null; }
    await commit(r.project, { undoable: true, rerender: false });
    st.edited = true;
    if (op === 'rescale') { setUnsized(false); st.ed.set({ sized: true }); }
    await edRefresh();
    return r;
  } catch (e) {
    toast(e.message);
    return null;
  }
}

async function edRefresh() {
  const st = app.editorOpen;
  if (!st) return;
  st.gaps = await editorGaps();
  st.ed.set({ rooms: app.view.rooms, gaps: st.gaps });
  st.plan?.set({ project: app.project, view: app.view, gaps: st.gaps.map((x) => ({ ...x, on: false })) });
  renderTop();
  edPanel();
}

async function edUndo() {
  const st = app.editorOpen;
  if (!st || app.undo.length <= st.undoBase) return;
  app.redo.push(app.project);
  app.project = app.undo.pop();
  await refresh(); save();
  st.edited = true;
  await edRefresh();
}
async function edRedo() {
  const st = app.editorOpen;
  if (!st || app.redo.length <= st.redoBase) return;
  app.undo.push(app.project);
  app.project = app.redo.pop();
  await refresh(); save();
  await edRefresh();
}

function edKeys(e) {
  const st = app.editorOpen;
  if (!st || document.querySelector('.overlay') || e.target.closest?.('input, select, textarea')) return;
  const ed = st.ed;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) edRedo(); else edUndo(); return; }
  const arrows = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
  if (arrows[e.key]) { e.preventDefault(); st.plan?.panBy(...arrows[e.key]); return; }
  if (e.key === 'Escape') ed.escape();
  else if (e.key === 'Enter' && ed.mode === 'draw') ed.finish();
  else if (e.key === 'Backspace' || e.key === 'Delete') {
    if (ed.sel?.kind === 'window') { const { room, n } = ed.sel; ed.sel = null; edEdit('removeWindow', { room, n }); }
    else if (ed.mode === 'draw' && ed.draft.length) ed.undoPoint();
    else if (ed.mode === 'edit' && ed.sel?.corner != null) ed.removeCorner();
    else return;
    e.preventDefault();
  }
}

/// The windows in one wall of a room (by its outline's edge), with their index in the room's list.
function wallWindows(r, edge) {
  const a = r.polygon[edge], b = r.polygon[(edge + 1) % r.polygon.length];
  const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey;
  return r.windows.map((w, n) => ({ w, n })).filter(({ w }) => {
    const m = { x: (w[0].x + w[1].x) / 2, y: (w[0].y + w[1].y) / 2 };
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((m.x - a.x) * ex + (m.y - a.y) * ey) / l2)) : 0;
    return Math.hypot(m.x - (a.x + ex * t), m.y - (a.y + ey * t)) < 0.1;
  });
}

/// A room's zone choices: as the zoning puts it, a zone of its own, on another room's zone, or no zone (always on).
function zoneOptions(r, current) {
  const others = app.view.rooms.filter((x) => x.conditioned && x.id !== r?.id);
  return `<option value="" ${current === '' ? 'selected' : ''}>As the zoning puts it</option>
    <option value="own" ${current === 'own' ? 'selected' : ''}>Its own zone</option>
    ${others.length ? `<optgroup label="On a zone with">${others.map((x) => `<option value="${x.id}" ${current === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</optgroup>` : ''}
    <option value="none" ${current === 'none' ? 'selected' : ''}>No zone — always on</option>`;
}

const FACING = { N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west' };

function shapeWord(r) {
  const n = r.polygon.length;
  const square = r.polygon.every((q, i) => { const o = r.polygon[(i + 1) % n]; return Math.abs(q.x - o.x) < 0.01 || Math.abs(q.y - o.y) < 0.01; });
  if (n === 4 && square) return 'rectangle';
  if (n === 6 && square) return 'L-shape';
  return square ? `${n} corners, square walls` : `${n} corners, angled walls`;
}

/// A ring that fills to a share (the mock's gauge beside a title): green at 85% or more, amber under, grey with none.
function ring(share, tone) {
  const pct = Math.max(0, Math.min(share ?? 0, 1.2)), c = 2 * Math.PI * 22;
  const col = tone ?? (share == null ? '#C6CBD3' : share >= 0.85 ? '#0FA37A' : '#F59E0B');
  return `<svg class="ring" width="56" height="56" viewBox="0 0 56 56" role="img" aria-label="${Math.round((share ?? 0) * 100)}%"><circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F3" stroke-width="6"/>
    <circle cx="28" cy="28" r="22" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(Math.min(pct, 1) * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/>
    <text x="28" y="32" text-anchor="middle" font-size="12.5" font-weight="600" fill="#0E1116" font-family="Geist, sans-serif">${share == null ? '—' : Math.round(share * 100) + '%'}</text></svg>`;
}
/// The top of a picked thing's card, as the mock has it: a small label and the close, then the ring, the name, a line
/// under it and a line of figures.
function cardHead(close, eyebrow, title, sub, mono = '', gauge = '') {
  return `<div class="ih"><span class="eyebrow">${eyebrow}</span>${close}</div>
    <div class="ihero">${gauge}<div class="grow"><h2>${title}</h2>${sub ? `<div class="isub">${sub}</div>` : ''}${mono ? `<div class="imono" style="margin-top:2px">${mono}</div>` : ''}</div></div>`;
}

const HEAT_TONES = { Windows: '#E8826B', Walls: '#F2B09C', Roof: '#F7D2C6', Floor: '#D9C8B8', 'Air leakage': '#C3CAD5', 'People and appliances': '#E3E6EB' };
/// Where a room's heat comes from on the summer design day (the mock's "Where the heat goes"): the engine's component
/// model (glass, walls, roof, draughts, people) as shares of the room's load, so the kW add up to its heat load.
function heatSplit(r) {
  const parts = (r.heat ?? []).filter((x) => x.cooling > 0.5), sum = parts.reduce((t, x) => t + x.cooling, 0);
  if (!r.conditioned || !parts.length || sum <= 0) return '';
  const rows = parts.map((x) => ({ label: x.label, share: x.cooling / sum, kw: x.cooling / sum * r.kw })).sort((x, y) => y.share - x.share);
  return `<div class="ih"><b>Where the heat comes from</b><span class="imono mut">kW · summer</span></div>
    <div class="stack">${rows.map((x) => `<i style="flex:${x.share.toFixed(4)};background:${HEAT_TONES[x.label] ?? '#D5D9E0'}" title="${esc(x.label)}"></i>`).join('')}</div>
    <div>${rows.map((x) => `<div class="hrow"><i style="background:${HEAT_TONES[x.label] ?? '#D5D9E0'}"></i><span>${esc(x.label)}</span><b>${fmt(x.kw, 1)}</b><em>${Math.round(x.share * 100)}%</em></div>`).join('')}</div>`;
}
/// How a room's built, a line each (the mock's rows under the heat): ceiling, what's above, windows, floor, when built.
function roomRows(r, { built = true } = {}) {
  const site = app.project.site, o = app.options;
  const glass = r.glass ?? [], glassM2 = glass.reduce((t, gl) => t + gl.height * gl.width, 0);
  const faces = [...new Set(glass.map((gl) => gl.facing).filter(Boolean))];
  const era = o.eras.find((e) => e.id === r.era), houseCeil = site.ceilingPref ?? 2.4;
  const roof = o.roofTypes?.find((x) => x.id === (site.roofTypePref ?? 'tile'))?.label ?? 'Roof';
  const floor = o.floorTypes?.find((x) => x.id === site.floorType)?.label ?? '';
  return `<div class="kv"><span>Above</span><b>${r.underRoof === false ? 'Another floor' : esc(roof) + ', roof space'}</b></div>
    <div class="kv"><span>Windows</span><b class="imono">${glass.length ? `${glass.length} · ${fmt(glassM2, 1)} m²${faces.length ? ' · ' + faces.join(', ') : ''}` : 'none drawn'}</b></div>
    <div class="kv"><span>Floor</span><b>${r.onGround === false ? 'Over the floor below' : esc(floor)}</b></div>
    ${built ? `<div class="kv"><span>Built</span><b>${era ? esc(era.short) + ', its own' : 'As the house'}</b></div>` : ''}`;
}
/// A room's ceiling, changed where it's shown (Jake, 24 Nov 2026: "click the room and change the roof height and also
/// the roof style, so flat or raked"): its style, then its height; a raked ceiling its low and high side, a cathedral
/// one its walls and its ridge. The load goes by the average of the two.
const CEIL_SIDES = { raked: ['Low side', 'High side'], cathedral: ['At the walls', 'At the ridge'] };
function ceilingRows(r) {
  const houseCeil = app.project.site.ceilingPref ?? 2.4;
  const styles = app.options.ceilingStyles ?? [{ id: 'flat', label: 'Flat' }], st = r.ceilingStyle ?? 'flat';
  const low = r.ceiling ?? 2.4, high = r.ceilingHigh ?? low, sides = CEIL_SIDES[st];
  const num = (key, v, max) => `<span class="numin"><input data-ceilnum="${key}" type="number" inputmode="decimal" min="2.1" max="${max}" step="0.05" value="${v.toFixed(2)}" aria-label="${key === 'high' ? 'High side' : 'Ceiling height'}, metres"><i>m</i></span>`;
  return `<div class="ceil" data-ceilroom="${r.id}">
    <div class="rowpick"><label>Ceiling</label><div class="seg">${styles.map((x) => `<button data-ceilstyle="${x.id}" class="${x.id === st ? 'on' : ''}">${esc(x.label)}</button>`).join('')}</div></div>
    <div class="rowpick"><label>${sides ? sides[0] : 'Height'}${!sides && Math.abs(low - houseCeil) > 0.01 ? ' <span class="chip mini">not the house\'s</span>' : ''}</label>${num('low', low, 6)}</div>
    ${sides ? `<div class="rowpick"><label>${sides[1]}</label>${num('high', high, 9)}</div>
      <p class="small muted" style="margin:2px 0 8px">Sized on its average, ${fmt(r.ceilingMean ?? (low + high) / 2, 2)} m. A sloped ceiling can leave little roof space over it: check the ducts and the vent fit.</p>` : ''}</div>`;
}
/// The ceiling rows' taps and typing, saved with `save(room, change)` (the page's own edit, or the room editor's).
function bindCeiling(el, save) {
  el.querySelectorAll('.ceil[data-ceilroom]').forEach((box) => {
    const id = box.dataset.ceilroom;
    box.querySelectorAll('[data-ceilstyle]').forEach((b) => (b.onclick = () => { if (!b.classList.contains('on')) save(id, { style: b.dataset.ceilstyle }); }));
    box.querySelectorAll('[data-ceilnum]').forEach((inp) => inp.addEventListener('change', () => {
      const h = parseFloat(inp.value), high = inp.dataset.ceilnum === 'high';
      const low = parseFloat(box.querySelector('[data-ceilnum="low"]').value);
      if (!(h >= 2.1 && h <= (high ? 9 : 6))) { toast(high ? 'A high side between 2.1 and 9 m.' : 'A ceiling between 2.1 and 6 m.'); inp.value = inp.defaultValue; return; }
      if (high && h <= low) { toast('The high side goes over the low side.'); inp.value = inp.defaultValue; return; }
      const top = parseFloat(box.querySelector('[data-ceilnum="high"]')?.value);
      if (!high && top && h >= top) { toast(`The low side stays under the high side (${top.toFixed(2)} m).`); inp.value = inp.defaultValue; return; }
      save(id, high ? { high: h } : { height: h });
    }));
  });
}
/// A room's numbers as the side panel shows them (the mock's Rooms panel): its load, how hard it works per m², its
/// floor; where that heat comes from; then how it's built.
function roomFacts(r, { tiles = true, built = true } = {}) {
  if (!r.conditioned) return '<p class="small muted" style="margin:0">Not air conditioned: no load and no vents.</p>';
  const dens = r.area > 0 ? r.kw * 1000 / r.area : 0;
  return `${tiles ? `<div class="tiles3"><div><span>Heat load</span><b>${fmt(r.kw, 1)}<i>kW</i></b></div><div><span>Density</span><b>${fmt(dens)}<i>W/m²</i></b></div><div><span>Area</span><b>${fmt(r.area, 1)}<i>m²</i></b></div></div>` : ''}
    ${heatSplit(r)}<div>${roomRows(r, { built })}</div>`;
}

/// The whole house the same way: its load, floor and rooms, then each room's share (tap one to open it).
function houseFacts(v, pickAttr = 'data-room') {
  const live = v.rooms.filter((r) => r.conditioned), t = v.totals;
  const kw = t.wholeHomeKW ?? t.connectedKW, top = Math.max(...live.map((r) => r.kw), 0.1);
  const dens = t.area > 0 ? t.connectedKW * 1000 / t.area : 0;
  return `<div class="insp-head"><h2>The house</h2></div>
    <div class="insp-sub">${v.rooms.length} room${v.rooms.length === 1 ? '' : 's'} drawn · ${live.length} air conditioned · ${fmt(dens)} W/m² on average</div>
    <div class="tiles3"><div><span>Heat load</span><b>${fmt(kw, 1)}<i>kW</i></b></div><div><span>Floor area</span><b>${fmt(t.area)}<i>m²</i></b></div><div><span>Rooms</span><b>${v.rooms.length}</b></div></div>
    <span class="eyebrow">Load by room</span>
    ${[...live].sort((a, b) => b.kw - a.kw).map((r) => `<button class="loadrow" ${pickAttr}="${r.id}"><span>${esc(r.name)} <span class="muted small">${fmt(r.area, 1)} m²</span></span><span class="track"><i style="width:${(r.kw / top * 100).toFixed(1)}%"></i></span><b>${fmt(r.kw, 1)} kW</b></button>`).join('')}
    ${v.rooms.filter((r) => !r.conditioned).map((r) => `<button class="loadrow" ${pickAttr}="${r.id}"><span class="muted">${esc(r.name)} <span class="small">${fmt(r.area, 1)} m²</span></span><span class="small muted" style="grid-column:2 / 4;text-align:right">not air conditioned</span></button>`).join('')}`;
}

function edPanel() {
  const st = app.editorOpen, el = $('#ed-panel');
  if (!st || !el) return;
  const ed = st.ed, v = app.view, o = app.options, sel = ed.sel;
  document.querySelectorAll('#ed-tools [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === ed.mode));
  const u = $('#ed-undo'), rd = $('#ed-redo');
  if (u) u.disabled = app.undo.length <= st.undoBase;
  if (rd) rd.disabled = app.redo.length <= st.redoBase;
  const hint = $('#ed-hint');
  if (hint) {
    hint.textContent = ed.mode === 'draw' ? 'Click each corner of the room in turn; click the first corner (or press Enter) to finish. Corners snap to the rooms round them — hold Shift to place one freely. Move around with the hand, Space-and-drag or a right-drag.'
      : ed.mode === 'measure' ? 'Click a wall you know the length of (it lights up blue), or two points on the plan such as the ends of the scale bar.'
      : ed.mode === 'window' ? 'Drag along an outside wall (dashed blue) from one side of a window to the other, or click the wall for a 1.2 m one. Click a window to size it or take it out.'
      : 'Drag a wall or a picked room\'s corner (the room next door comes too). Drag a + to put a corner in a wall. Zoom with + and −; move around with the hand, Space-and-drag, a right-drag or the arrow keys.';
  }
  // The tool in hand, named on the plan itself.
  const tip = $('#ed-tip');
  if (tip) tip.innerHTML = ed.mode === 'draw' ? `<b>Drawing a room</b> · click each corner, then the first one again to finish${ed.draft.length ? ` · ${ed.draft.length} so far` : ''}`
    : ed.mode === 'window' ? '<b>Drawing windows</b> · drag along an outside wall (dashed blue)'
    : ed.mode === 'measure' ? '<b>Setting the size</b> · click a wall you know the length of' : '';
  const close = '<button class="iconbtn close" id="ed-close">' + icon('x') + '</button>';
  const unsized = isUnsized(), area = (m2) => (unsized ? 'not sized yet' : fmt(m2, 1) + ' m²');
  // A plan drawn by hand: draw first, then size it — both steps in view the whole time.
  const drawn = v.rooms.length > 0;
  let html = unsized && ed.mode !== 'measure' ? `<div class="card"><h2>Two steps</h2>
    <div class="checklist" style="margin-top:4px">
      <div class="item ${drawn ? 'ok' : 'info'}"><div class="mark">${drawn ? '✓' : '1'}</div><div><b>Draw the rooms</b>
        <p class="small muted" style="margin:2px 0 0">Click round each room's corners over the plan. The sizes don't matter yet.</p></div></div>
      <div class="item ${drawn ? 'warn' : 'info'}"><div class="mark">2</div><div><b>Set the size</b>
        <p class="small muted" style="margin:2px 0 0">Click one wall you know the length of — a printed size, like 3600 — and type it. The whole plan is sized from it.</p>
        ${drawn ? '<button class="btn" id="go-size" style="margin-top:8px">Set the size</button>' : ''}</div></div>
    </div></div>` : '';
  // Drawing by hand: the steps, with Next once there are rooms.
  const wins = v.rooms.reduce((t, r) => t + (r.windows?.length ?? 0), 0);
  const guide = st.guide && !unsized ? `<div class="card"><div class="checklist">
      <div class="item ok"><div class="mark">✓</div><div><b>Scale set</b><p class="small muted" style="margin:2px 0 0">Lengths and areas are real now.</p></div></div>
      <div class="item ${drawn ? 'ok' : 'info'}"><div class="mark">${drawn ? '✓' : '2'}</div><div><b>Draw the rooms</b><p class="small muted" style="margin:2px 0 0">${drawn ? `${v.rooms.length} drawn.${ed.mode === 'draw' ? ' Draw the rest.' : ''}` : 'Click round the first room\'s corners.'}</p>
        ${drawn && ed.mode !== 'draw' ? '<button class="btn2 small" id="dr-rooms" style="margin-top:6px">Draw a room</button>' : ''}</div></div>
      <div class="item ${wins ? 'ok' : 'info'}"><div class="mark">${wins ? '✓' : '3'}</div><div><b>Draw the windows</b><p class="small muted" style="margin:2px 0 0">${wins ? `${wins} drawn.` : 'Drag along the outside walls where the plan has windows and glass doors.'} A room left without counts as typical glass.</p>
        ${drawn && ed.mode !== 'window' ? '<button class="btn2 small" id="dr-win" style="margin-top:6px">Draw the windows</button>' : ''}</div></div></div>
      ${drawn ? '<button class="btn" id="dr-next" style="margin-top:10px;width:100%">Next: check the rooms →</button>' : ''}</div>` : '';
  if (ed.mode === 'draw') {
    const n = ed.draft.length;
    html += guide;
    html += `<div class="card"><h2>Draw a room</h2>
      <p class="small muted" style="margin:4px 0 10px">${n ? `${n} corner${n === 1 ? '' : 's'} so far.` : 'Click the first corner of the room.'} Go round the room's walls — the inside face — and click the first corner again to finish.</p>
      <div class="actions-row">${n >= 3 ? '<button class="btn" id="dr-finish">Finish the room</button>' : ''}${n ? '<button class="btn2" id="dr-back">Take the last corner out</button>' : ''}
        <button class="btn2" id="dr-stop">${n ? 'Cancel' : 'Stop drawing'}</button></div></div>
      <div class="card"><h2>Tips</h2><ul class="small muted" style="margin:4px 0 0;padding-left:18px">
        <li>A corner snaps onto a room's corner or wall, and lines up square with the corners either side.</li>
        <li>Rooms you draw over give way — draw the laundry in the kitchen's corner and the kitchen becomes an L round it.</li>
        <li>${unsized ? 'Then set the size from one wall you know.' : st.showImage && (app.backdrop || app.upperBackdrop) ? 'Sizes out? Set the size from a wall you know.' : 'No plan image: the grid is in metres.'}</li></ul></div>`;
  } else if (ed.mode === 'measure') {
    html = `<div class="card"><h2>Set the size</h2><p class="small muted" style="margin:4px 0 10px"><b>Click a wall you know the length of</b> — it lights up blue — and type how long it really is (the printed size, like 3600). Or click two points on the plan, like the ends of the scale bar.</p>
      <p class="small muted" style="margin:0 0 10px">The rooms and the plan image are sized to match.${app.project.design ? ' The ducts are laid out again after.' : ''}</p>
      <button class="btn2" id="ms-stop">Cancel</button></div>`;
  } else if (sel?.kind === 'window' && ed.room(sel.room)?.windows?.[sel.n]) {
    const r = ed.room(sel.room), w = r.windows[sel.n];
    const gl = r.glass?.[sel.n] ?? { height: 1.2, width: Math.hypot(w[1].x - w[0].x, w[1].y - w[0].y), facing: '' };
    const door = gl.height >= 2;
    html += `<div class="card"><div class="insp-head"><h2>${door ? 'Glass door' : 'Window'} · ${esc(r.name)}</h2>${close}</div>
        <div class="insp-sub">${FACING[gl.facing] ? 'Faces ' + FACING[gl.facing] + ' · ' : ''}${fmt(gl.height * gl.width, 2)} m² of glass</div>
        <p class="small muted" style="margin:6px 0 8px">Its size as the plan prints it: height × width (like 2100 × 2400 for a glass door).</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label class="field"><span>Height (mm)</span><input id="win-h" type="number" inputmode="numeric" min="300" max="3000" step="10" value="${Math.round(gl.height * 1000)}"></label>
          <label class="field"><span>Width (mm)</span><input id="win-w" type="number" inputmode="numeric" min="250" max="6000" step="10" value="${Math.round(gl.width * 1000)}"></label></div>
        <div class="seg" style="flex-wrap:wrap;margin-top:2px">${[[600, '600'], [900, '900'], [1200, '1200'], [1500, '1500'], [1800, '1800'], [2100, '2100 door']].map(([mm, l]) => `<button data-wh="${mm}" class="${Math.round(gl.height * 1000) === mm ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="actions-row" style="margin-top:10px"><button class="btn2 danger" id="win-del">${icon('trash').replace('<svg', '<svg width="16" height="16"')} Take it out</button>
          ${ed.mode === 'window' ? '' : '<button class="btn2" id="win-more">Draw more windows</button>'}</div></div>${ed.mode === 'window' ? guide : ''}`;
  } else if (ed.mode === 'window') {
    const typical = v.rooms.filter((r) => r.conditioned && !(r.windows?.length) && ['living', 'bed', 'other'].includes(r.designerType));
    html += `<div class="card"><h2>Draw the windows</h2>
        <p class="small muted" style="margin:4px 0 8px"><b>Drag along an outside wall</b> (dashed blue) from one side of the window to the other, as the plan has it. Or click the wall for a 1.2 m window, then type its size. One 2 m or wider goes in as a glass door (2.1 m high).</p>
        <p class="small muted" style="margin:0 0 10px">The windows set each room's glass: how much there is, and which way it faces the sun. ${wins} drawn so far.</p>
        <div class="actions-row"><button class="btn${guide ? '2' : ''}" id="win-done">Done</button></div></div>
      ${guide}
      <div class="card"><h2>${typical.length ? 'No windows yet' : 'Every room has its windows'}</h2>
        ${typical.length ? `<p class="small muted" style="margin:2px 0 6px">Counted as typical glass until they're drawn:</p>${typical.map((r) => `<div class="kv"><span>${esc(r.name)}</span><span class="muted small">${area(r.area)}</span></div>`).join('')}`
          : '<p class="small muted" style="margin:2px 0 0">The living rooms and bedrooms all have windows drawn.</p>'}</div>`;
  } else if (sel?.kind === 'room' && ed.room(sel.id)) {
    const r = ed.room(sel.id), n = r.polygon.length;
    let corner = '', wall = '';
    if (sel.corner != null && sel.corner < n) {
      const kind = ed.cornerKind();
      corner = `<div class="card"><h2>Corner</h2><p class="small muted" style="margin:2px 0 10px">Drag it to where the plan has it. ${kind === 'outside' ? 'Cut it out to make the room an L, then drag the new walls to fit.' : 'Fill it in to square the room off.'}</p>
        <div class="actions-row"><button class="btn2 soft" id="c-square">${kind === 'outside' ? 'Cut this corner out' : 'Fill in this corner'}</button>
        ${n > 3 ? '<button class="btn2" id="c-remove">Take this corner out</button>' : ''}</div></div>`;
    }
    if (sel.edge != null && sel.edge < n) {
      const a = r.polygon[sel.edge], b = r.polygon[(sel.edge + 1) % n];
      const inside = ed.rooms.some((m) => m.id !== r.id && m.polygon.some((q, i) => onLine(a, b, q, m.polygon[(i + 1) % m.polygon.length])));
      const onWall = wallWindows(r, sel.edge);
      wall = `<div class="card"><h2>Wall · ${metres(Math.hypot(b.x - a.x, b.y - a.y))}</h2>
        <p class="small muted" style="margin:2px 0 8px">${inside ? 'An inside wall: the room next door is on the other side.' : 'An outside wall.'} Drag it to move it.</p>
        ${onWall.map(({ w, n: k }) => `<div class="kv"><button class="link" data-pickwin="${k}">${(r.glass?.[k]?.height ?? 1.2) >= 2 ? 'Glass door' : 'Window'} · ${metres(Math.hypot(w[1].x - w[0].x, w[1].y - w[0].y))}</button><button class="link" data-unwin="${k}">Remove</button></div>`).join('')}
        ${inside ? '' : `<span class="eyebrow" style="display:block;margin-top:8px">Add a window</span>
          <div class="seg" style="flex-wrap:wrap">${[0.6, 1.2, 1.8, 2.4, 3.0].map((wd) => `<button data-win="${wd}">${wd.toFixed(1)} m</button>`).join('')}</div>
          <p class="small muted" style="margin:6px 0 0">Or use <b>Windows</b> up top to draw one where the plan has it.</p>`}</div>`;
    }
    const eraOwn = o.eras.find((e) => e.id === r.era);
    html += `<div class="card is">${cardHead(close, 'Room', esc(r.name) + (eraOwn ? ` <span class="chip warn mini" style="vertical-align:3px">Built ${esc(eraOwn.short)}</span>` : !r.conditioned ? ' <span class="chip mini" style="vertical-align:3px">Not conditioned</span>' : ''), `${area(r.area)} · ${shapeWord(r)}`)}
        ${unsized ? '' : roomFacts(r, { built: false })}
        <div><div class="rowpick"><label>Name</label><input id="ed-name" class="rowin" value="${esc(r.name)}"></div>
          <div class="rowpick"><label>Room type</label><select id="ed-type">${o.roomTypes.map((x) => `<option value="${x.id}" ${x.id === r.type ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>
          ${r.conditioned ? `<div class="rowpick"><label>Zone</label><select id="ed-zone">${zoneOptions(r, r.zonePlan ?? '')}</select></div>` : ''}</div>
        ${unsized ? '' : ceilingRows(r)}
        <div class="imono mut" style="font-family:var(--sans);font-size:12px">Pick a corner to cut it out, a wall for its windows, or drag a + to bend a wall.</div></div>
      ${corner}${wall}
      <div class="actions-row"><button class="btn2 danger" id="ed-del">${icon('trash').replace('<svg', '<svg width="16" height="16"')} Delete this room</button></div>`;
  } else if (sel?.kind === 'gap' && st.gaps.find((x) => x.key === sel.key)) {
    const gp = st.gaps.find((x) => x.key === sel.key);
    html += `<div class="card"><div class="insp-head"><h2>Gap · ${area(gp.area)}</h2>${close}</div>
      <p class="small muted" style="margin:4px 0 10px">Floor the rooms don't cover. If it's a room the plan reading lost, make it that room. (Or leave it: on Check, switch it into the hallway or the room it opens off, or leave it out.)</p>
      <div class="pills">${o.gapKinds.map((k) => `<button data-kind="${esc(k.id)}" data-label="${esc(k.label)}">${esc(k.label)}</button>`).join('')}</div></div>`;
  } else {
    html += `<div class="card"><h2>Edit the rooms</h2><ul class="small muted" style="margin:6px 0 0;padding-left:18px">
        <li>Click a room to rename it, change its type, reshape it or delete it.</li>
        <li>Drag any wall to move it — the room on the other side comes too.</li>
        <li>Pick a room, then drag its corners, or drag a + to put a corner in a wall (rooms needn't be rectangles).</li>
        <li><b>Draw a room</b> to add one the reading missed, corner by corner.</li>
        <li><b>Windows</b>: drag along an outside wall to draw a window or glass door where the plan has it.</li>
        <li><b>Set the size</b> if the sizes are out: click a wall you know the length of and type it.</li></ul>
      <div class="actions-row"><button class="btn" id="ed-draw">Draw a room</button><button class="btn2" id="ed-win">Draw windows</button></div></div>
      ${v.rooms.length ? (unsized ? `<div class="card"><h2>${v.rooms.length} rooms</h2>
        ${v.rooms.map((r) => `<button class="kv" data-pick="${r.id}" style="width:100%;border:0;background:none;cursor:pointer;text-align:left"><span>${esc(r.name)}</span><b>${area(r.area)}</b></button>`).join('')}</div>`
        : `<div class="card">${houseFacts(v, 'data-pick')}</div>`)
      : '<div class="card"><p class="small muted" style="margin:0">No rooms yet. Pick <b>Draw a room</b> and click round the first room\'s corners.</p></div>'}`;
  }
  // Along the bottom, as the mock has it: the rooms drawn and the home's load, and the way on.
  const foot = v.rooms.length && !unsized ? `<div class="ifoot"><span><small>${v.rooms.length} room${v.rooms.length === 1 ? '' : 's'} drawn</small><b>${fmt(v.totals.wholeHomeKW ?? v.totals.connectedKW, 1)} kW whole home</b></span>
    <button class="btn" id="ed-next">${ctaLabel('Check the rooms →')}</button></div>` : '';
  el.classList.toggle('ipanel', !!foot);
  el.innerHTML = foot ? `<div class="iscroll">${html}</div>${foot}` : html;
  $('#ed-next', el)?.addEventListener('click', closeEditor);
  const room = () => (sel?.kind === 'room' ? ed.room(sel.id) : null);
  $('#ed-close', el)?.addEventListener('click', () => { ed.sel = null; edPanel(); st.plan?.draw(); });
  $('#ed-draw', el)?.addEventListener('click', () => ed.setMode('draw'));
  $('#ed-win', el)?.addEventListener('click', () => ed.setMode('window'));
  $('#dr-win', el)?.addEventListener('click', () => ed.setMode('window'));
  $('#dr-rooms', el)?.addEventListener('click', () => ed.setMode('draw'));
  $('#win-done', el)?.addEventListener('click', () => ed.setMode('edit'));
  $('#win-more', el)?.addEventListener('click', () => ed.setMode('window'));
  if (sel?.kind === 'window') {
    const { room: wr, n: wn } = sel;
    const mm = (v) => { const n = parseFloat(v); return n > 0 ? (n > 20 ? n / 1000 : n) : null; };
    $('#win-h', el)?.addEventListener('change', (e) => { const h = mm(e.target.value); if (h) edEdit('resizeWindow', { room: wr, n: wn, height: h }); });
    $('#win-w', el)?.addEventListener('change', (e) => { const w = mm(e.target.value); if (w) edEdit('resizeWindow', { room: wr, n: wn, width: w }); });
    el.querySelectorAll('[data-wh]').forEach((b) => (b.onclick = () => edEdit('resizeWindow', { room: wr, n: wn, height: +b.dataset.wh / 1000 })));
    $('#win-del', el)?.addEventListener('click', () => { ed.sel = null; edEdit('removeWindow', { room: wr, n: wn }); });
  }
  el.querySelectorAll('[data-pickwin]').forEach((b) => (b.onclick = () => { const r = room(); if (r) { ed.sel = { kind: 'window', room: r.id, n: +b.dataset.pickwin }; edPanel(); st.plan?.draw(); } }));
  el.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => { ed.sel = { kind: 'room', id: b.dataset.pick }; edPanel(); st.plan?.draw(); }));
  $('#dr-finish', el)?.addEventListener('click', () => ed.finish());
  $('#dr-back', el)?.addEventListener('click', () => ed.undoPoint());
  $('#dr-stop', el)?.addEventListener('click', () => ed.setMode(ed.draft.length ? 'draw' : 'edit'));
  $('#ms-stop', el)?.addEventListener('click', () => ed.setMode('edit'));
  $('#go-size', el)?.addEventListener('click', () => ed.setMode('measure'));
  $('#dr-next', el)?.addEventListener('click', closeEditor);
  $('#ed-name', el)?.addEventListener('change', (e) => { const r = room(); if (r && e.target.value.trim()) edEdit('setRoom', { room: r.id, name: e.target.value.trim() }); });
  bindCeiling(el, (id, change) => edEdit('setRoom', { room: id, ...change }));
  $('#ed-type', el)?.addEventListener('change', (e) => { const r = room(); if (r) edEdit('setRoom', { room: r.id, type: e.target.value }); });
  $('#ed-zone', el)?.addEventListener('change', (e) => { const r = room(); if (r) edEdit('setZonePlan', { room: r.id, choice: e.target.value || null }); });
  $('#c-square', el)?.addEventListener('click', () => ed.squareCorner());
  $('#c-remove', el)?.addEventListener('click', () => ed.removeCorner());
  el.querySelectorAll('[data-win]').forEach((b) => (b.onclick = () => { const r = room(); if (r) edEdit('addWindow', { room: r.id, edge: sel.edge, width: +b.dataset.win }); }));
  el.querySelectorAll('[data-unwin]').forEach((b) => (b.onclick = () => { const r = room(); if (r) edEdit('removeWindow', { room: r.id, n: +b.dataset.unwin }); }));
  $('#ed-del', el)?.addEventListener('click', () => {
    const r = room();
    if (r) confirmDialog(`Delete ${r.name}?`, 'The room comes off the plan (its floor shows as a gap), with any vents in it.', 'Delete the room', async () => {
      ed.sel = null;
      await edEdit('deleteRoom', { room: r.id });
    });
  });
  el.querySelectorAll('[data-kind]').forEach((b) => (b.onclick = async () => {
    const res = await edEdit('makeRoom', { key: sel.key, name: b.dataset.label, type: b.dataset.kind });
    if (res?.id) { ed.sel = { kind: 'room', id: res.id }; edPanel(); st.plan?.draw(); }
  }));
}

/// A room drawn: what it is, then in it goes (rooms it was drawn over give way). Drawing carries on for the next.
function newRoomDialog(pts) {
  const st = app.editorOpen;
  if (!st) return;
  // Bedrooms number on from Bed 2 (Bed 1 is the master on most plans): Bed 2, Bed 3…
  const nums = app.view.rooms.map((x) => /^bed(?:room)?\s*(\d+)$/i.exec(x.name.trim())?.[1]).filter(Boolean).map(Number);
  const nextBed = `Bed ${Math.max(1, ...nums) + 1}`;
  // An ensuite goes with the bedroom it opens off (its zone too); a second one is Ensuite 2.
  const ens = app.view.rooms.filter((x) => /^ens/i.test(x.name.trim())).length;
  const kinds = [['Master bedroom', 'bedroom', 'Master Bedroom'], ['Bedroom', 'bedroom', nextBed], ['Ensuite', 'bathroom', ens ? `Ensuite ${ens + 1}` : 'Ensuite'],
    ['Living', 'living'], ['Family', 'family'], ['Kitchen', 'kitchen'], ['Dining', 'dining'], ['Study', 'study'], ['Bathroom', 'bathroom'],
    ['Laundry', 'laundry'], ['Hallway', 'hallway'], ['Garage', 'garage']];
  let pick = kinds[1];
  const nameFor = (k) => k[2] ?? k[0];
  const area = Math.abs(signedArea(pts));
  const d = dialog(`<h2>The new room${isUnsized() ? '' : ' · ' + fmt(area, 1) + ' m²'}</h2><p class="muted small" style="margin:0 0 10px">What is it?</p>
    <div class="pills" id="nr-kinds">${kinds.map(([l], i) => `<button data-k="${i}" class="${i === 1 ? 'on' : ''}">${l}</button>`).join('')}</div>
    <p class="small muted" style="margin:8px 0 0">An ensuite goes on the zone of the bedroom it opens off. Garage takes in anything not air conditioned (robe, pantry, store).</p>
    <label class="field" style="margin-top:12px"><span>Name</span><input id="nr-name" placeholder="${esc(nameFor(kinds[1]))}" autofocus></label>
    <label class="field" id="nr-zonef"><span>Zone</span><select id="nr-zone">${zoneOptions(null, '')}</select>
      <small class="muted" style="display:block;margin-top:4px">Its own zone, on a zone with other rooms, or no zone (always on). Change it later on the room.</small></label>`,
  [{ label: 'Cancel', run: () => { st.plan?.draw(); edPanel(); } },
    { label: 'Add the room', primary: true, run: async (o) => {
      const name = $('#nr-name', o).value.trim() || nameFor(pick);
      const zone = pick[1] === 'garage' ? null : ($('#nr-zone', o).value || null);
      const r = await edEdit('addRoom', { outline: pts, name, type: pick[1], choice: zone });
      if (r?.id) toast((app.view.rooms.find((x) => x.id === r.id)?.name ?? pick[0]) + (isUnsized() ? ' added — draw the rest, then set the size' : ' added — draw the next room, or Select to fix one'));
      else { st.ed.draft = pts; st.ed.mode = 'draw'; edPanel(); st.plan?.draw(); }
    } }]);
  // The pills' buttons sit inside the dialog: their clicks pick a kind rather than close it.
  d.querySelector('#nr-kinds').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    pick = kinds[+b.dataset.k];
    d.querySelectorAll('#nr-kinds button').forEach((x) => x.classList.toggle('on', x === b));
    $('#nr-name', d).placeholder = nameFor(pick);
    $('#nr-zonef', d).style.display = pick[1] === 'garage' ? 'none' : '';
  });
  edPanel();
}

/// A length picked in the editor (a wall, or two points): what it really is, and the whole plan sized to match.
function scaleDialog(a, b, wall) {
  const st = app.editorOpen;
  if (!st) return;
  const now = Math.hypot(b.x - a.x, b.y - a.y), unsized = isUnsized();
  dialog(`<h2>How long is ${wall ? 'this wall' : 'that'}, really?</h2>
    <p class="muted small" style="margin:0 0 10px">${unsized ? '' : `It's ${metres(now)} on the plan now. `}Type the printed size${wall ? '' : ' (or what the scale bar says)'} and the rooms and the plan image are sized to match.${app.project.design ? ' The ducts are laid out again after.' : ''}</p>
    <label class="field"><span>Length in mm</span><input id="sc-mm" type="number" min="100" step="10" placeholder="e.g. 3600" autofocus></label>`,
  [{ label: 'Cancel', run: () => st.ed.setMode('measure') },
    { label: 'Size the plan', primary: true, run: async (o) => {
      const mm = parseFloat($('#sc-mm', o).value);
      if (!(mm >= 100 && mm <= 100000)) { toast('Type the length in millimetres, e.g. 3600'); return true; }
      const k = mm / 1000 / now;
      const r = await edEdit('rescale', { by: k });
      st.ed.setMode('edit');
      if (r) {
        st.bounds = editorBounds(); st.zoom = null; st.pan = null;
        render();
        toast(unsized ? `Sized — ${app.view.rooms.length} room${app.view.rooms.length === 1 ? '' : 's'}, ${g(app.view.totals.area)} m². Check them over, then Done.` : `Sized ×${k.toFixed(3)} — the rooms are ${k > 1 ? 'bigger' : 'smaller'} now`);
      }
    } }]);
}

// MARK: Design

/// Where the plan's zoomed and panned to, per job and step, so an edit (which re-renders the page) doesn't throw the
/// view back out to the whole house (Jake, 19 Nov 2026: "every time we move a vent or anything it zooms back out").
const planViews = new Map();
function mountPlan(cv, opts) {
  const { handlers, layout, ...rest } = opts;
  const key = `${app.project?.id ?? ''}:${app.step}`;
  const keep = () => planViews.set(key, { zoom: plan.zoom, pan: { ...plan.pan } });
  const on = { ...(handlers ?? {}), changed: () => { keep(); handlers?.changed?.(); } };
  const plan = new Plan(cv, on);
  const was = planViews.get(key);
  if (was) { plan.zoom = was.zoom; plan.pan = { ...was.pan }; }
  plan.set({
    project: app.project, view: app.view, layout: layout === false ? null : app.layout, air: app.air, backdrop: app.backdrop,
    upperBackdrop: app.upperBackdrop, topBackdrop: app.topBackdrop, showPlan: true, splitRooms: otherRooms(), allSizes: app.layers.allSizes, zoneCards: app.layers.zones, sound: app.layers.sound !== false, showAir: false, selection: null,
    ghost: ductedB() ? app.otherLayout : null, hatch: ductedB() ? T.line : null, vrfLabel: vrfLabel(), ...rest,
  });
  return plan;
}

/// B's heads on A's VRF outdoor: the plan names the outdoor that runs the lot, not what B alone would need.
function vrfLabel() {
  if (!isVrfB(app.project) || !app.project.vrfSpot || !app.split) return null;
  const v = vrfPick(app.ductView, null, app.split.heads);
  return `VRF · ${v.pick?.model ?? 'none fits'} · with A`;
}

/// The rooms of the system not on screen, hatched on the plan: B's (a split, or ducted B behind A), or A's when ducted
/// B is in front.
function otherRooms() {
  const p = app.project;
  if (!p?.splitRooms?.length) return null;
  return ductedB() && activeSys(p) === 'B' ? p.rooms.filter((r) => !onB(r.id)).map((r) => r.id) : p.splitRooms;
}

let liveRoute = latest(call);

function renderDesign(c) {
  const l = app.layout, v = app.view, p = app.project;
  if (isSplit() && v.planChecked) { renderSplitDesign(c); return; }
  if (!v.planChecked && !p.design) {
    c.innerHTML = `<div class="card empty" style="max-width:560px;margin:20px auto"><h2>Check the rooms first</h2><p>The ducts are laid out once the rooms, open areas and ensuite are checked.</p><button class="btn" data-go="plan" style="margin-top:12px">Check the rooms</button></div>`;
    c.querySelector('[data-go]').onclick = () => go('plan');
    return;
  }
  const bags = (l?.flex ?? []).reduce((s, f) => s + f.bags, 0);
  const zones = (l?.zones ?? []).filter((z) => z.number !== 0).length;
  c.innerHTML = `<div class="work with-rail">
    <div class="rail ${app.three ? 'off' : ''}">
      <button id="t-select" class="${app.addMode ? '' : 'on'}">${icon('cursor')}<span class="tip">Select and drag</span></button>
      <button id="t-add" class="${app.addMode === true ? 'on' : ''}">${icon('addvent')}<span class="tip">${app.addMode === true ? 'Done adding outlets' : 'Add an outlet'}</span></button>
      <button id="t-pen" class="${app.addMode === 'pen' ? 'on' : ''}">${icon('pen')}<span class="tip">${app.addMode === 'pen' ? 'Done drawing ducts' : 'Draw the ducts'}</span></button>
      ${l?.handDrawn ? '' : `<button id="t-bdo" class="${app.addMode === 'bdo' ? 'on' : ''}">${icon('bdo')}<span class="tip">${app.addMode === 'bdo' ? 'Done making BDOs' : 'New BDO: tap 2 or 3 vents'}</span></button>`}
      ${v.twoStorey ? `<button id="t-dropper" class="${app.addMode === 'dropper' ? 'on' : ''}">${icon('dropper')}<span class="tip">${app.addMode === 'dropper' ? 'Done adding droppers' : 'Add a dropper'}</span></button>` : ''}
      ${lineTools()}
      <button id="t-layers">${icon('layers')}<span class="tip">Layers</span></button>
      <button id="t-undo" ${app.undo.length ? '' : 'disabled'}>${icon('undo')}<span class="tip">Undo</span></button>
      <button id="t-redo" ${app.redo.length ? '' : 'disabled'}>${icon('redo')}<span class="tip">Redo</span></button>
      <button id="t-fit">${icon('fit')}<span class="tip">Fit the plan</span></button>
    </div>
    <div class="stage">
      <div class="bar">
        <div class="stats"><div><b>${ductedView().totals.unit ? g(ductedView().totals.unit.kw) + ' kW' : '—'}</b><span>unit</span></div><div><b>${zones || '—'}</b><span>zones</span></div>
          <div><b>${l ? l.outlets.filter((o) => !o.dropper).length : '—'}</b><span>outlets</span></div><div><b>${l ? bags : '—'}</b><span>flex bags</span></div></div>
        <div class="spacer" style="flex:1"></div>
        <button class="btn2 small" id="b-undo" title="Undo the last change" ${app.undo.length ? '' : 'disabled'}>${icon('undo').replace('<svg', '<svg width="15" height="15"')} Back</button>
        <button class="btn2 small" id="b-redo" title="Redo it" ${app.redo.length ? '' : 'disabled'}>Forward ${icon('redo').replace('<svg', '<svg width="15" height="15"')}</button>
        <div class="seg"><button data-dim="2" class="${app.three ? '' : 'on'}">2D</button><button data-dim="3" class="${app.three ? 'on' : ''}">3D</button></div>
        ${app.three ? `<div class="seg"><button data-tint="zone" class="${app.heat3d ? '' : 'on'}">Zones</button><button data-tint="heat" class="${app.heat3d ? 'on' : ''}">Heat</button></div>`
          : `<div class="seg"><button data-mode="plan" class="${app.layers.air ? '' : 'on'}">Plan</button><button data-mode="air" class="${app.layers.air ? 'on' : ''}">Air</button></div>`}
        ${isMixed() ? sysTabs() + (sysView() === 'B' ? bKindSeg() : '') : systemSwitch()}
      </div>
      <div class="canvas-card"><canvas id="cv"></canvas>${app.three ? '<div class="h3d" id="h3d"></div>' : ''}${zoomCtl()}
        <div class="north">${'<svg width="14" height="16" viewBox="0 0 14 16"><path d="M7 0l6 16-6-4-6 4z" fill="#E0342F"/></svg>'}<div>N</div></div>
        ${app.designing ? '<div class="busy"><div><div class="spinner"></div>Placing the fan coil…</div></div>' : ''}
      </div>
      <div class="hint">${app.three ? 'The house in 3D, to look at: drag to spin it, scroll to zoom, Shift-drag to slide it, tap a room or a vent. Switch back to 2D to change the design.' : lineHint() || (app.joining ? `Tap the room to join ${esc(v.rooms.find((r) => r.id === app.joining)?.name ?? '')} with. <button class="link" id="cancel-join">Cancel</button>`
        : app.addMode === 'pen' ? penHint()
        : app.addMode === 'bdo' ? `Tap 2 or 3 vents to put on one BDO. They can be on different zones: each leg gets its own damper. ${app.bdoPick?.length ? `<b>${app.bdoPick.length} picked</b> · <button class="link" id="bdo-make" ${app.bdoPick.length < 2 ? 'disabled' : ''}>Make the BDO</button> · <button class="link" id="bdo-clear">Clear</button>` : ''}`
        : app.addMode === 'dropper' ? 'Tap where a dropper goes: on the top floor where it leaves the roof, or on the floor below where it comes out. It lands in the same spot on both: the dashed outline is the floor above.'
        : app.addMode ? 'Tap inside a room to drop an outlet.'
        : l && !l.outlets.some((o) => !o.dropper) ? 'Tap <b>Add an outlet</b> on the left, then tap inside each room. The rooms still waiting for air are listed on the right, and the ducts draw and size themselves as you go.'
        : p.existing ? `Re-duct: drag the fan coil to where the ${p.existing.kind === 'heater' ? 'heater' : 'unit'} is in the roof.`
        : l?.handDrawn ? `Ducts drawn by hand: the router's off.${unfedCount() ? ` <b>${unfedCount()} vent${unfedCount() === 1 ? '' : 's'} not connected.</b>` : ''}${l.crossings ? ` <b>${l.crossings} pair${l.crossings === 1 ? '' : 's'} of ducts cross:</b> tap one and drag a bend to take it round the other.` : ''} Ducts that run along each other sit side by side. Draw with the pen, drag a BDO, tap a duct to take it out. <button class="link" id="hand-off">Let the router lay them out again</button>`
        : 'Drag a vent, a BDO, the fan coil or the return and the ducts re-route as you go. Tap a room, vent or duct to see it on the right.')}</div>
    </div>
    <div class="panel" id="insp"></div>
  </div>`;
  const plan = mountPlan($('#cv', c), {
    selection: app.selection, showAir: app.layers.air, addMode: app.addMode, interactive: true, labels: true, compact: true,
    allSizes: app.layers.allSizes || app.layers.speeds, speeds: app.layers.speeds ? speedLimits() : null, lineDraft: app.lineDraft,
    picked: app.addMode === 'bdo' ? app.bdoPick ?? [] : null,
    penDraft: penDraft(),
    handBends: handBends(),
    handlers: {
      select: (item) => select(item),
      pen: (h) => penTap(h),
      pick: (id) => pickForBox(id),
      add: (pos) => (isLineMode() ? addLinePoint(pos) : app.addMode === 'dropper' ? addDropper(pos) : addVent(pos)),
      dragMove: (item, pos) => dragMove(item, pos),
      drop: (item, pos) => drop(item, pos),
    },
  });
  app.plan = plan;
  renderInspector();
  mount3D(c, plan);
  c.querySelectorAll('[data-dim]').forEach((b) => (b.onclick = () => { app.three = b.dataset.dim === '3'; if (app.three) app.addMode = false; render(); }));
  c.querySelectorAll('[data-tint]').forEach((b) => (b.onclick = () => { app.heat3d = b.dataset.tint === 'heat'; render(); }));
  $('#t-select', c).onclick = () => { app.addMode = false; render(); };
  $('#t-add', c).onclick = () => { app.addMode = app.addMode === true ? false : true; if (app.addMode) app.selection = null; render(); };
  $('#t-pen', c).onclick = () => { app.addMode = app.addMode === 'pen' ? false : 'pen'; app.pen = null; if (app.addMode) app.selection = null; render(); };
  $('#pen-routed', c)?.addEventListener('click', () => edit('startHand', {}).then((r) => r && toast('The router\'s ducts are yours now: redraw, drag or take out any of them.')));
  $('#pen-blank', c)?.addEventListener('click', () => edit('startHand', { choice: 'blank' }));
  $('#pen-box', c)?.addEventListener('click', () => penFinish(null));
  $('#pen-back', c)?.addEventListener('click', () => { app.pen?.via.pop(); render(); });
  $('#pen-cancel', c)?.addEventListener('click', () => { app.pen = null; render(); });
  $('#hand-off', c)?.addEventListener('click', () => edit('stopHand', {}).then((r) => r && toast('The router lays the ducts out again.')));
  $('#t-bdo', c)?.addEventListener('click', () => { app.addMode = app.addMode === 'bdo' ? false : 'bdo'; app.bdoPick = []; if (app.addMode) app.selection = null; render(); });
  $('#bdo-make', c)?.addEventListener('click', () => makeBoxFromPick());
  $('#bdo-clear', c)?.addEventListener('click', () => { app.bdoPick = []; render(); });
  bindLineTools(c);
  $('#t-dropper', c)?.addEventListener('click', () => { app.addMode = app.addMode === 'dropper' ? false : 'dropper'; if (app.addMode) app.selection = null; render(); });
  $('#t-undo', c).onclick = undo;
  $('#t-redo', c).onclick = redo;
  $('#b-undo', c).onclick = undo;
  $('#b-redo', c).onclick = redo;
  bindZoomCtl(c, { zoomBy: (k) => (app.three ? app.h3d?.zoomBy(k) : plan.zoomBy(k)), fit: () => (app.three ? app.h3d?.fit() : plan.fit()), setHand: (on) => plan.setHand(on) });
  $('#t-fit', c).onclick = () => plan.fit();
  $('#t-layers', c).onclick = (e) => layersMenu(e.currentTarget);
  $('#cancel-join', c)?.addEventListener('click', () => { app.joining = null; render(); });
  bindSystemSwitch(c);
  bindSysTabs(c);
  c.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = async () => {
    app.layers.air = b.dataset.mode === 'air'; saveLayers();
    if (app.layers.air && !app.air && app.layout) app.air = await call('air', { project: app.project, closed: [...app.closed], balanced: app.balanced });
    render();
  }));
}

/// The 3D house over the plan on Air & pipes (the 2D / 3D switch): the same job, the same side list, to look at. The
/// camera's kept between redraws.
let H3D = null;
async function mount3D(c) {
  app.h3d?.destroy(); app.h3d = null;
  const host = $('#h3d', c);
  if (!host || !app.three) return;
  H3D ??= (await import('./house3d.js?v=f11c00d-202611241727')).House3D;
  if (!host.isConnected) return;
  app.h3d = new H3D(host, { select: (item) => select(item), changed: (cam) => { app.cam3d = cam; } }, app.cam3d ?? null);
  app.h3d.set({ view: app.view, layout: app.layout, air: app.air, selection: app.selection, heat: !!app.heat3d, sound: app.layers.sound !== false, airOn: true });
}

/// The customer's view (Jake, 22 Nov 2026: a 3D page "for the customer"): their home filling the screen with the system
/// in the roof and the air moving, the whole home or one room on its own, and a plain line about whatever they tap.
async function openCustomer3D() {
  const p = app.project, v = app.view;
  const all = await call('route', { project: p, closed: [], balanced: true });
  const air = await call('air', { project: p, closed: [], balanced: true }).catch(() => null);
  const zones = all.zones.filter((z) => z.number !== 0 && z.outlets > 0);
  const o = document.createElement('div');
  o.className = 'overlay cust3d';
  o.innerHTML = `<div class="c3-top"><div class="c3-title"><b>${esc(p.customer?.name || v.title || 'Your home')}</b><span>${esc(p.customer?.address || '')}</span></div>
      <div class="seg"><button data-c3run="all" class="on">Whole home</button><button data-c3run="one" ${zones.length < 2 ? 'disabled' : ''}>One room</button></div>
      <div class="seg"><button data-c3tint="zone" class="on">Zones</button><button data-c3tint="heat">Heat</button></div>
      <button class="iconbtn" id="c3-close" aria-label="Close" style="background:#fff">${icon('x')}</button></div>
    <div class="c3-stage" id="c3-stage"></div>
    <div class="c3-card" id="c3-card"></div>`;
  document.body.append(o);
  H3D ??= (await import('./house3d.js?v=f11c00d-202611241727')).House3D;
  let layout = all, pick = null, mode = 'all', heat = false, only = null;
  const u = ductedView().totals.unit, vents = all.outlets.filter((x) => !x.dropper && !x.spill).length;
  const card = () => {
    const el = $('#c3-card', o), room = pick?.kind === 'room' ? v.rooms.find((r) => r.id === pick.id) : pick?.kind === 'outlet' ? v.rooms.find((r) => r.id === layout.outlets.find((x) => x.id === pick.id)?.roomId) : null;
    if (room && room.conditioned) {
      const outs = layout.outlets.filter((x) => x.roomId === room.id && !x.spill && !x.dropper), on = outs.filter((x) => x.open && x.lps > 0);
      const gets = on.reduce((t, x) => t + x.lps, 0), db = on.length ? Math.max(...on.map((x) => x.dbA)) : null;
      el.innerHTML = `<span class="eyebrow">${room.zone ? 'Zone ' + room.zone : 'Always on'}</span><h2>${esc(room.name)}</h2>
        <div class="c3-nums"><div><b>${on.length ? fmt(gets) : '—'}</b><span>L/s of air${on.length ? '' : ' (off)'}</span></div><div><b>${db != null ? fmt(db) : '—'}</b><span>dB(A) at the vent</span></div>
          <div><b>${outs.length}</b><span>vent${outs.length === 1 ? '' : 's'}</span></div><div><b>${fmt(room.kw, 1)}</b><span>kW on the hottest day</span></div></div>`;
    } else if (room) {
      el.innerHTML = `<h2>${esc(room.name)}</h2><p>Not air conditioned.</p>`;
    } else {
      const sp = layout.spill, one = mode === 'one' && only != null ? zones.find((z) => z.number === only) : null;
      el.innerHTML = `<span class="eyebrow">${one ? 'One room on its own' : 'The whole home'}</span><h2>${one ? 'Only ' + esc(one.name) + ' on' : esc(u ? `${g(u.kw)} kW ducted system` : 'Ducted system')}</h2>
        <div class="c3-nums"><div><b>${fmt(layout.totalLps)}</b><span>L/s from the fan</span></div><div><b>${fmt(layout.totalLps / Math.max(all.fanLps, 1) * 100)}%</b><span>of full fan speed</span></div>
          <div><b>${one ? 1 : zones.length}</b><span>zone${one || zones.length === 1 ? '' : 's'} on</span></div><div><b>${vents}</b><span>vents in the home</span></div></div>
        <p>${one && sp?.spilling ? `The fan slows right down. It can't go below about ${fmt(sp.floorLps)} L/s, so the spare air spills ${sp.kind === 'outlet' ? 'out a spill outlet' : 'into ' + esc(sp.name)}.` : one ? 'The fan slows right down for just this zone.' : 'The fan coil sits in the roof space and feeds every room through its own vent. Tap a room to see its air and sound.'}</p>`;
    }
  };
  const h = new H3D($('#c3-stage', o), { select: async (item) => {
    pick = item && (item.kind === 'room' || item.kind === 'outlet') ? item : null;
    if (mode === 'one' && pick) {
      const z = pick.kind === 'room' ? v.rooms.find((r) => r.id === pick.id)?.zone : layout.outlets.find((x) => x.id === pick.id)?.zone;
      if (z && z !== only && zones.some((q) => q.number === z)) { only = z; await run(); return; }
    }
    h.set({ selection: pick }); card();
  } });
  const run = async () => {
    const closed = mode === 'one' && only != null ? zones.filter((z) => z.number !== only).map((z) => z.number) : [];
    layout = closed.length ? await call('route', { project: p, closed, balanced: true }) : all;
    const a = closed.length ? await call('air', { project: p, closed, balanced: true }).catch(() => air) : air;
    if (!o.isConnected) return;
    h.set({ view: v, layout, air: a, selection: pick, heat, sound: true, airOn: true });
    card();
  };
  o.querySelectorAll('[data-c3run]').forEach((b) => (b.onclick = async () => {
    mode = b.dataset.c3run;
    if (mode === 'one') only = (pick?.kind === 'room' ? v.rooms.find((r) => r.id === pick.id)?.zone : null) || only || [...zones].sort((x, y) => x.designLps - y.designLps)[0]?.number;
    o.querySelectorAll('[data-c3run]').forEach((x) => x.classList.toggle('on', x === b));
    await run();
  }));
  o.querySelectorAll('[data-c3tint]').forEach((b) => (b.onclick = () => { heat = b.dataset.c3tint === 'heat'; o.querySelectorAll('[data-c3tint]').forEach((x) => x.classList.toggle('on', x === b)); h.set({ heat }); }));
  const close = () => { h.destroy(); o.remove(); };
  $('#c3-close', o).onclick = close;
  await run();
}

/// The class's limits for the plan's speed labels (branch, trunk, return m/s), or null.
function speedLimits() { const lim = app.options.velocityLimits?.[app.project?.site?.velocityPref ?? 'standard']; return lim ? { ...lim, ventCap: app.options.ventCap, tol: SPEED_TOL } : null; }

function layersMenu(anchor) {
  document.querySelector('.menu')?.remove();
  const m = document.createElement('div');
  m.className = 'menu';
  const r = anchor.getBoundingClientRect();
  m.style.left = r.right + 8 + 'px'; m.style.top = r.top + 'px'; m.style.position = 'fixed';
  m.innerHTML = `<label><input type="checkbox" data-l="allSizes" ${app.layers.allSizes ? 'checked' : ''}> All duct sizes</label>
    <label><input type="checkbox" data-l="zones" ${app.layers.zones ? 'checked' : ''}> Zone cards (kW, L/s, m²)</label>
    <label><input type="checkbox" data-l="sound" ${app.layers.sound !== false ? 'checked' : ''}> Vent sound (dB)</label>
    <label><input type="checkbox" data-l="speeds" ${app.layers.speeds ? 'checked' : ''}> Air speed on the ducts (m/s)</label>
    <label><input type="checkbox" data-l="air" ${app.layers.air ? 'checked' : ''}> Airflow</label>`;
  document.body.append(m);
  m.onchange = async (e) => {
    const k = e.target.dataset.l;
    app.layers[k] = e.target.checked; saveLayers();
    if (k === 'air' && app.layers.air && !app.air) app.air = await call('air', { project: app.project, closed: [...app.closed], balanced: app.balanced });
    app.plan?.set({ allSizes: app.layers.allSizes || app.layers.speeds, speeds: app.layers.speeds ? speedLimits() : null, zoneCards: app.layers.zones, sound: app.layers.sound !== false, showAir: app.layers.air, air: app.air });
  };
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off); render(); } }), 0);
}

function select(item) {
  if (item?.kind === 'zoneCard') return;                     // a zone card's only moved
  // A bend on the picked duct: picked (to take it out), the duct stays picked.
  if (item?.kind === 'bend' || item?.kind === 'bendAdd') {
    if (item.kind === 'bend') app.bend = { id: item.id, i: item.i };
    app.plan?.set({ handBends: handBends() });
    renderInspector();
    return;
  }
  if (item?.kind === 'boxTurn') return;                    // turning the picked BDO: it stays picked
  app.bend = null;
  if (app.joining && item?.kind === 'room') {
    const a = app.joining;
    app.joining = null;
    if (item.id !== a) edit('joinRooms', { a, b: item.id }).then((r) => r && toast('Joined — one zone and one BDO between them'));
    else render();
    return;
  }
  // A duct picked, then a BDO tapped: the duct comes off that BDO (the BDO it's on already is just picked).
  if (item?.kind === 'box' && !app.addMode && !app.three) {
    const key = ductKey(app.selection);
    if (key && refeedable(key, item.id)) { refeed(key, item.id); return; }
  }
  if (item?.kind === 'dropTop' || item?.kind === 'dropFoot') item = { kind: 'dropper', id: item.id };
  app.selection = item;
  if (item) app.addingUnit = false;
  app.plan?.set({ selection: item, handBends: handBends() });
  app.h3d?.set({ selection: item });
  // A split's heads: a split job's, or system B's on a two-system job (its own panel, not the ducts').
  if (isSplit() || (isMixed() && sysView() === 'B' && !ductedB())) renderSplitInspector(); else renderInspector();
}

/// What a picked duct feeds, as the engine's `refeed` names it: a vent ("outlet:<id>") or a BDO ("box:<bid>"). Null
/// when what's picked isn't a duct.
function ductKey(s) {
  const l = app.layout;
  if (!l || !s) return null;
  if (s.kind === 'outlet' && s.duct && l.runs.some((r) => r.outlet === s.id)) return 'outlet:' + s.id;
  if (s.kind === 'feed' && l.runs.some((r) => r.keyBox === s.id)) return 'box:' + s.id;
  return null;
}
/// The BDO a duct comes off now (null: the fan coil, or not known).
function ductSource(key) {
  const l = app.layout;
  if (key.startsWith('outlet:')) return l.boxes.find((b) => b.outlets?.includes(key.slice(7)))?.bid ?? null;
  let r = [...l.runs].reverse().find((x) => x.keyBox === key.slice(4));
  for (let n = 0; r && n < 16; n++) { r = l.runs[r.parent]; if (r?.keyBox) return r.keyBox; }
  return null;
}
/// A BDO the picked duct could be fed from instead: not its own, and not the one it's on.
function refeedable(key, bid) { return key !== 'box:' + bid && ductSource(key) !== bid; }
/// A duct picked, then a BDO tapped (Jake, 24 Nov 2026: "click a duct and then click the BDO and make it go from that
/// BDO"). Ducts the router laid out become drawn by hand as they lie, so only this duct moves.
async function refeed(key, bid) {
  const was = app.layout, hand = was.handDrawn, old = was.boxes.find((b) => b.bid === key.slice(4))?.pos;
  if (!(await edit('refeed', { key, bid }))) return;
  const l = app.layout;
  if (key.startsWith('box:')) {
    // Its BDO has a new id once the ducts are by hand: found again by where it sits.
    const near = old && [...l.boxes].sort((a, b) => Math.hypot(a.pos.x - old.x, a.pos.y - old.y) - Math.hypot(b.pos.x - old.x, b.pos.y - old.y))[0];
    app.selection = near ? { kind: 'feed', id: near.bid } : null;
  }
  render();
  toast(l.handDrawn && !hand ? 'Now off that BDO. The ducts are drawn by hand from here: the router\'s off.' : 'Now off that BDO. Back undoes it.');
}

async function addDropper(pos) {
  const r = await edit('addDropper', { pos });
  if (r?.id) { app.addMode = false; app.selection = { kind: 'dropper', id: r.id }; render(); }
}

// MARK: Drawing the ducts by hand

/// The picked duct's bends, when it's drawn by hand: its run, where it starts and ends on the plan, and its bends.
function pickedHandRun() {
  const l = app.layout, s = app.selection;
  if (!l || !s || app.addMode || s.kind === 'box') return null;
  const run = s.kind === 'outlet' ? l.runs.find((x) => x.outlet === s.id)
    : s.kind === 'feed' ? [...l.runs].reverse().find((x) => x.keyBox === s.id) : null;
  if (!run) return null;
  if (!l.handDrawn) {
    // Laid out by the router: its corners are the bends; bending one draws the ducts by hand from here on.
    return { run, router: true, hr: { id: 'R:' + l.runs.indexOf(run), via: cornersOf(run.path) } };
  }
  const hr = run.hand && app.project.design?.hand?.runs.find((x) => x.id === run.hand);
  return hr ? { run, hr } : null;
}
/// A routed duct's corners worth bending at (the flat points between them dropped).
function cornersOf(path) {
  const keep = (pts, eps) => {
    if (pts.length < 3) return pts;
    const a = pts[0], b = pts[pts.length - 1];
    let best = -1, bi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      const d = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / L;
      if (d > best) { best = d; bi = i; }
    }
    return best > eps ? [...keep(pts.slice(0, bi + 1), eps).slice(0, -1), ...keep(pts.slice(bi), eps)] : [a, b];
  };
  return keep(path, 0.25).slice(1, -1);
}
/// A bend dragged on a duct the router laid out: the ducts become drawn by hand (as the router had them), then this
/// duct takes its new bends — found by where it was grabbed, as the hand-drawn duct's id is new.
async function bendRouted(newVia, grab) {
  if (!(await edit('startHand', {}))) return;
  const l = app.layout, hand = app.project.design?.hand;
  if (!l?.handDrawn || !hand) return;
  let best = null, bd = Infinity;
  for (const r of l.runs) {
    if (!r.hand) continue;
    for (let k = 1; k < r.path.length; k++) {
      const a = r.path[k - 1], b = r.path[k], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((grab.x - a.x) * dx + (grab.y - a.y) * dy) / L2));
      const d = Math.hypot(a.x + dx * t - grab.x, a.y + dy * t - grab.y);
      if (d < bd) { bd = d; best = r; }
    }
  }
  if (!best) return;
  toast('Ducts now drawn by hand, so your bends stay put');
  await edit('setHandVia', { key: best.hand, outline: newVia });
}
function handBends() {
  const p = pickedHandRun();
  if (!p) return null;
  const path = p.run.path;
  return { id: p.hr.id, ri: app.layout.runs.indexOf(p.run), via: p.hr.via, start: path[0], end: path[path.length - 1], picked: app.bend?.id === p.hr.id ? app.bend.i : null };
}
async function removeBend() {
  const b = app.bend, r = b && app.project.design?.hand?.runs.find((x) => x.id === b.id);
  if (!r || b.i == null || b.i >= r.via.length) return;
  app.bend = null;
  await edit('setHandVia', { key: r.id, outline: r.via.filter((_, i) => i !== b.i) });
}
function bendActions() {
  const p = pickedHandRun();
  if (!p) return '';
  if (p.router) return `<p class="small muted" style="margin:8px 0 0">Bend it: drag a bend or a + on the duct. The ducts are then drawn by hand, so your bends stay put.</p>`;
  const n = p.hr.via.length, picked = app.bend?.id === p.hr.id && app.bend.i < n;
  return `<p class="small muted" style="margin:8px 0 0">${n ? `${n} bend${n === 1 ? '' : 's'}: drag one to move it, or a + to add one.` : 'Drag the + on the duct to bend it.'}</p>
    ${n ? `<div class="actions-row">${picked ? '<button class="btn2" id="delbend">Take out this bend</button>' : ''}<button class="btn2" id="straighten">Straighten it</button></div>` : ''}`;
}

/// Vents with no duct to them (ducts drawn by hand).
function unfedCount() {
  const l = app.layout;
  if (!l?.handDrawn) return 0;
  const fed = new Set(l.runs.map((r) => r.outlet).filter(Boolean));
  return l.outlets.filter((o) => !fed.has(o.id)).length;
}
/// Where a hand-drawn duct starts on the plan: the front of the plenum, or a BDO.
function penStart(from) {
  const l = app.layout;
  if (!l || !from) return null;
  if (from === 'unit') { const k = l.unitDepth / 2 + l.plenumDepth; return { x: l.unit.x + l.unitDir.x * k, y: l.unit.y + l.unitDir.y * k }; }
  const id = from.slice(4);
  return l.boxes.find((b) => b.bid === 'H:' + id)?.pos ?? l.looseBoxes?.find((b) => b.id === id)?.pos ?? null;
}
function penDraft() {
  if (app.addMode !== 'pen' || !app.pen?.from) return null;
  return { start: penStart(app.pen.from), via: app.pen.via };
}
function penHint() {
  const l = app.layout;
  if (!l?.handDrawn) return `Draw every duct yourself: the router turns off for this job, and the sizes, dampers and materials follow what you draw.
    <button class="link" id="pen-routed"><b>Start from the router's ducts</b></button> · <button class="link" id="pen-blank">Start with none</button>`;
  if (!app.pen?.from) return 'Tap the fan coil or a BDO to start a duct.' + (unfedCount() ? ` <b>${unfedCount()} vent${unfedCount() === 1 ? '' : 's'} not connected.</b>` : '');
  return `Tap where it bends, then a vent or a BDO to finish${app.pen.via.length ? ', or end it in a new BDO' : ''}. ${app.pen.via.length ? '<button class="link" id="pen-box"><b>New BDO here</b></button> (Enter) · <button class="link" id="pen-back">Undo the last bend</button> · ' : ''}<button class="link" id="pen-cancel">Stop</button> (Esc)`;
}
function penTap(h) {
  const l = app.layout;
  if (!l?.handDrawn) { toast('Pick how to start: from the router\'s ducts, or with none.'); return; }
  const end = h.kind === 'unit' ? 'unit' : h.kind === 'box' ? 'box:' + String(h.id).slice(2) : h.kind === 'outlet' ? 'outlet:' + h.id : null;
  if (!app.pen?.from) {
    if (end === 'unit' || end?.startsWith('box:')) { app.pen = { from: end, via: [] }; render(); }
    else toast('Start a duct at the fan coil or a BDO.');
    return;
  }
  if (h.kind === 'point') { app.pen.via.push(h.pos); app.plan?.set({ penDraft: penDraft() }); renderHint(); return; }
  if (end === 'unit' || end === app.pen.from) return;
  penFinish(end);
}
/// The duct as drawn: to a vent or a BDO, or (`to` null) into a new BDO at the last bend. Drawing carries on from the
/// BDO it came off — or from the new BDO, ready for its legs.
async function penFinish(to) {
  const p = app.pen;
  if (!p?.from) return;
  if (!to && !p.via.length) return;
  const r = await edit('addHandRun', { key: p.from, choice: to ?? undefined, outline: p.via, pos: to ? undefined : p.via[p.via.length - 1] });
  if (!r) { render(); return; }
  app.pen = { from: !to && r.key ? 'box:' + r.key : p.from, via: [] };
  render();
}
function renderHint() {
  const h = document.querySelector('.stage .hint');
  if (h && app.addMode === 'pen') { h.innerHTML = penHint(); renderDesignHintBindings(h); }
}
function renderDesignHintBindings(h) {
  $('#pen-box', h)?.addEventListener('click', () => penFinish(null));
  $('#pen-back', h)?.addEventListener('click', () => { app.pen?.via.pop(); render(); });
  $('#pen-cancel', h)?.addEventListener('click', () => { app.pen = null; render(); });
}

/// New BDO: vents tapped in turn (again to drop one). The third makes the box; two can be made with the link.
function pickForBox(id) {
  if (!app.layout?.outlets.some((o) => o.id === id && !o.dropper)) return;
  const pick = app.bdoPick ?? [];
  app.bdoPick = pick.includes(id) ? pick.filter((x) => x !== id) : [...pick, id];
  if (app.bdoPick.length >= 3) makeBoxFromPick(); else render();
}
async function makeBoxFromPick() {
  const ids = app.bdoPick ?? [];
  if (ids.length < 2) return;
  const r = await edit('makeBox', { ids });
  app.bdoPick = [];
  if (r) {
    app.addMode = false;
    app.selection = r.key && app.layout?.boxes.some((b) => b.bid === r.key) ? { kind: 'box', id: r.key } : null;
    toast(`BDO made: ${ids.length} vents, each on its own damper. Drag it to where it sits.`);
  }
  render();
}

async function addVent(pos) {
  const st = app.project?.design?.outletStyle;
  if (SIDE_STYLES.has(st)) pos = wallSnap(pos, st);
  const r = await edit('addOutlet', { pos });
  if (r?.id) { app.selection = { kind: 'outlet', id: r.id }; render(); }
}

/// While dragging: the design as if dropped here, routed (the quick route for the fan coil), drawn as it comes back.
function dragMove(item, pos) {
  if ((item.kind === 'bend' || item.kind === 'bendAdd') && String(item.id).startsWith('R:')) {
    const p = pickedHandRun();
    if (!p?.router) return;
    const via = p.hr.via.slice();
    if (item.kind === 'bend') via[item.i] = pos; else via.splice(item.i, 0, pos);
    const runs = app.layout.runs.slice(), i = Number(item.id.slice(2)), path = runs[i].path;
    runs[i] = { ...runs[i], path: [path[0], ...via, path[path.length - 1]] };
    app.plan?.set({ layout: { ...app.layout, runs } });
    return;
  }
  if (item.kind === 'bend' || item.kind === 'bendAdd') {
    const d = structuredClone(app.project.design), r = d?.hand?.runs.find((x) => x.id === item.id);
    if (!r) return;
    if (item.kind === 'bend') r.via[item.i] = pos; else r.via.splice(item.i, 0, pos);
    liveRoute('route', { project: { ...app.project, design: d }, closed: [...app.closed], balanced: app.balanced },
      (layout) => { if (app.plan?.drag?.active) app.plan.set({ layout }); });
    return;
  }
  if (item.kind === 'boxTurn') {
    const d = structuredClone(app.project.design), axis = boxTurnAxis(item.id, pos);
    if (!d || !axis) return;
    d.boxTurns = { ...(d.boxTurns ?? {}), [item.id]: axis };
    liveRoute('route', { project: { ...app.project, design: d }, closed: [...app.closed], balanced: app.balanced },
      (layout) => { if (app.plan?.drag?.active) app.plan.set({ layout }); });
    return;
  }
  if (item.kind === 'head' || item.kind === 'odu' || item.kind === 'dropTop' || item.kind === 'dropFoot' || item.kind === 'zoneCard') return;   // placed on the drop
  const d = structuredClone(app.project.design);
  if (!d) return;
  if (item.kind === 'unit') d.unit = pos;
  else if (item.kind === 'ret') d.returnGrille = pos;
  else if (item.kind === 'outdoor') d.outdoor = pos;
  else if (item.kind === 'box' && String(item.id).startsWith('H:') && d.hand) { const b = d.hand.boxes.find((x) => x.id === item.id.slice(2)); if (b) b.pos = pos; }
  else if (item.kind === 'box') d.boxPins = { ...(d.boxPins ?? {}), [item.id]: pos };
  else if (item.kind === 'outlet') { const o = d.outlets.find((x) => x.id === item.id); if (o) o.pos = pos; }
  else return;
  liveRoute('route', { project: { ...app.project, design: d }, closed: [...app.closed], balanced: app.balanced, fast: item.kind === 'unit' },
    (layout) => { if (app.plan?.drag?.active) app.plan.set({ layout }); });
}

/// The way a BDO's feed points when its knob is dragged to `pos`: the knob sits square to the feed, and it snaps to
/// every 15°.
function boxTurnAxis(bid, pos) {
  const b = app.layout?.boxes.find((x) => x.bid === bid);
  if (!b) return null;
  const vx = pos.x - b.pos.x, vy = pos.y - b.pos.y;
  if (Math.hypot(vx, vy) < 1e-3) return null;
  const step = Math.PI / 12, a = Math.round(Math.atan2(vx, -vy) / step) * step;   // knob is 90° round from the feed
  return { x: Math.round(Math.cos(a) * 1e6) / 1e6, y: Math.round(Math.sin(a) * 1e6) / 1e6 };
}
async function turnBox(bid, deg) {
  const b = app.layout?.boxes.find((x) => x.bid === bid);
  if (!b) return;
  const a = Math.atan2(b.axis.y, b.axis.x) + deg * Math.PI / 180;
  await edit('turnBox', { key: bid, pos: { x: Math.cos(a), y: Math.sin(a) } });
}

async function drop(item, pos) {
  if (item.kind === 'zoneCard') {
    // Locked where it's let go, kept on the job (the engine doesn't know them: systems.js carries them through).
    const zc = { ...(app.project.zoneCards ?? {}), [item.id]: { x: Math.round(pos.x * 1000) / 1000, y: Math.round(pos.y * 1000) / 1000 } };
    await commit({ ...app.project, zoneCards: zc }, { undoable: true });
    return;
  }
  if (item.kind === 'boxTurn') {
    const axis = boxTurnAxis(item.id, pos);
    if (!axis || !(await edit('turnBox', { key: item.id, pos: axis }))) app.plan?.set({ layout: app.layout });
    return;
  }
  if ((item.kind === 'bend' || item.kind === 'bendAdd') && String(item.id).startsWith('R:')) {
    const p = pickedHandRun();
    if (!p?.router) { app.plan?.set({ layout: app.layout }); return; }
    const via = p.hr.via.slice(), path = p.run.path;
    const pts = [path[0], ...via, path[path.length - 1]];
    const grab = item.kind === 'bend' ? via[item.i] : { x: (pts[item.i].x + pts[item.i + 1].x) / 2, y: (pts[item.i].y + pts[item.i + 1].y) / 2 };
    if (item.kind === 'bend') via[item.i] = pos; else via.splice(item.i, 0, pos);
    app.bend = null;
    await bendRouted(via, grab);
    return;
  }
  if (item.kind === 'bend' || item.kind === 'bendAdd') {
    const r = app.project.design?.hand?.runs.find((x) => x.id === item.id);
    if (!r) return;
    const via = r.via.slice();
    if (item.kind === 'bend') via[item.i] = pos; else via.splice(item.i, 0, pos);
    app.bend = { id: item.id, i: item.i };
    if (!(await edit('setHandVia', { key: item.id, outline: via }))) render();
    return;
  }
  if (item.kind === 'head') {
    const h = app.split?.heads.find((x) => x.id === item.id);
    if (h && !(await edit('moveHead', { room: h.room, n: h.nth, pos }))) app.plan?.set({ split: app.split });
    return;
  }
  if (item.kind === 'odu' && isVrfB(app.project) && app.project.vrfSpot) {
    toast('B\'s heads run off the VRF outdoor A uses: move it on A.');
    app.plan?.set({ split: app.split });
    return;
  }
  if (item.kind === 'odu') {
    const o = app.split?.outdoors[item.id];
    if (o && !(await edit('moveSplitOutdoor', { rooms: o.rooms, pos }))) app.plan?.set({ split: app.split });
    return;
  }
  if (item.kind === 'dropTop' || item.kind === 'dropFoot') {
    if (!(await edit('moveDropper', { id: item.id, pos, choice: item.kind === 'dropFoot' ? 'foot' : 'top' }))) app.plan?.set({ view: app.view });
    return;
  }
  if (item.kind === 'outdoor' && ductedB() && activeSys(app.project) === 'B') {
    toast('That\'s the VRF outdoor both systems share: move it on system A.');
    app.plan?.set({ layout: app.layout });
    return;
  }
  const ops = { unit: ['dropUnit', {}], ret: ['dropReturn', {}], outdoor: ['dropOutdoor', {}], box: ['dropBox', { bid: item.id }], outlet: ['dropOutlet', { id: item.id }] };
  const op = ops[item.kind];
  if (!op) return;
  if (item.kind === 'outlet') {
    const st = app.layout?.outlets.find((o) => o.id === item.id)?.style;
    if (SIDE_STYLES.has(st)) pos = wallSnap(pos, st);       // a side grille stays on a wall
  }
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
  if (s?.kind === 'line' && lineCard(close)) {
    el.classList.remove('ipanel');
    el.innerHTML = lineCard(close);
    $('#insp-close', el)?.addEventListener('click', () => select(null));
    bindLineCard(el);
    return;
  }
  if (s?.kind === 'room' && room(s.id)) {
    html = '';                                             // opens in the list, in place
  } else if (s?.kind === 'outlet' && s.duct && l?.runs.some((x) => x.outlet === s.id)) {
    const run = l.runs.find((x) => x.outlet === s.id), o = l.outlets.find((x) => x.id === s.id), r = room(o?.roomId);
    const sp = run.sizeMM && run.lps > 0 ? velocity(run.lps, run.sizeMM) : null, over = o?.open && legOver(run), auto = run.autoMM ?? run.sizeMM;
    html = `<div class="card is">${cardHead(close, 'Duct · to a vent', `Flex to ${esc(r?.name ?? 'the vent')}`, `Ø${run.sizeMM} · ${fmt(run.length, 1)} m`, `${fmt(run.lps)} L/s`)}
      <div class="tiles3"><div><span>Size${o?.overridden ? ' · set' : ''}</span><b>Ø${run.sizeMM}</b></div><div class="${over ? 'warn' : ''}"><span>Speed${over ? ' · over' : ''}</span><b>${sp != null ? fmt(sp, 1) : '—'}<i>m/s</i></b></div><div><span>Length</span><b>${fmt(run.length, 1)}<i>m</i></b></div></div>
      <div class="seg fill"><button data-vsize="0" class="${o?.overridden ? '' : 'on'}" title="Sized for its air: Ø${auto}">Auto</button>${app.options.ventSizes.map((mm) => `<button data-vsize="${mm}" class="${o?.overridden && o.sizeMM === mm ? 'on' : !o?.overridden && mm === auto ? 'auto' : ''}">Ø${mm}</button>`).join('')}</div>
      <div class="lnote">Drag the duct to bend it where you hold it, or drag a + on it. <b>Tap another BDO</b> to feed it from there.</div>
      ${bendLine()}
      <div class="rowbtns"><button class="btn2" id="open-vent">Open its vent</button>${l.handDrawn && run.hand ? '<button class="btn2 danger" id="delrun">Take this duct out</button>' : ''}</div></div>`;
  } else if (s?.kind === 'outlet' && l?.outlets.find((o) => o.id === s.id)) {
    html = '';
  } else if (s?.kind === 'box' && l?.boxes.find((b) => b.bid === s.id)) {
    const b = l.boxes.find((x) => x.bid === s.id), feed = [...l.runs].reverse().find((r) => r.keyBox === b.bid);
    const fsp = feed?.sizeMM ? velocity(feed.designLps, feed.sizeMM) : null;
    html = `<div class="card is">${cardHead(close, `BDO · ${b.zone != null ? (b.zone === 0 ? 'always on' : 'zone ' + b.zone) : 'more than one zone'}`, `${b.branches}-way BDO`, `Feeds ${esc(feeds(b))}`,
        `Ø${b.inletMM} in · ${esc(legList(b))} out${b.pinned ? ' · moved by hand' : ''}`)}
      ${feed ? `<div class="tiles3"><div><span>Feed${feed.manual ? ' · set' : ''}</span><b>Ø${feed.sizeMM}</b></div><div><span>Speed</span><b>${fsp != null ? fmt(fsp, 1) : '—'}<i>m/s</i></b></div><div><span>Air</span><b>${fmt(feed.designLps)}<i>L/s</i></b></div></div>
        <div class="seg grid4"><button data-fsize="0" data-bid="${esc(b.bid)}" class="${feed.manual ? '' : 'on'}" title="Sized for its air: Ø${feed.autoMM}">Auto</button>${app.options.ductSizes.filter((mm) => mm <= 450).map((mm) => `<button data-fsize="${mm}" data-bid="${esc(b.bid)}" class="${feed.manual && feed.sizeMM === mm ? 'on' : !feed.manual && mm === feed.autoMM ? 'auto' : ''}">Ø${mm}</button>`).join('')}</div>` : ''}
      <div class="imono mut" style="font-family:var(--sans);font-size:12px">Drag it to move it, or drag its round knob to turn it: the arms stay put and the ducts follow.${b.zone == null && b.outlets.length > 1 ? ' A damper on each leg.' : ''}</div>
      <div class="rowbtns"><button class="btn2" data-turn="45">Turn left</button><button class="btn2" data-turn="-45">Turn right</button>${app.project.design?.boxTurns?.[b.bid] ? '<button class="btn2" id="unturn">Turn it back</button>' : ''}
        ${String(b.bid).startsWith('H:') ? `<button class="btn2" id="pen-from">${icon('pen').replace('<svg', '<svg width="15" height="15"')} Draw a duct from it</button><button class="btn2 danger" id="delhbox">Take it out</button>` : ''}
        ${!l.handDrawn && b.pinned ? '<button class="btn2" id="unpin">Back where the router had it</button>' : ''}${!l.handDrawn && handBox(b) ? '<button class="btn2" id="unbox">Take it apart</button>' : ''}</div></div>`;
  } else if (s?.kind === 'feed' && l?.runs.some((r) => r.keyBox === s.id)) {
    const runs = l.runs.filter((r) => r.keyBox === s.id), r = runs[runs.length - 1], b = l.boxes.find((x) => x.bid === s.id);
    const len = runs.reduce((sum, x) => sum + x.length, 0);
    const fsp = r.sizeMM ? velocity(r.designLps, r.sizeMM) : null, lim = app.options.velocityLimits?.[p.site.velocityPref ?? 'standard'];
    const cap = lim ? (r.kind === 'trunk' ? lim.trunk : lim.branch) : null, fover = fsp != null && overSpeed(fsp, cap);
    html = `<div class="card is">${cardHead(close, r.kind === 'trunk' ? 'Duct · trunk' : 'Duct · feed', 'Flex to the BDO', b ? `Into a ${b.branches}-way: ${esc(feeds(b))}` : '', `${fmt(r.designLps)} L/s${cap != null ? ` · limit ${cap} m/s` : ''}`)}
      <div class="tiles3"><div><span>Size${r.manual ? ' · set' : ''}</span><b>Ø${r.sizeMM}</b></div><div class="${fover ? 'warn' : ''}"><span>Speed${fover ? ' · over' : ''}</span><b>${fsp != null ? fmt(fsp, 1) : '—'}<i>m/s</i></b></div><div><span>Length</span><b>${fmt(len, 1)}<i>m</i></b></div></div>
      ${b ? `<div class="seg grid4"><button data-fsize="0" data-bid="${esc(b.bid)}" class="${r.manual ? '' : 'on'}" title="Sized for its air: Ø${r.autoMM}">Auto</button>${app.options.ductSizes.filter((mm) => mm <= 450).map((mm) => `<button data-fsize="${mm}" data-bid="${esc(b.bid)}" class="${r.manual && r.sizeMM === mm ? 'on' : !r.manual && mm === r.autoMM ? 'auto' : ''}">Ø${mm}</button>`).join('')}</div>` : ''}
      <div class="lnote"><b>Tap another BDO</b> to feed this duct from there.</div>
      ${bendLine()}
      ${r.hand ? '<div class="rowbtns"><button class="btn2 danger" id="delrun">Take this duct out</button></div>' : ''}</div>`;
  } else if (s?.kind === 'dropper' && v.droppers?.some((x) => x.id === s.id)) {
    const dr = v.droppers.find((x) => x.id === s.id), o = l?.outlets.find((x) => x.id === dr.id);
    const run = l?.runs.find((x) => x.outlet === dr.id);
    const ground = v.rooms.filter((r) => (r.level ?? 0) === (dr.level ?? 0) && r.conditioned && r.designerType !== 'none');
    const joining = p.twoStorey?.ductDownstairs === false;
    // Its flex: the air it carries, the size, and the speed against the branch limit (it runs through the house).
    const dq = o?.designLps ?? dr.lps, dmm = o?.sizeMM ?? dr.sizeMM ?? dr.autoMM;
    const dlim = app.options.velocityLimits?.[p.site.velocityPref ?? 'standard']?.branch, dsp = dq > 0 && dmm ? velocity(dq, dmm) : null;
    const dover = dsp != null && overSpeed(dsp, dlim);
    html = `<div class="card"><div class="insp-head"><h2>${esc(dr.name)} · Ø${dmm}</h2>${close}</div>
      <div class="insp-sub">${dq > 0 ? `${fmt(dq)} L/s down to the ground floor` : 'No rooms on it yet'}${run ? ` · ${fmt(run.length, 1)} m from the fan coil` : ''} · drag either end to move it</div>
      <div class="needs"><div><span>Carries</span><b>${fmt(dq)} L/s</b><small>${dr.rooms.length} room${dr.rooms.length === 1 ? '' : 's'}</small></div>
        <div class="${dsp != null && !dover ? 'good' : ''}"><span>Air speed</span><b style="${dover ? 'color:var(--danger)' : ''}">${dsp != null ? fmt(dsp, 1) + ' m/s' : '—'}</b><small>${dlim != null ? `limit ${dlim} m/s` : ''}${dover ? ' · over' : ''}</small></div></div>
      ${(v.topLevel ?? 1) >= 2 ? `<div class="rowpick" style="margin:0 0 6px"><label>Comes out on</label><select id="dr-level">${Array.from({ length: v.topLevel }, (_, lv) => `<option value="${lv}" ${lv === dr.level ? 'selected' : ''}>${FloorName(lv)}</option>`).join('')}</select></div>` : ''}
      <div class="kv"><span>Drops</span><b>${fmt(dr.depth, 1)} m · ${floorName(v.topLevel ?? 1)} to ${floorName(dr.level ?? 0)}</b></div>
      <span class="eyebrow">Flex size</span>
      <div class="sizes"><button data-dsize="0" class="${dr.sizeMM ? '' : 'on'}">Auto (Ø${dr.autoMM})</button>${app.options.ductSizes.filter((mm) => mm >= 200 && mm <= 450).map((mm) => `<button data-dsize="${mm}" class="${dr.sizeMM === mm ? 'on' : ''}">Ø${mm}</button>`).join('')}</div>
      ${dmm >= 400 ? `<p class="small" style="margin:8px 0 0;color:var(--accent-deep);font-weight:600">Ø${dmm} flex is a big hole through a cupboard. A second dropper splits the air and brings both down a size or two.</p>` : ''}
      <p class="small muted" style="margin:8px 0 8px">${joining ? 'Joined to the dropper that\'s there, on top of the ceiling below.' : `Insulated flex down through a cupboard, then new ducts in the ${floorName(dr.level ?? 0)}'s ceiling to its rooms' outlets. Its foot sits right under its top: drag either end and both move.`}</p>
      <span class="eyebrow">Rooms it feeds${dr.byHand ? ' · picked by hand' : ''}</span>
      ${ground.map((r) => `<label class="pick-row"><input type="checkbox" data-feed="${r.id}" ${dr.rooms.includes(r.id) ? 'checked' : ''}><span class="grow"><b>${esc(r.name)}</b><small>${fmt(r.lps)} L/s${r.dropper && r.dropper !== dr.id ? ' · on ' + esc(v.droppers.find((x) => x.id === r.dropper)?.name ?? 'another dropper') : ''}</small></span></label>`).join('')}
      <div class="actions-row">${dr.byHand ? '<button class="btn2" id="dr-auto">The nearest rooms</button>' : ''}<button class="btn2 danger" id="dr-del">${icon('trash').replace('<svg', '<svg width="16" height="16"')} Take this dropper out</button></div></div>`;
  } else if (s?.kind === 'unit' && l) {
    const u = ductedView().totals.unit;
    const n = l.network, ok = !n.limitedByFan && n.espSetting != null, way = p.design?.takeoffs, heater = p.existing?.kind === 'heater';
    html = `<div class="card is">${cardHead(close, isMixed() ? `Fan coil · system ${ductedB() ? sysView() : 'A'}` : 'Fan coil',
        p.existing ? `Existing ${heater ? 'heater' : 'unit'}` : esc(u?.model ?? 'Fan coil'),
        p.existing ? 'It stays: drag it to where it is in the roof' : u ? `${g(u.kw)} kW ducted · ${fmt(u.lps)} L/s fan` : '', `${fmt(l.totalLps)} of ${fmt(l.fanLps)} L/s`, ring(l.fanLps > 0 ? l.totalLps / l.fanLps : null))}
      <div class="tiles3"><div class="${ok ? '' : 'warn'}"><span>Ducts need</span><b>${fmt(n.externalPa)}<i>Pa</i></b></div>
        <div><span>${ok ? 'Set fan to' : 'Fan tops at'}</span><b>${fmt(ok ? n.espSetting : n.ratedEsp)}<i>Pa</i></b></div>
        <div><span>Ducts off</span><b>${l.collars.length}${way && l.collars.length < way ? `<i>of ${way}</i>` : ''}</b></div></div>
      ${ok ? '' : '<p class="small" style="margin:0;color:var(--accent-deep);font-weight:600">The ducts need more than the fan pushes: go up a duct size, shorten a run, or add a duct off the fan coil.</p>'}
      <div class="seg fill">${[[null, 'Auto'], [1, '1-way'], [2, '2-way'], [3, '3-way']].map(([k, t]) => `<button data-tko="${k ?? ''}" class="${(way ?? null) === k ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div class="imono mut" style="font-family:var(--sans);font-size:12px">Ducts off the fan coil. ${way ? (l.collars.length < way ? `${way - l.collars.length} spare spigot${way - l.collars.length === 1 ? ' is' : 's are'} capped.` : 'Picking another lays the ducts out again to suit.') : 'Auto picks 2 or 3, whichever runs cleaner.'}</div>
      <div class="rowbtns"><button class="btn2" id="rotate">${icon('rotate').replace('<svg', '<svg width="15" height="15"')} Turn it 90°</button><button class="btn2" data-sizehow>How it's sized</button></div></div>`;
  } else if (s?.kind === 'box' && l?.looseBoxes?.some((b) => 'H:' + b.id === s.id)) {
    html = `<div class="card"><div class="insp-head"><h2>BDO · not fed</h2>${close}</div>
      <div class="insp-sub">Its feed was taken out. Draw a duct into it from the fan coil or another BDO, or take it out.</div>
      <div class="actions-row"><button class="btn2 danger" id="delhbox">Take it out, with its ducts</button></div></div>`;
  } else if (s?.kind === 'ret' && l) {
    const rn = l.returnCount ?? 1, rsp = velocity(l.fanLps / rn, l.returnMM), rlim = app.options.velocityLimits?.[p.site.velocityPref ?? 'standard']?.ret;
    const rover = rlim != null && rsp > rlim * RETURN_TOL + 0.01, [ac, amm] = l.returnAuto ?? [rn, l.returnMM];
    html = `<div class="card is">${cardHead(close, 'Return air', 'Return grille', `${l.returnGrilleSize[0]} × ${l.returnGrilleSize[1]} mm · filter box`, `${fmt(l.fanLps)} L/s${rlim != null ? ` · limit ${rlim} m/s` : ''}`)}
      <div class="tiles3"><div><span>Ducts</span><b>${rn}</b></div><div><span>Size${l.returnManual ? ' · set' : ''}</span><b>Ø${l.returnMM}</b></div>
        <div class="${rover ? 'warn' : ''}"><span>Speed${rover ? ' · over' : ''}</span><b>${fmt(rsp, 1)}<i>m/s</i></b></div></div>
      <div class="seg fill"><button data-rcount="0" class="${l.returnManual ? '' : 'on'}" title="Sized for the fan: ${ac > 1 ? ac + ' × ' : ''}Ø${amm}">Auto</button>
        <button data-rcount="1" class="${l.returnManual && rn === 1 ? 'on' : ''}">1 duct</button><button data-rcount="2" class="${l.returnManual && rn === 2 ? 'on' : ''}">2 ducts</button></div>
      <div class="seg grid4">${RETURN_SIZES.map((mm) => `<button data-rsize="${mm}" class="${l.returnManual && l.returnMM === mm ? 'on' : !l.returnManual && mm === amm ? 'auto' : ''}">Ø${mm}</button>`).join('')}</div>
      ${rover ? '<p class="small" style="margin:0;color:var(--accent-deep);font-weight:600">Over the return\'s air speed: go up a size, or to 2 ducts.</p>' : ''}
      ${returnNote(l)}
      <div class="imono mut" style="font-family:var(--sans);font-size:12px">Drag it anywhere over the house: it goes where you put it.</div></div>`;
  } else if (s?.kind === 'outdoor' && l) {
    const moved = p.design?.outdoor != null;
    html = `<div class="card is">${cardHead(close, 'Outdoor unit', 'Outdoor unit', moved ? 'Moved by hand' : 'On the wall nearest the fan coil', `Pipes about ${fmt(Math.ceil(l.pipeRun))} m to the fan coil`)}
      <div class="imono mut" style="font-family:var(--sans);font-size:12px">Drag it along the outside walls.</div>
      ${moved ? '<div class="rowbtns"><button class="btn2" id="outback">Back on the nearest wall</button></div>' : ''}</div>`;
  } else {
    app.selection = null;
  }
  // One clean column, as the mock has it (Jake, 22 Nov 2026: "super clean and simple like the mock"): what's left to
  // do, then what's picked (or, with nothing picked, the zones), the air to each room, the flex — and the fan along
  // the bottom.
  el.classList.toggle('ipanel', !!l);
  if (!l) { el.innerHTML = designSummary(); bindInspector(el); return; }
  const picked = !!app.selection, top = el.querySelector('.iscroll')?.scrollTop ?? 0, same = el.dataset.sel === JSON.stringify(app.selection ?? null);
  el.dataset.sel = JSON.stringify(app.selection ?? null);
  // One list for the home, a room and a vent (Jake, 22 Nov 2026, picked from four layouts): every room with its air,
  // its sound and its load; the one tapped opens in place. Anything else picked (a BDO, a duct, the fan coil) sits above.
  // A room or vent picked: only that room (Jake, 22 Nov 2026: "when I click the room I want it to only show stuff about
  // that room"), with the way back to the list. Nothing else about the house until it's closed.
  const focus = app.selection?.kind === 'room' || (app.selection?.kind === 'outlet' && !app.selection.duct);
  el.innerHTML = focus
    ? `<div class="iscroll"><div class="card is" style="padding-bottom:0"><button class="lback" id="insp-close">${icon('back')} All rooms</button></div>${focusCard(l, v, p)}</div>${fanFoot(l)}`
    : `<div class="iscroll">${issueList(l, v, p)}${homeCard(l, v, p)}${html}${roomList(l, v, p)}${extrasCards(l, v, p)}${flexCard(l)}${optionsCard(l, p)}</div>${fanFoot(l)}`;
  if (same) el.querySelector('.iscroll').scrollTop = top;
  bindInspector(el);
}

/// A duct's bends, in a line (the duct picked through its vent or its BDO).
function bendLine() {
  const pk = pickedHandRun();
  if (!pk) return '';
  if (pk.router) return '<div class="imono mut">Drag a + on the duct to bend it: the ducts are then yours to draw.</div>';
  const n = pk.hr.via.length, on = app.bend?.id === pk.hr.id && app.bend.i < n;
  return `<div class="imono mut">${n ? `${n} bend${n === 1 ? '' : 's'}: drag one, or a + to add one.` : 'Drag the + on the duct to bend it.'}</div>
    ${n ? `<div class="rowbtns">${on ? '<button class="btn2" id="delbend">Take out this bend</button>' : ''}<button class="btn2" id="straighten">Straighten it</button></div>` : ''}`;
}

/// What's left to do, as short call-outs with the button that does it (the mock's top of the panel). Three at most.
function issueList(l, v, p) {
  const rooms = v.rooms.filter((r) => r.conditioned && r.designerType !== 'none' && onDucts(r.id));
  const short = rooms.filter((r) => { const q = l.outlets.filter((o) => o.roomId === r.id && !o.spill && !o.dropper).reduce((t, o) => t + o.designLps, 0); return r.lps > 0 && q / r.lps < 0.85; });
  const below = v.twoStorey ? [...new Set(v.rooms.filter((r) => (r.level ?? 0) < (v.topLevel ?? 1)).map((r) => r.level ?? 0))] : [];
  const dry = below.filter((lv) => !(v.droppers ?? []).some((d) => (d.level ?? 0) === lv));
  const drain = (p.lines ?? []).some((x) => x.kind === 'drain'), n = l.network, unfed = unfedCount(), sp = speedState(l, p);
  const row = (cls, title, sub, btn = '') => `<div class="issue ${cls}"><span class="idot">${cls === 'w' ? '!' : cls === 'ok' ? '✓' : ''}</span><span class="gr"><span>${title}</span><small>${sub}</small></span>${btn}</div>`;
  const out = [];
  if (short.length) out.push(row('w', `${short.length} room${short.length === 1 ? ' still needs' : 's still need'} air`, esc(short.slice(0, 3).map((r) => r.name).join(', ')) + (short.length > 3 ? ` and ${short.length - 3} more` : ''), '<button data-next="vent">Add vents</button>'));
  if (unfed) out.push(row('w', `${unfed} vent${unfed === 1 ? '' : 's'} not connected`, 'Draw a duct to each with the pen'));
  if (dry.length) out.push(row('w', `No dropper to the ${dry.map(floorName).join(' or ')}`, 'It gets its air down a dropper', '<button data-next="dropper">Add one</button>'));
  if (n.limitedByFan || n.espSetting == null) out.push(row('w', 'The ducts need more than the fan pushes', `${fmt(n.externalPa)} Pa of its ${fmt(n.ratedEsp)} Pa: go up a duct size or shorten a run`));
  if (sp.over) out.push(row('n', `${sp.over} run${sp.over === 1 ? '' : 's'} over the air speed limit`, 'A size up, or fewer vents on that run'));
  if (l.handDrawn && l.crossings) out.push(row('n', `${l.crossings} pair${l.crossings === 1 ? '' : 's'} of ducts cross`, 'Tap one and drag a bend round the other'));
  return out.length ? `<div class="card is" style="gap:8px;padding-top:16px">${out.slice(0, 3).join('')}</div>` : '';
}

/// A re-duct's note and a two-storey home's droppers: only when the job has them.
function extrasCards(l, v, p) {
  const ex = p.existing, ds = v.droppers ?? [];
  const reduct = ex ? `<div class="card is" style="gap:4px"><div class="ih"><b>Re-duct</b></div><div class="imono mut" style="font-family:var(--sans);font-size:12.5px">New ducts onto the ${ex.kind === 'heater' ? 'gas ducted heater' : 'ducted unit'} that's there: drag the fan coil to where it is.</div></div>` : '';
  const floors = v.twoStorey ? `<div class="card is" style="gap:6px"><div class="ih"><b>Droppers</b><button class="link" id="add-dropper" style="padding:0">Add one</button></div>
      <div>${ds.length ? ds.map((d) => { const o = l.outlets.find((x) => x.id === d.id), mm = o?.sizeMM ?? d.sizeMM ?? d.autoMM, q = o?.designLps ?? d.lps; return `<button class="zr" data-dropper="${d.id}"><i class="dash" style="background:${ductColour(mm)}"></i><span>${esc(d.name)} · Ø${mm}</span><b>${q > 0 ? `${fmt(q)} L/s · ${fmt(velocity(q, mm), 1)} m/s` : 'no rooms'}</b></button>`; }).join('')
        : '<div class="imono" style="color:var(--danger)">None yet: the floor below has no air.</div>'}</div>
      <div class="rowpick" style="margin:0;padding:0;border:0"><label style="font-size:13px">Lower floor ducts</label><select id="downstairs">
        <option value="1" ${p.twoStorey?.ductDownstairs !== false ? 'selected' : ''}>New ducts</option>
        <option value="0" ${p.twoStorey?.ductDownstairs === false ? 'selected' : ''}>Join existing droppers</option></select></div></div>` : '';
  return reduct + floors;
}

/// How it's run: the whole home open, or down to one room (Jake, 22 Nov 2026: "see what it would look like with down
/// to one room vs the whole home open"). The list, the plan and the fan along the bottom all follow.
function runState(l) {
  const zones = l.zones.filter((z) => z.number !== 0 && (z.outlets > 0 || l.outlets.some((o) => o.dropper && o.zone === z.number)));
  // Asked for, not as it ends up: the spill zone opens by itself when too few are on.
  const asked = zones.filter((z) => !app.closed.has(z.number));
  return { zones, open: asked, mode: !app.closed.size ? 'all' : asked.length === 1 ? 'one' : 'mix' };
}
/// A bar in parts with a line for each under it (the mock's charts): `parts` are { label, value, tone, text }, `spare`
/// the unfilled rest of the bar.
function stackChart(parts, spare = 0) {
  const sum = parts.reduce((t, x) => t + x.value, 0) + spare;
  if (!(sum > 0)) return '';
  return `<div class="stack">${parts.map((x) => `<i style="flex:${(x.value / sum).toFixed(4)};background:${x.tone}" title="${esc(x.label)}"></i>`).join('')}${spare > 0 ? `<i style="flex:${(spare / sum).toFixed(4)};background:#EEF0F3"></i>` : ''}</div>
    <div>${parts.map((x) => `<div class="hrow"><i style="background:${x.tone}"></i><span>${esc(x.label)}</span><b>${x.text}</b><em>${x.unit ?? ''}</em></div>`).join('')}</div>`;
}
/// A gauge: how far along a scale something is, with a mark where its limit sits (a vent's sound against its room's target).
function gauge(value, lo, hi, mark, bad) {
  const at = (x) => Math.max(0, Math.min(1, (x - lo) / (hi - lo))) * 100;
  return `<div class="gauge"><i class="${bad ? 'bad' : ''}" style="width:${at(value).toFixed(1)}%"></i>${mark != null ? `<em style="left:${at(mark).toFixed(1)}%"></em>` : ''}</div>`;
}

/// The whole home at the top of the panel, as the mock's cards are laid out: a ring for how hard the fan's working, the
/// whole home or one room switch, three figures, and the fan static as a bar of where the pressure goes.
function homeCard(l, v, p) {
  const { zones, open, mode } = runState(l), t = ductedView().totals, u = t.unit, n = l.network;
  const sp = l.spill, spilling = mode !== 'all' && sp?.spilling, ok = !n.limitedByFan && n.espSetting != null;
  const dbs = l.outlets.filter((o) => o.open && o.lps > 0 && !o.dropper).map((o) => o.dbA), loud = dbs.length ? Math.max(...dbs) : null;
  const top = ok ? n.espSetting : n.ratedEsp, ducts = Math.max(n.externalPa - n.returnPa, 0);
  return `<div class="card is">
    <div class="ih"><span class="eyebrow">${p.existing ? 'Re-duct' : 'Ducted system'}${isMixed() ? ` · ${ductedB() ? sysView() : 'A'}` : ''}</span></div>
    <div class="ihero">${ring(l.fanLps > 0 ? l.totalLps / l.fanLps : null, '#3E6CF0')}<div class="grow"><h2>${mode === 'one' ? 'Only ' + esc(open[0].name) : mode === 'mix' ? `${open.length} of ${zones.length} zones on` : 'Whole home'}</h2>
      <div class="isub">${u ? esc(`${g(u.kw)} kW · ${u.model}`) : 'No unit yet'}</div><div class="imono" style="margin-top:2px">${fmt(l.totalLps)} of ${fmt(l.fanLps)} L/s</div></div></div>
    ${zones.length >= 2 ? `<div class="seg fill"><button data-run="all" class="${mode === 'all' ? 'on' : ''}">Whole home</button><button data-run="one" class="${mode === 'one' ? 'on' : ''}">One room</button></div>` : ''}
    ${spilling ? `<div class="lnote">The fan won't slow below about ${fmt(sp.floorLps)} L/s, so the spare air spills ${sp.kind === 'outlet' ? 'out the spill outlet' : 'into <b>' + esc(sp.name) + '</b>'}.</div>` : ''}
    <div class="tiles3"><div><span>Heat load</span><b>${fmt(t.wholeHomeKW ?? t.connectedKW, 1)}<i>kW</i></b></div><div><span>Unit</span><b>${u ? g(u.kw) : '—'}<i>kW</i></b></div>
      <div><span>Loudest vent</span><b>${loud != null ? fmt(loud) : '—'}<i>dB</i></b></div></div>
    <div class="ih" style="margin-top:2px"><b>Fan static</b><span class="chipnum ${ok ? '' : 'bad'}">${fmt(n.externalPa)} of ${fmt(top)} Pa</span></div>
    ${stackChart([{ label: 'Supply ducts', value: ducts, tone: '#0FA37A', text: fmt(ducts), unit: 'Pa' }, { label: 'Return and filter', value: n.returnPa, tone: '#7FD1B9', text: fmt(n.returnPa), unit: 'Pa' }], Math.max(top - n.externalPa, 0))}
  </div>`;
}
/// Down to one zone: the one given, or the picked room's, or the smallest (the hardest for the fan to turn down to).
async function runOne(zone) {
  const l = app.layout, { zones } = runState(l), s = app.selection;
  const mine = zone ?? (s?.kind === 'room' ? app.view.rooms.find((r) => r.id === s.id)?.zone : s?.kind === 'outlet' ? l.outlets.find((o) => o.id === s.id)?.zone : null);
  const keep = zones.find((z) => z.number === mine) ?? [...zones].sort((a, b) => a.designLps - b.designLps)[0];
  if (!keep) return;
  app.closed = new Set(zones.filter((z) => z.number !== keep.number).map((z) => z.number));
  await refresh(); render();
}

/// Supply air a kW of cooling (the engine's `Designer.lpsPerKW`).
const LPS_PER_KW = 50;
/// How a vent's sound sits against its room's target: under by a margin, under, or over.
const soundWord = (db, target) => (db == null ? '' : db > target + 0.5 ? 'loud' : db > target - 5 ? 'fine' : 'quiet');

/// Every room on the ducts and how it's going under the zones that are on: its vents, the air it gets of what it
/// needs, its loudest vent.
function roomStats(l, v) {
  const fed = l.handDrawn ? new Set(l.runs.map((x) => x.outlet).filter(Boolean)) : null;
  return v.rooms.filter((r) => r.conditioned && r.designerType !== 'none' && onDucts(r.id)).map((r) => {
    const outs = l.outlets.filter((o) => o.roomId === r.id && !o.spill && !o.dropper), live = fed ? outs.filter((o) => fed.has(o.id)) : outs;
    const zoneOpen = r.zone == null || r.zone === 0 || l.zones.find((z) => z.number === r.zone)?.open !== false;
    const gets = live.reduce((t, o) => t + (o.open ? o.lps : 0), 0), share = r.lps > 0 ? gets / r.lps : 1;
    const dbs = live.filter((o) => o.open && o.lps > 0).map((o) => o.dbA), db = dbs.length ? Math.max(...dbs) : null;
    return { r, outs, zoneOpen, gets, share, db, short: zoneOpen && share < 0.85, loud: db != null && db > r.soundTarget + 0.5 };
  });
}
const zoneTone = (z) => (z ? zoneColour(z) : '#8A909B');

/// Air to each room (the mock's chart): a bar in the room's zone colour against a mark at what it needs, the L/s, and
/// its loudest vent. The zone's number shuts or opens it; a row opens the room.
function roomList(l, v, p) {
  const all = roomStats(l, v);
  if (!all.length) return '';
  const f = app.listFilter ?? 'all', nShort = all.filter((x) => x.short).length, nLoud = all.filter((x) => x.loud).length;
  const shown = all.filter((x) => f === 'all' || (f === 'short' ? x.short : x.loud));
  const chip = (k, t, n) => `<button data-lfilter="${k}" class="${f === k ? 'on' : ''}">${t}${n != null ? ` <i>${n}</i>` : ''}</button>`;
  const row = (x) => {
    const r = x.r, z = r.zone;
    const badge = z == null ? '<span class="zb none"></span>' : `<button class="zb ${x.zoneOpen ? '' : 'shut'}" data-zone="${z}" style="${x.zoneOpen && z !== 0 ? 'background:' + zoneColour(z) : ''}" title="${z === 0 ? 'Always on: no damper' : x.zoneOpen ? 'Zone ' + z + ': tap to shut it' : 'Zone ' + z + ' is shut: tap to open it'}">${z === 0 ? '∞' : z}</button>`;
    return `<div class="lrow bars ${x.zoneOpen ? '' : 'shut'}" data-room="${r.id}">${badge}<span class="nm" title="${esc(r.name)}">${esc(r.name)}</span>
      <span class="track"><i style="width:${x.zoneOpen ? (Math.min(x.share, 1.1) * 90).toFixed(1) : 0}%;background:${zoneTone(z)}"></i><em></em></span>
      <b class="${x.short ? 'low' : ''}">${x.zoneOpen ? `${fmt(x.gets)}<i>/${fmt(r.lps)}</i>` : 'shut'}</b><b class="${x.loud ? 'bad' : ''}">${x.db != null ? fmt(x.db) : '—'}</b></div>`;
  };
  return `<div class="card is" style="gap:8px">
    <div class="ih"><b>Air to each room</b><span class="imono mut">L/s · mark = need · dB</span></div>
    <div class="lfilter" style="padding:0">${chip('all', 'All', null)}${chip('short', 'Short of air', nShort)}${chip('loud', 'Loud', nLoud)}</div>
    <div>${shown.map(row).join('') || `<div class="lnote" style="padding:8px 0">${f === 'short' ? 'No room is short of air.' : 'No vent is over its room\'s sound target.'}</div>`}</div></div>`;
}

/// Should a vent go up a size? When it has more air than its size takes, or it's over its room's sound target.
function upsize(o, r, l) {
  const run = l.runs.find((q) => q.outlet === o.id), over = run && o.open && legOver(run), loud = o.open && o.dbA > r.soundTarget + 0.5;
  if (!(over || loud)) return null;
  return { next: (app.options.ventSizes ?? []).find((mm) => mm > o.sizeMM), why: over && loud ? 'too much air for its size, and loud' : over ? 'too much air for its size' : 'over the room\'s sound target' };
}

/// A room, or one of its vents, on its own in the panel — laid out as the mock's cards are: what wants doing up top,
/// a ring and the name, three figures, then charts (its air, its sound, where its heat comes from).
function focusCard(l, v, p) {
  const sel = app.selection, o = sel.kind === 'outlet' ? l.outlets.find((q) => q.id === sel.id) : null;
  const x = roomStats(l, v).find((q) => q.r.id === (o ? o.roomId : sel.id));
  if (!x) return '';
  const r = x.r, close = `<button class="iconbtn close" id="insp-close2">${icon('x')}</button>`, byHand = p.design?.zoneOverrides ?? {};
  const zoneText = r.zone === 0 ? 'always on' : r.zone != null ? 'zone ' + r.zone : 'no zone';
  const issue = (cls, title, sub, btn = '') => `<div class="issue ${cls}"><span class="idot">${cls === 'w' ? '!' : cls === 'ok' ? '✓' : ''}</span><span class="gr"><span>${title}</span><small>${sub}</small></span>${btn}</div>`;
  const kwOf = (lps) => lps / LPS_PER_KW;
  const soundChart = (db, label) => db == null ? '' : `<div class="ih"><b>${label}</b><span class="chipnum ${db > r.soundTarget + 0.5 ? 'bad' : ''}">${fmt(db)} of ${fmt(r.soundTarget)} dB(A)</span></div>${gauge(db, 20, Math.max(50, r.soundTarget + 8), r.soundTarget, db > r.soundTarget + 0.5)}`;
  if (o) {
    // One vent.
    const a = app.air?.outlets.find((q) => q.id === o.id), run = l.runs.find((q) => q.outlet === o.id), auto = run?.autoMM ?? o.sizeMM, st = o.style ?? 'round';
    const sp = run && o.open && run.sizeMM ? velocity(run.lps, run.sizeMM) : null, up = upsize(o, r, l), n = x.outs.indexOf(o);
    const targets = (o.moveTargets ?? []).map((bid) => l.boxes.find((b) => b.bid === bid)).filter(Boolean);
    const tips = (up ? issue('w', up.next ? `Go up to Ø${up.next}` : 'Add a vent to share the air', esc(up.why[0].toUpperCase() + up.why.slice(1)), up.next ? `<button data-upsize="${o.id}:${up.next}">Do it</button>` : '')
      : o.open ? issue('ok', 'This vent\'s size is right', 'Its air and its sound are within what it takes') : '')
      + (l.handDrawn && !run?.hand ? issue('w', 'Not connected', 'Draw a duct to it with the pen') : '');
    return `<div class="card is" style="gap:8px;padding-bottom:0">${tips}</div>
      <div class="card is">${cardHead(close, `Outlet · ${zoneText}`, esc(r.name) + (x.outs.length > 1 ? ` <span class="muted" style="font-weight:500">vent ${n + 1}</span>` : ''),
          esc(OUTLET_NAMES[st] ?? 'Round ceiling diffuser') + (st !== 'round' && o.face ? ' · ' + esc(o.face) + ' mm' : ''),
          o.open ? `${fmt(o.lps)} of ${fmt(o.designLps)} L/s · ${fmt(kwOf(o.lps), 1)} kW` : `Zone shut · sized for ${fmt(o.designLps)} L/s`, ring(o.open && o.designLps > 0 ? o.lps / o.designLps : null, zoneTone(o.zone)))}
        <div class="tiles3"><div class="${o.open && o.dbA > r.soundTarget + 0.5 ? 'warn' : ''}"><span>Sound</span><b>${o.open ? fmt(o.dbA) : '—'}<i>dB(A)</i></b></div>
          <div class="${up && /air/.test(up.why) ? 'warn' : ''}"><span>Speed</span><b>${sp != null ? fmt(sp, 1) : '—'}<i>m/s</i></b></div><div><span>Throw</span><b>${a ? fmt(a.throwM, 1) : '—'}<i>m</i></b></div></div>
        <div class="seg fill"><button data-vsize="0" class="${o.overridden ? '' : 'on'}" title="Sized for its air: Ø${auto}">Auto</button>${app.options.ventSizes.map((mm) => `<button data-vsize="${mm}" class="${o.overridden && o.sizeMM === mm ? 'on' : !o.overridden && mm === auto ? 'auto' : ''}">Ø${mm}</button>`).join('')}</div>
        <div class="seg grid3">${OUTLET_STYLES.map(([k, t]) => `<button data-ostyle="${k}" class="${st === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        ${o.open ? soundChart(o.dbA, 'Sound') : ''}
        <div class="rowbtns"><button class="btn2" data-roomof="${r.id}">The room</button><button class="btn2 danger" id="delvent">${icon('trash').replace('<svg', '<svg width="15" height="15"')} Take out</button>
          ${l.handDrawn && run?.hand ? '<button class="btn2" id="delrun">Take its duct out</button>' : ''}<button class="btn2" id="vent-more">${app.ventMore ? 'Less' : 'More'}</button></div>
        ${app.ventMore ? `<div class="lmore">
          <div class="kv"><span>Flex to it</span><b>${run ? fmt(run.length, 1) + ' m of Ø' + run.sizeMM : 'none'}</b></div>
          ${a ? `<div class="kv"><span>Throw</span><b>${esc(a.coverage === 'good' ? 'mixes well' : a.coverage === 'short' ? 'falls short' : 'strong')}</b></div><div class="kv"><span>Noise rating</span><b>NC ${fmt(a.nc)} · ${esc(a.ncWord)}</b></div>` : ''}
          ${targets.length && !l.handDrawn ? `<div class="rowpick" style="margin:0"><label>Put it on another BDO</label><select id="movebox"><option value="">Choose…</option>${targets.map((b) => `<option value="${esc(b.bid)}">BDO with ${esc(feeds(b))}</option>`).join('')}</select></div>` : ''}
          ${bendLine()}
          <div class="rowbtns"><button class="btn2" id="ostyle-every">Make every vent ${esc((OUTLET_STYLES.find(([k]) => k === st) ?? ['', 'Round'])[1].toLowerCase())}</button></div></div>` : ''}
      </div>`;
  }
  // The room.
  const mates = v.rooms.filter((m) => m.id !== r.id && m.conditioned && r.zone != null && m.zone === r.zone);
  const joined = byHand[r.id] != null || mates.some((m) => byHand[m.id] != null), dens = r.area > 0 ? r.kw * 1000 / r.area : 0;
  const ups = x.outs.map((q, i) => ({ q, i, up: upsize(q, r, l) })).filter((y) => y.up);
  const tips = !x.outs.length ? issue('w', 'No vents in it yet', 'Add one, then drag it where it goes', '<button id="addhere2">Add a vent</button>')
    : !x.zoneOpen ? issue('n', 'Its zone is shut', 'Open it with its number in the list')
    : ups.length ? ups.map((y) => issue('w', `${x.outs.length > 1 ? 'Vent ' + (y.i + 1) + ': go' : 'Go'}${y.up.next ? ' up to Ø' + y.up.next : ' on and add a vent to share the air'}`, esc(y.up.why[0].toUpperCase() + y.up.why.slice(1)), y.up.next ? `<button data-upsize="${y.q.id}:${y.up.next}">Do it</button>` : '')).join('')
    : x.short ? issue('w', `${esc(r.name)} at ${fmt(x.share * 100)}% of its air`, 'Add a vent, or go up a size', '<button id="addhere2">Add a vent</button>')
    : issue('ok', 'Vent sizes are right', 'No need to go up a size');
  const vent = (q, i) => `<button class="lvent" data-vent="${q.id}"><span>Vent${x.outs.length > 1 ? ' ' + (i + 1) : ''} · Ø${q.sizeMM}</span><b>${q.open ? fmt(q.lps) + ' L/s' : 'shut'}</b><b>${q.open ? fmt(kwOf(q.lps), 1) + ' kW' : '—'}</b><b class="${q.open && q.dbA > r.soundTarget + 0.5 ? 'bad' : ''}">${q.open ? fmt(q.dbA) + ' dB' : '—'}</b></button>`;
  return `<div class="card is" style="gap:8px;padding-bottom:0">${tips}</div>
    <div class="card is">${cardHead(close, `Room · ${zoneText}`, esc(r.name), `${fmt(r.area, 1)} m² · ${fmt(dens)} W/m²${mates.length ? ' · with ' + mates.map((m) => esc(m.name)).join(', ') : ''}`,
        x.zoneOpen ? `${fmt(x.gets)} of ${fmt(r.lps)} L/s` : `Zone shut · needs ${fmt(r.lps)} L/s`, ring(x.outs.length && x.zoneOpen ? x.share : null, zoneTone(r.zone)))}
      <div class="tiles3"><div><span>Heat load</span><b>${fmt(r.kw, 1)}<i>kW</i></b></div>
        <div class="${x.zoneOpen && x.short ? 'warn' : ''}"><span>Vents deliver</span><b>${x.zoneOpen ? fmt(kwOf(x.gets), 1) : '—'}<i>kW</i></b></div>
        <div><span>Outlets</span><b>${x.outs.length}</b></div></div>
      <div class="ih"><b>Air</b><span class="chipnum ${x.zoneOpen && x.short ? 'bad' : ''}">${x.zoneOpen ? `${fmt(x.gets)} of ${fmt(r.lps)} L/s` : 'shut'}</span></div>
      <div class="gauge air"><i style="width:${x.zoneOpen ? (Math.min(x.share, 1.1) * 90).toFixed(1) : 0}%;background:${zoneTone(r.zone)}"></i><em style="left:90%"></em></div>
      ${soundChart(x.db, 'Loudest vent')}
      ${x.outs.length ? `<div>${x.outs.map(vent).join('')}</div>` : ''}
      <div class="seg fill"><button data-zoned="own" class="${r.zone != null && r.zone !== 0 && !mates.length ? 'on' : ''}">Its own zone</button>
        <button data-zoned="none" class="${r.zone === 0 ? 'on' : ''}">Always on</button>${mates.length ? '<button class="on" disabled>Shared</button>' : ''}</div>
      <div class="rowbtns"><button class="btn2 soft" id="addhere">${icon('plus').replace('<svg', '<svg width="15" height="15"')} Add a vent</button>
        ${joined && mates.length ? '<button class="btn2" id="unjoin">Unjoin</button>' : '<button class="btn2" id="join">Join a room</button>'}<button class="btn2" id="reshape">Shape</button></div>
      ${byHand[r.id] != null ? '<button class="link" data-zoned="auto" style="padding:0;text-align:left">Zone it as the zoning has it</button>' : ''}
    </div>
    <div class="card is">${ceilingRows(r)}${heatSplit(r)}<div>${roomRows(r, { built: false })}
      <div class="rowpick" style="margin:0"><label>Built</label><select id="r-built">${eraOptions(r.era)}</select></div></div>
      ${r.openArea && v.rooms.some((m) => m.id !== r.id && m.openArea === r.openArea) ? '<label class="small muted" style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" id="r-built-area" checked> and the rest of its open area</label>' : ''}</div>`;
}

/// The flex to order, a line a size.
function flexCard(l) {
  if (!l.flex.length) return '';
  const bags = l.flex.reduce((t, f) => t + f.bags, 0), m = l.flex.reduce((t, f) => t + f.metres, 0);
  return `<div class="card is"><div class="ih"><b>Flex to order</b><span class="chipnum">${bags} bag${bags === 1 ? '' : 's'} · ${fmt(m)} m</span></div>
    ${stackChart(l.flex.map((f) => ({ label: 'Ø' + f.sizeMM, value: f.metres, tone: ductColour(f.sizeMM), text: `${fmt(f.metres, 1)} m`, unit: `${f.bags} bag${f.bags === 1 ? '' : 's'}` })))}</div>`;
}

/// The air speed in the ducts against the class's limits: the fastest trunk and feed, the return, and how many are over.
function speedState(l, p) {
  const cls = p.site.velocityPref ?? 'standard', lim = app.options.velocityLimits?.[cls];
  if (!lim || !l.runs.length) return { rows: [], over: 0, legs: 0, legsOver: 0, lim: null, cls };
  const worst = (pick) => l.runs.filter((r) => pick(r) && r.open && r.sizeMM && r.lps > 0)
    .reduce((w, r) => { const sp = velocity(r.lps, r.sizeMM); return !w || sp > w.sp ? { sp, r } : w; }, null);
  const legs = l.runs.filter((r) => r.outlet != null && r.open && r.sizeMM), legsOver = legs.filter(legOver).length;
  const rows = [['Trunks', worst((r) => r.kind === 'trunk'), lim.trunk], ['Feeds to BDOs', worst((r) => r.kind === 'supply' && r.outlet == null), lim.branch],
    ['Return', l.fanLps && l.returnMM ? { sp: velocity(l.fanLps / (l.returnCount ?? 1), l.returnMM), r: { sizeMM: l.returnMM, count: l.returnCount ?? 1 } } : null, lim.ret]].filter(([, w]) => w)
    .map(([name, w, cap]) => ({ name, w, cap, over: name === 'Return' ? w.sp > cap * RETURN_TOL + 0.01 : overSpeed(w.sp, cap) }));
  return { rows, legs: legs.length, legsOver, over: rows.filter((x) => x.over).length + legsOver, lim, cls };
}

/// The settings that are set once: every vent's type, the zoning, the transition, the air speed class, the catalogue.
function optionsCard(l, p) {
  const zoning = p.site.zoningPref ?? 'perroom', sp = speedState(l, p), u = ductedView().totals.unit;
  return `<div class="card is" style="gap:0"><details class="more" id="opts" ${app.optsOpen ? 'open' : ''}><summary>Options ${icon('chev')}</summary>
    <div style="padding-top:8px">
      <div class="kv"><span>Unit</span><b>${p.existing ? `Existing ${p.existing.kind === 'heater' ? 'heater' : 'unit'} · ducts for ${g(u?.kw ?? 0)} kW` : esc(u?.label ?? '—')}</b></div>
      ${(app.options.brands?.length ?? 0) > 1 && !p.existing ? `<div class="rowpick"><label>Brand</label><select id="brand">${app.options.brands.map((b) => `<option value="${b.id}" ${b.id === brandId() ? 'selected' : ''}>${esc(b.label)}</option>`).join('')}</select></div>` : ''}
      <div class="rowpick"><label>Every vent</label><select id="ostyle-all">${OUTLET_STYLES.map(([k, t]) => `<option value="${k}" ${(p.design?.outletStyle ?? 'round') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="rowpick"><label>Zoning</label><select id="zoning">${app.options.zonings.map((z) => `<option value="${z.id}" ${z.id === zoning ? 'selected' : ''}>${esc(z.label)}</option>`).join('')}</select></div>
      <div class="rowpick"><label>Supply air transition</label><select id="takeoffs">${takeoffOptions()}</select></div>
      <div class="rowpick"><label>Air shown</label><select id="bal"><option value="1" ${app.balanced ? 'selected' : ''}>Balanced</option><option value="0" ${app.balanced ? '' : 'selected'}>As installed</option></select></div>
      <div class="rowpick"><label>Air speed</label><select id="velocity">${app.options.velocities.map((x) => `<option value="${x.id}" ${x.id === (p.site.velocityPref ?? 'standard') ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>
      ${sp.rows.map((x) => `<div class="kv"><span>${x.name} · ${x.w.r.count > 1 ? `${x.w.r.count} × Ø${x.w.r.sizeMM}` : `fastest, Ø${x.w.r.sizeMM}`}</span><b style="${x.over ? 'color:var(--danger)' : ''}">${fmt(x.w.sp, 1)} m/s <span class="muted small" style="font-weight:500">of ${x.cap}</span></b></div>`).join('')}
      ${sp.legs ? `<div class="kv"><span>Legs to the vents</span><b style="${sp.legsOver ? 'color:var(--danger)' : ''}">${sp.legsOver ? `${sp.legsOver} over what the vent takes` : 'all within their vents'}</b></div>` : ''}
      <div class="rowbtns" style="margin-top:12px"><button class="btn2" data-sizehow>How it's sized</button><button class="btn2" data-cat>Catalogue</button>
        ${(p.design?.boxPins || p.design?.stations) ? '<button class="btn2" id="unhand">Undo hand-placed BDOs</button>' : ''}
        ${p.zoneCards && Object.keys(p.zoneCards).length ? '<button class="btn2" id="cards-back">Put the zone cards back</button>' : ''}
        ${(p.lines ?? []).some((x) => x.kind === 'drain') ? '' : '<button class="btn2" data-next="drain">Draw the drain line</button>'}
        <button class="btn2" id="restart">Clear the outlets</button>${ASSIST() ? '<button class="btn2" id="redesign">Lay it out for me</button>' : ''}</div>
    </div></details></div>`;
}

/// The fan along the bottom of the panel: its model and static setting, and the air it's moving of what it can.
function fanFoot(l) {
  const u = ductedView().totals.unit, n = l.network, ok = !n.limitedByFan && n.espSetting != null;
  return `<div class="ifoot"><span><small>${app.project.existing ? 'Existing unit' : 'Fan ' + esc(u?.model ?? '')} · <span style="${ok ? '' : 'color:var(--danger);font-weight:600'}">${ok ? fmt(n.espSetting) + ' Pa' : 'needs ' + fmt(n.externalPa) + ' Pa'}</span></small>
    <b>${fmt(l.totalLps)} / ${fmt(l.fanLps)} L/s</b></span><button class="btn2 small" id="opts-btn">Options</button></div>`;
}

/// A word when the return sits where steam, grease or a garage's air gets pulled into it (it's still the installer's call).
function returnNote(l) {
  const r = app.view.rooms.find((q) => q.polygon?.length >= 3 && pointInPolygon(l.returnGrille, q.polygon));
  if (!r) return '';
  const why = !r.conditioned ? `${esc(r.name)} isn't air conditioned, so the return pulls its air back through the house.`
    : r.type === 'kitchen' ? 'In the kitchen: keep it well clear of the cooktop, or grease ends up on the filter and coil.'
    : r.designerType === 'wet' ? `In a wet area: steam ends up on the filter and coil.` : '';
  return why ? `<p class="small" style="margin:0 0 8px;color:var(--accent-deep);font-weight:600">${why}</p>` : '';
}

/// "Set to 100 Pa · needs 92": the fan's static setting for the ducts as laid out (balanced, every zone open).
function staticLine(n) {
  if (n.limitedByFan) return `needs more than it can push · ${fmt(n.externalPa)} Pa`;
  return n.espSetting != null ? `set to ${fmt(n.espSetting)} Pa · needs ${fmt(n.externalPa)}` : `needs ${fmt(n.externalPa)} Pa — over its ${fmt(n.ratedEsp)} Pa top setting`;
}

function takeoffOptions() {
  const n = app.project.design?.takeoffs ?? null, now = app.layout?.collars?.length;
  return [[null, `Auto${now ? ` (${now}-way now)` : ' (2 or 3)'}`], [1, '1-way'], [2, '2-way'], [3, '3-way']]
    .map(([k, t]) => `<option value="${k ?? ''}" ${n === k ? 'selected' : ''}>${t}</option>`).join('');
}

/// How the unit size is worked out (the engine's Designer.roomLoad and totals): each room's floor × the climate's W/m²
/// × what its ceiling, insulation, glass, the way it faces and its type do to it; the rooms added up; the allowance for
/// them not all peaking at once; the unit picked. Then whatever on this job is pulling the size down.
function sizeBreakdown() {
  const v = ductedView(), t = v.totals, p = app.project, o = app.options;
  if (!v?.rooms?.length) { toast('No rooms yet.'); return; }
  const live = v.rooms.filter((r) => r.conditioned), off = v.rooms.filter((r) => !r.conditioned);
  const zoning = o.zonings.find((z) => z.id === (p.site.zoningPref ?? 'perroom'));
  const zmult = v.coincidence > 0 ? t.diversity / v.coincidence : 1;
  const perM2 = (kw, m2) => (m2 > 0 ? fmt(kw * 1000 / m2) + ' W/m²' : '—');
  const pct = (x) => fmt(x * 100) + '%';
  const climate = live[0]?.factors?.[0];                                       // ["Cool climate", "20 m² × 115 W/m²"]
  const base = climate?.[1]?.split('×')[1]?.trim() ?? '';
  const factor = (r, word) => r.factors.find(([k]) => k.toLowerCase().startsWith(word));
  const mult = (f) => parseFloat(String(f?.[1] ?? '').replace('×', '')) || 1;
  const chain = (r) => r.factors.slice(1).map(([k, val]) => {
    const n = mult([k, val]);
    return `<span style="${n < 0.995 ? 'color:var(--danger)' : n > 1.005 ? 'color:var(--green)' : ''}">${esc(val)} ${esc(k.toLowerCase())}</span>`;
  }).join(' · ');
  const noGlass = live.filter((r) => !r.windows.length);
  const insul = factor(live[0] ?? { factors: [] }, 'insulation');
  const ch = t.choices ?? {};
  const pickedBy = t.byHand ? 'picked by hand' : ({ balanced: 'recommended', wholeHome: 'whole home at its peak', margin: 'more margin', zoned: 'zoned use only' })[t.sizing] ?? t.sizing;
  const lows = [];
  const big = biggestUnitKW();
  if ((t.balancedKW ?? t.wholeHomeKW) > big * 1.06) lows.push(`<b>The home wants ${fmt(t.balancedKW ?? t.wholeHomeKW, 1)} kW — more than the biggest ${esc(brandNow().label)} ducted unit (${g(big)} kW).</b> Split it into two systems (say living and sleeping), or size it for zoned use and tell the customer it won't run every room flat out at once on the hottest day.`);
  if (needsThreePhase(t, p.site)) lows.push(`<b>${g(t.unit.kw)} kW needs a three-phase supply.</b> 18 kW is the biggest Mitsubishi Electric ducted unit on single phase; 20 and 24.5 kW are three phase only. Check the switchboard (and set it on the Equipment step), or split the house into two systems.`);
  if (noGlass.length) lows.push(`<b>${noGlass.length} of ${live.length} rooms have no windows drawn.</b> They count as typical glass (× 1.00) facing no particular way — a west-facing room is × 1.16 and a glassy one × 1.22. Add the windows for a truer size: Edit the rooms → pick a wall → Add a window.`);
  if (/good/.test(insul?.[0] ?? '')) lows.push(`<b>Ceiling insulation R3.5 or better</b> takes 15% off every room (× 0.85). Check it on New job if you're not sure what's up there.`);
  lows.push(`<b>People and appliances are in each room's W/m² rate</b> (a typical household), not added on top. Bedrooms are × 0.92 because they're mostly used at night; a home office, a gym or a west-facing bedroom may want a size up.`);
  if (/cool/i.test(climate?.[0] ?? '')) lows.push(`<b>${esc(climate[0])} sizes from ${esc(base)}</b> for the summer peak. The winter heating load isn't worked out separately, and in a cool climate it can be the bigger one — allow for it on an old or draughty house.`);
  const opt = (key, label) => ch[key] ? `<div class="kv"><span>${label}${!t.byHand && t.sizing === key ? ' <span class="tag">PICKED</span>' : ''}</span><b>${esc(ch[key].label)}</b></div>` : '';
  const d = dialog(`<h2>How the size is worked out</h2>
    <p class="muted small" style="margin:0 0 12px">${esc(climate?.[0] ?? '')} · ${esc(base)} base · summer ${fmt(v.summerDB)}°C / winter ${fmt(v.winterDB)}°C design days · ${esc(zoning?.label ?? '')} zoning. A simplified room-by-room estimate (DA09-style) — not a certified calculation.</p>
    <table class="rooms" style="width:100%;font-size:13px"><thead><tr><th>Room</th><th class="num">Floor</th><th class="num">Windows</th><th class="num">Load</th><th class="num">W/m²</th></tr></thead><tbody>
      ${live.map((r) => `<tr><td><b>${esc(r.name)}</b><div class="small muted" style="margin-top:2px">${esc(r.factors[0]?.[1] ?? '')} · ${chain(r)}</div></td>
        <td class="num">${fmt(r.area, 1)} m²</td><td class="num">${r.windows.length || '<span style="color:var(--danger)">none</span>'}</td><td class="num"><b>${fmt(r.kw, 2)} kW</b></td><td class="num">${perM2(r.kw, r.area)}</td></tr>`).join('')}
      ${off.map((r) => `<tr class="muted"><td>${esc(r.name)} <span class="small">· not air conditioned</span></td><td class="num">${fmt(r.area, 1)} m²</td><td></td><td class="num">—</td><td></td></tr>`).join('')}
    </tbody></table>
    <div class="card" style="margin:14px 0 0;padding:12px 14px;background:var(--tile);box-shadow:none">
      <div class="kv"><span>Every room at its peak (connected)</span><b>${fmt(t.connectedKW, 1)} kW · ${perM2(t.connectedKW, t.area)} over ${fmt(t.area)} m²</b></div>
      <div class="kv"><span>Whole home at its peak: every room flat out at once</span><b>${fmt(t.wholeHomeKW, 1)} kW</b></div>
      <div class="kv"><span>Recommended: × ${pct(t.homeShare ?? 0.75)} of that (rooms peak at different times; holding takes less than pulling down)</span><b>${fmt(t.balancedKW ?? t.wholeHomeKW * 0.75, 1)} kW</b></div>
      <div class="kv"><span>Zoned use only: × ${pct(v.coincidence)} × ${pct(zmult)} for ${esc((zoning?.label ?? '').toLowerCase())} zoning</span><b>${fmt(t.designKW, 1)} kW</b></div>
    </div>
    <span class="eyebrow" style="display:block;margin:14px 0 4px">The unit — the next size up from the load</span>
    ${opt('balanced', 'Recommended')}${opt('margin', 'More margin (one size up)')}${opt('wholeHome', 'Whole home at its peak')}${opt('zoned', 'Zoned use only')}
    ${t.byHand ? `<div class="kv"><span>Picked by hand <span class="tag">PICKED</span></span><b>${esc(t.unit?.label ?? '')}</b></div>` : ''}
    <p class="small muted" style="margin:6px 0 0">${t.unit ? `${esc(t.unit.label)} (${pickedBy}) is ${perM2(t.unit.kw, t.area)} of conditioned floor.` : ''}</p>
    <span class="eyebrow" style="display:block;margin:14px 0 4px">Worth checking on this job</span>
    <ul class="small" style="margin:4px 0 0;padding-left:18px">${lows.map((x) => `<li style="margin:6px 0">${x}</li>`).join('')}</ul>`,
  [{ label: 'Close' },
    ...(t.sizing !== 'margin' || t.byHand ? [{ label: 'Use more margin', primary: true, run: () => commit({ ...app.project, site: { ...app.project.site, unitSizingPref: 'margin', unitKWPref: null } }) }] : [])]);
  d.querySelector('.dialog').classList.add('wide');
}

/// A VRF's kinds of head (Jake, 22 Nov 2026: "a VRF you should be able to run ducted, split, cassette, bulkhead anything").
const HEAD_KINDS = { bulkhead: 'Bulkhead', wall: 'Wall', cassette: 'Cassette', ducted: 'Ducted' };
const HEAD_KIND_NAMES = { bulkhead: 'bulkhead head', wall: 'wall head', cassette: 'ceiling cassette', ducted: 'ducted unit' };
const OUTLET_STYLES = [['round', 'Round'], ['slot', 'Linear slot'], ['bar', 'Linear bar'], ['floor', 'Floor grille'], ['sideWall', 'Side · wall'], ['sideBulkhead', 'Side · bulkhead']];
const OUTLET_NAMES = { round: 'Round ceiling diffuser', slot: 'Linear slot diffuser', bar: 'Linear bar grille', floor: 'Floor grille', sideWall: 'Side-blow bar grille · wall', sideBulkhead: 'Side-blow bar grille · bulkhead' };
/// How far into the room a side grille's vent sits: in the wall itself, or out on a bulkhead's face.
const SIDE_INSET = { sideWall: 0.15, sideBulkhead: 0.45 };

/// A side-blow grille goes on a wall (Jake, 22 Nov 2026): the nearest wall of the room it's in, clear of the corners,
/// set into the room by its inset. Anywhere else (no room there): left where it is.
function wallSnap(pos, style) {
  const room = app.view?.rooms.find((r) => r.polygon?.length >= 3 && pointInPolygon(pos, r.polygon));
  if (!room) return pos;
  const P = room.polygon, k = SIDE_INSET[style] ?? 0.15;
  let best = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    if (L < 0.8) continue;                                  // a stub of wall: no grille on it
    const t = Math.max(0.35, Math.min(L - 0.35, ((pos.x - a.x) * dx + (pos.y - a.y) * dy) / L));
    const q = { x: a.x + dx / L * t, y: a.y + dy / L * t }, d = Math.hypot(pos.x - q.x, pos.y - q.y);
    let n = { x: -dy / L, y: dx / L };
    if (!pointInPolygon({ x: q.x + n.x * 0.05, y: q.y + n.y * 0.05 }, P)) n = { x: -n.x, y: -n.y };
    const at = { x: q.x + n.x * k, y: q.y + n.y * k };
    if (!pointInPolygon(at, P)) continue;                  // too tight there
    if (!best || d < best.d) best = { d, at };
  }
  return best?.at ?? pos;
}

/// Edits in a row, as one change (one undo): each on the last one's project. The first refusal stops it; later ones
/// are skipped (the rest still stands).
async function edits(steps) {
  let p = app.project;
  try {
    for (const [op, args] of steps) {
      const r = await call('edit', { project: p, op, ...args });
      if (r.ok === false) { if (p === app.project) { toast(editRefusal(op)); return null; } continue; }
      p = r.project;
    }
  } catch (e) { toast(e.message); return null; }
  if (p !== app.project) await commit(p, { undoable: true });
  return p;
}

/// A vent's style (or every vent's, no id); a side grille also moves onto its wall.
function setVentStyle(id, st) {
  const steps = [['setOutletStyle', id ? { id, choice: st } : { choice: st }]];
  if (SIDE_STYLES.has(st))
    for (const o of app.layout?.outlets ?? []) if (!o.dropper && (!id || o.id === id)) steps.push(['dropOutlet', { id: o.id, pos: wallSnap(o.pos, st) }]);
  return edits(steps);
}

function velocity(lps, mm) { return lps / 1000 / (Math.PI * (mm / 2000) ** 2); }
/// The router sizes a run up to 12% over its class's limit before taking the next size (Router.sizes, ventTol), so a
/// run is "over" only past that — the same line the engine draws.
const SPEED_TOL = 1.12;
const overSpeed = (sp, cap) => cap != null && sp > cap * SPEED_TOL + 0.01;
/// A leg to a vent runs at the vent's neck, not the branch limit: it's over when the vent has more air than its size takes.
const legOver = (run) => { const cap = app.options.ventCap?.[run.sizeMM]; return cap != null && run.lps > cap * SPEED_TOL + 0.5; };
/// "Leg Ø200 · 4.1 m — 2.8 m/s": a run's air speed — a trunk, feed or the return against its class's limit, a leg to a
/// vent against what the vent takes.
function legSpeedLine(run) {
  const cls = app.project.site.velocityPref ?? 'standard', lim = app.options.velocityLimits?.[cls];
  const sp = velocity(run.lps, run.sizeMM);
  if (run.outlet != null) {
    const cap = app.options.ventCap?.[run.sizeMM], over = legOver(run);
    return `<div class="kv"><span>Leg Ø${run.sizeMM} · ${fmt(run.length, 1)} m</span><b style="${over ? 'color:var(--danger)' : ''}">${fmt(sp, 1)} m/s${cap != null ? ` <span class="muted small" style="font-weight:500">· Ø${run.sizeMM} takes ${fmt(cap)} L/s</span>` : ''}${over ? ' · over' : ''}</b></div>`;
  }
  const cap = lim ? (run.kind === 'trunk' ? lim.trunk : run.kind === 'return' ? lim.ret : lim.branch) : null, over = overSpeed(sp, cap);
  return `<div class="kv"><span>${run.kind === 'trunk' ? 'Trunk' : run.kind === 'return' ? 'Return' : 'Feed'} Ø${run.sizeMM} · ${fmt(run.length, 1)} m</span><b style="${over ? 'color:var(--danger)' : ''}">${fmt(sp, 1)} m/s${cap != null ? ` <span class="muted small" style="font-weight:500">of ${cap}</span>` : ''}${over ? ' · over' : ''}</b></div>`;
}
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
  return `<div class="card"><h2>Duct design</h2><p class="muted small">${app.designing ? 'Placing the fan coil…' : 'No design yet.'}</p>${app.designing ? '' : '<button class="btn" id="startdesign">Start the design</button>'}</div>`;
}

/// The supply transition: 1, 2 or 3 ducts off the fan coil (or auto). With the ducts drawn by hand and more of them
/// off the fan coil than the transition takes, the router lays them out again to suit (Jake, 22 Nov 2026: "when I click
/// two the duct still shows 3-way and doesn't change the design"); Back puts the hand-drawn ducts back.
async function setTakeoffs(n) {
  const l = app.layout, off = l ? l.runs.filter((r) => r.parent == null && r.kind !== 'return').length : 0;
  // Auto, no vents yet, or hand-drawn ducts that already fit it: just the transition (spare spigots show capped).
  if (!n || !l?.outlets?.some((o) => !o.dropper) || (l.handDrawn && off <= n)) { await edit('setTakeoffs', { n }); return; }
  const hand = l.handDrawn;
  toast(`Laying the ducts out as a ${n}-way…`, 8000);
  const r = await edit('relay', { n });
  document.querySelector('.toast')?.remove();
  const how = n === 2 ? 'living areas off one duct, bedrooms and the rest off the other' : `${n === 1 ? 'one duct' : n + ' ducts'} off the fan coil`;
  if (r) toast(hand ? `Laid out again as a ${n}-way: ${how}. Back puts your ducts back.` : `Laid out as a ${n}-way: ${how}.`, 6000);
}

function bindInspector(el) {
  const s = app.selection;
  $('#insp-close', el)?.addEventListener('click', () => select(null));
  $('#join', el)?.addEventListener('click', () => { app.joining = s.id; app.selection = null; render(); });
  $('#unjoin', el)?.addEventListener('click', () => edit('unjoinRoom', { room: s.id }));
  bindCeiling(el, (id, change) => edit('setRoom', { room: id, ...change }));
  $('#r-built', el)?.addEventListener('change', (e) => {
    const r = app.view.rooms.find((x) => x.id === s.id), area = $('#r-built-area', el)?.checked && r?.openArea;
    edit('setRoom', { room: s.id, era: e.target.value, ...(area ? { rooms: app.view.rooms.filter((m) => m.openArea === r.openArea).map((m) => m.id) } : {}) });
  });
  el.querySelectorAll('[data-zoned]').forEach((b) => (b.onclick = () => {
    const k = b.dataset.zoned, zones = (app.layout?.zones ?? []).map((z) => z.number);
    edit('setZone', { room: s.id, zone: k === 'none' ? 0 : k === 'auto' ? null : Math.max(0, ...zones) + 1 });
  }));
  $('#addhere', el)?.addEventListener('click', () => { app.addMode = true; render(); });
  $('#reshape', el)?.addEventListener('click', () => openEditor({ room: app.selection?.id }));
  el.querySelectorAll('[data-vsize]').forEach((b) => (b.onclick = () => edit('setRunSize', { id: s.id, mm: +b.dataset.vsize })));
  el.querySelectorAll('[data-fsize]').forEach((b) => (b.onclick = () => edit('setRunSize', { bid: b.dataset.bid, mm: +b.dataset.fsize })));
  $('#movebox', el)?.addEventListener('change', (e) => e.target.value && edit('moveOutletToBox', { id: s.id, bid: e.target.value }));
  $('#delvent', el)?.addEventListener('click', async () => { const id = s.id; app.selection = null; await edit('removeOutlet', { id }); });
  $('#unpin', el)?.addEventListener('click', () => edit('pinBox', { bid: s.id, pos: null }));
  $('#delbend', el)?.addEventListener('click', () => removeBend());
  el.querySelectorAll('[data-turn]').forEach((bt) => bt.addEventListener('click', () => app.selection?.kind === 'box' && turnBox(app.selection.id, Number(bt.dataset.turn))));
  $('#unturn', el)?.addEventListener('click', () => app.selection?.kind === 'box' && edit('turnBox', { key: app.selection.id, choice: 'reset' }));
  $('#straighten', el)?.addEventListener('click', () => { const p = pickedHandRun(); if (p) { app.bend = null; edit('setHandVia', { key: p.hr.id, outline: [] }); } });
  $('#delrun', el)?.addEventListener('click', async () => {
    const l = app.layout, run = s.kind === 'outlet' ? l?.runs.find((x) => x.outlet === s.id) : [...(l?.runs ?? [])].reverse().find((x) => x.keyBox === s.id);
    if (run?.hand && await edit('removeHandRun', { key: run.hand })) { app.selection = null; render(); }
  });
  $('#delhbox', el)?.addEventListener('click', async () => {
    if (await edit('removeHandBox', { key: String(s.id).slice(2) })) { app.selection = null; render(); }
  });
  $('#pen-from', el)?.addEventListener('click', () => { app.addMode = 'pen'; app.pen = { from: 'box:' + String(s.id).slice(2), via: [] }; app.selection = null; render(); });
  $('#unbox', el)?.addEventListener('click', async () => {
    const b = app.layout?.boxes.find((x) => x.bid === s.id);
    if (b && await edit('unBox', { ids: b.outlets })) { app.selection = null; renderInspector(); toast('Taken apart: the router puts those vents back on their zones\' BDOs.'); }
  });
  el.querySelectorAll('[data-rcount]').forEach((btn) => btn.addEventListener('click', () => {
    const n = +btn.dataset.rcount, l = app.layout;
    if (!n) edit('setReturnSize', {});
    else edit('setReturnSize', { n, mm: l.returnManual && (l.returnCount ?? 1) === n ? l.returnMM : returnSizeFor(l, n) });
  }));
  el.querySelectorAll('[data-rsize]').forEach((btn) => btn.addEventListener('click', () => {
    const l = app.layout;
    edit('setReturnSize', { mm: +btn.dataset.rsize, n: l.returnCount ?? 1 });
  }));
  $('#rotate', el)?.addEventListener('click', () => edit('rotateUnit'));
  $('#outback', el)?.addEventListener('click', () => edit('resetOutdoor'));
  $('#redesign', el)?.addEventListener('click', () => designNow(true));
  $('#startdesign', el)?.addEventListener('click', () => startDesign());
  $('#restart', el)?.addEventListener('click', () => confirmDialog('Clear the outlets?', 'Every outlet comes out and the fan coil and return go back to the starting spots. You can undo this.', 'Clear them', () => startDesign()));
  el.querySelectorAll('[data-room]').forEach((r) => (r.onclick = (e) => { if (e.target.closest('[data-quickvent], [data-zone]')) return; select(app.selection?.kind === 'room' && app.selection.id === r.dataset.room ? null : { kind: 'room', id: r.dataset.room }); }));
  el.querySelectorAll('[data-quickvent]').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    const r = app.view.rooms.find((x) => x.id === b.dataset.quickvent);
    if (r) addVent(r.centroid);
  }));
  el.querySelectorAll('[data-next]').forEach((b) => (b.onclick = () => {
    const k = b.dataset.next;
    app.selection = null;
    if (k === 'drain') { app.addMode = 'drain'; app.lineDraft = []; } else app.addMode = k === 'dropper' ? 'dropper' : true;
    render();
  }));
  $('#openall', el)?.addEventListener('click', async () => { app.closed = new Set(); await refresh(); render(); });
  el.querySelectorAll('[data-zone]').forEach((r) => (r.onclick = async (e) => {
    e.stopPropagation();
    const z = +r.dataset.zone;
    if (z === 0) { toast('The constant zone has no damper — it\'s always on.'); return; }
    if (app.layout && runState(app.layout).mode === 'one') { runOne(z); return; }
    app.closed.has(z) ? app.closed.delete(z) : app.closed.add(z);
    await refresh(); render();
  }));
  el.querySelectorAll('[data-bal]').forEach((b) => (b.onclick = async () => { app.balanced = b.dataset.bal === '1'; await refresh(); render(); }));
  el.querySelectorAll('[data-ostyle]').forEach((b) => (b.onclick = () => setVentStyle(s.id, b.dataset.ostyle)));
  $('#ostyle-all', el)?.addEventListener('change', (e) => setVentStyle(null, e.target.value));
  $('#cards-back', el)?.addEventListener('click', () => { const { zoneCards, ...rest } = app.project; commit(rest, { undoable: true }); });
  $('#ostyle-every', el)?.addEventListener('click', () => {
    const st = (app.layout?.outlets ?? []).find((q) => q.id === s.id)?.style ?? 'round';
    setVentStyle(null, st).then((r) => r && toast(`Every vent is ${(OUTLET_STYLES.find(([k]) => k === st) ?? ['', 'round'])[1].toLowerCase()} now`));
  });
  el.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => openCatalogue()));
  $('#brand', el)?.addEventListener('change', (e) => commit({ ...app.project, site: { ...app.project.site, brandPref: e.target.value === 'mitsubishi' ? null : e.target.value, unitKWPref: null } }, { undoable: true }));
  $('#zoning', el)?.addEventListener('change', (e) => commit({ ...app.project, site: { ...app.project.site, zoningPref: e.target.value } }, { undoable: true }));
  $('#velocity', el)?.addEventListener('change', (e) => commit({ ...app.project, site: { ...app.project.site, velocityPref: e.target.value } }, { undoable: true }));
  $('#takeoffs', el)?.addEventListener('change', (e) => setTakeoffs(e.target.value ? +e.target.value : null));
  el.querySelectorAll('[data-tko]').forEach((b) => (b.onclick = () => setTakeoffs(b.dataset.tko ? +b.dataset.tko : null)));
  $('#opts', el)?.addEventListener('toggle', (e) => { app.optsOpen = e.target.open; });
  $('#flex-more', el)?.addEventListener('toggle', (e) => { app.flexOpen = e.target.open; });
  $('#open-vent', el)?.addEventListener('click', () => select({ kind: 'outlet', id: app.selection.id }));
  $('#insp-close2', el)?.addEventListener('click', () => select(null));
  $('#addhere2', el)?.addEventListener('click', () => { app.addMode = true; render(); });
  el.querySelectorAll('[data-roomof]').forEach((b) => (b.onclick = () => select({ kind: 'room', id: b.dataset.roomof })));
  el.querySelectorAll('[data-upsize]').forEach((b) => (b.onclick = () => { const [id, mm] = b.dataset.upsize.split(':'); edit('setRunSize', { id, mm: +mm }).then((r) => r && toast(`Up to Ø${mm}`)); }));
  $('#room-more', el)?.addEventListener('click', () => { app.loadOpen = !app.loadOpen; renderInspector(); });
  $('#vent-more', el)?.addEventListener('click', () => { app.ventMore = !app.ventMore; renderInspector(); });
  $('#bal', el)?.addEventListener('change', async (e) => { app.balanced = e.target.value === '1'; await refresh(); render(); });
  el.querySelectorAll('[data-lfilter]').forEach((b) => (b.onclick = () => { app.listFilter = b.dataset.lfilter; renderInspector(); }));
  el.querySelectorAll('[data-vent]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); select(app.selection?.kind === 'outlet' && app.selection.id === b.dataset.vent ? { kind: 'room', id: app.layout.outlets.find((o) => o.id === b.dataset.vent)?.roomId } : { kind: 'outlet', id: b.dataset.vent }); }));
  el.querySelectorAll('[data-run]').forEach((b) => (b.onclick = async () => {
    if (b.dataset.run === 'all') { app.closed = new Set(); await refresh(); render(); } else runOne();
  }));
  $('#load-more', el)?.addEventListener('toggle', (e) => { app.loadOpen = e.target.open; });
  $('#opts-btn', el)?.addEventListener('click', () => {
    if (app.selection) { app.optsOpen = true; select(null); }
    const d = $('#opts');
    if (d) { d.open = true; app.optsOpen = true; d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  });
  $('#unhand', el)?.addEventListener('click', () => edit('resetHandBoxes'));
  // Two storeys
  el.querySelectorAll('[data-dropper]').forEach((r) => (r.onclick = () => select({ kind: 'dropper', id: r.dataset.dropper })));
  $('#downstairs', el)?.addEventListener('change', (e) => edit('setDuctDownstairs', { on: e.target.value === '1' }));
  $('#add-dropper', el)?.addEventListener('click', () => { app.addMode = 'dropper'; app.selection = null; render(); });
  if (s?.kind === 'dropper') {
    const dr = app.view.droppers?.find((x) => x.id === s.id);
    el.querySelectorAll('[data-feed]').forEach((b) => (b.onchange = () => {
      const picked = [...el.querySelectorAll('[data-feed]')].filter((x) => x.checked).map((x) => x.dataset.feed);
      edit('setDropperRooms', { id: s.id, rooms: picked.length ? picked : null });
    }));
    $('#dr-auto', el)?.addEventListener('click', () => edit('setDropperRooms', { id: s.id, rooms: null }));
    el.querySelectorAll('[data-dsize]').forEach((b) => (b.onclick = () => edit('setDropperSize', { id: s.id, mm: +b.dataset.dsize })));
    $('#dr-level', el)?.addEventListener('change', (e) => edit('setDropperLevel', { id: s.id, level: +e.target.value }));
    $('#dr-del', el)?.addEventListener('click', () => { app.selection = null; edit('removeDropper', { id: dr?.id ?? s.id }); });
  }
}

// MARK: Send

async function renderSend(c) {
  const l = app.layout;
  if (isSplit()) { renderSplitSend(c); return; }
  if (!l?.outlets?.length) {
    c.innerHTML = '<div class="card empty" style="max-width:560px;margin:20px auto"><h2>Design the ducts first</h2><p>The report, materials and install sheet are made once the ducts are designed.</p></div>';
    return;
  }
  c.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto 12px"></div>Checking the design…</div>';
  const [{ checks }, takeoff] = await Promise.all([call('checks', { project: app.project }), call('takeoff', { project: app.project })]);
  if (!app.project || app.step !== 'send' || !c.isConnected) return; // left the page while it was checking
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
      <div class="file"><div class="ic">${icon('house')}</div><div><b>3D for the customer</b><span>Their home, the system in the roof, the air moving</span></div><div class="go"><button class="btn2 small" id="show3d">Show</button></div></div>
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
  $('#show3d', c)?.addEventListener('click', () => openCustomer3D().catch((e) => toast(e.message)));
  $('#quoted', c)?.addEventListener('click', () => commit({ ...p, status: 'quoted' }));
  $('#unquote', c)?.addEventListener('click', () => commit({ ...p, status: null }));
}

// MARK: Multi-head split

/// New ducted, a re-duct or a multi-head split, on the Design step's bar.
function systemSwitch() {
  const k = jobKind();
  return `<div class="seg" title="The kind of job">${[['ducted', 'Ducted'], ['reduct', 'Re-duct'], ['bulkhead', 'Bulkhead'], ['vrf', 'VRF'], ['wall', 'Wall split']].map(([id, t]) =>
    `<button data-sys="${id}" class="${k === id ? 'on' : ''}">${t}</button>`).join('')}</div>`;
}

function bindSystemSwitch(c) {
  c.querySelectorAll('[data-sys]').forEach((b) => (b.onclick = () => setJobKind(b.dataset.sys)));
}

/// Switch the job: a re-duct is a ducted job with the unit that's there kept (an air conditioner unless said otherwise).
async function setJobKind(kind) {
  if (kind === jobKind()) return;
  app.selection = null;
  if (['bulkhead', 'vrf', 'wall', 'multiSplit'].includes(kind)) {
    // Each brand's own range: bulkhead heads, wall heads, or City Multi on branch boxes.
    const kaden = brandId() === 'kaden';
    const range = kind === 'vrf' ? 'mitsubishi-pumy' : kind === 'wall' ? (kaden ? 'kaden-ksi' : 'mitsubishi-msz') : (kaden ? 'kaden-km' : 'mitsubishi-mxz');
    if (!isSplit()) await edit('setSystem', { system: 'multiSplit' });
    if (app.project.split?.range !== range) await edit('setSplitRange', { key: range });
    return;
  }
  if (isSplit()) await edit('setSystem', { system: 'ducted' });
  await edit('setExisting', { choice: kind === 'reduct' ? (app.project.existing?.kind ?? 'aircon') : null });
  if (kind === 'reduct') toast('Re-duct: drag the fan coil to where the unit is.', 4500);
  if (!app.project.design && app.view?.planChecked && app.step === 'design') startDesign();
}

const shortModel = (m) => m.replace(/(VGKD2|VGD)-A\d$/, '');

/// The Design step for a multi-head split: the heads on their walls, the outdoor units and the pipe runs on the plan;
/// the system, each head and each outdoor unit on the right.
function renderSplitDesign(c) {
  const sp = app.split, v = app.view;
  const heads = sp?.heads ?? [], pumps = heads.filter((h) => h.pump).length;
  const kw = heads.reduce((t, h) => t + h.coolKW, 0);
  c.innerHTML = `<div class="work with-rail">
    <div class="rail">
      <button id="t-select" class="${app.addMode ? '' : 'on'}">${icon('cursor')}<span class="tip">Select and drag</span></button>
      <button id="t-addhead" class="${app.addMode === 'head' ? 'on' : ''}">${icon('addvent')}<span class="tip">${app.addMode === 'head' ? 'Done adding' : sp?.range?.wall ? 'Add a wall head' : 'Add a bulkhead unit'}</span></button>
      ${lineTools()}
      <button id="t-undo" ${app.undo.length ? '' : 'disabled'}>${icon('undo')}<span class="tip">Undo</span></button>
      <button id="t-redo" ${app.redo.length ? '' : 'disabled'}>${icon('redo')}<span class="tip">Redo</span></button>
      <button id="t-fit">${icon('fit')}<span class="tip">Fit the plan</span></button>
    </div>
    <div class="stage">
      <div class="bar">
        <div class="stats"><div><b>${heads.length || '—'}</b><span>heads</span></div><div><b>${sp?.outdoors.length || '—'}</b><span>outdoor</span></div>
          <div><b>${kw ? g(Math.round(kw * 10) / 10) + ' kW' : '—'}</b><span>of heads</span></div><div><b>${pumps}</b><span>pumps</span></div></div>
        <div class="spacer" style="flex:1"></div>
        <button class="btn2 small" id="b-undo" title="Undo the last change" ${app.undo.length ? '' : 'disabled'}>${icon('undo').replace('<svg', '<svg width="15" height="15"')} Back</button>
        <button class="btn2 small" id="b-redo" title="Redo it" ${app.redo.length ? '' : 'disabled'}>Forward ${icon('redo').replace('<svg', '<svg width="15" height="15"')}</button>
        <div class="seg" title="Show how far each head's air reaches"><button data-sair="0" class="${splitAir() ? '' : 'on'}">Plan</button><button data-sair="1" class="${splitAir() ? 'on' : ''}">Air</button></div>
        ${isMixed() ? sysTabs() + (sysView() === 'B' ? bKindSeg() : '') : systemSwitch()}
      </div>
      <div class="canvas-card"><canvas id="cv"></canvas>${zoomCtl()}
        <div class="north">${'<svg width="14" height="16" viewBox="0 0 14 16"><path d="M7 0l6 16-6-4-6 4z" fill="#E0342F"/></svg>'}<div>N</div></div>
        ${sp ? '' : '<div class="busy"><div><div class="spinner"></div>Laying out the heads…</div></div>'}
      </div>
      <div class="hint">${lineHint() || `Drag a head along its room's walls — on an outside wall its pipes and drain go straight out; on an internal wall it needs a pump. Drag an outdoor unit along the outside walls. Tap one to see it on the right.`}</div>
    </div>
    <div class="panel" id="insp"></div>
  </div>`;
  const plan = mountPlan($('#cv', c), {
    layout: false, split: sp, splitAir: splitAir(), selection: app.selection, interactive: true, labels: true, compact: true,
    addMode: app.addMode === 'head' || isLineMode() ? app.addMode : false, lineDraft: app.lineDraft,
    handlers: { select: (item) => select(item), dragMove: () => {}, drop: (item, pos) => drop(item, pos), add: (pos) => (isLineMode() ? addLinePoint(pos) : addHead(pos)) },
  });
  bindLineTools(c);
  $('#t-select', c).onclick = () => { app.addMode = false; render(); };
  $('#t-addhead', c).onclick = () => { app.addMode = app.addMode === 'head' ? false : 'head'; if (app.addMode) app.selection = null; render(); };
  app.plan = plan;
  renderSplitInspector();
  for (const id of ['#t-undo', '#b-undo']) $(id, c).onclick = undo;
  for (const id of ['#t-redo', '#b-redo']) $(id, c).onclick = redo;
  $('#t-fit', c).onclick = () => plan.fit();
  bindZoomCtl(c, { zoomBy: (k) => plan.zoomBy(k), fit: () => plan.fit(), setHand: (on) => plan.setHand(on) });
  bindSystemSwitch(c);
  bindSysTabs(c);
  c.querySelectorAll('[data-sair]').forEach((b) => (b.onclick = () => {
    app.layers.splitAir = b.dataset.sair === '1'; saveLayers();
    c.querySelectorAll('[data-sair]').forEach((x) => x.classList.toggle('on', x === b));
    plan.set({ splitAir: splitAir() });
  }));
}

// MARK: Pipe runs drawn by hand

const LINE_NAMES = { drain: 'Condensate drain', refrigerant: 'Refrigerant line' };
const isLineMode = () => app.addMode === 'drain' || app.addMode === 'refrigerant';
function lineTools() {
  // The refrigerant line is worked out to the outdoor unit or branch box; only the drain is drawn (Jake, 16 Nov 2026).
  return [['drain', 'drop', 'Draw the drain line']].map(([k, ic, t]) =>
    `<button data-linetool="${k}" class="${app.addMode === k ? 'on' : ''}">${icon(ic)}<span class="tip">${app.addMode === k ? 'Finish the line' : t}</span></button>`).join('');
}
function lineHint() {
  if (!isLineMode()) return '';
  const n = app.lineDraft?.length ?? 0;
  return `${LINE_NAMES[app.addMode]}: click along its run${app.addMode === 'drain' ? ', from the unit to where it drains outside' : ', from the unit to the outdoor unit'}. ${n >= 2 ? '<button class="link" id="line-done">Finish it</button> · ' : ''}<button class="link" id="line-cancel">Cancel</button>`;
}
function bindLineTools(c) {
  c.querySelectorAll('[data-linetool]').forEach((b) => (b.onclick = () => {
    if (app.addMode === b.dataset.linetool) { finishLine(); return; }
    app.addMode = b.dataset.linetool; app.lineDraft = []; app.selection = null; render();
  }));
  $('#line-done', c)?.addEventListener('click', finishLine);
  $('#line-cancel', c)?.addEventListener('click', () => { app.addMode = false; app.lineDraft = null; render(); });
}
function addLinePoint(pos) {
  app.lineDraft = [...(app.lineDraft ?? []), pos];
  app.plan?.set({ lineDraft: app.lineDraft });
  const hint = document.querySelector('.hint');
  if (hint) { hint.innerHTML = lineHint(); bindLineTools(hint.parentElement); }
}
async function finishLine() {
  const kind = app.addMode, pts = app.lineDraft ?? [];
  app.addMode = false; app.lineDraft = null;
  if (pts.length < 2) { render(); return; }
  const r = await edit('addLine', { choice: kind, outline: pts });
  if (r?.id) { app.selection = { kind: 'line', id: r.id }; render(); }
}
function lineCard(close) {
  const ln = (app.project.lines ?? []).find((x) => x.id === app.selection?.id);
  if (!ln) return null;
  let run = 0;
  for (let i = 1; i < ln.points.length; i++) run += Math.hypot(ln.points[i].x - ln.points[i - 1].x, ln.points[i].y - ln.points[i - 1].y);
  return `<div class="card"><div class="insp-head"><h2>${LINE_NAMES[ln.kind] ?? 'Pipe run'}</h2>${close}</div>
    <div class="insp-sub">${fmt(run + (ln.drop ?? 0), 1)} m in all · on the materials in place of the estimate</div>
    <div class="kv"><span>Along the plan</span><b>${fmt(run, 1)} m</b></div>
    <label class="rowpick"><label>Up or down a wall (m)</label><input class="text" id="line-drop" type="number" min="0" step="0.1" value="${fmt(ln.drop ?? 0, 1)}" style="width:90px"></label>
    <div class="actions-row"><button class="btn2 danger" id="line-del">${icon('trash').replace('<svg', '<svg width="16" height="16"')} Take it out</button></div></div>`;
}
function bindLineCard(el) {
  const id = app.selection?.id;
  $('#line-drop', el)?.addEventListener('change', (e) => edit('setLineDrop', { id, by: parseFloat(e.target.value) || 0 }));
  $('#line-del', el)?.addEventListener('click', () => { app.selection = null; edit('removeLine', { id }); });
}

/// A head added by hand where the plan's tapped: the room's first, or one more in a room or open area that has one.
async function addHead(pos) {
  const room = app.view.rooms.find((r) => r.conditioned && pointInPolygon(pos, r.polygon));
  if (!room) return;
  const h = app.split?.heads.find((x) => x.spaceRooms.includes(room.id));
  const r = h ? await edit('setHeadCount', { key: h.spaceKey, n: h.spaceHeads + 1 }) : await edit('setHeadRoom', { room: room.id, choice: 'on' });
  if (r) toast(h ? `${h.spaceHeads + 1} heads in ${room.name}: drag them where they go.` : `A head in ${room.name}: drag it along its wall.`);
}

/// The heads' air reach on the plan (on unless turned off).
const splitAir = () => app.layers.splitAir !== false;

/// A bulkhead head's face: the linear bar grilles for its air, what they take of its static, and the bulkhead it needs.
function bulkheadCard(h) {
  const gr = h.grilles, row = (name, x) => `<div class="kv"><span>${name}</span><b>${esc(x.size)} mm <span class="muted small" style="font-weight:500">· ${fmt(x.pa)} Pa · NR ${fmt(x.nr)}</span></b></div>`;
  const box = h.widthMM && h.heightMM ? `${h.widthMM + 100} wide × ${h.heightMM + 50} high inside, ${h.depthMM ? (h.depthMM + 250) + ' mm' : 'its depth plus the plenum box'} deep` : null;
  return `<div class="card"><h2>Bulkhead face</h2>
    <p class="small muted" style="margin:0 0 6px">Linear bar grilles for its ${fmt(gr.lps)} L/s on high, kept under NR ${fmt(gr.nrLimit)}${h.space === h.roomName && gr.nrLimit < 30 ? ' (a bedroom)' : ''}.</p>
    ${row('Supply grille', gr.supply)}${row('Return air grille', gr.ret)}
    <div class="kv"><span>Static through both</span><b style="${gr.over ? 'color:var(--danger)' : ''}">${fmt(gr.needPa)} Pa${gr.maxPa != null ? ` <span class="muted small" style="font-weight:500">of ${fmt(gr.maxPa)} Pa top</span>` : ''}</b></div>
    ${gr.setting != null ? `<div class="kv"><span>Fan static setting</span><b>${fmt(gr.setting)} Pa or the next up, with the plenum box and filter</b></div>` : ''}
    ${box ? `<div class="kv"><span>Bulkhead, about</span><b>${box}</b></div>` : ''}
    ${gr.over ? '<p class="small" style="margin:6px 0 0;color:var(--danger);font-weight:600">The grilles take more than 60% of its static. A longer or taller grille, a second head, or a head with more static.</p>' : ''}
    <p class="small muted" style="margin:6px 0 0">Sized from Airfoil LBG-00 linear bar grille data. Check your grille maker's own figures.</p></div>`;
}

function renderSplitInspector() {
  const el = $('#insp');
  if (!el) return;
  const sp = app.split, s = app.selection, v = app.view;
  if (!sp) { el.innerHTML = '<div class="card"><p class="small muted" style="margin:0">Laying out the heads…</p></div>'; return; }
  const close = `<button class="iconbtn close" id="insp-close">${icon('x')}</button>`;
  if (s?.kind === 'line' && lineCard(close)) {
    el.classList.remove('ipanel');
    el.innerHTML = lineCard(close);
    $('#insp-close', el)?.addEventListener('click', () => select(null));
    bindLineCard(el);
    return;
  }
  const roomName = (id) => v.rooms.find((r) => r.id === id)?.name ?? '';
  let html = '';
  const h = s?.kind === 'head' ? sp.heads.find((x) => x.id === s.id) : null;
  const o = s?.kind === 'odu' ? sp.outdoors[s.id] : null;
  const roomPick = s?.kind === 'room' ? v.rooms.find((r) => r.id === s.id) : null;
  if (h) {
    const auto = !h.sizedByHand;
    const tone = splitColour(h.outdoor);
    const enough = h.coolKW * 1.06 >= h.loadKW;
    html = `<div class="card"><div class="insp-head"><h2>${esc(h.roomName)}</h2>${close}</div>
      <div class="insp-sub">${esc(shortModel(h.model))} · ${g(h.coolKW)} kW ${HEAD_KIND_NAMES[h.kind] ?? (h.wall ? 'wall head' : 'bulkhead head')}${h.outdoor >= 0 ? ` · <span style="color:${tone};font-weight:700">${vrfShared() ? 'VRF outdoor' : 'outdoor ' + (h.outdoor + 1)}</span>` : ''}</div>
      ${(sp.range.kinds?.length ?? 0) > 1 ? `<label class="field"><span>Kind of head</span></label><div class="seg" style="flex-wrap:wrap;margin:-4px 0 10px">${sp.range.kinds.map((k) =>
        `<button data-hkind="${k}" class="${h.kind === k ? 'on' : ''}">${esc(HEAD_KINDS[k] ?? k)}</button>`).join('')}</div>` : ''}
      <label class="field"><span>Head size</span><select id="hs-size">
        <option value="0" ${auto ? 'selected' : ''}>Auto — sized to the room</option>
        ${sp.headModels.filter((m) => !m.kind || m.kind === h.kind).map((m) => `<option value="${m.kw}" ${!auto && Math.abs(m.kw - h.coolKW) < 0.01 ? 'selected' : ''}>${esc(shortModel(m.model))} · ${g(m.kw)} kW${m.handOnly ? ' (small)' : ''}</option>`).join('')}</select></label>
      ${true ? `<label class="field"><span>Heads in ${h.spaceRooms.length > 1 ? 'this area' : 'this room'}</span><select id="hs-count">
        <option value="0" ${h.countByHand ? '' : 'selected'}>Auto — ${h.autoHeads} for its load</option>
        ${[1, 2, 3, 4].map((n) => `<option value="${n}" ${h.countByHand && h.spaceHeads === n ? 'selected' : ''}>${n} head${n === 1 ? '' : 's'}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>Outdoor unit</span><select id="hs-unit">${outdoorOptions(sp, h.outdoor, true)}</select></label>
      <div class="kv"><span>Room load</span><b style="color:${enough ? 'inherit' : 'var(--danger)'}">${fmt(h.loadKW, 2)} kW${h.space !== h.roomName ? ` <span class="muted small">(${esc(h.space)})</span>` : ''}</b></div>
      <div class="kv"><span>Airflow</span><b>${h.airflowLps ? `up to ${Math.round(h.airflowLps)} L/s` : '—'} <span class="muted small">· room ${Math.round(h.needLps)} L/s</span></b></div>
      ${h.reachM ? `<div class="kv" title="How far its air carries on high fan before it slows to 0.25 m/s — estimated from its airflow and outlet; the brands don't publish air throw"><span>Air reaches</span>
        <b style="color:${h.reachShort ? 'var(--danger)' : 'inherit'}">about ${fmt(h.reachM, 1)} m <span class="muted small">· far wall ${fmt(h.depthM, 1)} m</span></b></div>
        ${h.reachShort ? '<p class="small" style="margin:6px 0 0;color:var(--danger)">Its air slows before the far end on high fan. A bigger head, or a second one at the far end, carries further.</p>' : ''}` : ''}
      ${h.soundDB ? `<div class="kv"><span>Sound</span><b>${h.soundDB[0]}–${h.soundDB[1]} dB(A)</b></div>` : ''}
      ${h.widthMM ? `<div class="kv"><span>Size</span><b>${h.widthMM} wide × ${h.heightMM ?? '—'} high${h.depthMM ? ` × ${h.depthMM} deep` : ''}</b></div>` : ''}
    </div>
    ${h.grilles ? bulkheadCard(h) : ''}
    <div class="card"><h2>Where it goes</h2>
      <div class="kv"><span>${h.kind === 'cassette' ? 'Where' : 'Wall'}</span><b>${h.wall ? (h.onOutside ? 'Outside wall' : 'Internal wall') : h.kind === 'cassette' ? 'In the ceiling, mid-room' : h.kind === 'ducted' ? 'In the roof, ducted' : 'Bulkhead'}</b></div>
      <div class="kv"><span>Pipe run</span><b>${fmt(h.pipeM, 1)} m · ${esc(h.pipes)}</b></div>
      <div class="kv"><span>Drain</span><b>${fmt(h.drainM, 1)} m${h.pump ? ' · <span style="color:var(--cool)">pumped</span>' : ''}</b></div>
      <p class="small muted" style="margin:8px 0 0">${h.wall ? (h.onOutside ? 'Pipes, cable and drain go straight out through the wall behind it, then along the outside wall in duct cover to the outdoor unit.'
        : 'On an internal wall: the pipes go up into the roof and across, and the drain needs a condensate pump. Drag it onto an outside wall to do without.') : h.kind === 'cassette' ? 'Flush in the ceiling: pipes across the roof, and its own pump lifts the drain into the roof.' : 'In a bulkhead: pipes and drain across the roof.'}</p>
      <div class="actions-row">${h.pinned ? '<button class="btn2" id="hs-back">Put it back</button>' : ''}<button class="btn2" id="hs-none">No head in this room</button></div></div>`;
  } else if (o) {
    const tone = splitColour(s.id);
    html = `<div class="card"><div class="insp-head"><h2><span style="color:${tone}">Outdoor ${s.id + 1}</span> · ${esc(o.model)}</h2>${close}</div>
      <div class="insp-sub">${g(o.coolKW)} kW · ${o.ports} heads · ${esc(o.phase)} · on the ${esc(o.room)} wall${o.pinned ? ' (moved)' : ''}</div>
      ${o.problem ? `<p class="unit-problem">It can't take these heads: the ${esc(o.model)} ${esc(o.problem)}. Move a head onto another outdoor unit.</p>` : ''}
      <div class="kv"><span>Heads' size</span><b>${fmt(o.connectedKW, 1)} kW on a ${g(o.coolKW)} kW unit</b></div>
      <div class="kv"><span>Pipe</span><b>${Math.round(o.pipeTotalM)} of ${o.maxPipeTotal} m · each up to ${o.maxPipePerHead} m</b></div>
      <div class="actions-row">${o.pinned ? '<button class="btn2" id="od-back">Put it back</button>' : ''}${sp.outdoors.length > 1 ? `<button class="btn2" id="od-remove">Take this unit out</button>` : ''}</div></div>
    <div class="card"><h2>${o.heads.length} head${o.heads.length === 1 ? '' : 's'} on it</h2>${o.heads.map((i) => unitHeadRow(sp, sp.heads[i])).join('')}
      ${sp.outdoors.length > 1 ? `<p class="small muted" style="margin:8px 0 0">Taking it out puts its heads on outdoor ${s.id === 0 ? 2 : 1}.</p>` : ''}</div>`;
  } else if (app.addingUnit) {
    const n = sp.outdoors.length + 1;
    html = `<div class="card"><div class="insp-head"><h2>Outdoor ${n}: which heads go on it?</h2>${close}</div>
      <p class="small muted" style="margin:0 0 6px">Tick the heads to run off another outdoor unit. The rest stay where they are.</p>
      ${sp.heads.map((x) => `<label class="pick-row"><input type="checkbox" data-pick="${esc(x.key)}">
        <span class="dot" style="background:${x.outdoor >= 0 ? splitColour(x.outdoor) : 'var(--danger)'}"></span>
        <span class="grow"><b>${esc(x.roomName)}</b><small>${esc(shortModel(x.model))} · ${g(x.coolKW)} kW · ${x.outdoor >= 0 ? `on outdoor ${x.outdoor + 1}` : 'on no outdoor unit'}</small></span></label>`).join('')}
      <div class="actions-row"><button class="btn" id="nu-add" disabled>Add outdoor ${n}</button><button class="link" id="nu-cancel">Cancel</button></div></div>`;
  } else if (roomPick) {
    const has = sp.heads.some((x) => x.room === roomPick.id), off = sp.noHead.includes(roomPick.id);
    html = `<div class="card"><div class="insp-head"><h2>${esc(roomPick.name)}</h2>${close}</div>
      <div class="insp-sub">${fmt(roomPick.area, 1)} m² · ${fmt(roomPick.kw, 2)} kW</div>
      <p class="small muted" style="margin:6px 0 10px">${has ? 'Has a head.' : off ? 'No head of its own.' : 'Shares a head with its open area.'}</p>
      <div class="actions-row">${has ? '<button class="btn2" id="rm-off">No head here</button>' : `<button class="btn" id="rm-on">Give it a head</button>`}
        <button class="link" id="rm-auto">As the plan has it</button></div></div>`;
  } else {
    const groups = [['Wall-mounted heads', sp.ranges.filter((r) => r.wall)], ['Ducted heads in a bulkhead', sp.ranges.filter((r) => !r.wall && !r.vrf)],
      ['VRF on branch boxes (bigger homes)', sp.ranges.filter((r) => r.vrf)]].filter(([, rs]) => rs.length);
    const noHead = sp.noHead.map(roomName).filter(Boolean);
    html = `<div class="card"><h2>Multi-head split</h2>
        <label class="field"><span>Range</span><select id="sp-range">${groups.map(([label, rs]) => `<optgroup label="${label}">${rs.map((r) => `<option value="${r.id}" ${r.id === sp.range.id ? 'selected' : ''}>${esc(r.brand)} — ${esc(r.name)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <p class="small muted" style="margin:0">Each bedroom and living area gets a head sized to its load; the heads go on the fewest outdoor units that take them, each where its pipes are shortest.</p>
        <div class="actions-row"><button class="btn2" data-cat>Catalogue</button><button class="link" id="sp-reset">Start the heads again</button></div></div>
      ${unitsCard(sp, noHead)}
      <div class="card"><h2>Checks</h2><div class="checklist">${sp.checks.map(checkItem).join('')}</div></div>`;
  }
  el.innerHTML = html;
  $('#insp-close', el)?.addEventListener('click', () => { app.addingUnit = false; select(null); });
  el.querySelectorAll('[data-head]').forEach((b) => (b.onclick = () => select({ kind: 'head', id: +b.dataset.head })));
  el.querySelectorAll('[data-odu]').forEach((b) => (b.onclick = () => select({ kind: 'odu', id: +b.dataset.odu })));
  el.querySelectorAll('[data-move]').forEach((m) => (m.onchange = () => edit('setHeadUnit', { key: m.dataset.move, unit: +m.value })));
  $('#sp-add-unit', el)?.addEventListener('click', () => { app.addingUnit = true; app.selection = null; app.plan?.set({ selection: null }); renderSplitInspector(); });
  $('#sp-auto', el)?.addEventListener('click', () => edit('autoSplitUnits'));
  if (app.addingUnit && !s) {
    const picks = [...el.querySelectorAll('[data-pick]')], add = $('#nu-add', el);
    picks.forEach((p) => (p.onchange = () => (add.disabled = !picks.some((x) => x.checked))));
    add.onclick = () => { app.addingUnit = false; edit('addSplitOutdoor', { keys: picks.filter((x) => x.checked).map((x) => x.dataset.pick) }); };
    $('#nu-cancel', el).onclick = () => { app.addingUnit = false; renderSplitInspector(); };
  }
  el.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => openCatalogue()));
  $('#sp-range', el)?.addEventListener('change', (e) => edit('setSplitRange', { key: e.target.value }));
  $('#sp-reset', el)?.addEventListener('click', () => confirmDialog('Start the heads again?', 'Every head and outdoor unit goes back where the plan puts it, at the size it picks. You can undo this.', 'Start again', () => edit('resetSplit')));
  if (h) {
    $('#hs-size', el).onchange = (e) => edit('setHeadSize', { room: h.room, kw: +e.target.value || null });
    el.querySelectorAll('[data-hkind]').forEach((b) => (b.onclick = () => b.dataset.hkind !== h.kind && edit('setHeadKind', { room: h.room, choice: b.dataset.hkind })));
    // How many heads the area gets (Jake, 31 Oct: one 8 kW head instead of two 5s); the heads are laid out again.
    $('#hs-count', el)?.addEventListener('change', (e) => { app.selection = null; edit('setHeadCount', { key: h.spaceKey, n: +e.target.value || null }); });
    $('#hs-unit', el).onchange = (e) => edit('setHeadUnit', { key: h.key, unit: +e.target.value });
    $('#hs-back', el)?.addEventListener('click', () => edit('moveHead', { room: h.room, n: h.nth, pos: null }));
    $('#hs-none', el).onclick = () => { app.selection = null; edit('setHeadRoom', { room: h.room, choice: 'off' }); };
  }
  if (o) {
    $('#od-back', el)?.addEventListener('click', () => edit('moveSplitOutdoor', { rooms: o.rooms, pos: null }));
    $('#od-remove', el)?.addEventListener('click', () => { app.selection = null; edit('removeSplitOutdoor', { unit: s.id }); });
  }
  if (roomPick) {
    $('#rm-on', el)?.addEventListener('click', () => edit('setHeadRoom', { room: roomPick.id, choice: 'on' }));
    $('#rm-off', el)?.addEventListener('click', () => edit('setHeadRoom', { room: roomPick.id, choice: 'off' }));
    $('#rm-auto', el)?.addEventListener('click', () => edit('setHeadRoom', { room: roomPick.id, choice: null }));
  }
}

/// The outdoor units to pick from for a head: each one there is, and a new one (`long`: with their models).
function outdoorOptions(sp, current, long) {
  return sp.outdoors.map((o, i) => `<option value="${i}" ${i === current ? 'selected' : ''}>Outdoor ${i + 1}${long ? ` · ${esc(o.model)}` : ''}</option>`).join('')
    + `${current < 0 ? '<option value="-1" selected disabled>No outdoor unit</option>' : ''}<option value="${sp.outdoors.length}">${long ? 'A new outdoor unit' : 'New outdoor'}</option>`;
}

/// A head in an outdoor unit's list: its room and size (tap for the head), and which unit it's on.
function unitHeadRow(sp, x) {
  return `<div class="unit-row"><button class="grow" data-head="${x.id}"><b>${esc(x.roomName)}${x.pump ? ' <span class="chip cool mini">pump</span>' : ''}</b>
    <small>${esc(shortModel(x.model))} · ${g(x.coolKW)} kW${x.outdoor >= 0 ? ` · ${fmt(x.pipeM, 1)} m pipe` : ''}</small></button>
    <select class="unit-pick" data-move="${esc(x.key)}" title="Which outdoor unit it runs off">${outdoorOptions(sp, x.outdoor, false)}</select></div>`;
}

/// Which heads are on which outdoor unit (Jake, 28 Oct: "make a list on what indoor is on what condenser"), each head's
/// unit to change, and another unit to add — all on the one unless set otherwise.
function unitsCard(sp, noHead) {
  const n = sp.outdoors.length, loose = sp.heads.filter((x) => x.outdoor < 0);
  const lead = sp.byHand
    ? `Set by hand. <button class="link inline" id="sp-auto">${sp.autoOutdoors === 1 ? 'Put them all back on one' : `Back to the plan's ${sp.autoOutdoors}`}</button>`
    : n === 1 ? 'Every head runs off the one outdoor unit.'
    : n > 1 ? `One outdoor unit can't take all these heads within its limits, so they're on ${n}.` : '';
  const shared = isVrfB(app.project) && app.project.vrfSpot;
  return `<div class="card"><h2>${shared ? 'On the VRF outdoor with A' : n === 1 ? 'One outdoor unit' : `${n} outdoor units`}</h2>
    <p class="small muted" style="margin:0 0 4px">${shared ? `These heads run off the same PUMY as A's ducted fan coil, through branch boxes. The outdoor that fits the lot is on Equipment, under Systems; below is what B alone would need.` : lead}</p>
    ${sp.outdoors.map((o, i) => `<div class="unit">
      <button class="unit-head" data-odu="${i}"><span class="dot" style="background:${splitColour(i)}"></span>
        <span class="grow"><b style="color:${splitColour(i)}">Outdoor ${i + 1} · ${esc(o.model)}</b>
        <small>${o.heads.length} of ${o.ports} heads · ${fmt(o.connectedKW, 1)} kW of heads on ${g(o.coolKW)} kW · ${Math.round(o.pipeTotalM)} m pipe</small></span></button>
      ${o.problem ? `<p class="unit-problem">Can't take these heads: the ${esc(o.model)} ${esc(o.problem)}.</p>` : ''}
      ${o.heads.map((id) => unitHeadRow(sp, sp.heads[id])).join('')}</div>`).join('')}
    ${loose.length ? `<div class="unit"><div class="unit-head"><span class="dot" style="background:var(--danger)"></span><span class="grow"><b style="color:var(--danger)">On no outdoor unit</b></span></div>
      ${loose.map((x) => unitHeadRow(sp, x)).join('')}</div>` : ''}
    ${shared ? '' : `<div class="actions-row"><button class="btn2 small" id="sp-add-unit" ${sp.heads.length < 2 ? 'disabled' : ''}>+ Add another outdoor unit</button></div>`}
    ${noHead.length ? `<p class="small muted" style="margin:10px 0 0">No head: ${noHead.map(esc).join(', ')}. Tap a room on the plan to give it one.</p>` : ''}</div>`;
}

/// The Send step for a multi-head split: its checks, the install sheet and drawing, the materials.
async function renderSplitSend(c) {
  const sp = app.split;
  if (!sp?.heads?.length) {
    c.innerHTML = '<div class="card empty" style="max-width:560px;margin:20px auto"><h2>Lay out the heads first</h2><p>The install sheet and materials are made once the heads are laid out.</p></div>';
    return;
  }
  const p = app.project, v = app.view;
  const warn = sp.checks.filter((x) => x.level !== 'ok'), ok = sp.checks.filter((x) => x.level === 'ok');
  c.innerHTML = `<div class="send-grid">
    <div>
      <div class="card"><span class="eyebrow">Checks</span><div class="checklist">${ok.map(checkItem).join('') || '<p class="small muted">—</p>'}</div></div>
      ${warn.length ? `<div class="card"><span class="eyebrow">${warn.length === 1 ? 'One thing to know' : warn.length + ' things to know'}</span><div class="checklist">${warn.map(checkItem).join('')}</div></div>` : ''}
    </div>
    <div class="card"><span class="eyebrow">Job file</span>
      <div class="file"><div class="ic">${icon('print')}</div><div><b>Install sheet</b><span>The plan, each head's wall, pipe, drain and pump</span></div><div class="go"><button class="btn2 small" data-report="install">Open</button></div></div>
      <div class="file"><div class="ic">${icon('aircon')}</div><div><b>Head layout</b><span>Heads, outdoor units, pipe runs</span></div><div class="go"><button class="btn2 small" id="png">PNG</button></div></div>
      <div class="file"><div class="ic">${icon('ruler')}</div><div><b>Materials</b><span>Heads, outdoor units, pipe, drains, pumps</span></div><div class="go"><button class="btn2 small" data-report="materials">Print</button><button class="btn2 small" id="csv">CSV</button></div></div>
      <p class="small muted" style="margin:10px 0 0">Each file is made from the layout as it is now. The customer report is for ducted jobs for now.</p>
      <div class="actions-row">${(p.status ?? 'inProgress') === 'inProgress' ? '<button class="btn2" id="quoted">Mark as quoted</button>' : `<span class="chip ok">Quoted</span><button class="link" id="unquote">Back to in progress</button>`}</div>
    </div>
    <div class="card"><span class="eyebrow">Materials</span>
      <table class="mat">${sp.groups.map((grp) => `<tr><th colspan="2">${esc(grp.name)}</th></tr>${grp.lines.map((ln) => `<tr><td>${esc(ln.desc)}${ln.note ? `<div class="small muted">${esc(ln.note)}</div>` : ''}</td><td class="qty">${esc(ln.qtyText)} <a href="${esc(ln.url)}" target="_blank" rel="noopener" title="Search Reece">↗</a></td></tr>`).join('')}`).join('')}</table>
      <p class="small muted" style="margin:10px 0 0">A first-pass ordering list from the layout — check quantities before you buy. The arrows open a Reece search.</p></div>
  </div>`;
  c.querySelectorAll('[data-report]').forEach((b) => (b.onclick = () => openReport(b.dataset.report)));
  $('#csv', c).onclick = () => download(`${v.title} — materials.csv`, new Blob([sp.csv], { type: 'text/csv' }));
  $('#png', c).onclick = drawingPNG;
  $('#show3d', c)?.addEventListener('click', () => openCustomer3D().catch((e) => toast(e.message)));
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
  // The design over the builder's plan (Jake, 31 Oct: the drawing that goes to the customer should show the read plan).
  plan.set({ project: app.project, view: app.view, layout: isSplit() ? null : app.layout, split: isSplit() ? app.split : null,
    backdrop: app.backdrop, upperBackdrop: app.upperBackdrop, topBackdrop: app.topBackdrop, showPlan: !!(app.backdrop || app.upperBackdrop), planAlpha: 0.45, interactive: false, labels: true, compact: false });
  plan.draw();
  const ctx = cv.getContext('2d');
  ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  cv.toBlob((b) => { download(`${app.view.title} — ${isSplit() ? 'head layout' : 'duct drawing'}.png`, b); cv.remove(); }, 'image/png');
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
  import('./reports.js?v=f11c00d-202611241727').then(async (m) => {
    // Reports are always the design as installed: every zone open, balanced. A multi-head job has no ducted design to
    // route (routing one threw, and the bar stayed on "Building the report…" for good).
    app.designLayout = isSplit() ? null : await call('route', { project: app.project, closed: [], balanced: true });
    const r = await m.build(kind, { app, call, Plan });
    if (r.error) { $('.report-bar b', o).textContent = r.error; return; }
    const frame = $('iframe', o);
    frame.srcdoc = r.html;
    $('.report-bar b', o).textContent = r.title;
    const print = $('#rp-print', o);
    print.disabled = false;
    print.onclick = () => frame.contentWindow.print();
  }).catch((e) => { $('.report-bar b', o).textContent = `The report couldn't be built: ${e.message}`; });
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
    if (e.key === 'Enter' && isLineMode()) { e.preventDefault(); finishLine(); return; }
    if (app.addMode === 'pen' && app.pen?.from) {
      if (e.key === 'Enter') { e.preventDefault(); penFinish(null); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); app.pen.via.pop(); render(); return; }
      if (e.key === 'Escape') { app.pen = null; render(); return; }
    }
    if (e.key === 'Escape') { app.addMode = false; app.lineDraft = null; app.joining = null; select(null); render(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && app.bend && pickedHandRun()?.hr.id === app.bend.id) { e.preventDefault(); removeBend(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && app.selection?.kind === 'outlet') { const id = app.selection.id; app.selection = null; edit('removeOutlet', { id }); }
  });
  route();
})();
