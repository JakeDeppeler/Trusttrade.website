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
    if (layout) {
      if (d.showAir && d.air) this.drawThrow(g, x, d.view, layout, d.air);
      if (layout.outdoor) this.drawPipes(g, x, layout.unit, layout.outdoor);
      this.drawDucts(g, x, layout, { legSizes: !!d.allSizes, flow: d.showAir ? this.flow : null });
      const sel = d.selection;
      if (sel?.kind === 'feed') {
        for (const r of layout.runs) {
          if (r.keyBox !== sel.id) continue;
          const w = Math.min(Math.max(r.sizeMM / 1000 * x.s * 0.9, 3), 22);
          this.stroke(g, r.path.map(x.pt), T.accent, w + 7);
          this.stroke(g, r.path.map(x.pt), ductColour(r.sizeMM), w);
        }
      }
    }
    if (d.selection?.kind === 'room') {
      const r = d.view.rooms.find((r) => r.id === d.selection.id);
      if (r) { this.path(g, r.polygon.map(x.pt), true); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
    }
    if (d.labels !== false) this.drawLabels(g, x, view, layout, d.compact !== false);
    if (layout && d.report) this.drawReportMarks(g, x, layout);
    else if (layout && !d.editor) this.drawMarkers(g, x, layout, d);
    d.editor?.overlay(g, x);
  }

  path(g, pts, close) {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    if (close) g.closePath();
  }

  stroke(g, pts, colour, w, cap = 'round', dash = null) {
    this.path(g, pts, false);
    g.strokeStyle = colour; g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round';
    g.setLineDash(dash || []);
    g.stroke();
    g.setLineDash([]);
  }

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
      g.fillStyle = rgba(fill, 0.14); g.fill();
      g.strokeStyle = rgba(T.ink, 0.55); g.lineWidth = 1.5; g.stroke();
      for (const w of r.windows) this.stroke(g, [x.pt(w[0]), x.pt(w[1])], T.window, 4, 'butt');
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

  drawDucts(g, x, l, { legSizes, flow }) {
    // Plenum on the unit's supply face.
    const f = l.unitDir, side = { x: f.y, y: -f.x };
    const pc = { x: l.unit.x + f.x * (l.unitDepth / 2 + l.plenumDepth / 2), y: l.unit.y + f.y * (l.unitDepth / 2 + l.plenumDepth / 2) };
    const hw = l.unitWidth * 0.46, hd = l.plenumDepth / 2;
    const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => x.pt({ x: pc.x + side.x * a + f.x * b, y: pc.y + side.y * a + f.y * b }));
    this.path(g, corners, true);
    g.fillStyle = '#B9B4AA'; g.fill(); g.strokeStyle = rgba(T.ink, 0.6); g.lineWidth = 1; g.stroke();

    const runs = [...l.runs].sort((a, b) => (a.kind === 'return' ? 0 : 1) - (b.kind === 'return' ? 0 : 1));
    for (const r of runs) {
      const pts = r.path.map(x.pt);
      const w = Math.min(Math.max(r.sizeMM / 1000 * x.s * 0.9, 3), 22);
      const alpha = r.open ? 1 : 0.3;
      this.stroke(g, pts, `rgba(255,255,255,${alpha})`, w + 2.5);
      this.stroke(g, pts, rgba(ductColour(r.sizeMM), alpha), w);
      if (w >= 4) {
        this.stroke(g, pts, `rgba(0,0,0,${0.13 * alpha})`, w, 'butt', [1.1, Math.max(2.2, w * 0.32)]);
        this.stroke(g, pts, `rgba(255,255,255,${0.28 * alpha})`, w * 0.3);
      }
    }
    // Sizes: a little off the duct near the middle of each run (only trunks and BDO feeds unless asked).
    const placed = [];
    g.font = `600 9.5px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const r of l.runs) {
      if (!(legSizes || r.outlet == null)) continue;
      const pts = r.path.map(x.pt);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (len <= 55 || pts.length < 2) continue;
      let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], dd = Math.hypot(b.x - a.x, b.y - a.y);
        if (acc + dd >= len * 0.5 && dd > 0) {
          const t = (len * 0.5 - acc) / dd;
          const m = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, n = { x: -(b.y - a.y) / dd, y: (b.x - a.x) / dd };
          const off = r.sizeMM / 1000 * x.s * 0.45 + 8;
          const at = { x: m.x + n.x * off, y: m.y + n.y * off };
          if (placed.some((p) => Math.hypot(p.x - at.x, p.y - at.y) < 30)) break;
          placed.push(at);
          g.fillStyle = rgba(T.ductLabel, r.open ? 1 : 0.4);
          g.fillText('ø' + r.sizeMM, at.x, at.y);
          break;
        }
        acc += dd;
      }
    }
    // Moving dots along each open run (supply out, return back).
    if (flow != null) {
      g.fillStyle = '#fff';
      for (const r of l.runs) {
        if (!r.open) continue;
        const pts = r.path.map(x.pt), segs = [0];
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
      const c = x.pt(dm.pos), n = { x: -dm.dir.y, y: -dm.dir.x };
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

  drawLabels(g, x, view, layout, compact) {
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
    }
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
      if (r.conditioned) {
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
      g.fillStyle = 'rgba(255,255,255,0.78)';
      g.beginPath(); g.roundRect(card.x, card.y, card.w, card.h, 5); g.fill();
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.font = nameFont; g.fillStyle = nameColour; g.fillText(name, card.x + 4, card.y + 2.5);
      if (detail) { g.font = detailFont; g.fillStyle = tone; g.fillText(detail, card.x + 4, card.y + 3 + nameH, card.w - 6); }
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
    {
      const c = at('ret', null, x.pt(l.returnGrille));
      shadow(() => {
        g.beginPath(); g.roundRect(c.x - 13, c.y - 11.5, 26, 26, 3); g.fillStyle = T.returnAir; g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 4; i++) g.fillRect(c.x - 8, c.y - 6.75 + i * 4.5, 16, 1.5);
        this.tag(g, 'RA Ø' + l.returnMM, c.x, c.y + 24.5, T.returnAir);
      });
      if (sel?.kind === 'ret') { g.beginPath(); g.roundRect(c.x - 17, c.y - 15.5, 34, 34, 5); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      this.hits.push({ item: { kind: 'ret' }, x: c.x, y: c.y + 1.5, r: 18 });
    }
    // Fan coil: the body turns with its plenum, the label stays upright.
    {
      const c = at('unit', null, x.pt(l.unit));
      shadow(() => {
        g.save(); g.translate(c.x, c.y); g.rotate(-Math.atan2(l.unitDir.y, l.unitDir.x));
        g.beginPath(); g.roundRect(-26 + 4 - 4.5, -12, 52, 24, 4); g.fillStyle = T.ink; g.fill();
        g.fillStyle = '#BFBFBF'; g.fillRect(26 - 0.5, -10, 9, 20);
        if (sel?.kind === 'unit') { g.beginPath(); g.roundRect(-30.5, -16, 70, 32, 6); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
        g.restore();
        g.font = `800 8px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('FAN COIL', c.x, c.y);
      });
      this.hits.push({ item: { kind: 'unit' }, x: c.x, y: c.y, r: 27 });
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
      const c = at('outlet', o.id, x.pt(o.pos));
      shadow(() => this.drawGrille(g, c, 15));
      if (sel?.kind === 'outlet' && sel.id === o.id) { g.beginPath(); g.roundRect(c.x - 13, c.y - 13, 26, 26, 5); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
      this.hits.push({ item: { kind: 'outlet', id: o.id }, x: c.x, y: c.y, r: 17 });
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
      for (const r of l.runs) {
        if (r.kind === 'return') continue;
        const key = r.keyBox != null ? { kind: 'feed', id: r.keyBox } : r.keyOutlet != null ? { kind: 'outlet', id: r.keyOutlet } : null;
        if (!key) continue;
        const pts = r.path.map(x.pt), w = Math.min(Math.max(r.sizeMM / 1000 * x.s * 0.9, 3), 22);
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
        this.zoom = Math.min(Math.max(this.pinch.zoom * this.pinchDist() / this.pinch.d, 0.6), 8);
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
      const q = local(e), before = this.x.world(q);
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      this.zoom = Math.min(Math.max(this.zoom * k, 0.6), 8);
      // Keep the point under the cursor where it is.
      const x = this.xform(), after = x.pt(before);
      this.pan = { x: this.pan.x + q.x - after.x, y: this.pan.y + q.y - after.y };
      this.draw();
      this.on.changed?.();
    }, { passive: false });
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
