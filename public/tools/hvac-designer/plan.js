// The plan as Trust Trade Pro draws it (a port of PlanRenderer and PlanEditorView in the app): rooms tinted by zone,
// the builder's plan as linework, flex in its size colours with ribs, BDOs, zone motors, grilles, the fan coil and its
// plenum, the return, the outdoor unit and its pipes, and each room's label where it sits clear. Pan, zoom, tap to pick
// and drag to move.

export const T = {
  accent: '#F59E0B', accentSoft: '#FEF0D2', accentDeep: '#8A5A00', ink: '#0E1116', inkOn: '#FFFFFF', body: '#3B4250',
  muted: '#5B6170', faint: '#8A909B', tint: '#F1F2F5', tile: '#F5F6F8', hair: '#EEF0F3', line: '#E1E4E9',
  green: '#07664C', greenBg: '#E6F7F0', danger: '#C2412D', dangerBg: '#FDECE8', bg: '#F1F2F5', cool: '#3E6CF0',
  coolBg: '#EDF2FE', returnAir: '#3B4250', pipe: '#B0703A', ductLabel: '#1E3FA6', window: '#5FB3E6',
};
const ZONES = ['#3E6CF0', '#8B5CF6', '#0FA37A', '#E2683C', '#D9467A', '#0F9A9A', '#A16207', '#64748B'];
export const zoneColour = (n) => n === 0 ? '#4B5563' : ZONES[(Math.max(n, 1) - 1) % ZONES.length];
/// An outdoor unit's colour (its heads and pipes share it).
const SPLITS = ['#2B6CB0', '#B0703A', '#1B8A5A', '#8B5CF6', '#D9467A', '#0F9A9A'];
export const splitColour = (i) => SPLITS[Math.max(i, 0) % SPLITS.length];
export function ductColour(mm) {
  if (mm <= 150) return '#E0342F';
  if (mm <= 200) return '#6A8DDB';
  if (mm <= 250) return '#F0CB2E';
  if (mm <= 300) return '#7DC242';
  if (mm <= 350) return '#BFC4C9';
  if (mm <= 400) return '#D35FD0';
  return '#7B3FE4';
}
const ROOM_FILL = { bed: '#3E6CF0', wet: '#0F9A9A', util: '#8A909B', none: '#C6CBD3', other: '#5B6170' };
const roomFill = (r) => ROOM_FILL[r.designerType] ?? '#F59E0B';
/// System B on a two-system job (mock v14's green).
export const SYS_B = '#0FA37A';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/// Side-blow bar grilles (in a wall, or a bulkhead's face): drawn along their wall.
export const SIDE_STYLES = new Set(['sideWall', 'sideBulkhead']);

export function pointInPolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/// Flex as it's drawn: its insulated size (the bore and 50 mm of jacket) to scale, never thinner than a line you can see.
export const ductWidth = (mm, s) => Math.min(Math.max((mm + 50) / 1000 * s, 3), 30);

/// A window in its wall as a plan draws one: a frame across the wall, the glass down the middle; a glass door shows its
/// two panes side by side, as a slider. `on`: picked.
export function drawWindowMark(g, a, b, { door = false, s = 40, on = false } = {}) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 2) return;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, nx = -uy, ny = ux;
  const t = Math.min(Math.max(0.16 * s, 5), 12) / 2;
  const glass = '#2E86C1';
  g.save();
  g.beginPath();
  g.moveTo(a.x + nx * t, a.y + ny * t); g.lineTo(b.x + nx * t, b.y + ny * t);
  g.lineTo(b.x - nx * t, b.y - ny * t); g.lineTo(a.x - nx * t, a.y - ny * t); g.closePath();
  g.fillStyle = on ? T.accentSoft : '#fff'; g.fill();
  g.strokeStyle = on ? T.accentDeep : glass; g.lineWidth = on ? 2.2 : 1.2; g.stroke();
  g.strokeStyle = glass; g.lineWidth = 1.6; g.lineCap = 'butt';
  g.beginPath();
  if (door) {
    const o = t * 0.42, k = len * 0.56;
    g.moveTo(a.x + nx * o, a.y + ny * o); g.lineTo(a.x + ux * k + nx * o, a.y + uy * k + ny * o);
    g.moveTo(b.x - nx * o, b.y - ny * o); g.lineTo(b.x - ux * k - nx * o, b.y - uy * k - ny * o);
  } else {
    g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
  }
  g.stroke();
  g.restore();
}

/// A routed path with its grid steps taken out (Ramer–Douglas–Peucker, `eps` metres): the turns that matter.
function simplify(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let far = -1, fd = eps;
    for (let k = i + 1; k < j; k++) {
      const d = segDist(pts[k], pts[i], pts[j]);
      if (d > fd) { fd = d; far = k; }
    }
    if (far >= 0) { keep[far] = 1; stack.push([i, far], [far, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}

const unitVec = (v) => { const n = Math.hypot(v.x, v.y); return n > 1e-9 ? { x: v.x / n, y: v.y / n } : null; };

function segDist(p, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.y - a.y) * ey) / l2)) : 0;
  return Math.hypot(p.x - (a.x + ex * t), p.y - (a.y + ey * t));
}

/// The plan's linework from a plan image: dark ink with the paper see-through, as the app's `Store.planLines`.
export async function inkImage(blob) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
  const c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  g.drawImage(bmp, 0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    const a = Math.max(0, Math.min(1, (0.86 - l) / 0.6)) * (d[i + 3] / 255);
    d[i] = 40; d[i + 1] = 40; d[i + 2] = 46; d[i + 3] = Math.round(a * 255);
  }
  g.putImageData(img, 0, 0);
  return c.transferToImageBitmap();
}

/// Space held: a drag moves the plan whatever's under the pointer (as in drawing apps).
let spaceHeld = false;
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.target.closest?.('input, textarea, select, button, [contenteditable]')) return;
  spaceHeld = true;
  e.preventDefault();
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') spaceHeld = false; });
window.addEventListener('blur', () => { spaceHeld = false; });
export const spaceIsHeld = () => spaceHeld;

/// A drag that only moves the plan: the hand's on, Space is held, or it's the middle or right button.
export const movesOnly = (e, hand) => hand || spaceHeld || e.button === 1 || e.button === 2;

/// What a wheel turn does: a trackpad's two-finger scroll moves the plan; a pinch (it arrives as Ctrl + wheel), Ctrl
/// or ⌘ + wheel, or a mouse wheel zooms.
export function wheelMoves(e) {
  if (e.ctrlKey || e.metaKey) return false;
  const mouseWheel = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50);
  return !mouseWheel;
}

export const ZOOM_MAX = 12;

/// Flex comes in 6 m lengths: a run past that is joined, so it's flagged.
const LENGTH_M = 6;

function nearestOn(p, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.y - a.y) * ey) / l2)) : 0;
  return { x: a.x + ex * t, y: a.y + ey * t };
}

/// The point a fraction `f` of the way along a polyline (screen points).
function pointAlong(pts, f) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  if (!(len > 0)) return pts[0] ?? null;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + d >= len * f && d > 0) {
      const t = (len * f - acc) / d;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
    }
    acc += d;
  }
  return pts[pts.length - 1];
}

export class Plan {
  /// `on`: select(item|null), drop(item, pos), dragMove(item, pos), add(pos), changed() (zoom/pan).
  constructor(canvas, on = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.on = on;
    this.data = null;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.pointers = new Map();
    this.drag = null;
    this.hand = false;
    this.flow = 0;
    this.raf = 0;
    this.bind();
    new ResizeObserver(() => this.draw()).observe(canvas);
  }

  /// project, view (engine), layout (engine, may be null), air (engine, may be null), backdrop (ink ImageBitmap),
  /// selection, options {showPlan, allSizes, showAir, addMode, interactive, labels, compact, insetBottom}
  set(data) {
    this.data = { ...this.data, ...data };
    this.draw();
    const air = this.data.showAir && this.data.layout;
    if (air && !this.raf) this.animate();
  }

  fit() { this.zoom = 1; this.pan = { x: 0, y: 0 }; this.draw(); this.on.changed?.(); }

  /// Zoom by `k` about a point on the screen (the middle by default), keeping that point where it is.
  zoomBy(k, q = null) {
    if (!this.x) return;
    const c = q ?? { x: this.canvas.clientWidth / 2, y: (this.canvas.clientHeight - (this.data?.insetBottom ?? 0)) / 2 };
    const before = this.x.world(c);
    this.zoom = Math.min(Math.max(this.zoom * k, 0.6), ZOOM_MAX);
    const after = this.xform().pt(before);
    this.pan = { x: this.pan.x + c.x - after.x, y: this.pan.y + c.y - after.y };
    this.draw();
    this.on.changed?.();
  }

  panBy(dx, dy) {
    this.pan = { x: this.pan.x + dx, y: this.pan.y + dy };
    this.draw();
    this.on.changed?.();
  }

  /// The hand: every drag moves the plan, and nothing's picked or placed.
  setHand(on) {
    this.hand = on;
    this.canvas.style.cursor = on ? 'grab' : '';
  }

