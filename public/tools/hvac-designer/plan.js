// The plan as Trust Trade Pro draws it (a port of PlanRenderer and PlanEditorView in the app): rooms tinted by zone,
// the builder's plan as linework, flex in its size colours with ribs, BDOs, zone motors, grilles, the fan coil and its
// plenum, the return, the outdoor unit and its pipes, and each room's label where it sits clear. Pan, zoom, tap to pick
// and drag to move.

export const T = {
  accent: '#E9A21C', accentSoft: '#FBEAC4', accentDeep: '#8A6A0B', ink: '#101010', inkOn: '#FAFAF8', body: '#3E3A33',
  muted: '#5E5A52', faint: '#8C877D', tint: '#F2F0EB', tile: '#F4F2ED', hair: '#EEECE7', line: '#DEDCD6',
  green: '#1B6B45', greenBg: '#E3F3E8', danger: '#B4472B', dangerBg: '#FBE4E1', bg: '#F2F2F0', cool: '#2B6CB0',
  coolBg: '#E4EEF8', returnAir: '#3E3A33', pipe: '#B0703A', ductLabel: '#1E2F7A', window: '#5FB3E6',
};
const ZONES = ['#E9A21C', '#2B6CB0', '#1B8A5A', '#8B5CF6', '#D9467A', '#0F9A9A', '#A16207', '#64748B'];
export const zoneColour = (n) => n === 0 ? '#4B5563' : ZONES[(Math.max(n, 1) - 1) % ZONES.length];
export function ductColour(mm) {
  if (mm <= 150) return '#E0342F';
  if (mm <= 200) return '#6A8DDB';
  if (mm <= 250) return '#F0CB2E';
  if (mm <= 300) return '#7DC242';
  if (mm <= 350) return '#BFC4C9';
  if (mm <= 400) return '#D35FD0';
  return '#7B3FE4';
}
const ROOM_FILL = { bed: '#2B6CB0', wet: '#0F9A9A', util: '#8C877D', none: '#C9C4BA', other: '#5E5A52' };
const roomFill = (r) => ROOM_FILL[r.designerType] ?? '#E9A21C';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

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

  xform() {
    const v = this.data?.view;
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const b = this.data?.bounds ?? v?.bounds ?? [0, 0, 10, 10];
    const minX = b[0] - 1, minY = b[1] - 1, maxX = b[2] + 1, maxY = b[3] + 1;
    const bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
    const pad = 24, inset = this.data?.insetBottom ?? 0;
    const h = Math.max(H - inset, 100);
    const s = Math.max(Math.min((W - 2 * pad) / bw, (h - 2 * pad) / bh), 1) * this.zoom;
    const ox = (W - bw * s) / 2 + this.pan.x, oy = (h - bh * s) / 2 + this.pan.y;
    return {
      s, minX, maxY, ox, oy,
      pt: (p) => ({ x: ox + (p.x - minX) * s, y: oy + (maxY - p.y) * s }),
      world: (q) => ({ x: minX + (q.x - ox) / s, y: maxY - (q.y - oy) / s }),
    };
  }

  // MARK: Drawing

  draw() {
    this.hits = [];
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
    if (d.showPlan !== false && d.backdrop && d.project?.backdrop) this.drawBackdrop(g, x, d.project.backdrop, d.backdrop, dpr);
    if (d.gaps) this.drawGaps(g, x, d.gaps);
    this.drawWindows(g, x, view, d.editor?.pickedWindow?.());
    if (layout) {
      if (d.showAir && d.air) this.drawThrow(g, x, d.view, layout, d.air);
      if (layout.outdoor) this.drawPipes(g, x, layout.unit, layout.outdoor);
      this.drawDucts(g, x, layout, { legSizes: !!d.allSizes, flow: d.showAir ? this.flow : null });
      const sel = d.selection;
      if (sel?.kind === 'feed') {
        const curves = this.curves(layout);
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
    const zoneCards = !!layout && !d.editor && !d.report && d.zoneCards !== false && (layout.zones?.length ?? 0) >= 2;
    if (d.labels !== false) this.drawLabels(g, x, view, layout, d.compact !== false, zoneCards);
    if (zoneCards && d.labels !== false) this.drawZoneCards(g, x, view, layout);
    if (layout && d.report) this.drawReportMarks(g, x, layout);
    else if (layout && !d.editor) this.drawMarkers(g, x, layout, d);
    d.editor?.overlay(g, x);
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
      const fill = z !== undefined ? (closed.has(z) ? T.line : zoneColour(z)) : roomFill(r);
      this.path(g, pts, true);
      g.fillStyle = rgba(fill, layout && z !== undefined && !closed.has(z) ? 0.22 : 0.14); g.fill();
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

  drawBackdrop(g, x, b, image, dpr) {
    g.save();
    g.globalAlpha = 0.6;
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
  curves(l) {
    if (this._curves?.l === l) return this._curves.c;
    const start = {}, end = {};
    for (const b of l.boxes) {
      (b.legRuns ?? []).forEach((ri, k) => { if (b.legDirs?.[k]) start[ri] = b.legDirs[k]; });
      if (b.inlet != null && b.inlet >= 0 && b.axis) end[b.inlet] = b.axis;
    }
    const c = l.runs.map((r, i) => {
      const pts = simplify(r.path, 0.12), n = pts.length;
      if (n < 2) return r.path;
      const first = unitVec({ x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y }) ?? { x: 1, y: 0 };
      const last = unitVec({ x: pts[n - 1].x - pts[n - 2].x, y: pts[n - 1].y - pts[n - 2].y }) ?? first;
      const along = (t, ref) => (t && t.x * ref.x + t.y * ref.y < -0.3 ? { x: -t.x, y: -t.y } : t);
      const collar = r.parent == null ? l.collars.find((cl) => Math.hypot(cl.pos.x - pts[0].x, cl.pos.y - pts[0].y) < 0.4) : null;
      const t0 = r.kind === 'return' ? first : along(unitVec(start[i] ?? collar?.dir ?? first) ?? first, first);
      const tN = r.kind === 'return' || !end[i] ? last : along(unitVec(end[i]) ?? last, last);
      const tan = pts.map((p, k) => (k === 0 ? t0 : k === n - 1 ? tN
        : unitVec({ x: pts[k + 1].x - pts[k - 1].x, y: pts[k + 1].y - pts[k - 1].y }) ?? first));
      const out = [pts[0]];
      for (let k = 0; k < n - 1; k++) {
        const a = pts[k], b = pts[k + 1], d = Math.hypot(b.x - a.x, b.y - a.y) * 0.38;
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
    this._curves = { l, c };
    return c;
  }

  drawDucts(g, x, l, { legSizes, flow }) {
    // Plenum on the unit's supply face.
    const f = l.unitDir, side = { x: f.y, y: -f.x };
    const pc = { x: l.unit.x + f.x * (l.unitDepth / 2 + l.plenumDepth / 2), y: l.unit.y + f.y * (l.unitDepth / 2 + l.plenumDepth / 2) };
    const hw = l.unitWidth * 0.46, hd = l.plenumDepth / 2;
    const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => x.pt({ x: pc.x + side.x * a + f.x * b, y: pc.y + side.y * a + f.y * b }));
    this.path(g, corners, true);
    g.fillStyle = '#B9B4AA'; g.fill(); g.strokeStyle = rgba(T.ink, 0.6); g.lineWidth = 1; g.stroke();

    const curves = this.curves(l);
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
      const text = 'ø' + r.sizeMM, tw = g.measureText(text).width;
      g.fillStyle = `rgba(255,255,255,${r.open ? 0.8 : 0.4})`;
      g.beginPath(); g.roundRect(at.x - tw / 2 - 2.5, at.y - 6.5, tw + 5, 13, 3); g.fill();
      g.fillStyle = rgba(T.ductLabel, r.open ? 1 : 0.4);
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
    // Zone motors: a dark collar across the duct; red with a cross when shut.
    for (const dm of l.dampers) {
      // On the duct as it's drawn (the curve can sit a little off the routed line).
      let c = x.pt(dm.pos), dir = { x: dm.dir.x, y: -dm.dir.y }, bestD = 1.2 * x.s;
      for (const cv of curves) {
        for (let k = 1; k < cv.length; k++) {
          const a = x.pt(cv[k - 1]), b = x.pt(cv[k]), d = segDist(x.pt(dm.pos), a, b);
          if (d < bestD) { bestD = d; c = nearestOn(x.pt(dm.pos), a, b); dir = unitVec({ x: b.x - a.x, y: b.y - a.y }) ?? dir; }
        }
      }
      const n = { x: -dir.y, y: dir.x };
      const len = Math.max(dm.sizeMM / 1000 * x.s * 0.55, 5);
      this.stroke(g, [{ x: c.x - n.x * len, y: c.y - n.y * len }, { x: c.x + n.x * len, y: c.y + n.y * len }], dm.open ? '#3A3F45' : T.danger, 3);
      if (!dm.open) {
        g.font = `900 10px ${FONT}`; g.fillStyle = T.danger; g.fillText('✕', c.x + 9, c.y - 9);
      }
    }
    // BDOs: grey fittings.
    for (const b of l.boxes) {
      const c = x.pt(b.pos), r = Math.max(0.2 * x.s, 6);
      g.beginPath(); g.arc(c.x, c.y, r, 0, Math.PI * 2);
      g.fillStyle = '#D5D8DC'; g.fill(); g.strokeStyle = '#6B7178'; g.lineWidth = 1.4; g.stroke();
      g.beginPath(); g.arc(c.x, c.y, r * 0.35, 0, Math.PI * 2); g.fillStyle = '#8A9097'; g.fill();
    }
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
      busy.push({ p: x.pt(layout.unit), r: layout.unitWidth / 2 * x.s, w: BLOCKED });
      busy.push({ p: x.pt(layout.returnGrille), r: 16, w: BLOCKED });
      for (const p of this.sizeSpots ?? []) busy.push({ p, r: 16, w: 20 });     // the ducts' sizes stay readable
      if (layout.outdoor) {
        const c = x.pt(layout.outdoor[2]);
        busy.push({ p: c, r: 22, w: BLOCKED }, { p: { x: c.x, y: c.y + 26 }, r: 14, w: BLOCKED });
      }
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

  /// A card for each zone, as a duct layout drawing has them: the zone in its colour, its load, its air and its floor.
  /// Each sits by its zone — off the house where there's room, clear of the rooms' names, the vents and the other
  /// cards — with a line to the zone when it's had to go further out.
  drawZoneCards(g, x, view, layout) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight - (this.data?.insetBottom ?? 0);
    const rooms = view.rooms.filter((r) => r.polygon.length >= 3).map((r) => {
      const pts = r.polygon.map(x.pt), xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      return { r, pts, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
    });
    const inRoom = (p, only = null) => rooms.find((m) => (!only || only.has(m.r.id)) && p.x >= m.box[0] && p.x <= m.box[2]
      && p.y >= m.box[1] && p.y <= m.box[3] && pointInPolygon(p, m.pts));
    const byId = Object.fromEntries(view.rooms.map((r) => [r.id, r]));
    // The rooms a zone feeds: those with vents, and their open area's others (the kitchen) — not a hallway with none.
    const vented = new Set(layout.outlets.map((o) => o.roomId));
    const fedAreas = new Set(view.rooms.filter((r) => vented.has(r.id) && r.openArea).map((r) => r.openArea));
    const fed = (r) => vented.has(r.id) || (r.openArea && fedAreas.has(r.openArea));
    const placed = [], cards = [];
    const zones = [...layout.zones].filter((z) => z.roomIds.some((id) => byId[id]))
      .sort((a, b) => (a.number === 0) - (b.number === 0) || a.number - b.number);
    for (const z of zones) {
      const all = z.roomIds.map((id) => byId[id]).filter(Boolean);
      const mine = all.some(fed) ? all.filter(fed) : all;
      const ids = new Set(mine.map((r) => r.id));
      const kw = mine.reduce((t, r) => t + r.kw, 0), m2 = mine.reduce((t, r) => t + r.area, 0);
      const lines = [[z.number === 0 ? 'Always on' : `Zone ${z.number}`, `800 11.5px ${FONT}`],
        [`${kw.toFixed(2)} kW`, `600 10.5px ${FONT}`], [`${Math.round(z.designLps)} L/s`, `600 10.5px ${FONT}`],
        [`${m2.toFixed(1)} m²`, `600 10.5px ${FONT}`]];
      let tw = 0;
      for (const [t, f] of lines) { g.font = f; tw = Math.max(tw, g.measureText(t).width); }
      const w = Math.ceil(tw) + 18, h = 13 * lines.length + 9;
      // Where the zone is: the middle of its biggest room's floor.
      const big = mine.reduce((a, b) => (b.area > a.area ? b : a));
      const anchor = x.pt(big.centroid ?? big.polygon[0]);
      const cost = (c) => {
        if (c.x < 6 || c.y < 6 || c.x + c.w > W - 6 || c.y + c.h > H - 6) return Infinity;
        let n = 0;
        for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) {
          const p = { x: c.x + c.w * i / 2, y: c.y + c.h * j / 2 }, m = inRoom(p);
          if (m) n += ids.has(m.r.id) ? 12 : m.r.conditioned ? 30 : 5;     // a garage or a robe's fine to sit over
        }
        const pad = 5;
        for (const o of placed) if (c.x < o.x + o.w + pad && c.x + c.w + pad > o.x && c.y < o.y + o.h + pad && c.y + c.h + pad > o.y) n += 500;
        for (const o of this.labelRects ?? []) if (c.x < o.x + o.w && c.x + c.w > o.x && c.y < o.y + o.h && c.y + c.h > o.y) n += 120;
        for (const b of this.busy ?? []) if (b.p.x >= c.x - b.r && b.p.x <= c.x + c.w + b.r && b.p.y >= c.y - b.r && b.p.y <= c.y + c.h + b.r) n += b.w > 1 ? 60 : 5;
        for (const p of this.sizeSpots ?? []) if (p.x >= c.x - 16 && p.x <= c.x + c.w + 16 && p.y >= c.y - 7 && p.y <= c.y + c.h + 7) n += 60;
        // Close to the zone, and a short line back to it that doesn't cut across other zones' rooms.
        const cx = Math.max(c.x, Math.min(anchor.x, c.x + c.w)), cy = Math.max(c.y, Math.min(anchor.y, c.y + c.h));
        const reach = Math.hypot(cx - anchor.x, cy - anchor.y);
        const inCard = (p, o) => p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h;
        for (let k = 1, steps = Math.floor(reach / 10); k < steps; k++) {
          const q = { x: anchor.x + (cx - anchor.x) * k / steps, y: anchor.y + (cy - anchor.y) * k / steps };
          const m = inRoom(q);
          if (m && !ids.has(m.r.id) && m.r.conditioned) n += 4;
          if (placed.some((o) => inCard(q, o))) n += 40;                  // its line through another card
        }
        // Nor over another card's line.
        for (const o of placed) {
          if (!o.line) continue;
          for (let k = 1; k < 12; k++) {
            const q = { x: o.line[0].x + (o.line[1].x - o.line[0].x) * k / 12, y: o.line[0].y + (o.line[1].y - o.line[0].y) * k / 12 };
            if (inCard(q, c)) { n += 40; break; }
          }
        }
        return n + reach * 0.5;
      };
      let best = null, bestCost = Infinity;
      for (let rad = 0; rad <= 420; rad += 14) {
        const steps = rad ? 16 : 1;
        for (let k = 0; k < steps; k++) {
          const a = k / steps * Math.PI * 2;
          const c = { x: anchor.x + Math.cos(a) * rad - w / 2, y: anchor.y + Math.sin(a) * rad - h / 2, w, h };
          const v = cost(c);
          if (v < bestCost) { bestCost = v; best = c; }
        }
      }
      if (!best || bestCost >= 500) continue;
      const ex = Math.max(best.x, Math.min(anchor.x, best.x + best.w)), ey = Math.max(best.y, Math.min(anchor.y, best.y + best.h));
      placed.push({ ...best, line: Math.hypot(ex - anchor.x, ey - anchor.y) > 26 ? [anchor, { x: ex, y: ey }] : null });
      cards.push({ z, c: best, lines, anchor, ids });
    }
    for (const { z, c, lines, anchor, ids } of cards) {
      const tone = z.open ? zoneColour(z.number) : T.faint;
      // A line back to the zone when the card's off it.
      const mid = { x: c.x + c.w / 2, y: c.y + c.h / 2 };
      if (!inRoom(mid, ids)) {
        const ex = Math.max(c.x, Math.min(anchor.x, c.x + c.w)), ey = Math.max(c.y, Math.min(anchor.y, c.y + c.h));
        if (Math.hypot(ex - anchor.x, ey - anchor.y) > 26) {
          g.strokeStyle = rgba(tone, 0.75); g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(ex, ey); g.lineTo(anchor.x, anchor.y); g.stroke();
          g.beginPath(); g.arc(anchor.x, anchor.y, 2.6, 0, Math.PI * 2); g.fillStyle = tone; g.fill();
        }
      }
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.14)'; g.shadowBlur = 4; g.shadowOffsetY = 1;
      g.beginPath(); g.roundRect(c.x, c.y, c.w, c.h, 6); g.fillStyle = '#fff'; g.fill();
      g.restore();
      g.beginPath(); g.roundRect(c.x, c.y, c.w, c.h, 6); g.strokeStyle = rgba(tone, 0.55); g.lineWidth = 1; g.stroke();
      g.fillStyle = tone; g.fillRect(c.x, c.y + 5, 3, c.h - 10);
      g.textAlign = 'left'; g.textBaseline = 'top';
      lines.forEach(([t, f], i) => { g.font = f; g.fillStyle = i ? (z.open ? T.body : T.faint) : tone; g.fillText(t, c.x + 9, c.y + 5 + i * 13); });
    }
  }

  drawGrille(g, c, size) {
    const h = size / 2;
    g.beginPath(); g.roundRect(c.x - h, c.y - h, size, size, size * 0.12);
    g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#3A3F45'; g.lineWidth = Math.max(1, size * 0.09); g.stroke();
    const inset = size * 0.24;
    g.lineWidth = Math.max(0.8, size * 0.07);
    for (let i = 0; i < 3; i++) {
      const y = c.y - h + inset + i * (size - 2 * inset) / 2;
      g.beginPath(); g.moveTo(c.x - h + inset, y); g.lineTo(c.x + h - inset, y); g.stroke();
    }
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
        this.tag(g, 'RA Ø' + l.returnMM, c.x, c.y + below + 11, T.returnAir);
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
        g.fillStyle = '#BFBFBF'; g.fillRect(depth / 2 - 0.5, -width / 2 + 2, plenum, width - 4);
        if (sel?.kind === 'unit') {
          g.beginPath(); g.roundRect(-depth / 2 - 4, -width / 2 - 4, depth + plenum + 8, width + 8, 6); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke();
        }
        g.restore();
        // The label runs along the unit, the right way up.
        let a = turn + Math.PI / 2;
        while (a > Math.PI / 2) a -= Math.PI;
        while (a <= -Math.PI / 2) a += Math.PI;
        g.save(); g.translate(c.x, c.y); g.rotate(a);
        g.font = `800 8px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('FAN COIL', 0, 0);
        g.restore();
      });
      this.hits.push({ item: { kind: 'unit' }, x: c.x, y: c.y, r: Math.max(width / 2, 27) });
    }
    // BDO handles: a ring when picked, a pin once moved by hand.
    for (const b of l.boxes) {
      if (!b.bid || b.branches < 2) continue;
      const c = at('box', b.bid, x.pt(b.pos));
      if (sel?.kind === 'box' && sel.id === b.bid) { g.beginPath(); g.arc(c.x, c.y, 13, 0, Math.PI * 2); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      if (b.pinned) {
        // A pin: moved by hand, so it stays put when the rest re-routes.
        g.strokeStyle = T.accentDeep; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(c.x + 10, c.y - 9); g.lineTo(c.x + 10, c.y - 4); g.stroke();
        g.beginPath(); g.arc(c.x + 10, c.y - 11, 2.8, 0, Math.PI * 2); g.fillStyle = T.accentDeep; g.fill();
      }
      if (drag?.item.kind === 'box' && drag.item.id === b.bid) {
        const r = Math.max(0.2 * x.s, 6);
        g.beginPath(); g.arc(c.x, c.y, r, 0, Math.PI * 2); g.fillStyle = '#D5D8DC'; g.fill(); g.strokeStyle = '#6B7178'; g.lineWidth = 1.4; g.stroke();
      }
      this.hits.push({ item: { kind: 'box', id: b.bid }, x: c.x, y: c.y, r: 17 });
    }
    // Outlets: the grille alone (its size is its leg's colour, and on its card).
    for (const o of l.outlets) {
      const c = at('outlet', o.id, x.pt(o.pos)), size = Math.min(Math.max((o.sizeMM + 150) / 1000 * x.s, 15), 34);
      shadow(() => this.drawGrille(g, c, size));
      const ring = size / 2 + 5;
      if (sel?.kind === 'outlet' && sel.id === o.id) { g.beginPath(); g.roundRect(c.x - ring, c.y - ring, ring * 2, ring * 2, 5); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      this.hits.push({ item: { kind: 'outlet', id: o.id }, x: c.x, y: c.y, r: Math.max(17, ring) });
    }
  }

  /// The reports' plan (the app's `Reports.planImage`): grilles and the outdoor unit, no handles or tags.
  drawReportMarks(g, x, l) {
    for (const o of l.outlets) this.drawGrille(g, x.pt(o.pos), 13);
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
      if (Math.hypot(q.x - h.x, q.y - h.y) <= h.r) return h.item;
    }
    const l = this.data?.layout, x = this.x;
    if (l && x) {
      let best = null;
      const curves = this.curves(l);
      for (const [ri, r] of l.runs.entries()) {
        if (r.kind === 'return') continue;
        const key = r.keyBox != null ? { kind: 'feed', id: r.keyBox } : r.keyOutlet != null ? { kind: 'outlet', id: r.keyOutlet } : null;
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
      const item = interactive && this.data?.layout ? this.hitMarker(q) : null;
      this.drag = { start: q, last: q, item, active: false, pan: { ...this.pan } };
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) {
        if (this.data?.editor && this.x && e.pointerType === 'mouse') { this.data.editor.hover(local(e), this.x, e); this.draw(); }
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
      if (Math.hypot(q.x - h.x, q.y - h.y) <= h.r) return h.item;
    }
    return null;
  }

  tap(q) {
    if (this.data?.addMode && this.x) {
      const w = this.x.world(q);
      if (this.data.view.rooms.some((r) => r.conditioned && pointInPolygon(w, r.polygon))) { this.on.add?.(w); return; }
    }
    if (this.data?.interactive === false) { this.on.tapRoom?.(this.x && this.x.world(q)); return; }
    this.on.select?.(this.hit(q));
  }
}