  animate() {
    const tick = (t) => {
      if (!(this.data?.showAir && this.data?.layout)) { this.raf = 0; return; }
      this.flow = t / 1000;
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  // MARK: Transform

  xform() { return this.xformAt(this.zoom, this.pan); }

  /// The zone cards are on: they sit outside the house, so the house is fitted with room round it for them.
  cardsOn() {
    const d = this.data, l = d?.layout;
    return !!l && !d.editor && !d.report && d.zoneCards !== false && d.labels !== false && (l.zones?.length ?? 0) >= 2;
  }

  xformAt(zoom, pan) {
    const v = this.data?.view;
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const b = this.data?.bounds ?? v?.bounds ?? [0, 0, 10, 10];
    const minX = b[0] - 1, minY = b[1] - 1, maxX = b[2] + 1, maxY = b[3] + 1;
    const bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
    const pad = this.cardsOn() ? 100 : 24, inset = this.data?.insetBottom ?? 0;
    const h = Math.max(H - inset, 100);
    const s = Math.max(Math.min((W - 2 * pad) / bw, (h - 2 * pad) / bh), 1) * zoom;
    const ox = (W - bw * s) / 2 + pan.x, oy = (h - bh * s) / 2 + pan.y;
    return {
      s, minX, maxY, ox, oy,
      pt: (p) => ({ x: ox + (p.x - minX) * s, y: oy + (maxY - p.y) * s }),
      world: (q) => ({ x: minX + (q.x - ox) / s, y: maxY - (q.y - oy) / s }),
    };
  }

  // MARK: Drawing

  draw() {
    // Whatever goes wrong drawing one part, the fan still goes where the fan coil is (or hides): it once stayed behind
    // on its own when the unit was moved (Jake, 19 Nov 2026: "when i move the the unit dispairs and the fan staye").
    try { this.drawScene(); } catch (e) { console.error('plan', e); this.fanAt = null; }
    this.placeFan();
  }

  /// One layer of the plan: if it fails, the rest still draws.
  guard(name, fn) { try { fn(); } catch (e) { console.error('plan: ' + name, e); } }

  /// The fan coil's fan: a spinning fan over the unit (a CSS animation on its own layer, so the plan isn't redrawn
  /// every frame); quicker with the airflow on. Hidden when there's no fan coil on the plan.
  placeFan() {
    const host = this.canvas.parentElement;
    if (!host || !this.canvas.isConnected) return;
    const f = this.fanAt;
    if (!f) { if (this.fanEl) this.fanEl.style.display = 'none'; return; }
    if (!this.fanEl) {
      this.fanEl = document.createElement('div');
      this.fanEl.className = 'fan-spin';
      this.fanEl.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2A2E33" stroke="#5B6168" stroke-width="1"/><g class="blades" fill="#C9CED4">'
        + [0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a} 12 12)" d="M12 12 C 11 8.2, 12.4 4.4, 14.6 3.6 C 15.6 6.4, 14.6 9.8, 12 12 Z"/>`).join('')
        + '</g><circle cx="12" cy="12" r="2.2" fill="#E9A21C"/></svg>';
      host.append(this.fanEl);
    }
    const e = this.fanEl;
    e.style.display = '';
    e.style.width = e.style.height = f.size + 'px';
    e.style.left = this.canvas.offsetLeft + f.x - f.size / 2 + 'px';
    e.style.top = this.canvas.offsetTop + f.y - f.size / 2 + 'px';
    e.classList.toggle('fast', !!this.data?.showAir);
  }

  drawScene() {
    this.hits = [];
    this.fanAt = null;
    const c = this.canvas, dpr = this.data?.dpr ?? (window.devicePixelRatio || 1);
    const W = c.clientWidth, H = c.clientHeight;
    if (!W || !H) return;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const g = this.ctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const d = this.data;
    if (!d?.view) return;
    const x = this.xform();
    this.x = x;
    const layout = d.layout;
    // The room editor draws its rooms as they're being dragged, and its handles over the top.
    const view = d.editor ? { ...d.view, rooms: d.editor.liveRooms() } : d.view;
    d.editor?.underlay(g, x);
    this.drawRooms(g, x, view, layout);
    // Two storeys: the upper floor's plan beside the ground floor's, each showing only its own floor (both floors can be
    // on one builder's sheet).
    // (The room editor shows the whole sheet: a room the reading missed can be anywhere on it.)
    const boxes = d.editor ? null : d.view.floorBoxes;
    if (d.showPlan !== false && d.backdrop && d.project?.backdrop) this.drawBackdrop(g, x, d.project.backdrop, d.backdrop, dpr, d.planAlpha, boxes?.[0]);
    if (d.showPlan !== false && d.upperBackdrop && d.project?.upperBackdrop) this.drawBackdrop(g, x, d.project.upperBackdrop, d.upperBackdrop, dpr, d.planAlpha, boxes?.[1]);
    if (d.showPlan !== false && d.topBackdrop && d.project?.topBackdrop) this.drawBackdrop(g, x, d.project.topBackdrop, d.topBackdrop, dpr, d.planAlpha, boxes?.[2]);
    if (!d.editor) this.drawOverlays(g, x, d.view);
    this.drawFloorLabels(g, x, d.view);
    if (d.gaps) this.drawGaps(g, x, d.gaps);
    this.drawWindows(g, x, view, d.editor?.pickedWindow?.());
    // Two ducted systems: the other one's ducts and vents, faint, behind the one being worked on (not tappable).
    if (d.ghost && !d.editor && !d.report) this.guard('other system', () => {
      g.save(); g.globalAlpha = 0.3;
      if (d.ghost.outdoor) this.drawPipes(g, x, d.ghost.unit, d.ghost.outdoor);
      this.drawDucts(g, x, d.ghost, { legSizes: false, flow: null });
      this.drawReportMarks(g, x, { ...d.ghost, outdoor: null });
      const u = x.pt(d.ghost.unit);
      g.beginPath(); g.roundRect(u.x - 12, u.y - 7, 24, 14, 3); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
      g.restore();
    });
    if (layout) {
      if (d.showAir && d.air) this.guard('throw', () => this.drawThrow(g, x, d.view, layout, d.air));
      if (layout.outdoor) this.guard('pipes', () => this.drawPipes(g, x, layout.unit, layout.outdoor));
      this.guard('ducts', () => this.drawDucts(g, x, layout, { legSizes: !!d.allSizes, flow: d.showAir ? this.flow : null }));
      const sel = d.selection;
      if (sel?.kind === 'feed') {
        const curves = this.curves(layout, x);
        layout.runs.forEach((r, i) => {
          if (r.keyBox !== sel.id) return;
          const w = ductWidth(r.sizeMM, x.s), pts = curves[i].map(x.pt);
          this.stroke(g, pts, T.accent, w + 7);
          this.stroke(g, pts, ductColour(r.sizeMM), w);
        });
      }
    }
    if (d.selection?.kind === 'room') {
      const r = d.view.rooms.find((r) => r.id === d.selection.id);
      if (r) { this.path(g, r.polygon.map(x.pt), true); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
    }
    // A split's heads: on a split job's own plan, or with the ducts on a two-system job's overview (`both`).
    const split = (!layout || d.both) && !d.editor ? d.split : null;
    if (split && d.splitAir !== false && !d.report) this.drawSplitAir(g, x, view, split, d);
    if (split) this.drawSplitPipes(g, x, split);
    const zoneCards = this.cardsOn();
    if (d.labels !== false) this.guard('labels', () => this.drawLabels(g, x, view, layout, d.compact !== false, zoneCards));
    if (split) this.drawSplitMarks(g, x, split, d);
    if (zoneCards && d.labels !== false) this.guard('zone cards', () => this.drawZoneCards(g, x, view, layout));
    if (layout && d.report) this.drawReportMarks(g, x, layout);
    else if (layout && !d.editor) this.guard('markers', () => this.drawMarkers(g, x, layout, d));
    if (!d.editor && (!split || layout)) this.guard('droppers', () => this.drawDroppers(g, x, d, !!d.report));
    if (!d.editor) this.guard('lines', () => this.drawLines(g, x, d));
    if (layout && d.penDraft && !d.editor) this.guard('pen', () => this.drawPenDraft(g, x, d.penDraft));
    d.editor?.overlay(g, x);
  }

  /// A duct drawn by hand, picked: a handle on each bend to drag (tap one to pick it), and a small + between each pair
  /// of points that makes a new bend where it's dragged to.
  drawBends(g, x, hb, drag) {
    const pts = [hb.start, ...hb.via, hb.end];
    const dragging = (kind, i) => drag?.active && drag.item?.kind === kind && drag.item.id === hb.id && drag.item.i === i;
    const drawn = hb.ri != null ? this.curves(this.data.layout, x)?.[hb.ri] : null;
    for (let k = 0; k < pts.length - 1; k++) {
      if (dragging('bendAdd', k)) continue;
      const a = x.pt(pts[k]), b = x.pt(pts[k + 1]);
      if (Math.hypot(b.x - a.x, b.y - a.y) < 34) continue;              // too short to fit one
      // On a straight-through duct the + sits on the duct as it's drawn (it sweeps off the fittings), halfway along.
      const m = pts.length === 2 && drawn ? (pointAlong(drawn.map(x.pt), 0.5) ?? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }) : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      g.beginPath(); g.arc(m.x, m.y, 5.5, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.92)'; g.fill();
      g.strokeStyle = T.ink; g.lineWidth = 1.2; g.setLineDash([2, 2]); g.stroke(); g.setLineDash([]);
      g.strokeStyle = T.ink; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(m.x - 2.5, m.y); g.lineTo(m.x + 2.5, m.y); g.moveTo(m.x, m.y - 2.5); g.lineTo(m.x, m.y + 2.5); g.stroke();
      this.hits.push({ item: { kind: 'bendAdd', id: hb.id, i: k }, x: m.x, y: m.y, r: 10 });
    }
    const handle = (c, picked) => {
      g.save(); g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 4; g.shadowOffsetY = 1;
      g.beginPath(); g.arc(c.x, c.y, 7, 0, Math.PI * 2); g.fillStyle = picked ? T.accent : '#fff'; g.fill(); g.restore();
      g.beginPath(); g.arc(c.x, c.y, 7, 0, Math.PI * 2); g.strokeStyle = T.ink; g.lineWidth = 2; g.stroke();
    };
    hb.via.forEach((p, i) => {
      const c = dragging('bend', i) ? drag.screen : x.pt(p);
      handle(c, hb.picked === i);
      this.hits.push({ item: { kind: 'bend', id: hb.id, i }, x: c.x, y: c.y, r: 12 });
    });
    for (let k = 0; k < pts.length - 1; k++) if (dragging('bendAdd', k)) handle(drag.screen, true);
  }

  /// The duct being drawn: from where it starts, through the bends tapped so far, to the mouse.
  drawPenDraft(g, x, pd) {
    const pts = [pd.start, ...pd.via, ...(this.penHover ? [this.penHover] : [])].filter(Boolean).map(x.pt);
    if (!pts.length) return;
    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(14,17,22,0.18)'; g.lineWidth = Math.max(8, 0.25 * x.s);
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
    g.strokeStyle = T.ink; g.lineWidth = 2; g.setLineDash([6, 5]);
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
    g.setLineDash([]);
    for (const [i, p] of pts.entries()) {
      if (i === pts.length - 1 && this.penHover) continue;
      g.beginPath(); g.arc(p.x, p.y, i === 0 ? 5 : 4, 0, Math.PI * 2); g.fillStyle = i === 0 ? T.accent : '#fff'; g.fill();
      g.strokeStyle = T.ink; g.lineWidth = 1.6; g.stroke();
    }
    // Its length so far.
    let m = 0;
    const w = [pd.start, ...pd.via, ...(this.penHover ? [this.penHover] : [])].filter(Boolean);
    for (let i = 1; i < w.length; i++) m += Math.hypot(w[i].x - w[i - 1].x, w[i].y - w[i - 1].y);
    if (m > 0.3) {
      const e = pts[pts.length - 1];
      this.tag(g, (Math.round(m * 10) / 10) + ' m', e.x + 18, e.y - 14, m > 6 ? T.danger ?? '#D93A2F' : T.ink);
    }
    g.restore();
  }

  path(g, pts, close) {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    if (close) g.closePath();
  }

  /// A line through the points; with `bend`, round each corner (flex sweeps round, it doesn't kink).
  stroke(g, pts, colour, w, cap = 'round', dash = null, bend = 0) {
    if (bend > 0 && pts.length > 2) {
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], p = pts[i], b = pts[i + 1];
        const r = Math.min(bend, Math.hypot(p.x - a.x, p.y - a.y) / 2, Math.hypot(b.x - p.x, b.y - p.y) / 2);
        if (r > 0.5) g.arcTo(p.x, p.y, b.x, b.y, r); else g.lineTo(p.x, p.y);
      }
      g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    } else this.path(g, pts, false);
    g.strokeStyle = colour; g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round';
    g.setLineDash(dash || []);
    g.stroke();
    g.setLineDash([]);
  }

  /// How round a run's bends are: a couple of its widths, or half a metre on a big plan.
  bend(w, s) { return Math.min(Math.max(w * 2.2, 0.55 * s), 70); }

  drawRooms(g, x, view, layout) {
    const zoneOf = {};
    for (const z of layout?.zones ?? []) for (const id of z.roomIds) zoneOf[id] = z.number;
    const closed = new Set((layout?.zones ?? []).filter((z) => !z.open).map((z) => z.number));
    for (const r of view.rooms) {
      if (r.polygon.length < 3) continue;
      const pts = r.polygon.map(x.pt);
      const z = zoneOf[r.id];
      // A two-system job: system B's rooms in B's own green, hatched, whatever the ducts' zones say.
      const onB = this.data?.splitRooms?.includes(r.id);
      const fill = onB ? (this.data?.hatch ?? SYS_B) : z !== undefined ? (closed.has(z) ? T.line : zoneColour(z)) : roomFill(r);
      this.path(g, pts, true);
      g.fillStyle = rgba(fill, onB ? 0.2 : layout && z !== undefined && !closed.has(z) ? 0.22 : 0.14); g.fill();
      if (onB) {
        g.save(); this.path(g, pts, true); g.clip();
        const bb = pts.reduce((b, q) => [Math.min(b[0], q.x), Math.min(b[1], q.y), Math.max(b[2], q.x), Math.max(b[3], q.y)], [Infinity, Infinity, -Infinity, -Infinity]);
        g.strokeStyle = rgba(this.data?.hatch ?? SYS_B, 0.28); g.lineWidth = 1;
        for (let k = bb[0] - (bb[3] - bb[1]); k < bb[2]; k += 9) { g.beginPath(); g.moveTo(k, bb[3]); g.lineTo(k + (bb[3] - bb[1]), bb[1]); g.stroke(); }
        g.restore();
        this.path(g, pts, true);
      }
      g.strokeStyle = rgba(T.ink, 0.55); g.lineWidth = 1.5; g.stroke();
    }
  }

  /// The windows and glass doors, over the plan image so they read as the drawing's own.
  drawWindows(g, x, view, picked) {
    for (const r of view.rooms) {
      (r.windows ?? []).forEach((w, k) => drawWindowMark(g, x.pt(w[0]), x.pt(w[1]), {
        door: (r.glass?.[k]?.height ?? 1.2) >= 2, s: x.s, on: picked?.room === r.id && picked.n === k,
      }));
    }
  }

  drawBackdrop(g, x, b, image, dpr, alpha, clip) {
    g.save();
    if (clip?.length === 4) {
      const m = 1.5, a = x.pt({ x: clip[0] - m, y: clip[3] + m }), c = x.pt({ x: clip[2] + m, y: clip[1] - m });
      g.beginPath(); g.rect(a.x, a.y, c.x - a.x, c.y - a.y); g.clip();
    }
    g.globalAlpha = alpha ?? 0.6;
    g.setTransform(dpr * b.across.x * x.s, dpr * -b.across.y * x.s, dpr * b.down.x * x.s, dpr * -b.down.y * x.s,
      dpr * (x.ox + (b.origin.x - x.minX) * x.s), dpr * (x.oy + (x.maxY - b.origin.y) * x.s));
    g.imageSmoothingQuality = 'high';
    g.drawImage(image, 0, 0, 1, 1);
    g.restore();
  }

  drawGaps(g, x, gaps) {
    for (const gap of gaps) {
      this.path(g, gap.polygon.map(x.pt), true);
      const on = gap.on;
      g.fillStyle = on ? rgba(T.accent, 0.28) : rgba(T.faint, 0.12);
      g.fill();
      g.setLineDash([5, 4]);
      g.strokeStyle = on ? T.accentDeep : T.faint; g.lineWidth = 1.5; g.stroke();
      g.setLineDash([]);
    }
  }

  drawThrow(g, x, view, layout, air) {
    const byId = Object.fromEntries(air.outlets.map((a) => [a.id, a]));
    for (const o of layout.outlets) {
      const a = byId[o.id], room = view.rooms.find((r) => r.id === o.roomId);
      if (!o.open || !a || !room) continue;
      const c = x.pt(o.pos), r = a.throwM * x.s;
      const colour = a.coverage === 'good' ? T.green : T.accent;
      g.save();
      this.path(g, room.polygon.map(x.pt), true);
      g.clip();
      const grad = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(r, 1));
      grad.addColorStop(0, rgba(colour, 0.26)); grad.addColorStop(1, rgba(colour, 0.03));
      g.beginPath(); g.arc(c.x, c.y, r, 0, Math.PI * 2);
      g.fillStyle = grad; g.fill();
      g.setLineDash([5, 4]); g.strokeStyle = rgba(colour, 0.7); g.lineWidth = 1.2; g.stroke(); g.setLineDash([]);
      g.restore();
    }
  }

  drawPipes(g, x, unit, outdoor) {
    const [point, , condenser] = outdoor;
    this.stroke(g, [x.pt(unit), x.pt(point), x.pt(condenser)], T.pipe, 2.5, 'round', [6, 4]);
  }

  /// Flex as it lies, as a duct layout drawing has it (Jake, 15 Oct: "I like how the ducts curve on their drawing"):
  /// each run's routed path smoothed into sweeping curves — out of a BDO the way its leg points, off the plenum square
  /// to it, into a BDO along its inlet. World points per run, worked out once per layout.
  /// Where each duct meets its fittings, as they're drawn at this zoom (Jake, 19 Nov 2026: "make the duct join on to
  /// the end of the bdo not the middle"): the end of a BDO arm's spigot, the BDO's feed spigot, a spigot on the fan
  /// coil's supply transition, or one on its return box — with the way the air goes through it there.
  fittingEnds(l, x) {
    const start = {}, end = {};
    const wd = (v) => ({ x: v.x, y: -v.y });                              // screen direction → plan
    for (const b of l.boxes) {
      const G = this.bdoGeom(x.pt(b.pos), b, x);
      G.legs.forEach((L) => { const ri = b.legRuns?.[L.k]; if (ri != null) start[ri] = { p: x.world(L.end), t: wd(L.dir) }; });
      if (b.inlet != null && b.inlet >= 0) {
        const a = { x: Math.cos(G.ang), y: Math.sin(G.ang) }, back = G.len / 2 + G.dIn * 0.55;
        end[b.inlet] = { p: x.world({ x: G.c.x - a.x * back, y: G.c.y - a.y * back }), t: wd(a) };
      }
    }
    const T = this.unitGeom(l, x);
    for (const sp of T.supply) start[sp.ri] = { p: x.world(sp.end), t: wd(sp.dir) };
    for (const sp of T.ret) end[sp.ri] = { p: x.world(sp.end), t: wd({ x: -sp.dir.x, y: -sp.dir.y }) };
    return { start, end };
  }

  curves(l, x) {
    const sc = x?.s ?? 0;
    // Kept per layout (two ducted systems draw two), until the scale changes.
    const hit = (this._curves ??= new WeakMap()).get(l);
    if (hit?.s === sc) return hit.c;
    const fe = x ? this.fittingEnds(l, x) : { start: {}, end: {} };
    const c = l.runs.map((r, i) => {
      let pts = simplify(r.path, 0.12);
      if (pts.length < 2) return r.path;
      const S = fe.start[i], E = fe.end[i];
      // Onto the spigots' ends: drop any corner the router left inside the fitting, so the flex leaves straight on.
      const near = (p, o, f) => Math.hypot(p.x - o.x, p.y - o.y) < Math.max(0.45, Math.hypot(f.x - o.x, f.y - o.y) + 0.12);
      if (S) { const o = pts[0]; pts = pts.slice(1).filter((p, k, arr) => k === arr.length - 1 || !near(p, o, S.p)); pts.unshift(S.p); }
      if (E) { const o = pts[pts.length - 1]; pts = pts.slice(0, -1).filter((p, k) => k === 0 || !near(p, o, E.p)); pts.push(E.p); }
      const n = pts.length;
      if (n < 2) return r.path;
      const first = unitVec({ x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y }) ?? { x: 1, y: 0 };
      const last = unitVec({ x: pts[n - 1].x - pts[n - 2].x, y: pts[n - 1].y - pts[n - 2].y }) ?? first;
      let t0 = S ? S.t : first;
      let tN = E ? E.t : last;
      if (r.kind === 'return' && !S) {
        // Return flex lies in a lazy S off the filter box, into its spigot on the fan coil's return box.
        const chord = unitVec({ x: pts[n - 1].x - pts[0].x, y: pts[n - 1].y - pts[0].y }) ?? first;
        const turn = chord.x * tN.y - chord.y * tN.x;
        const rot = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
        t0 = rot(chord, Math.abs(turn) < 0.15 ? 0.34 : -Math.sign(turn) * 0.3);
      }
      const tan = pts.map((p, k) => (k === 0 ? t0 : k === n - 1 ? tN
        : unitVec({ x: pts[k + 1].x - pts[k - 1].x, y: pts[k + 1].y - pts[k - 1].y }) ?? first));
      const out = [pts[0]];
      for (let k = 0; k < n - 1; k++) {
        const a = pts[k], b = pts[k + 1], d = Math.hypot(b.x - a.x, b.y - a.y) * ((k === 0 && S) || (k === n - 2 && E) ? 0.48 : 0.38);
        const c1 = { x: a.x + tan[k].x * d, y: a.y + tan[k].y * d }, c2 = { x: b.x - tan[k + 1].x * d, y: b.y - tan[k + 1].y * d };
        const steps = Math.max(4, Math.min(18, Math.ceil(d / 0.1)));
        for (let st = 1; st <= steps; st++) {
          const t = st / steps, u = 1 - t;
          out.push({ x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
            y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y });
        }
      }
      return out;
    });
    this._curves.set(l, { s: sc, c });
    return c;
  }

  drawDucts(g, x, l, { legSizes, flow }) {
    const curves = this.curves(l, x);
    const runs = l.runs.map((r, i) => ({ r, i })).sort((a, b) => (a.r.kind === 'return' ? 0 : 1) - (b.r.kind === 'return' ? 0 : 1));
    for (const { r, i } of runs) {
      const pts = curves[i].map(x.pt);
      const w = ductWidth(r.sizeMM, x.s), bend = 0;
      const alpha = r.open ? 1 : 0.3;
      // Over 6 m: more than a length of flex — a red glow along it (and its length on it, below).
      if (r.length > LENGTH_M) this.stroke(g, pts, rgba(T.danger, 0.4), w + 9);
      this.stroke(g, pts, `rgba(255,255,255,${alpha})`, w + 2.5, 'round', null, bend);
      this.stroke(g, pts, rgba(ductColour(r.sizeMM), alpha), w, 'round', null, bend);
      if (w >= 4) {
        this.stroke(g, pts, `rgba(0,0,0,${0.13 * alpha})`, w, 'butt', [1.1, Math.max(2.2, w * 0.32)], bend);
        this.stroke(g, pts, `rgba(255,255,255,${0.28 * alpha})`, w * 0.3, 'round', null, bend);
      }
    }
    // Sizes: a little off the duct near the middle of each run (only trunks and BDO feeds unless asked).
    this.sizeSpots = [];
    const ra = x.pt(l.returnGrille);
    const placed = [{ x: ra.x, y: ra.y + 22 }, { x: ra.x - 18, y: ra.y + 22 }, { x: ra.x + 18, y: ra.y + 22 }, x.pt(l.unit),
      ...l.outlets.map((o) => x.pt(o.pos)), ...l.boxes.map((b) => x.pt(b.pos))];
    // A run over 6 m has its length on it, in red, halfway along.
    const longTags = [];
    l.runs.forEach((r, i) => {
      if (!(r.length > LENGTH_M)) return;
      const at = pointAlong(curves[i].map(x.pt), 0.5);
      if (!at) return;
      longTags.push({ at, text: `${r.length.toFixed(1)} m` });
      placed.push(at, { x: at.x - 18, y: at.y }, { x: at.x + 18, y: at.y });
      this.sizeSpots.push(at);
    });
    g.font = `700 10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [i, r] of l.runs.entries()) {
      if (!(legSizes || r.outlet == null)) continue;
      const pts = curves[i].map(x.pt);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (len <= 55 || pts.length < 2) continue;
      // Near the middle, else a little either way or the other side of the duct: wherever it's clear of the others.
      const spot = (f, side) => {
        let acc = 0;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i], dd = Math.hypot(b.x - a.x, b.y - a.y);
          if (acc + dd >= len * f && dd > 0) {
            const t = (len * f - acc) / dd, off = (ductWidth(r.sizeMM, x.s) / 2 + 8) * side;
            return { x: a.x + (b.x - a.x) * t - (b.y - a.y) / dd * off, y: a.y + (b.y - a.y) * t + (b.x - a.x) / dd * off };
          }
          acc += dd;
        }
        return null;
      };
      let at = null;
      for (const f of [0.5, 0.38, 0.62, 0.28, 0.72]) {
        for (const side of [1, -1]) {
          const c = spot(f, side);
          if (c && !placed.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < 30)) { at = c; break; }
        }
        if (at) break;
      }
      if (!at) continue;
      placed.push(at);
      this.sizeSpots.push(at);
      // With the speeds on: "ø200 · 2.8", red past the class's limit for a branch, a trunk or the return.
      const lim = this.data?.speeds, sp = lim && r.sizeMM ? r.lps / 1000 / (Math.PI * (r.sizeMM / 2000) ** 2) : null;
      // A leg to a vent is judged by what the vent takes (L/s); a trunk, a feed or the return by the class's limit.
      const tol = lim?.tol ?? 1.12, ventCap = r.outlet != null ? lim?.ventCap?.[r.sizeMM] : null;
      const cap = lim ? (r.kind === 'trunk' ? lim.trunk : r.kind === 'return' ? lim.ret : lim.branch) : null;
      const over = sp != null && (ventCap != null ? r.lps > ventCap * tol + 0.5 : cap != null && sp > cap * tol + 0.01);
      const text = 'ø' + r.sizeMM + (sp != null && r.open ? ' · ' + sp.toFixed(1) : ''), tw = g.measureText(text).width;
      g.fillStyle = over ? T.danger : `rgba(255,255,255,${r.open ? 0.8 : 0.4})`;
      g.beginPath(); g.roundRect(at.x - tw / 2 - 2.5, at.y - 6.5, tw + 5, 13, 3); g.fill();
      g.fillStyle = over ? '#fff' : rgba(T.ductLabel, r.open ? 1 : 0.4);
      g.fillText(text, at.x, at.y);
    }
    for (const t of longTags) {
      g.font = `800 10px ${FONT}`;
      const tw = g.measureText(t.text).width + 10;
      g.beginPath(); g.roundRect(t.at.x - tw / 2, t.at.y - 7.5, tw, 15, 7.5); g.fillStyle = T.danger; g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.text, t.at.x, t.at.y + 0.5);
    }
    // Moving dots along each open run (supply out, return back).
    if (flow != null) {
      g.fillStyle = '#fff';
      for (const [ri, r] of l.runs.entries()) {
        if (!r.open) continue;
        const pts = curves[ri].map(x.pt), segs = [0];
        for (let i = 1; i < pts.length; i++) segs.push(segs[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
        const total = segs[segs.length - 1];
        if (!(total > 4)) continue;
        const spacing = 22, speed = r.kind === 'return' ? 30 : 55;
        for (let dd = (flow * speed) % spacing; dd < total; dd += spacing) {
          const along = r.kind === 'return' ? total - dd : dd;
          let i = 1;
          while (i < segs.length - 1 && segs[i] < along) i++;
          const t = (along - segs[i - 1]) / Math.max(segs[i] - segs[i - 1], 0.001);
          g.beginPath();
          g.arc(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    // BDOs: Multisnap fittings, the feed's spigot in and one for each leg. Drawn first: the zone dampers sit on their ends.
    for (const b of l.boxes) this.drawBdo(g, x.pt(b.pos), b, x);
    // Zone dampers, each on its leg as it is in the roof.
    for (const dm of l.dampers) {
      // On the end of the BDO the zone's leg leaves (Jake, 19 Nov 2026: "the zone should be on the end of the BDO"),
      // else (off the fan coil's collar) on the duct as it's drawn: the curve can sit a little off the routed line.
      const dw = ductWidth(dm.sizeMM, x.s), L = Math.max(dw * 1.15, 5);
      let c = x.pt(dm.pos), dir = { x: dm.dir.x, y: -dm.dir.y }, onBox = false;
      let ri = -1, rBest = Infinity;
      l.runs.forEach((r, i) => {
        if (r.damperZone !== dm.zone) return;
        const dd = Math.min(...r.path.map((p) => Math.hypot(p.x - dm.pos.x, p.y - dm.pos.y)));
        if (dd < rBest) { rBest = dd; ri = i; }
      });
      const into = ri >= 0 ? l.boxes.find((bx) => bx.inlet === ri) : null;
      const box = ri >= 0 && !into ? l.boxes.find((bx) => bx.legRuns?.includes(ri)) : null;
      if (into) {
        // The zone's own BDO (Jake, 19 Nov 2026: "the zone should be on the back of the BDO"): on its feed's spigot.
        const G = this.bdoGeom(x.pt(into.pos), into, x), a = { x: Math.cos(G.ang), y: Math.sin(G.ang) };
        const back = G.len / 2 + G.dIn * 0.55;
        dir = a; c = { x: G.c.x - a.x * (back + L / 2 - 0.5), y: G.c.y - a.y * (back + L / 2 - 0.5) }; onBox = true;
      } else if (box) {
        const leg = this.bdoGeom(x.pt(box.pos), box, x).legs[box.legRuns.indexOf(ri)];
        if (leg) { dir = leg.dir; c = { x: leg.end.x + dir.x * (L / 2 - 0.5), y: leg.end.y + dir.y * (L / 2 - 0.5) }; onBox = true; }
      } else if (ri >= 0 && l.runs[ri].parent == null) {
        // Straight off the fan coil: on the end of its spigot on the transition.
        const sp = this.unitGeom(l, x).supply.find((q) => q.ri === ri);
        if (sp) { dir = sp.dir; c = { x: sp.end.x + dir.x * (L / 2 - 0.5), y: sp.end.y + dir.y * (L / 2 - 0.5) }; onBox = true; }
      }
      if (!onBox) {
        let bestD = 1.2 * x.s;
        for (const cv of curves) {
          for (let k = 1; k < cv.length; k++) {
            const a = x.pt(cv[k - 1]), b = x.pt(cv[k]), d = segDist(x.pt(dm.pos), a, b);
            if (d < bestD) { bestD = d; c = nearestOn(x.pt(dm.pos), a, b); dir = unitVec({ x: b.x - a.x, y: b.y - a.y }) ?? dir; }
          }
        }
      }
      // A motorised zone damper as it is (Jake, 19 Nov 2026: "a zone needs to look real", then "make the zone black like
      // the bdo with a orange blade"): a black sleeve like the Multisnap fittings, its orange blade (along the duct open,
      // across it shut), and the motor on its side in the zone's colour with the zone's number (red with a cross when shut).
      const n = { x: -dir.y, y: dir.x }, ang = Math.atan2(dir.y, dir.x);
      const w = dw * 1.18 + 1, lw = Math.min(Math.max(dw * 0.07, 0.6), 1.2), bead = Math.min(L * 0.18, 2.5);
      g.save(); g.translate(c.x, c.y); g.rotate(ang);
      g.shadowColor = 'rgba(0,0,0,0.22)'; g.shadowBlur = Math.min(dw * 0.25, 3); g.shadowOffsetY = 1;
      const sl = g.createLinearGradient(0, -w / 2, 0, w / 2);
      sl.addColorStop(0, '#565C63'); sl.addColorStop(0.32, '#2E3237'); sl.addColorStop(1, '#121417');
      g.beginPath(); g.roundRect(-L / 2, -w / 2, L, w, 2); g.fillStyle = sl; g.fill();
      g.shadowColor = 'transparent';
      g.strokeStyle = '#0C0E10'; g.lineWidth = lw; g.stroke();
      g.strokeStyle = 'rgba(160,168,176,0.5)'; g.lineWidth = lw * 0.8;    // the snap beads at each end
      g.beginPath(); g.moveTo(-L / 2 + bead, -w / 2); g.lineTo(-L / 2 + bead, w / 2); g.moveTo(L / 2 - bead, -w / 2); g.lineTo(L / 2 - bead, w / 2); g.stroke();
      g.strokeStyle = '#F7931E'; g.lineWidth = Math.max(lw * 2, 1.1); g.lineCap = 'round';    // the orange blade on its shaft
      g.beginPath();
      if (dm.open) { g.moveTo(-L / 2 + bead * 1.8, 0); g.lineTo(L / 2 - bead * 1.8, 0); } else { g.moveTo(0, -w / 2 + lw); g.lineTo(0, w / 2 - lw); }
      g.stroke();
      // The motor bolted flush to the sleeve's side, square to the duct; its number stays upright.
      const mw = Math.min(Math.max(dw * 0.95, 5), 18), mh = mw * 0.74, my = -w / 2 - mh + 0.5;
      const tone = dm.open ? zoneColour(dm.zone) : T.danger, label = dm.open ? String(dm.zone) : '✕';
      g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = Math.min(dw * 0.25, 3); g.shadowOffsetY = 1;
      g.beginPath(); g.roundRect(-mw / 2, my, mw, mh, Math.min(mh * 0.25, 2.5)); g.fillStyle = tone; g.fill();
      g.shadowColor = 'transparent';
      g.strokeStyle = '#1E2227'; g.lineWidth = lw; g.stroke();
      g.restore();
      const fs = mh * 0.82;
      if (fs >= 5) {
        const mc = { x: c.x - n.x * (w / 2 + mh / 2 - 0.5), y: c.y - n.y * (w / 2 + mh / 2 - 0.5) };
        g.font = `900 ${fs.toFixed(1)}px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(label, mc.x, mc.y + 0.5);
      }
    }
    // Drawn by hand but not fed from the fan coil (its feed was taken out): dashed, faint.
    for (const r of l.looseRuns ?? []) {
      const pts = r.path.map(x.pt);
      g.save(); g.setLineDash([6, 5]); g.strokeStyle = 'rgba(14,17,22,0.45)'; g.lineWidth = 2.5; g.lineCap = 'round';
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); g.restore();
    }
    for (const b of l.looseBoxes ?? []) {
      g.save(); g.globalAlpha = 0.5; this.drawBdo(g, x.pt(b.pos), { axis: { x: 1, y: 0 }, legDirs: [] }, x); g.restore();
    }
  }

  /// A BDO as the Multisnap fitting it is (Jake, 19 Nov 2026: "they bdo dont look like the multi snap ones", then "the 2
  /// way bdo still looks wrong vs how they are in real life"): the Double Branch Take Off — a short black foam body that
  /// flares from its feed collar into a Y, the branch collars moulded onto its shoulders at 45°, and the straight collar
  /// out of its front between them (capped when nothing carries straight on). Every collar is the size of its duct and
  /// it's all sized off the ducts as they're drawn, so it zooms with them. No label: the fitting says what it is.
  bdoGeom(c, b, x) {
    const D = ductWidth(b.inletMM ?? 250, x.s), dIn = D, ang = Math.atan2(-(b.axis?.y ?? 0), b.axis?.x ?? 1);
    const len = D * 1.2, wid = D * 1.1;                     // the body's back face sits len/2 behind the middle
    const cs = Math.cos(ang), sn = Math.sin(ang), front = D * 0.8;
    const toS = (lx, ly) => ({ x: c.x + lx * cs - ly * sn, y: c.y + lx * sn + ly * cs });
    const relOf = (d) => { const wx = d.x, wy = -d.y; return Math.atan2(-wx * sn + wy * cs, wx * cs + wy * sn); };
    // A 2-way (nothing straight on) is the Y with a V between its arms, so its arms sit a little wider on the shoulders.
    const yWay = (b.legDirs ?? []).length > 0 && !(b.legDirs ?? []).some((d) => Math.abs(relOf(d)) < 0.2);
    const hub = yWay ? -D * 0.3 : -D * 0.2;
    const legs = (b.legDirs ?? []).map((d, k) => {
      const wx = d.x, wy = -d.y, lx = wx * cs + wy * sn, ly = -wx * sn + wy * cs;     // in the body's own frame
      const dL = ductWidth(b.legMM?.[k] ?? 200, x.s), rel = Math.atan2(ly, lx);
      const straight = Math.abs(rel) < 0.2;
      // Where its collar leaves the body (local): the straight one off the front face, a branch off its shoulder.
      const rr = straight ? 0 : yWay ? D * 0.8 : D * 0.62 + D * 0.38 * Math.max(0, 1 - Math.abs(rel) / 0.79);
      const base = straight ? { x: front, y: 0 } : { x: hub + Math.cos(rel) * rr, y: Math.sin(rel) * rr };
      const spig = Math.max(dL * 0.6, 3), dl = { x: Math.cos(rel), y: Math.sin(rel) };
      const tip = { x: base.x + dl.x * spig, y: base.y + dl.y * spig };
      return { k, lx, ly, rel, dL, straight, base, spig, end: toS(tip.x, tip.y), dir: { x: wx, y: wy } };
    });
    return { c, ang, len, wid, dIn, hub, front, yWay, legs };
  }
  /// The fan coil and its fittings at this zoom, in screen space: its size, how it's turned, the supply transition's
  /// shape and spigots (Jake, 19 Nov 2026: "flat on the supply and then 45 degrees on the side with the pop on the sides
  /// of the 45 and the flat at the end with the airflow to go straight"; a 2-way is a Y off the two 45s with the end
  /// capped) and the flat return box on its back with a spigot for each return duct. Each spigot knows its run.
  unitGeom(l, x, c = x.pt(l.unit)) {
    const depth = Math.max(0.7 * x.s, 16), width = Math.max(1.6 * x.s, 46), turn = -Math.atan2(l.unitDir.y, l.unitDir.x);
    const cs = Math.cos(turn), sn = Math.sin(turn);
    const toS = (p) => ({ x: c.x + p.x * cs - p.y * sn, y: c.y + p.x * sn + p.y * cs });
    const dirS = (v) => ({ x: v.x * cs - v.y * sn, y: v.x * sn + v.y * cs });
    const toL = (p) => { const s0 = x.pt(p), dx = s0.x - c.x, dy = s0.y - c.y; return { x: dx * cs + dy * sn, y: -dx * sn + dy * cs }; };
    const W = width - 4, x0 = depth / 2 - 0.5, dT = Math.min(Math.max(0.36 * x.s, 11), W * 0.34), fw = W / 2 - dT;
    // Supply: the runs straight off the unit, in the order they sit along it.
    const sup = l.runs.map((r, ri) => ({ r, ri })).filter(({ r }) => r.parent == null && r.kind !== 'return' && r.path.length > 1)
      .map((o) => ({ ...o, y: toL(o.r.path[0]).y })).sort((a, b) => a.y - b.y);
    const n = sup.length, r2 = Math.SQRT1_2;
    const side = (sgn) => ({ base: { x: x0 + dT / 2, y: sgn * (W / 2 - dT / 2) }, dir: { x: r2, y: sgn * r2 } });
    // No supply ducts yet (a new job) gives no slots: the bare unit still draws and ducts can be added.
    const fronts = n === 1 ? 1 : Math.max(n - 2, 0);
    const slots = n === 0 ? [] : n === 1 ? [null] : [side(-1), ...Array(fronts).fill(null), side(1)];
    let fk = 0;
    const supply = sup.map((o, k) => {
      const w = Math.min(ductWidth(o.r.sizeMM, x.s), slots[k] ? dT * 1.3 : (2 * fw) / Math.max(fronts, 1) - 2);
      const sl = slots[k] ?? { base: { x: x0 + dT, y: -fw + (fk++ + 0.5) * (2 * fw / Math.max(fronts, 1)) }, dir: { x: 1, y: 0 } };
      const len = Math.max(w * 0.55, 4), endL = { x: sl.base.x + sl.dir.x * len, y: sl.base.y + sl.dir.y * len };
      return { ri: o.ri, w, len, baseL: sl.base, dirL: sl.dir, end: toS(endL), dir: dirS(sl.dir) };
    });
    // Return: a flat box on the back, a spigot per return duct, spread along it.
    const rets = l.runs.map((r, ri) => ({ r, ri })).filter(({ r }) => r.kind === 'return' && r.path.length > 1)
      .map((o) => ({ ...o, y: toL(o.r.path[o.r.path.length - 1]).y })).sort((a, b) => a.y - b.y);
    const rbT = Math.max(0.16 * x.s, 6), rws = rets.map((o) => ductWidth(o.r.sizeMM, x.s));
    const span = Math.min(W, Math.max(W * 0.6, rws.reduce((a, b) => a + b, 0) + 6 * (rets.length + 1)));
    const rb = { x1: -depth / 2 + 0.5, x0: -depth / 2 + 0.5 - rbT, half: span / 2 };
    const ret = rets.map((o, k) => {
      const w = Math.min(rws[k], span / rets.length - 4), y = -span / 2 + (k + 0.5) * (span / rets.length);
      const len = Math.max(w * 0.45, 4), base = { x: rb.x0, y }, endL = { x: rb.x0 - len, y };
      return { ri: o.ri, w, len, baseL: base, dirL: { x: -1, y: 0 }, end: toS(endL), dir: dirS({ x: -1, y: 0 }) };
    });
    return { c, turn, depth, width, W, x0, dT, fw, supply, ret, rb };
  }

  /// Draws the supply transition and the return box in the unit's turned frame (already translated and rotated).
  drawUnitFittings(g, U) {
    const edge = '#5B636C', { x0, dT, fw, W } = U;
    const galv = (y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#EEF1F4'); gr.addColorStop(0.5, '#C9CFD6'); gr.addColorStop(1, '#A6ADB6'); return gr; };
    const spigot = (sp) => {
      g.save(); g.translate(sp.baseL.x, sp.baseL.y); g.rotate(Math.atan2(sp.dirL.y, sp.dirL.x));
      g.beginPath(); g.rect(-1, -sp.w / 2, sp.len + 1, sp.w); g.fillStyle = galv(-sp.w / 2, sp.w / 2); g.fill();
      g.strokeStyle = edge; g.lineWidth = 0.9; g.stroke();
      g.strokeStyle = 'rgba(70,78,88,0.6)'; g.beginPath(); g.moveTo(sp.len * 0.6, -sp.w / 2); g.lineTo(sp.len * 0.6, sp.w / 2); g.stroke();
      g.restore();
    };
    // Supply transition: flat on the unit, 45° sides, flat end.
    const gr = g.createLinearGradient(x0, 0, x0 + dT, 0);
    gr.addColorStop(0, '#C9CFD6'); gr.addColorStop(0.5, '#E6EAEE'); gr.addColorStop(1, '#C2C8CF');
    g.beginPath(); g.moveTo(x0, -W / 2); g.lineTo(x0 + dT, -fw); g.lineTo(x0 + dT, fw); g.lineTo(x0, W / 2); g.closePath();
    g.fillStyle = gr; g.fill(); g.strokeStyle = edge; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(90,98,108,0.35)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x0 + 1.5, -W / 2 + 3); g.lineTo(x0 + dT - 1.5, -fw + 1); g.moveTo(x0 + 1.5, W / 2 - 3); g.lineTo(x0 + dT - 1.5, fw - 1); g.stroke();
    U.supply.forEach(spigot);
    // Return box: flat, on the back.
    const { rb } = U;
    g.beginPath(); g.rect(rb.x0, -rb.half, rb.x1 - rb.x0, rb.half * 2); g.fillStyle = galv(-rb.half, rb.half); g.fill();
    g.strokeStyle = edge; g.lineWidth = 1; g.stroke();
    U.ret.forEach(spigot);
  }

  bdoSize(x, b = {}) { const d = ductWidth(b.inletMM ?? 250, x.s); return { len: d * 2.4, wid: d * 1.9 }; }
  drawBdo(g, c, b, x) {
    const G = this.bdoGeom(c, b, x), { len, dIn: D, front } = G, ink = '#0C0E10';
    const lw = Math.min(Math.max(D * 0.07, 0.6), 1.4), back = len / 2;
    const shade = (w) => {
      const gr = g.createLinearGradient(0, -w / 2, 0, w / 2);
      gr.addColorStop(0, '#4E545B'); gr.addColorStop(0.35, '#2A2E33'); gr.addColorStop(1, '#131518');
      return gr;
    };
    // A snap collar, drawn along +x from 0 to l: a round tube with the beads the flex is strapped over.
    const collar = (w, l) => {
      g.beginPath(); g.rect(0, -w / 2, l, w); g.fillStyle = shade(w); g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
      g.strokeStyle = 'rgba(160,168,176,0.55)'; g.lineWidth = lw; g.beginPath();
      for (const f of [0.28, 0.58, 0.86]) { g.moveTo(l * f, -w / 2 + lw); g.lineTo(l * f, w / 2 - lw); }
      g.stroke();
      // the lip where it comes out of the foam
      g.beginPath(); g.rect(-0.5, -w / 2 - lw * 1.2, Math.max(l * 0.12, 1.2), w + lw * 2.4); g.fillStyle = '#1B1E22'; g.fill();
    };
    g.save(); g.translate(c.x, c.y); g.rotate(G.ang);
    // The foam body: the hull of its back face, each collar's root and the front face — a short Y, as the fitting is.
    const hasStraight = G.legs.some((L) => L.straight);
    const pts = [{ x: -back, y: -D * 0.56 }, { x: -back, y: D * 0.56 }];
    if (hasStraight) { const fw = Math.max(...G.legs.filter((L) => L.straight).map((L) => L.dL)); pts.push({ x: front, y: -fw * 0.56 }, { x: front, y: fw * 0.56 }); }
    else if (!G.legs.length) pts.push({ x: front, y: -D * 0.5 }, { x: front, y: D * 0.5 });
    for (const L of G.legs) {
      if (L.straight) continue;
      const nx = -Math.sin(L.rel), ny = Math.cos(L.rel), h = L.dL * 0.58;
      pts.push({ x: L.base.x + nx * h, y: L.base.y + ny * h }, { x: L.base.x - nx * h, y: L.base.y - ny * h });
    }
    let hull = convexHull(pts);
    if (G.yWay) {
      // The 2-way's front (Jake, 19 Nov 2026: "remove the end cap and almost make the end a v in"): the edge between its
      // arms dips in to a V, the crotch of the Y.
      const k = hull.findIndex((p, i) => { const q = hull[(i + 1) % hull.length]; return p.x > 0 && q.x > 0 && Math.sign(p.y) !== Math.sign(q.y); });
      if (k >= 0) {
        const p = hull[k], q = hull[(k + 1) % hull.length], tipX = Math.min(p.x, q.x) - Math.abs(p.y - q.y) * 0.55;
        hull = [...hull.slice(0, k + 1), { x: Math.max(tipX, G.hub + D * 0.15), y: 0 }, ...hull.slice(k + 1)];
      }
    }
    g.shadowColor = 'rgba(10,10,10,0.25)'; g.shadowBlur = Math.min(D * 0.3, 5); g.shadowOffsetY = 1;
    g.beginPath(); hull.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
    const by = Math.max(...hull.map((p) => Math.abs(p.y)));
    const gr = g.createLinearGradient(0, -by, 0, by);
    gr.addColorStop(0, '#585E65'); gr.addColorStop(0.32, '#2F3338'); gr.addColorStop(1, '#121417');
    g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
    g.lineJoin = 'round'; g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.stroke();
    // The moulding: the seam down its middle with the snap clips, and the light along its top.
    g.save(); g.clip();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = lw; g.beginPath(); g.moveTo(-back, 0); g.lineTo(G.yWay ? G.hub + D * 0.15 : front, 0); g.stroke();
    g.fillStyle = 'rgba(150,158,166,0.5)';
    for (const f of [0.15, 0.45, 0.75]) { const cx = -back + ((G.yWay ? G.hub + D * 0.15 : front) + back) * f; g.fillRect(cx - D * 0.05, -D * 0.06, D * 0.1, D * 0.12); }
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = Math.max(D * 0.1, 0.8); g.lineCap = 'round';
    g.beginPath(); g.moveTo(-back + D * 0.15, -D * 0.3); g.lineTo(front - D * 0.15, -D * 0.3); g.stroke();
    g.restore();
    // The collars: the feed in the back, then each leg's.
    g.save(); g.translate(-back, 0); g.rotate(Math.PI); collar(D, D * 0.55); g.restore();
    for (const L of G.legs) { g.save(); g.translate(L.base.x, L.base.y); g.rotate(L.rel); collar(L.dL, L.spig); g.restore(); }
    g.restore();
  }

  /// Each room's name where it sits clear of the ducts and vents, and its load under it — unless the zones' cards carry
  /// the loads (`namesOnly`), as a duct layout drawing has them.
  drawLabels(g, x, view, layout, compact, namesOnly = false) {
    const zoneOf = {};
    for (const z of layout?.zones ?? []) for (const id of z.roomIds) zoneOf[id] = z.number;
    const closed = new Set((layout?.zones ?? []).filter((z) => !z.open).map((z) => z.number));
    const BLOCKED = 40;
    const busy = [];
    if (layout) {
      for (const run of layout.runs) {
        const pts = run.path.map(x.pt);
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 6));
          for (let k = 0; k < n; k++) busy.push({ p: { x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n }, r: 3, w: 1 });
        }
      }
      for (const b of layout.boxes) busy.push({ p: x.pt(b.pos), r: 10, w: BLOCKED });
      for (const o of layout.outlets) busy.push({ p: x.pt(o.pos), r: 11, w: BLOCKED });
      for (const dr of this.data?.view?.droppers ?? []) busy.push({ p: x.pt(dr.top), r: 16, w: BLOCKED }, { p: x.pt(dr.bottom), r: 16, w: BLOCKED });
      busy.push({ p: x.pt(layout.unit), r: layout.unitWidth / 2 * x.s, w: BLOCKED });
      busy.push({ p: x.pt(layout.returnGrille), r: 16, w: BLOCKED });
      for (const p of this.sizeSpots ?? []) busy.push({ p, r: 16, w: 20 });     // the ducts' sizes stay readable
      if (layout.outdoor) {
        const c = x.pt(layout.outdoor[2]);
        busy.push({ p: c, r: 22, w: BLOCKED }, { p: { x: c.x, y: c.y + 26 }, r: 14, w: BLOCKED });
      }
    }
    // A multi-head split's heads and outdoor units (and the tags beside them) are kept clear too.
    const sp = !layout || this.data?.both ? this.data?.split : null;
    if (sp) {
      for (const h of sp.heads) {
        const c = x.pt(h.pos), ang = Math.atan2(-h.blow.y, h.blow.x), reach = Math.max(0.7 * x.s, 18);
        busy.push({ p: c, r: Math.max((h.widthMM ?? 800) / 2000 * x.s, 14), w: BLOCKED });
        // Its tag, along the whole of its width: rather not under a name, but no reason to drop one.
        const t = { x: c.x + Math.cos(ang) * (reach + 26), y: c.y + Math.sin(ang) * (reach + 26) };
        const tag = this.headTag(h, this.data, x);
        g.font = `800 9px ${FONT}`;
        const half = (g.measureText(tag).width + 10) / 2;
        const n = Math.max(1, Math.round(half / 9));
        for (let k = 0; k <= n; k++) busy.push({ p: { x: t.x - half + 9 + (2 * half - 18) * k / n, y: t.y }, r: 11, w: Math.min(12, 24 / (n + 1)) });
        if (h.reachShort && this.data?.splitAir !== false) busy.push({ p: this.reachLabelAt(h, x), r: 18, w: 12 });
      }
      for (const o of sp.outdoors) busy.push({ p: x.pt(this.splitOutdoorAt(o)), r: 26, w: BLOCKED });
    }
    this.busy = busy;
    this.labelRects = [];
    const measure = (text, font) => { g.font = font; return g.measureText(text).width; };
    for (const r of view.rooms) {
      const poly = r.polygon;
      if (poly.length < 3) continue;
      const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
      const tl = x.pt({ x: Math.min(...xs), y: Math.max(...ys) }), br = x.pt({ x: Math.max(...xs), y: Math.min(...ys) });
      const widthPx = (Math.max(...xs) - Math.min(...xs)) * x.s;
      if (widthPx <= 44) continue;
      const room = widthPx - 16;
      let nameFont = '', name = r.name;
      for (const size of (r.conditioned ? [12, 10.5, 9.5] : [10.5, 9.5])) {
        nameFont = `700 ${size}px ${FONT}`;
        if (measure(name, nameFont) <= room) break;
      }
      while (name.length > 3 && measure(name, nameFont) > room) {
        name = name.slice(0, -2) + '…';
        nameFont = `700 9.5px ${FONT}`;
      }
      const nameColour = r.conditioned ? rgba(T.ink, 0.88) : T.muted;
      const z = zoneOf[r.id];
      const tone = z !== undefined ? (closed.has(z) ? T.faint : zoneColour(z)) : T.muted;
      const detailFont = `600 10.5px ${FONT}`;
      let detail = null;
      if (r.conditioned && !namesOnly) {
        detail = compact ? `${r.kw.toFixed(1)} kW`
          : widthPx > 150 ? `${r.kw.toFixed(2)} kW · ${Math.round(r.lps)} L/s · ${r.area.toFixed(1)} m²`
          : widthPx > 95 ? `${r.kw.toFixed(1)} kW · ${Math.round(r.lps)} L/s` : `${r.kw.toFixed(1)} kW`;
      }
      const nameW = measure(name, nameFont), nameH = 15;
      const detailW = detail ? Math.min(measure(detail, detailFont), widthPx - 12) : 0, detailH = detail ? 13 : 0;
      const score = (c) => {
        const onFloor = [[c.x, c.y], [c.x + c.w, c.y], [c.x, c.y + c.h], [c.x + c.w, c.y + c.h]]
          .every(([px, py]) => pointInPolygon(x.world({ x: px, y: py }), poly));
        let n = onFloor ? 0 : 1000;
        for (const b of busy) if (b.p.x >= c.x - b.r && b.p.x <= c.x + c.w + b.r && b.p.y >= c.y - b.r && b.p.y <= c.y + c.h + b.r) n += b.w;
        return n;
      };
      const best = (w, h) => {
        const xs2 = [tl.x + 4, br.x - 4 - w, (tl.x + br.x - w) / 2], ys2 = [tl.y + 4, br.y - 4 - h, (tl.y + br.y - h) / 2];
        const spots = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1], [0, 2], [1, 2], [2, 2]].map(([i, j]) => ({ x: xs2[i], y: ys2[j], w, h }));
        for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
          spots.push({ x: tl.x + 4 + (br.x - tl.x - 8 - w) * i / 6, y: tl.y + 4 + (br.y - tl.y - 8 - h) * j / 6, w, h });
        }
        let bestSpot = null, bestCost = Infinity;
        spots.forEach((s, k) => { const c = score(s) + k * 0.01; if (c < bestCost) { bestCost = c; bestSpot = s; } });
        return [bestSpot, bestCost];
      };
      let w = Math.min(Math.max(nameW, detailW) + 8, widthPx - 8), h = nameH + (detail ? detailH + 1 : 0) + 5;
      let [card, cost] = best(w, h);
      if (compact && cost >= BLOCKED && detail) {
        const [card3, cost3] = best(Math.min(nameW + 8, widthPx - 8), nameH + 5);
        if (cost3 < cost - 0.5) { card = card3; cost = cost3; detail = null; }
      }
      if (cost >= 1000 || (compact && cost >= BLOCKED)) continue;
      this.labelRects.push(card);
      g.fillStyle = 'rgba(255,255,255,0.78)';
      g.beginPath(); g.roundRect(card.x, card.y, card.w, card.h, 5); g.fill();
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.font = nameFont; g.fillStyle = nameColour; g.fillText(name, card.x + 4, card.y + 2.5);
      if (detail) { g.font = detailFont; g.fillStyle = tone; g.fillText(detail, card.x + 4, card.y + 3 + nameH, card.w - 6); }
    }
  }

  /// A card for each zone, as a duct layout drawing has them: the zone in its colour, its load, its air, its floor and how
  /// loud its vents are. Each sits OUTSIDE the house (Jake, 19 Nov 2026: "always make them on the outside of the floor
  /// plan"), as near its zone as it can, clear of the other cards, with a line back to the zone. They're placed with the
  /// whole house in view and ride with the plan as it's zoomed. Drag one and it stays where it's let go (kept on the job).
  drawZoneCards(g, x, view, layout) {
    const byId = Object.fromEntries(view.rooms.map((r) => [r.id, r]));
    // The rooms a zone feeds: those with vents, and their open area's others (the kitchen) — not a hallway with none.
    const vented = new Set(layout.outlets.map((o) => o.roomId));
    const fedAreas = new Set(view.rooms.filter((r) => vented.has(r.id) && r.openArea).map((r) => r.openArea));
    const fed = (r) => vented.has(r.id) || (r.openArea && fedAreas.has(r.openArea));
    const zones = [...layout.zones].filter((z) => z.roomIds.some((id) => byId[id]))
      .sort((a, b) => (a.number === 0) - (b.number === 0) || a.number - b.number);
    const pins = { ...(this.data?.project?.zoneCards ?? {}), ...(this.cardDrops ?? {}) };
    const cards = zones.map((z) => {
      const all = z.roomIds.map((id) => byId[id]).filter(Boolean);
      const mine = all.some(fed) ? all.filter(fed) : all;
      const kw = mine.reduce((t, r) => t + r.kw, 0), m2 = mine.reduce((t, r) => t + r.area, 0);
      const vents = layout.outlets.filter((o) => o.zone === z.number && !o.spill);
      const loud = vents.length ? Math.max(...vents.map((o) => o.dbA ?? 0)) : null;
      const lines = [[z.number === 0 ? 'Always on' : `Zone ${z.number}`, `800 11.5px ${FONT}`],
        [`${kw.toFixed(2)} kW`, `600 10.5px ${FONT}`], [`${Math.round(z.designLps)} L/s`, `600 10.5px ${FONT}`],
        [`${m2.toFixed(1)} m²`, `600 10.5px ${FONT}`]];
      if (loud != null && loud > 0) lines.push([`${vents.length > 1 ? 'Up to ' : ''}${Math.round(loud)} dB(A)`, `600 10.5px ${FONT}`]);
      let tw = 0;
      for (const [t, f] of lines) { g.font = f; tw = Math.max(tw, g.measureText(t).width); }
      const big = mine.length ? mine.reduce((a, b) => (b.area > a.area ? b : a)) : all[0];
      return { z, lines, w: Math.ceil(tw) + 20, h: 13 * lines.length + 14, big, ids: new Set(mine.map((r) => r.id)) };
    });
    // Where the cards go, worked out with the whole house in view (cached till the layout or the canvas changes).
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight - (this.data?.insetBottom ?? 0);
    const key = [layout, W, H, JSON.stringify(pins), cards.map((c) => c.lines.map((l) => l[0]).join()).join('|')];
    const same = this.cardCache && this.cardCache.key.every((k, i) => k === key[i]);
    if (!same) {
      const f = this.xformAt(1, { x: 0, y: 0 });
      const rooms = view.rooms.filter((r) => r.polygon.length >= 3).map((r) => {
        const pts = r.polygon.map(f.pt), xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
        return { r, pts, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
      });
      const inRoom = (p) => rooms.find((m) => p.x >= m.box[0] - 4 && p.x <= m.box[2] + 4 && p.y >= m.box[1] - 4 && p.y <= m.box[3] + 4
        && (pointInPolygon(p, m.pts) || m.pts.some((a, i) => segDist(p, a, m.pts[(i + 1) % m.pts.length]) < 4)));
      const keepOut = [];
      if (layout.outdoor) { const o = f.pt(layout.outdoor[2]); keepOut.push({ x: o.x - 22, y: o.y - 22, w: 44, h: 58 }); }
      const hitsBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
      const placed = [], at = {};
      // Cards moved by hand first: they stay put and the rest keep clear of them.
      for (const c of cards) {
        const p = pins[c.z.number];
        if (!p) continue;
        const m = f.pt(p);
        placed.push({ x: m.x - c.w / 2, y: m.y - c.h / 2, w: c.w, h: c.h });
        at[c.z.number] = { world: p, pinned: true };
      }
      for (const c of cards) {
        if (at[c.z.number]) continue;
        const anchor = f.pt(c.big.centroid ?? c.big.polygon[0]);
        const cost = (b) => {
          if (b.x < 4 || b.y < 4 || b.x + b.w > W - 4 || b.y + b.h > H - 4) return Infinity;
          let n = 0;
          for (let i = 0; i <= 3; i++) for (let j = 0; j <= 3; j++) if (inRoom({ x: b.x + b.w * i / 3, y: b.y + b.h * j / 3 })) n += 1000;
          for (const o of placed) if (hitsBox(b, o, 6)) n += 800;
          for (const o of keepOut) if (hitsBox(b, o, 4)) n += 300;
          const cx = Math.max(b.x, Math.min(anchor.x, b.x + b.w)), cy = Math.max(b.y, Math.min(anchor.y, b.y + b.h));
          return n + Math.hypot(cx - anchor.x, cy - anchor.y);
        };
        let best = null, bestCost = Infinity;
        for (let rad = 0; rad <= Math.max(W, H); rad += 12) {
          const steps = rad ? Math.max(16, Math.round(rad / 8)) : 1;
          for (let k = 0; k < steps; k++) {
            const a = k / steps * Math.PI * 2;
            const b = { x: anchor.x + Math.cos(a) * rad - c.w / 2, y: anchor.y + Math.sin(a) * rad - c.h / 2, w: c.w, h: c.h };
            const v = cost(b);
            if (v < bestCost) { bestCost = v; best = b; }
          }
          if (bestCost < 1000 && rad > 0 && bestCost < rad) break;       // outside and nothing nearer can beat it
        }
        if (!best) continue;
        placed.push(best);
        at[c.z.number] = { world: f.world({ x: best.x + best.w / 2, y: best.y + best.h / 2 }), pinned: false };
      }
      this.cardCache = { key, at };
    }
    const at = this.cardCache.at, drag = this.drag?.active && this.drag.item?.kind === 'zoneCard' ? this.drag : null;
    for (const c of cards) {
      const spot = at[c.z.number];
      if (!spot) continue;
      let m = x.pt(spot.world);
      if (drag && drag.item.id === c.z.number) m = { x: drag.item.cx + drag.screen.x - drag.start.x, y: drag.item.cy + drag.screen.y - drag.start.y };
      const r = { x: m.x - c.w / 2, y: m.y - c.h / 2, w: c.w, h: c.h }, z = c.z;
      const tone = z.open ? zoneColour(z.number) : T.faint, anchor = x.pt(c.big.centroid ?? c.big.polygon[0]);
      // A line back to the zone.
      const ex = Math.max(r.x, Math.min(anchor.x, r.x + r.w)), ey = Math.max(r.y, Math.min(anchor.y, r.y + r.h));
      if (Math.hypot(ex - anchor.x, ey - anchor.y) > 20) {
        g.strokeStyle = rgba(tone, 0.75); g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(anchor.x, anchor.y); g.stroke();
        g.beginPath(); g.arc(anchor.x, anchor.y, 2.6, 0, Math.PI * 2); g.fillStyle = tone; g.fill();
      }
      g.save();
      g.shadowColor = drag?.item.id === z.number ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.14)'; g.shadowBlur = drag?.item.id === z.number ? 10 : 4; g.shadowOffsetY = 1;
      g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, 6); g.fillStyle = '#fff'; g.fill();
      g.restore();
      g.save(); g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, 7); g.clip();
      g.fillStyle = tone; g.fillRect(r.x, r.y, r.w, 18);
      g.restore();
      g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, 7); g.strokeStyle = rgba(tone, 0.6); g.lineWidth = 1; g.stroke();
      g.textAlign = 'left'; g.textBaseline = 'top';
      c.lines.forEach(([t, f], i) => { g.font = f; g.fillStyle = i ? (z.open ? T.body : T.faint) : '#fff'; g.fillText(t, r.x + 9, i ? r.y + 9 + i * 13 : r.y + 3.5); });
      if (spot.pinned) {
        // Moved by hand: a pin in its corner, as a moved BDO has.
        const px = r.x + r.w - 7, py = r.y + 6;
        g.strokeStyle = '#fff'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(px, py + 1.5); g.lineTo(px, py + 6); g.stroke();
        g.beginPath(); g.arc(px, py, 2.4, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      }
      this.hits.push({ item: { kind: 'zoneCard', id: z.number, cx: m.x, cy: m.y }, x: m.x, y: m.y, r: 0, rect: r });
    }
  }

  // MARK: Multi-head split

  /// Where an outdoor unit sits on the plan: on its pad just off the wall.
  splitOutdoorAt(o) { return { x: o.pos.x + o.out.x * 0.45, y: o.pos.y + o.out.y * 0.45 }; }

  /// How far each wall head's air carries on high fan before it slows to 0.25 m/s (an estimate: the brands don't publish
  /// air throw): a fan of air the way the head blows, fading to its reach, kept inside the space it serves — a dashed
  /// edge where it stops, red when that's short of the far wall.
  drawSplitAir(g, x, view, sp, d) {
    const drag = this.drag?.active ? this.drag : null;
    for (const h of sp.heads) {
      if (!h.reachM || (drag?.item.kind === 'head' && drag.item.id === h.id)) continue;
      const rooms = view.rooms.filter((r) => (h.spaceRooms ?? [h.room]).includes(r.id) && r.polygon.length >= 3);
      if (!rooms.length) continue;
      const c = x.pt(h.pos), r = h.reachM * x.s, ang = Math.atan2(-h.blow.y, h.blow.x), spread = 0.6;
      const tone = h.outdoor >= 0 ? splitColour(h.outdoor) : T.danger;
      const picked = d.selection?.kind === 'head' && d.selection.id === h.id;
      g.save();
      g.beginPath();
      for (const rm of rooms) { rm.polygon.map(x.pt).forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); }
      g.clip();
      const grad = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(r, 1));
      grad.addColorStop(0, rgba(tone, picked ? 0.36 : 0.22)); grad.addColorStop(1, rgba(tone, 0.03));
      g.beginPath(); g.moveTo(c.x, c.y); g.arc(c.x, c.y, r, ang - spread, ang + spread); g.closePath();
      g.fillStyle = grad; g.fill();
      g.beginPath(); g.arc(c.x, c.y, r, ang - spread, ang + spread);
      g.setLineDash([5, 4]); g.strokeStyle = h.reachShort ? T.danger : rgba(tone, 0.75); g.lineWidth = h.reachShort ? 2 : 1.4; g.stroke(); g.setLineDash([]);
      g.restore();
    }
  }

  /// A head's tag: its model and size, and how far its air reaches when that fits across its room (zoom in for the
  /// small rooms' — their names come first). Short of the far wall, the reach is in red by the edge of the air instead.
  /// A ducted head in its bulkhead, from above (Jake, 16 Nov 2026: "a bulkhead should look like a bulkhead unit, not a
  /// split, and show the spec"): the bulkhead boxed out from the wall, the unit inside it, the linear supply grille on its
  /// face and the return grille under it, the air off the face, and its spec — model, size, air and grilles.
  drawBulkhead(g, x, h, at, ang, tone, sel, drag, d) {
    const s = x.s, gr = h.grilles;
    const unitW = (h.widthMM ?? 900) / 1000, unitD = (h.depthMM ?? 650) / 1000;
    const L = Math.max(Math.max(unitW + 0.1, (gr?.supply.lengthMM ?? 0) / 1000, (gr?.ret.lengthMM ?? 0) / 1000) * s, 30);
    const D = Math.max((unitD + 0.25) * s, 16);
    g.save(); g.translate(at.x, at.y); g.rotate(ang);
    // The bulkhead: plasterboard, boxed out from the wall (x = 0) into the room.
    g.save(); g.shadowColor = 'rgba(0,0,0,0.14)'; g.shadowBlur = 4; g.shadowOffsetY = 1;
    g.beginPath(); g.rect(0, -L / 2, D, L); g.fillStyle = '#F3F4F6'; g.fill(); g.restore();
    g.save(); g.beginPath(); g.rect(0, -L / 2, D, L); g.clip();
    g.strokeStyle = 'rgba(16,16,16,0.07)'; g.lineWidth = 1;
    for (let k = -L; k < D + L; k += 7) { g.beginPath(); g.moveTo(k, -L / 2); g.lineTo(k - L, L / 2); g.stroke(); }
    g.restore();
    g.beginPath(); g.rect(0, -L / 2, D, L); g.strokeStyle = tone; g.lineWidth = 2; g.stroke();
    // The unit inside, against the wall.
    const uw = Math.min(unitW * s, L - 6), ud = Math.min(unitD * s, D * 0.72);
    g.beginPath(); g.roundRect(3, -uw / 2, ud, uw, 3); g.fillStyle = '#2A2E33'; g.fill();
    g.beginPath(); g.arc(3 + ud * 0.45, 0, Math.min(ud, uw) * 0.28, 0, Math.PI * 2); g.strokeStyle = '#8A9097'; g.lineWidth = 1.2; g.stroke();
    // The return grille under the bulkhead, by the face; the supply grille on the face.
    const rl = Math.min(((gr?.ret.lengthMM ?? 700) / 1000) * s, L - 4), rd = Math.max(((gr?.ret.heightMM ?? 100) / 1000) * s, 4);
    g.beginPath(); g.rect(D - rd - 5, -rl / 2, rd, rl); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#6B7178'; g.lineWidth = 1; g.stroke();
    for (let y = -rl / 2 + 3; y < rl / 2 - 1; y += 3.5) { g.beginPath(); g.moveTo(D - rd - 4, y); g.lineTo(D - 6, y); g.stroke(); }
    const sl = Math.min(((gr?.supply.lengthMM ?? 600) / 1000) * s, L - 4);
    g.beginPath(); g.rect(D - 2.5, -sl / 2, 5, sl); g.fillStyle = tone; g.fill();
    // Its air, off the face.
    const reach = Math.max(0.7 * s, 18);
    g.strokeStyle = rgba(tone, 0.55); g.lineWidth = 1.6; g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(D + 4, 0); g.lineTo(D + reach, 0); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(D + reach + 5, 0); g.lineTo(D + reach - 2, -4.5); g.lineTo(D + reach - 2, 4.5); g.closePath(); g.fillStyle = rgba(tone, 0.75); g.fill();
    if (sel?.kind === 'head' && sel.id === h.id) { g.beginPath(); g.rect(-4, -L / 2 - 4, D + 8, L + 8); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
    g.restore();
    if (!drag) {
      const lp = { x: at.x + Math.cos(ang) * (D + reach + 26), y: at.y + Math.sin(ang) * (D + reach + 26) };
      const short = h.model.replace(/(DA3|JAAD)$/, '');
      this.tag(g, `${short} · ${h.coolKW} kW · ${Math.round(h.airflowLps ?? 0)} L/s`, lp.x, lp.y - 7, tone);
      if (gr && !d.report) this.tag(g, `S ${gr.supply.size} · R ${gr.ret.size}`, lp.x, lp.y + 8, '#5F666E');
    }
    this.hits.push({ item: { kind: 'head', id: h.id }, x: at.x + Math.cos(ang) * D / 2, y: at.y + Math.sin(ang) * D / 2, r: Math.max(L / 2, 18) });
  }

  headTag(h, d, x) {
    const base = `${h.model.replace(/(VGKD2|VGD)-A\d$/, '').replace(/^MSZ-/, '')} · ${h.coolKW} kW`;
    if (!h.reachM || d?.splitAir === false || d?.report || h.reachShort) return base;
    const full = `${base} · air ${h.reachM.toFixed(1)} m`;
    const xs = d.view?.rooms.find((r) => r.id === h.room)?.polygon.map((p) => p.x) ?? [];
    this.ctx.font = `800 9px ${FONT}`;
    return !xs.length || this.ctx.measureText(full).width + 10 <= 0.9 * (Math.max(...xs) - Math.min(...xs)) * x.s ? full : base;
  }

  /// Where a head's reach is written when it falls short of the far wall: just past its dashed edge.
  reachLabelAt(h, x) {
    const c = x.pt(h.pos), ang = Math.atan2(-h.blow.y, h.blow.x), m = h.reachM + 0.4;
    return { x: c.x + Math.cos(ang) * m * x.s, y: c.y + Math.sin(ang) * m * x.s };
  }

  /// Each head's pipe run back to its outdoor unit, in the unit's colour: solid along the outside wall (a head on an
  /// outside wall), dashed through the roof (one on an internal wall). Its length halfway.
  drawSplitPipes(g, x, sp) {
    const drag = this.drag?.active ? this.drag : null;
    g.font = `700 10px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const h of sp.heads) {
      const o = sp.outdoors[h.outdoor];
      if (!o) continue;
      const tone = splitColour(h.outdoor);
      const a = drag?.item.kind === 'odu' && drag.item.id === h.outdoor ? drag.screen : x.pt(this.splitOutdoorAt(o));
      const b = drag?.item.kind === 'head' && drag.item.id === h.id ? drag.screen : x.pt(h.pos);
      // Square to the house, the way the pipes go: along one way, then the other.
      const mid = Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
      this.stroke(g, [a, mid, b], 'rgba(255,255,255,0.9)', 5.5, 'round');
      this.stroke(g, [a, mid, b], tone, 2.5, 'round', h.onOutside || !h.wall ? null : [7, 5]);
      const m = pointAlong([a, mid, b], 0.5);
      if (m && !drag) {
        const t = `${h.pipeM.toFixed(1)} m`, tw = g.measureText(t).width + 8;
        g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); g.roundRect(m.x - tw / 2, m.y - 7, tw, 14, 4); g.fill();
        g.fillStyle = tone; g.fillText(t, m.x, m.y + 0.5);
      }
    }
  }

  /// The heads (wall units to scale on their wall, blowing into the room; a P where the drain needs a pump) and the
  /// outdoor units (numbered, on their pads) — each in its outdoor unit's colour, tappable and draggable.
  drawSplitMarks(g, x, sp, d) {
    const sel = d.selection, drag = this.drag?.active ? this.drag : null;
    sp.outdoors.forEach((o, i) => {
      const at = drag?.item.kind === 'odu' && drag.item.id === i ? drag.screen : x.pt(this.splitOutdoorAt(o));
      const tone = splitColour(i), w = Math.max(0.9 * x.s, 30), dep = Math.max(0.35 * x.s, 13);
      g.save(); g.translate(at.x, at.y); g.rotate(-Math.atan2(o.out.y, o.out.x) + Math.PI / 2);
      g.beginPath(); g.roundRect(-w / 2, -dep / 2, w, dep, 3); g.fillStyle = '#fff'; g.fill();
      g.strokeStyle = tone; g.lineWidth = 2.5; g.stroke();
      g.beginPath(); g.arc(w * 0.18, 0, dep * 0.32, 0, Math.PI * 2); g.lineWidth = 1.5; g.stroke();
      if (sel?.kind === 'odu' && sel.id === i) { g.beginPath(); g.roundRect(-w / 2 - 4, -dep / 2 - 4, w + 8, dep + 8, 6); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      g.restore();
      this.tag(g, d.vrfLabel ?? `${i + 1} · ${o.model}`, at.x, at.y + dep / 2 + 14, tone);
      this.hits.push({ item: { kind: 'odu', id: i }, x: at.x, y: at.y, r: Math.max(w / 2, 20) });
    });
    for (const h of sp.heads) {
      const at = drag?.item.kind === 'head' && drag.item.id === h.id ? drag.screen : x.pt(h.pos);
      const tone = h.outdoor >= 0 ? splitColour(h.outdoor) : T.danger;
      const len = Math.max((h.widthMM ?? 800) / 1000 * x.s, 26), dep = Math.max(0.22 * x.s, 9);
      const ang = Math.atan2(-h.blow.y, h.blow.x);            // the way it blows, on screen
      if (h.kind === 'cassette') { this.drawCassette(g, x, h, at, tone, sel, drag, d); continue; }
      if (!h.wall) { this.drawBulkhead(g, x, h, at, ang, tone, sel, drag, d); continue; }
      g.save(); g.translate(at.x, at.y); g.rotate(ang);
      // The unit along its wall (long side across the way it blows), louvres on the room side.
      g.beginPath(); g.roundRect(-dep / 2, -len / 2, dep, len, 3); g.fillStyle = '#fff'; g.fill();
      g.strokeStyle = tone; g.lineWidth = 2.2; g.stroke();
      g.strokeStyle = rgba(tone, 0.7); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(dep * 0.25, -len / 2 + 4); g.lineTo(dep * 0.25, len / 2 - 4); g.stroke();
      // Its air, into the room.
      const reach = Math.max(0.7 * x.s, 18);
      g.strokeStyle = rgba(tone, 0.55); g.lineWidth = 1.6; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(dep / 2 + 2, 0); g.lineTo(dep / 2 + reach, 0); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(dep / 2 + reach + 5, 0); g.lineTo(dep / 2 + reach - 2, -4.5); g.lineTo(dep / 2 + reach - 2, 4.5); g.closePath();
      g.fillStyle = rgba(tone, 0.75); g.fill();
      if (sel?.kind === 'head' && sel.id === h.id) { g.beginPath(); g.roundRect(-dep / 2 - 4, -len / 2 - 4, dep + 8, len + 8, 6); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      g.restore();
      if (h.pump) {
        const p = { x: at.x - Math.sin(ang) * (len / 2 + 9), y: at.y + Math.cos(ang) * (len / 2 + 9) };
        g.beginPath(); g.arc(p.x, p.y, 7.5, 0, Math.PI * 2); g.fillStyle = T.cool; g.fill();
        g.font = `800 9px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', p.x, p.y + 0.5);
      }
      if (h.pinned) { g.beginPath(); g.arc(at.x + Math.cos(ang) * -(dep / 2 + 6), at.y + Math.sin(ang) * -(dep / 2 + 6), 2.6, 0, Math.PI * 2); g.fillStyle = T.accentDeep; g.fill(); }
      if (!drag) {
        const lp = { x: at.x + Math.cos(ang) * (dep / 2 + reach + 22), y: at.y + Math.sin(ang) * (dep / 2 + reach + 22) };
        this.tag(g, this.headTag(h, d, x), lp.x, lp.y, tone);
        if (h.reachM && d.splitAir !== false && !d.report && h.reachShort) {
          const rp = this.reachLabelAt(h, x);
          this.tag(g, `air reaches ${h.reachM.toFixed(1)} m`, rp.x, rp.y, T.danger);
        }
      }
      this.hits.push({ item: { kind: 'head', id: h.id }, x: at.x, y: at.y, r: Math.max(len / 2, 16) });
    }
  }

  /// A ceiling cassette, from below: its square grille panel in the middle of the room, the return in the centre and a
  /// slot along each edge blowing out four ways.
  drawCassette(g, x, h, at, tone, sel, drag, d) {
    const S = Math.max(0.625 * x.s, 24), r = S / 2, slot = S * 0.11;
    g.save(); g.translate(at.x, at.y);
    g.beginPath(); g.roundRect(-r, -r, S, S, 3); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = tone; g.lineWidth = 2.2; g.stroke();
    g.strokeStyle = rgba(tone, 0.75); g.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      g.save(); g.rotate(k * Math.PI / 2);
      g.beginPath(); g.roundRect(-r * 0.62, -r + slot * 0.7, r * 1.24, slot, 1.5); g.stroke();
      // Its air, out past the edge.
      const reach = Math.max(0.5 * x.s, 12);
      g.strokeStyle = rgba(tone, 0.5); g.lineWidth = 1.4; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(0, -r - 2); g.lineTo(0, -r - reach); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(0, -r - reach - 5); g.lineTo(-4, -r - reach + 1); g.lineTo(4, -r - reach + 1); g.closePath(); g.fillStyle = rgba(tone, 0.7); g.fill();
      g.restore();
      g.strokeStyle = rgba(tone, 0.75); g.lineWidth = 1.2;
    }
    g.beginPath(); g.roundRect(-r * 0.42, -r * 0.42, r * 0.84, r * 0.84, 2); g.stroke();
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-r * 0.34, k * r * 0.14); g.lineTo(r * 0.34, k * r * 0.14); g.stroke(); }
    if (sel?.kind === 'head' && sel.id === h.id) { g.beginPath(); g.roundRect(-r - 4, -r - 4, S + 8, S + 8, 6); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
    g.restore();
    if (!drag) this.tag(g, this.headTag(h, d, x), at.x, at.y + r + Math.max(0.5 * x.s, 12) + 16, tone);
    this.hits.push({ item: { kind: 'head', id: h.id }, x: at.x, y: at.y, r: Math.max(r, 16) });
  }

  /// An outlet's face, by its kind: a round ceiling diffuser (rings), a linear slot (two slots), a linear bar grille
  /// (fine bars) or a floor grille (a square grid on a darker face).
  /// A side grille's wall (Jake, 22 Nov 2026: "bar grills as side ways blow air"): the nearest wall of the room the
  /// vent is in, as screen directions along it (u) and into the room (v), and how far off it the vent sits (px).
  sideWall(x, c) {
    const w = x.world(c), room = this.data?.view?.rooms.find((r) => r.polygon?.length >= 3 && pointInPolygon(w, r.polygon));
    if (!room) return null;
    const P = room.polygon;
    let best = null;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      if (L < 0.05) continue;
      const t = Math.max(0, Math.min(L, ((w.x - a.x) * dx + (w.y - a.y) * dy) / L));
      const q = { x: a.x + dx / L * t, y: a.y + dy / L * t }, d = Math.hypot(w.x - q.x, w.y - q.y);
      if (!best || d < best.d) best = { d, q, t: { x: dx / L, y: dy / L } };
    }
    if (!best) return null;
    let n = { x: -best.t.y, y: best.t.x };
    if (!pointInPolygon({ x: best.q.x + n.x * 0.05, y: best.q.y + n.y * 0.05 }, P)) n = { x: -n.x, y: -n.y };
    const q0 = x.pt(best.q), along = x.pt({ x: best.q.x + best.t.x, y: best.q.y + best.t.y }), into = x.pt({ x: best.q.x + n.x, y: best.q.y + n.y });
    const unit = (p) => { const L = Math.hypot(p.x - q0.x, p.y - q0.y) || 1; return { x: (p.x - q0.x) / L, y: (p.y - q0.y) / L }; };
    return { u: unit(along), v: unit(into), off: best.d * x.s, m: x.s };
  }

  /// A side-blow bar grille, seen from above: edge on, along its wall, with its air thrown into the room. In a bulkhead
  /// face it sits out from the wall, with the bulkhead (shaded) behind it back to the wall.
  drawSideGrille(g, c, size, style, w) {
    const ink = '#3A3F45', len = size * 2.1, t = Math.max(4, size * 0.3);
    const near = w.off <= 0.9 * w.m;                       // snapped to its wall (else: drawn where it is)
    const wallY = near ? -w.off : 0, face = style === 'sideBulkhead' || !near ? 0 : wallY + t / 2;
    g.save();
    g.transform(w.u.x, w.u.y, w.v.x, w.v.y, c.x, c.y);     // x: along the wall · y: into the room
    if (style === 'sideBulkhead' && near && w.off > 2) {
      const bl = len + size * 1.4;
      g.beginPath(); g.rect(-bl / 2, wallY, bl, -wallY);
      g.fillStyle = 'rgba(120,128,138,0.22)'; g.fill();
      g.setLineDash([4, 3]); g.strokeStyle = ink; g.lineWidth = 1; g.stroke(); g.setLineDash([]);
    }
    g.beginPath(); g.roundRect(-len / 2, face - t / 2, len, t, 1.5);
    g.fillStyle = '#fff'; g.fill(); g.strokeStyle = ink; g.lineWidth = Math.max(1, size * 0.08); g.stroke();
    g.lineWidth = Math.max(0.8, size * 0.05);
    for (let k = -len / 2 + t * 0.6; k <= len / 2 - t * 0.5; k += Math.max(3, size * 0.2)) {
      g.beginPath(); g.moveTo(k, face - t * 0.3); g.lineTo(k, face + t * 0.3); g.stroke();
    }
    // The throw: three arrows out into the room.
    g.strokeStyle = '#2E7CF6'; g.fillStyle = '#2E7CF6'; g.lineWidth = Math.max(1.2, size * 0.07);
    const y0 = face + t / 2 + 2, y1 = y0 + size * 0.95, hd = Math.max(3, size * 0.18);
    for (const k of [-0.32, 0, 0.32]) {
      const ax = k * len;
      g.beginPath(); g.moveTo(ax, y0); g.lineTo(ax, y1 - hd * 0.6); g.stroke();
      g.beginPath(); g.moveTo(ax, y1); g.lineTo(ax - hd * 0.6, y1 - hd); g.lineTo(ax + hd * 0.6, y1 - hd); g.closePath(); g.fill();
    }
    g.restore();
  }

  drawGrille(g, c, size, style = 'round') {
    const h = size / 2, ink = '#3A3F45';
    g.strokeStyle = ink;
    if (style === 'slot' || style === 'bar') {
      const w = size * 2.1, t = size * 0.5;
      g.beginPath(); g.roundRect(c.x - w / 2, c.y - t / 2, w, t, t * 0.25);
      g.fillStyle = '#fff'; g.fill(); g.lineWidth = Math.max(1, size * 0.08); g.stroke();
      g.lineWidth = Math.max(0.8, size * 0.06);
      if (style === 'slot') {
        for (const k of [-1, 1]) { const y = c.y + k * t * 0.18; g.beginPath(); g.moveTo(c.x - w / 2 + t * 0.3, y); g.lineTo(c.x + w / 2 - t * 0.3, y); g.stroke(); }
      } else {
        for (let x = c.x - w / 2 + t * 0.35; x <= c.x + w / 2 - t * 0.3; x += Math.max(3, size * 0.2)) {
          g.beginPath(); g.moveTo(x, c.y - t * 0.28); g.lineTo(x, c.y + t * 0.28); g.stroke();
        }
      }
      return;
    }
    if (style === 'floor') {
      g.beginPath(); g.roundRect(c.x - h, c.y - h * 0.7, size, size * 0.7, size * 0.08);
      g.fillStyle = '#E3E6EA'; g.fill(); g.lineWidth = Math.max(1, size * 0.09); g.stroke();
      g.lineWidth = Math.max(0.7, size * 0.05);
      for (let i = 1; i < 4; i++) { const x = c.x - h + i * size / 4; g.beginPath(); g.moveTo(x, c.y - h * 0.55); g.lineTo(x, c.y + h * 0.55); g.stroke(); }
      for (const k of [-1, 1]) { const y = c.y + k * h * 0.22; g.beginPath(); g.moveTo(c.x - h * 0.85, y); g.lineTo(c.x + h * 0.85, y); g.stroke(); }
      return;
    }
    g.beginPath(); g.arc(c.x, c.y, h, 0, Math.PI * 2);
    g.fillStyle = '#fff'; g.fill(); g.lineWidth = Math.max(1, size * 0.09); g.stroke();
    g.lineWidth = Math.max(0.8, size * 0.06);
    for (const k of [0.66, 0.36]) { g.beginPath(); g.arc(c.x, c.y, h * k, 0, Math.PI * 2); g.stroke(); }
  }

  drawMarkers(g, x, l, d) {
    const sel = d.selection, drag = this.drag?.active ? this.drag : null;
    const at = (kind, id, fallback) => (drag?.screen && drag.item.kind === kind && (id == null || drag.item.id === id)) ? drag.screen : fallback;
    const shadow = (fn) => { g.save(); g.shadowColor = 'rgba(0,0,0,0.15)'; g.shadowBlur = 3; g.shadowOffsetY = 1; fn(); g.restore(); };

    // Outdoor unit on its pad, square to the wall.
    if (l.outdoor) {
      const [point, out, condenser] = l.outdoor;
      const c = at('outdoor', null, x.pt(condenser)), size = 30;
      shadow(() => {
        g.save(); g.translate(c.x, c.y); g.rotate(-Math.atan2(out.y, out.x));
        g.beginPath(); g.roundRect(-size * 0.3, -size * 0.55, size * 0.6, size * 1.1, 3);
        g.fillStyle = '#fff'; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
        g.beginPath(); g.arc(0, 0, size * 0.22, 0, Math.PI * 2); g.lineWidth = 1.2; g.stroke();
        g.beginPath(); g.arc(0, 0, size * 0.06, 0, Math.PI * 2); g.fillStyle = T.ink; g.fill();
        g.restore();
        this.tag(g, 'OUTDOOR', c.x, c.y + 26, T.ink);
      });
      if (sel?.kind === 'outdoor') { g.beginPath(); g.arc(c.x, c.y, 20, 0, Math.PI * 2); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      this.hits.push({ item: { kind: 'outdoor' }, x: c.x, y: c.y, r: 22 });
    }
    // Return grille + its size, sitting just below its spot (as the app's marker).
    // Return grille to its size (as the take-off orders it), its long side across the fan coil's, with its slats.
    {
      const c = at('ret', null, x.pt(l.returnGrille));
      const [gw, gh] = l.returnGrilleSize?.length === 2 ? l.returnGrilleSize : [600, 600];
      const long = Math.max(Math.max(gw, gh) / 1000 * x.s, 30), short = Math.max(Math.min(gw, gh) / 1000 * x.s, 18);
      const turn = -Math.atan2(l.unitDir.y, l.unitDir.x);
      shadow(() => {
        g.save(); g.translate(c.x, c.y); g.rotate(turn);
        g.beginPath(); g.roundRect(-short / 2, -long / 2, short, long, 3); g.fillStyle = T.returnAir; g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.4;
        const n = Math.max(3, Math.min(14, Math.round(long / 6)));
        for (let i = 1; i < n; i++) {
          const y = -long / 2 + long * i / n;
          g.beginPath(); g.moveTo(-short / 2 + 3.5, y); g.lineTo(short / 2 - 3.5, y); g.stroke();
        }
        if (sel?.kind === 'ret') { g.beginPath(); g.roundRect(-short / 2 - 4, -long / 2 - 4, short + 8, long + 8, 5); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
        g.restore();
        const below = Math.abs(Math.sin(turn)) * short / 2 + Math.abs(Math.cos(turn)) * long / 2;
        this.tag(g, 'RA ' + ((l.returnCount ?? 1) > 1 ? l.returnCount + '×' : '') + 'Ø' + l.returnMM, c.x, c.y + below + 11, T.returnAir);
      });
      this.hits.push({ item: { kind: 'ret' }, x: c.x, y: c.y, r: Math.max(18, Math.min(long, 60) / 2 + 4) });
    }
    // Fan coil, sideways as they are: wide and skinny (the engine's 1.6 × 0.7 m), its plenum along the long side the
    // supply faces, where the ducts come off. To scale, never smaller than a mark you can grab.
    {
      const c = at('unit', null, x.pt(l.unit));
      const depth = Math.max(0.7 * x.s, 16), width = Math.max(1.6 * x.s, 46), plenum = Math.max(0.45 * x.s, 9);
      const turn = -Math.atan2(l.unitDir.y, l.unitDir.x);
      shadow(() => {
        g.save(); g.translate(c.x, c.y); g.rotate(turn);
        g.beginPath(); g.roundRect(-depth / 2, -width / 2, depth, width, 4); g.fillStyle = T.ink; g.fill();
        this.guard('unit fittings', () => this.drawUnitFittings(g, this.unitGeom(l, x, c)));
        if (sel?.kind === 'unit') {
          g.beginPath(); g.roundRect(-depth / 2 - 4, -width / 2 - 4, depth + plenum + 8, width + 8, 6); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke();
        }
        g.restore();
        // The label runs along the unit, the right way up, to one side of its fan.
        let a = turn + Math.PI / 2;
        while (a > Math.PI / 2) a -= Math.PI;
        while (a <= -Math.PI / 2) a += Math.PI;
        const along = { x: -Math.sin(turn), y: Math.cos(turn) }, fanSize = Math.min(depth * 0.78, 26);
        this.fanAt = { x: c.x - along.x * width * 0.26, y: c.y - along.y * width * 0.26, size: fanSize };
        g.save(); g.translate(c.x + along.x * width * 0.17, c.y + along.y * width * 0.17); g.rotate(a);
        g.font = `800 8px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('FAN COIL', 0, 0);
        g.restore();
      });
      this.hits.push({ item: { kind: 'unit' }, x: c.x, y: c.y, r: Math.max(width / 2, 27) });
    }
    // BDO handles: a ring when picked, a pin once moved by hand.
    for (const b of l.boxes) {
      if (!b.bid || (b.branches < 2 && !b.bid.startsWith('H:'))) continue;
      const c = at('box', b.bid, x.pt(b.pos));
      const { len, wid } = this.bdoSize(x, b);
      if (sel?.kind === 'box' && sel.id === b.bid) {
        g.save(); g.translate(c.x, c.y); g.rotate(Math.atan2(-(b.axis?.y ?? 0), b.axis?.x ?? 1));
        g.beginPath(); g.roundRect(-len / 2 - 5, -wid / 2 - 5, len + 10, wid + 10, 7); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke();
        g.restore();
      }
      if (drag?.item.kind === 'box' && drag.item.id === b.bid) this.drawBdo(g, c, b, x);
      if (b.pinned) {
        // A pin: moved by hand, so it stays put when the rest re-routes.
        const px = c.x + Math.max(len, wid) / 2 - 2, py = c.y - wid / 2 - 3;
        g.strokeStyle = T.accentDeep; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(px, py + 2); g.lineTo(px, py + 7); g.stroke();
        g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fillStyle = T.accentDeep; g.fill();
      }
      this.hits.push({ item: { kind: 'box', id: b.bid }, x: c.x, y: c.y, r: Math.max(12, len / 2 + 4) });
    }
    for (const b of l.looseBoxes ?? []) {
      const c = at('box', 'H:' + b.id, x.pt(b.pos)), { len, wid } = this.bdoSize(x);
      if (sel?.kind === 'box' && sel.id === 'H:' + b.id) { g.beginPath(); g.roundRect(c.x - len / 2 - 5, c.y - wid / 2 - 5, len + 10, wid + 10, 7); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      if (drag?.item.kind === 'box' && drag.item.id === 'H:' + b.id) this.drawBdo(g, c, { axis: { x: 1, y: 0 }, legDirs: [] }, x);
      this.hits.push({ item: { kind: 'box', id: 'H:' + b.id }, x: c.x, y: c.y, r: Math.max(12, len / 2 + 4) });
    }
    // Outlets: the grille alone (its size is its leg's colour, and on its card). A dropper's top isn't a grille: it's
    // drawn as the dropper.
    for (const o of l.outlets) {
      if (o.dropper) continue;
      const c = at('outlet', o.id, x.pt(o.pos)), size = Math.min(Math.max((o.sizeMM + 150) / 1000 * x.s, 15), 34);
      const sw = SIDE_STYLES.has(o.style) ? this.sideWall(x, c) : null;
      shadow(() => sw ? this.drawSideGrille(g, c, size, o.style, sw) : this.drawGrille(g, c, size, o.style));
      const ring = size / 2 + 5;
      if (sel?.kind === 'outlet' && sel.id === o.id) { g.beginPath(); g.roundRect(c.x - ring, c.y - ring, ring * 2, ring * 2, 5); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      const pk = this.data?.picked?.indexOf(o.id) ?? -1;
      if (pk >= 0) {
        // Picked for a new BDO: a ring and its number.
        g.beginPath(); g.arc(c.x, c.y, ring + 1, 0, Math.PI * 2); g.strokeStyle = T.ink; g.lineWidth = 2.2; g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]);
        const bx = c.x + ring * 0.75, by = c.y - ring * 0.75;
        g.beginPath(); g.arc(bx, by, 8, 0, Math.PI * 2); g.fillStyle = T.ink; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
        g.font = `800 9.5px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(pk + 1), bx, by + 0.5);
      }
      this.hits.push({ item: { kind: 'outlet', id: o.id }, x: c.x, y: c.y, r: Math.max(17, ring) });
    }
    if (d.handBends) this.guard('bends', () => this.drawBends(g, x, d.handBends, drag));
    // The picked BDO's turn knob (Jake, 19 Nov 2026: "click and rotate the BDO"): drag it round and the BDO turns with
    // its arms fixed; the ducts follow.
    const pickedBox = sel?.kind === 'box' && d.layout?.boxes?.find((b) => b.bid === sel.id);
    if (pickedBox && !(drag?.item?.kind === 'box')) {
      const c = x.pt(pickedBox.pos), a = unitVec({ x: pickedBox.axis.x, y: -pickedBox.axis.y }) ?? { x: 1, y: 0 };
      const k = { x: -a.y, y: a.x }, { wid } = this.bdoSize(x, pickedBox), r = wid / 2 + 22;
      const kn = { x: c.x + k.x * r, y: c.y + k.y * r };
      g.save();
      g.strokeStyle = T.accent; g.lineWidth = 1.5; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(c.x + k.x * (wid / 2 + 3), c.y + k.y * (wid / 2 + 3)); g.lineTo(kn.x, kn.y); g.stroke(); g.setLineDash([]);
      g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 4; g.shadowOffsetY = 1;
      g.beginPath(); g.arc(kn.x, kn.y, 10, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = T.accent; g.lineWidth = 2; g.stroke();
      // A turning arrow.
      g.strokeStyle = T.ink; g.lineWidth = 1.6; g.lineCap = 'round';
      g.beginPath(); g.arc(kn.x, kn.y, 5, -Math.PI * 0.85, Math.PI * 0.45); g.stroke();
      const ex = kn.x + 5 * Math.cos(Math.PI * 0.45), ey = kn.y + 5 * Math.sin(Math.PI * 0.45);
      g.beginPath(); g.moveTo(ex - 3.2, ey - 0.4); g.lineTo(ex, ey); g.lineTo(ex + 0.6, ey - 3.2); g.stroke();
      g.restore();
      this.hits.push({ item: { kind: 'boxTurn', id: pickedBox.bid }, x: kn.x, y: kn.y, r: 14 });
    }
  }

  /// Each lower floor with the floor above laid over it, faint and dashed, where it sits — so a dropper's foot is seen
  /// under its top (Jake, 16 Nov 2026).
  drawOverlays(g, x, view) {
    for (const ov of view?.overlays ?? []) {
      g.save(); g.setLineDash([5, 4]); g.strokeStyle = 'rgba(91,123,232,0.55)'; g.fillStyle = 'rgba(91,123,232,0.05)'; g.lineWidth = 1.3;
      for (const poly of ov.outlines) {
        const pts = poly.map(x.pt);
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.fill(); g.stroke();
      }
      g.restore();
      const all = ov.outlines.flat().map(x.pt);
      if (all.length) {
        const top = all.reduce((a, b) => (b.y < a.y ? b : a)), left = Math.min(...all.map((q) => q.x));
        g.font = `700 10px ${FONT}`; g.fillStyle = 'rgba(70,98,200,0.85)'; g.textAlign = 'left'; g.textBaseline = 'bottom';
        g.fillText(`${ov.name} above (dashed)`, left, top.y - 4);
      }
    }
  }

  /// More than one storey: each floor's name over its north-west corner.
  drawFloorLabels(g, x, view) {
    for (const f of view?.floorLabels ?? []) {
      const c = x.pt(f.pos);
      g.font = `800 11px ${FONT}`; g.fillStyle = T.body; g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText(f.text.toUpperCase(), c.x, c.y);
    }
  }

  /// Two storeys: each dropper's top on the upper floor and its foot on the ground floor, numbered and in its duct's
  /// colour, joined by a faint dashed line (the duct goes down through the house between them). Both ends drag.
  /// The pipe runs drawn by hand: the condensate drain (blue, dashed) and the refrigerant line (copper, doubled), each
  /// with its length; the one being drawn follows the clicks.
  drawLines(g, x, d) {
    const LOOK = { drain: { c: '#2F7FD8', w: 2.5, dash: [7, 5], name: 'Drain' }, refrigerant: { c: '#B8733A', w: 4, dash: null, name: 'Refrigerant' } };
    const one = (pts, kind, id, drop, draft) => {
      if (pts.length < 1) return;
      const look = LOOK[kind] ?? LOOK.drain, sp = pts.map(x.pt), on = !draft && d.selection?.kind === 'line' && d.selection.id === id;
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      if (on) { g.strokeStyle = rgba(T.accent, 0.55); g.lineWidth = look.w + 7; g.beginPath(); sp.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); }
      if (kind === 'refrigerant') { g.strokeStyle = '#fff'; g.lineWidth = look.w + 2.5; g.beginPath(); sp.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); }
      g.strokeStyle = look.c; g.lineWidth = look.w; if (look.dash) g.setLineDash(look.dash);
      g.beginPath(); sp.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
      g.setLineDash([]);
      for (const p of draft ? sp : [sp[0], sp[sp.length - 1]]) { g.beginPath(); g.arc(p.x, p.y, draft ? 4 : 3, 0, Math.PI * 2); g.fillStyle = look.c; g.fill(); }
      g.restore();
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (sp.length >= 2) {
        const at = pointAlong(sp, 0.5);
        if (at) this.tag(g, `${look.name} ${(len + (drop ?? 0)).toFixed(1)} m`, at.x, at.y - 12, look.c);
      }
      if (!draft) for (let i = 1; i < sp.length; i++) {
        const a = sp[i - 1], b = sp[i], n = Math.max(1, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 12));
        for (let k = 0; k <= n; k++) this.hits.push({ item: { kind: 'line', id }, x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n, r: 8 });
      }
    };
    for (const ln of d.project?.lines ?? []) one(ln.points, ln.kind, ln.id, ln.drop, false);
    if (d.lineDraft?.length) one(d.lineDraft, d.addMode, null, 0, true);
  }

  drawDroppers(g, x, d, report) {
    const ds = d.view?.droppers ?? [];
    if (!ds.length) return;
    const sel = d.selection, drag = this.drag?.active ? this.drag : null;
    const at = (kind, id, p) => (drag?.screen && drag.item.kind === kind && drag.item.id === id) ? drag.screen : x.pt(p);
    const sizeOf = Object.fromEntries((d.layout?.outlets ?? []).filter((o) => o.dropper).map((o) => [o.id, o.sizeMM]));
    ds.forEach((dr, i) => {
      const a = at('dropTop', dr.id, dr.top), b = at('dropFoot', dr.id, dr.bottom);
      g.save(); g.setLineDash([4, 5]); g.strokeStyle = 'rgba(16,16,16,0.22)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.restore();
      const on = sel?.kind === 'dropper' && sel.id === dr.id;
      for (const [c, kind] of [[a, 'dropTop'], [b, 'dropFoot']]) {
        const r = report ? 9 : 12;
        g.save(); g.shadowColor = 'rgba(0,0,0,0.15)'; g.shadowBlur = 3; g.shadowOffsetY = 1;
        g.beginPath(); g.arc(c.x, c.y, r, 0, Math.PI * 2);
        g.fillStyle = sizeOf[dr.id] ? ductColour(sizeOf[dr.id]) : T.ink; g.fill();
        g.restore();
        g.beginPath(); g.arc(c.x, c.y, r, 0, Math.PI * 2); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
        g.font = `800 ${report ? 8 : 10}px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('D' + (i + 1), c.x, c.y + 0.5);
        if (on) { g.beginPath(); g.arc(c.x, c.y, r + 5, 0, Math.PI * 2); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
        if (!report) this.hits.push({ item: { kind, id: dr.id }, x: c.x, y: c.y, r: 16 });
      }
      if (!report && sizeOf[dr.id]) this.tag(g, 'Ø' + sizeOf[dr.id], a.x, a.y + 21, T.ink);
    });
  }

  /// The reports' plan (the app's `Reports.planImage`): grilles and the outdoor unit, no handles or tags.
  drawReportMarks(g, x, l) {
    for (const o of l.outlets) {
      if (o.dropper) continue;
      const c = x.pt(o.pos), sw = SIDE_STYLES.has(o.style) ? this.sideWall(x, c) : null;
      sw ? this.drawSideGrille(g, c, 13, o.style, sw) : this.drawGrille(g, c, 13, o.style);
    }
    if (l.outdoor) {
      const [, out, condenser] = l.outdoor, c = x.pt(condenser), size = 22;
      g.save(); g.translate(c.x, c.y); g.rotate(-Math.atan2(out.y, out.x));
      g.beginPath(); g.roundRect(-size * 0.3, -size * 0.55, size * 0.6, size * 1.1, 3);
      g.fillStyle = '#fff'; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 1.5; g.stroke();
      g.beginPath(); g.arc(0, 0, size * 0.22, 0, Math.PI * 2); g.lineWidth = 1.2; g.stroke();
      g.beginPath(); g.arc(0, 0, size * 0.06, 0, Math.PI * 2); g.fillStyle = T.ink; g.fill();
      g.restore();
    }
  }

  tag(g, text, cx, cy, colour) {
    g.font = `800 9px ${FONT}`;
    const w = g.measureText(text).width + 10;
    g.beginPath(); g.roundRect(cx - w / 2, cy - 7, w, 14, 7); g.fillStyle = '#fff'; g.fill();
    g.fillStyle = colour; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, cy + 0.5);
  }

  // MARK: Hit testing

  /// What's under a point on the screen: a marker (last drawn on top), else a duct, else a room.
  hit(q) {
    for (let i = (this.hits?.length ?? 0) - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (h.rect ? q.x >= h.rect.x && q.x <= h.rect.x + h.rect.w && q.y >= h.rect.y && q.y <= h.rect.y + h.rect.h
        : Math.hypot(q.x - h.x, q.y - h.y) <= h.r) return h.item;
    }
    const l = this.data?.layout, x = this.x;
    if (l && x) {
      let best = null;
      const curves = this.curves(l, x);
      for (const [ri, r] of l.runs.entries()) {
        if (r.kind === 'return') continue;
        const dropper = r.keyOutlet != null && l.outlets.some((o) => o.dropper && o.id === r.keyOutlet);
        const key = r.keyBox != null ? { kind: 'feed', id: r.keyBox } : dropper ? { kind: 'dropper', id: r.keyOutlet }
          : r.keyOutlet != null ? { kind: 'outlet', id: r.keyOutlet } : null;
        if (!key) continue;
        const pts = curves[ri].map(x.pt), w = ductWidth(r.sizeMM, x.s);
        for (let i = 1; i < pts.length; i++) {
          const dd = segDist(q, pts[i - 1], pts[i]);
          if (dd <= Math.max(14, w / 2 + 8) && (!best || dd < best.d)) best = { key, d: dd };
        }
      }
      if (best) return best.key;
    }
    const w = x?.world(q);
    const room = w && this.data?.view?.rooms.find((r) => r.conditioned && pointInPolygon(w, r.polygon));
    return room ? { kind: 'room', id: room.id } : null;
  }

  // MARK: Gestures

  bind() {
    const c = this.canvas;
    const local = (e) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      const q = local(e);
      this.pointers.set(e.pointerId, q);
      if (this.pointers.size === 2) { this.pinch = { d: this.pinchDist(), zoom: this.zoom }; this.drag = null; return; }
      if (movesOnly(e, this.hand)) {
        this.drag = { start: q, last: q, item: null, active: false, pan: { ...this.pan }, moveOnly: true, cursor: c.style.cursor };
        c.style.cursor = 'grabbing';
        return;
      }
      if (this.data?.editor && this.x) {
        const h = this.data.editor.down(q, this.x, e);
        this.drag = { start: q, last: q, item: h ? { kind: 'edit', h } : null, active: false, pan: { ...this.pan } };
        return;
      }
      const interactive = this.data?.interactive !== false;
      // Placing a dropper: a tap anywhere in a room places it, over a vent or the fan coil too.
      const item = interactive && this.data?.addMode !== 'dropper' && this.data?.addMode !== 'bdo' && this.data?.addMode !== 'pen' && (this.data?.layout || this.data?.split) ? this.hitMarker(q) : null;
      this.drag = { start: q, last: q, item, active: false, pan: { ...this.pan } };
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) {
        if (this.data?.editor && this.x && e.pointerType === 'mouse') { this.data.editor.hover(local(e), this.x, e); this.draw(); }
        // Drawing a duct: the line follows the mouse from the last point.
        if (this.data?.penDraft && this.x && e.pointerType === 'mouse') { this.penHover = this.x.world(local(e)); this.draw(); }
        return;
      }
      const q = local(e);
      this.pointers.set(e.pointerId, q);
      if (this.pinch && this.pointers.size === 2) {
        this.zoom = Math.min(Math.max(this.pinch.zoom * this.pinchDist() / this.pinch.d, 0.6), ZOOM_MAX);
        this.draw();
        return;
      }
      const d = this.drag;
      if (!d) return;
      if (!d.active && Math.hypot(q.x - d.start.x, q.y - d.start.y) > 4) {
        d.active = true;
        d.screen = q;
        if (d.item && d.item.kind !== 'edit') this.on.select?.(d.item);
      }
      if (!d.active) return;
      if (d.item?.kind === 'edit') {
        this.data.editor.move(d.item.h, q, this.x, e);
      } else if (d.item) {
        d.screen = q;
        this.on.dragMove?.(d.item, this.x.world(q));
      } else {
        this.pan = { x: d.pan.x + q.x - d.start.x, y: d.pan.y + q.y - d.start.y };
      }
      this.draw();
    });
    const end = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.pinch) { if (this.pointers.size < 2) this.pinch = null; this.on.changed?.(); return; }
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      const q = local(e);
      if (d.moveOnly) {
        c.style.cursor = this.hand ? 'grab' : d.cursor;
        if (d.active) this.on.changed?.();
        this.draw();
        return;
      }
      if (d.active && d.item?.kind === 'edit') {
        this.data.editor?.up(d.item.h, q, this.x, e);
      } else if (d.active && d.item?.kind === 'zoneCard') {
        // A zone card stays where it's let go (Jake, 19 Nov 2026: "be able to to move them and lock it once it let go").
        const pos = this.x.world({ x: d.item.cx + q.x - d.start.x, y: d.item.cy + q.y - d.start.y });
        this.cardDrops = { ...(this.cardDrops ?? {}), [d.item.id]: pos };
        this.on.drop?.(d.item, pos);
      } else if (d.active && d.item) {
        this.on.drop?.(d.item, this.x.world(q));
      } else if (d.active) {
        this.on.changed?.();
      } else if (e.type === 'pointerup') {
        if (this.data?.editor) this.data.editor.tap(q, this.x, e);
        else this.tap(q);
      }
      this.draw();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!this.x) return;
      if (wheelMoves(e)) { this.panBy(-e.deltaX, -e.deltaY); return; }
      this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), local(e));    // the point under the cursor stays put
    }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());              // a right-drag moves the plan
  }

  pinchDist() {
    const [a, b] = [...this.pointers.values()];
    return Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1);
  }

  hitMarker(q) {
    for (let i = (this.hits?.length ?? 0) - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (h.rect ? q.x >= h.rect.x && q.x <= h.rect.x + h.rect.w && q.y >= h.rect.y && q.y <= h.rect.y + h.rect.h
        : Math.hypot(q.x - h.x, q.y - h.y) <= h.r) return h.item;
    }
    return null;
  }

  tap(q) {
    // Drawing a duct: the fan coil, a BDO drawn by hand or a vent is an end; anywhere else is a bend.
    if (this.data?.addMode === 'pen') {
      const h = this.hitMarker(q);
      if (h?.kind === 'unit' || h?.kind === 'outlet' || (h?.kind === 'box' && String(h.id).startsWith('H:'))) this.on.pen?.(h);
      else if (this.x) this.on.pen?.({ kind: 'point', pos: this.x.world(q) });
      return;
    }
    // New BDO: a tap on a vent picks it (again to drop it). Nothing else.
    if (this.data?.addMode === 'bdo') { const h = this.hit(q); if (h?.kind === 'outlet') this.on.pick?.(h.id); return; }
    // Drawing a pipe run: every click is a point on it, inside the house or out to the outdoor unit.
    if ((this.data?.addMode === 'drain' || this.data?.addMode === 'refrigerant') && this.x) { this.on.add?.(this.x.world(q)); return; }
    if (this.data?.addMode && this.x) {
      const w = this.x.world(q);
      if (this.data.view.rooms.some((r) => (r.conditioned || this.data.addMode === 'dropper') && pointInPolygon(w, r.polygon))) { this.on.add?.(w); return; }
    }
    if (this.data?.interactive === false) { this.on.tapRoom?.(this.x && this.x.world(q)); return; }
    this.on.select?.(this.hit(q));
  }
}

/// The convex hull of some points (monotone chain), in order round it.
function convexHull(pts) {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
