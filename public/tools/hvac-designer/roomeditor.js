// The room editor ("Edit the rooms"): the house's rooms over the builder's drawing, to put right what the plan reading
// got wrong or to draw the house by hand. Drag a corner or a wall (the room next door comes too), drag a wall's + to put
// a corner in it, draw a room corner by corner, draw the windows along the outside walls, set the scale from a length
// you know. It runs on the plan canvas
// (plan.js calls down/move/up/tap/hover and draws underlay/overlay); every change goes through the engine's edits
// (JobEdits — the ones the app's plan editor makes), so the house stays one the designer can lay ducts in.

import { T, pointInPolygon, drawWindowMark } from './plan.js?v=a650aa1-202610151309';

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const round = (v, step) => Math.round(v / step) * step;

export function signedArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q.x * r.y - r.x * q.y; }
  return a / 2;
}

/// The nearest point on a segment.
function nearest(p, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.y - a.y) * ey) / l2)) : 0;
  return { x: a.x + ex * t, y: a.y + ey * t };
}

/// An edge's left-hand normal — the engine's `PlanEdit.normal`, which its moveWall moves along.
function normal(a, b) {
  const l = Math.max(dist(a, b), 1e-9);
  return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
}

/// Two edges on one wall line (the engine's `PlanEdit.onLine`).
export function onLine(a0, a1, b0, b1) {
  const la = dist(a0, a1), lb = dist(b0, b1);
  if (la <= 0.05 || lb <= 0.05) return false;
  const t = { x: (a1.x - a0.x) / la, y: (a1.y - a0.y) / la }, u = { x: (b1.x - b0.x) / lb, y: (b1.y - b0.y) / lb };
  if (Math.abs(t.x * u.y - t.y * u.x) >= 0.05) return false;
  const off = (p) => Math.abs((p.x - a0.x) * t.y - (p.y - a0.y) * t.x);
  if (off(b0) >= 0.15 || off(b1) >= 0.15) return false;
  const s0 = (b0.x - a0.x) * t.x + (b0.y - a0.y) * t.y, s1 = (b1.x - a0.x) * t.x + (b1.y - a0.y) * t.y;
  return Math.min(la, Math.max(s0, s1)) - Math.max(0, Math.min(s0, s1)) > 0.2;
}

/// Every room edge on the wall line of `seg`, as [room index, edge index] (the engine's `PlanEdit.linkedEdges`).
function linkedEdges(seg, rooms) {
  const out = [], queue = [seg], seen = new Set();
  while (queue.length) {
    const s = queue.pop();
    rooms.forEach((r, k) => {
      const p = r.polygon;
      if (p.length < 3) return;
      for (let e = 0; e < p.length; e++) {
        const key = k + ':' + e;
        if (seen.has(key)) continue;
        const c = p[e], f = p[(e + 1) % p.length];
        if (onLine(s[0], s[1], c, f)) { seen.add(key); out.push([k, e]); queue.push([c, f]); }
      }
    });
  }
  return out;
}

export const metres = (m) => (Math.abs(m) >= 10 ? m.toFixed(1) : m.toFixed(2)) + ' m';

export class RoomEditor {
  /// hooks: commit(op, args) → Promise<reply|null>, changed() (selection or mode: the panel), finishRoom(points),
  /// measured(a, b), redraw().
  constructor(hooks) {
    this.h = hooks;
    this.mode = 'edit';
    this.sel = null;           // {kind: 'room', id, corner?, edge?} | {kind: 'gap', key} | {kind: 'window', room, n}
    this.rooms = [];
    this.gaps = [];
    this.live = null;          // rooms as they're being dragged
    this.draft = [];           // a room being drawn, corner by corner
    this.measure = [];         // the two ends of a length being measured
    this.hoverPt = null;
    this.guides = [];
    this.busy = false;
    this.hasImage = false;
    this.canvas = null;
    /// False while a hand-drawn plan hasn't had its size set: its lengths mean nothing yet, so none are shown.
    this.sized = true;
    this.hoverWall = null;
    this.winDrag = null;       // a window being drawn: {room, edge, a, b}
  }

  set({ rooms, gaps, hasImage, canvas, sized }) {
    if (sized !== undefined) this.sized = sized;
    if (rooms) this.rooms = rooms;
    if (gaps) this.gaps = gaps;
    if (hasImage !== undefined) this.hasImage = hasImage;
    if (canvas) this.canvas = canvas;
    this.live = null;
    if (this.sel?.kind === 'room') {
      const r = this.room(this.sel.id);
      if (!r) this.sel = null;
      else {
        if (this.sel.corner != null && this.sel.corner >= r.polygon.length) delete this.sel.corner;
        if (this.sel.edge != null && this.sel.edge >= r.polygon.length) delete this.sel.edge;
      }
    } else if (this.sel?.kind === 'gap' && !this.gaps.some((g) => g.key === this.sel.key)) this.sel = null;
    else if (this.sel?.kind === 'window' && !this.room(this.sel.room)?.windows?.[this.sel.n]) this.sel = null;
  }

  /// The window that's picked, for the plan to show it.
  pickedWindow() { return this.sel?.kind === 'window' ? this.sel : null; }

  liveRooms() { return this.live ?? this.rooms; }
  room(id) { return this.rooms.find((r) => r.id === id); }
  selRoom() { return this.sel?.kind === 'room' ? this.room(this.sel.id) : null; }

  setMode(mode) {
    this.mode = mode;
    this.draft = [];
    this.measure = [];
    this.hoverPt = null;
    this.hoverWall = null;
    this.guides = [];
    this.winDrag = null;
    if (mode !== 'edit' && !(mode === 'window' && this.sel?.kind === 'window')) this.sel = null;
    if (this.canvas) this.canvas.style.cursor = mode === 'edit' || mode === 'window' ? '' : 'crosshair';
    this.h.changed();
    this.h.redraw();
  }

  // MARK: Snapping

  /// A point as it lands: on another room's corner, square with the corners either side, in line with a corner
  /// elsewhere, or on a wall — within a few pixels. Shift places it exactly where it is.
  snap(p, x, { skip = null, refs = [], free = false } = {}) {
    this.guides = [];
    const step = this.hasImage ? 0.01 : 0.05;
    if (free) return { x: round(p.x, 0.01), y: round(p.y, 0.01) };
    const tol = 10 / x.s, line = 7 / x.s;
    let best = null;
    for (const r of this.rooms) {
      r.polygon.forEach((v, i) => {
        if (skip?.has(r.id + ':' + i)) return;
        const d = dist(v, p);
        if (d < tol && (!best || d < best.d)) best = { v, d };
      });
    }
    if (best) { this.guides.push({ ring: best.v }); return { x: best.v.x, y: best.v.y }; }
    const out = { x: p.x, y: p.y };
    let sx = null, sy = null;
    for (const r of refs) {
      if (sx == null && Math.abs(p.x - r.x) < line) { out.x = r.x; sx = r; }
      if (sy == null && Math.abs(p.y - r.y) < line) { out.y = r.y; sy = r; }
    }
    if (sx == null || sy == null) {
      for (const r of this.rooms) {
        r.polygon.forEach((v, i) => {
          if (skip?.has(r.id + ':' + i)) return;
          if (sx == null && Math.abs(p.x - v.x) < line * 0.7) { out.x = v.x; sx = v; }
          if (sy == null && Math.abs(p.y - v.y) < line * 0.7) { out.y = v.y; sy = v; }
        });
      }
    }
    if (sx) this.guides.push({ from: { x: out.x, y: sx.y }, to: out });
    if (sy) this.guides.push({ from: { x: sy.x, y: out.y }, to: out });
    if (sx == null && sy == null) {
      let wall = null;
      for (const r of this.rooms) {
        const poly = r.polygon;
        for (let i = 0; i < poly.length; i++) {
          const q = nearest(p, poly[i], poly[(i + 1) % poly.length]), d = dist(q, p);
          if (d < line && (!wall || d < wall.d)) wall = { q, d };
        }
      }
      if (wall) { this.guides.push({ ring: wall.q, small: true }); return wall.q; }
    }
    if (sx == null) out.x = round(out.x, step);
    if (sy == null) out.y = round(out.y, step);
    return out;
  }

  // MARK: Hit testing (screen pixels)

  handles(x) {
    const r = this.selRoom();
    if (!r || this.mode !== 'edit') return [];
    const pts = r.polygon.map(x.pt), out = [];
    pts.forEach((p, i) => out.push({ type: 'corner', i, x: p.x, y: p.y }));
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      if (dist(p, q) > 70) out.push({ type: 'bend', edge: i, x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
    });
    return out;
  }

  handleAt(q, x) {
    let best = null;
    for (const h of this.handles(x)) {
      const d = Math.hypot(q.x - h.x, q.y - h.y);
      if (d <= 10 && (!best || d < best.d || (h.type === 'corner' && best.h.type !== 'corner' && d <= best.d + 3))) best = { h, d };
    }
    return best?.h ?? null;
  }

  wallAt(q, x) {
    let best = null;
    const sel = this.selRoom();
    for (const r of this.rooms) {
      const pts = r.polygon.map(x.pt);
      for (let e = 0; e < pts.length; e++) {
        const d = dist(nearest(q, pts[e], pts[(e + 1) % pts.length]), q);
        const bias = r === sel ? -2 : 0;               // on a shared wall, the room that's picked
        if (d <= 7 && (!best || d + bias < best.d)) best = { room: r.id, edge: e, d: d + bias };
      }
    }
    return best;
  }

  /// The outside wall under a point (where a window can go): the room, its outline's edge, and the spot on the wall.
  outsideAt(q, x) {
    let best = null;
    for (const r of this.rooms) {
      const n = r.polygon.length;
      for (let e = 0; e < n; e++) {
        if (!r.outside?.[e]) continue;
        const a = r.polygon[e], b = r.polygon[(e + 1) % n], p = nearest(x.world(q), a, b);
        const d = dist(x.pt(p), q);
        if (d <= 12 && (!best || d < best.d)) best = { room: r.id, edge: e, p, d };
      }
    }
    return best;
  }

  /// The window under a point.
  windowAt(q, x) {
    let best = null;
    for (const r of this.rooms) {
      (r.windows ?? []).forEach((w, n) => {
        const d = dist(nearest(q, x.pt(w[0]), x.pt(w[1])), q);
        if (d <= 7 && (!best || d < best.d)) best = { room: r.id, n, d };
      });
    }
    return best;
  }

  /// A spot on a wall, to the centimetre along it (5 cm drawing on a grid).
  onWall(room, edge, p) {
    const r = this.room(room), n = r.polygon.length, a = r.polygon[edge], b = r.polygon[(edge + 1) % n];
    const l = Math.max(dist(a, b), 1e-9), step = this.hasImage ? 0.01 : 0.05;
    const t = Math.max(0, Math.min(l, round(((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l, step)));
    return { x: a.x + (b.x - a.x) / l * t, y: a.y + (b.y - a.y) / l * t };
  }

  /// A window drawn (a tap when `b` is `a`): in it goes, and it's the one picked, to type its size.
  async drawWindow(room, edge, a, b) {
    this.busy = true;
    const reply = await this.h.commit('drawWindow', { room, edge, pos: a, to: b });
    this.busy = false;
    this.winDrag = null;
    const r = this.room(room);
    if (reply && r?.windows?.length) this.sel = { kind: 'window', room, n: r.windows.length - 1 };
    this.h.changed();
    this.h.redraw();
  }

  // MARK: Pointer (plan.js)

  down(q, x) {
    if (this.busy) return null;
    if (this.mode === 'window') {
      const w = this.outsideAt(q, x);
      return w ? { type: 'window', room: w.room, edge: w.edge, a: this.onWall(w.room, w.edge, w.p) } : null;
    }
    if (this.mode !== 'edit') return null;
    const r = this.selRoom(), h = r && this.handleAt(q, x);
    if (h) return { ...h, room: r.id, start: x.world(q) };
    const w = this.wallAt(q, x);
    if (w) {
      const room = this.room(w.room), a = room.polygon[w.edge], b = room.polygon[(w.edge + 1) % room.polygon.length];
      return { type: 'wall', room: w.room, edge: w.edge, start: x.world(q), links: linkedEdges([a, b], this.rooms) };
    }
    return null;
  }

  move(h, q, x, e) {
    const r = this.room(h.room);
    if (!r) return;
    const free = e.shiftKey, w = x.world(q), n = r.polygon.length;
    if (h.type === 'window') {
      h.b = this.onWall(h.room, h.edge, w);
      this.winDrag = { room: h.room, edge: h.edge, a: h.a, b: h.b };
    } else if (h.type === 'corner') {
      const from = r.polygon[h.i];
      const skip = new Set();
      for (const rm of this.rooms) rm.polygon.forEach((v, i) => { if ((rm === r && i === h.i) || (rm !== r && dist(v, from) < 0.1)) skip.add(rm.id + ':' + i); });
      const p = this.snap(w, x, { skip, refs: [r.polygon[(h.i + n - 1) % n], r.polygon[(h.i + 1) % n]], free });
      h.to = p;
      this.live = this.rooms.map((rm) => ({ ...rm, polygon: rm.polygon.map((v, i) => (skip.has(rm.id + ':' + i) ? p : v)) }));
      if (!this.sel || this.sel.id !== r.id || this.sel.corner !== h.i) { this.sel = { kind: 'room', id: r.id, corner: h.i }; this.h.changed(); }
    } else if (h.type === 'bend') {
      const a = r.polygon[h.edge], b = r.polygon[(h.edge + 1) % n];
      const p = this.snap(w, x, { refs: [a, b], free });
      h.outline = [...r.polygon.slice(0, h.edge + 1), p, ...r.polygon.slice(h.edge + 1)];
      this.live = this.rooms.map((rm) => (rm === r ? { ...rm, polygon: h.outline } : rm));
    } else if (h.type === 'wall') {
      const a = r.polygon[h.edge], b = r.polygon[(h.edge + 1) % n], nrm = normal(a, b);
      let d = (w.x - h.start.x) * nrm.x + (w.y - h.start.y) * nrm.y;
      this.guides = [];
      if (!free) {
        // Lined up with another corner on the plan, else to the centimetre (to 5 cm drawing on a grid).
        const moving = new Set(h.links.flatMap(([k, ed]) => [k + ':' + ed, k + ':' + ((ed + 1) % this.rooms[k].polygon.length)]));
        let best = null;
        this.rooms.forEach((rm, k) => rm.polygon.forEach((v, i) => {
          if (moving.has(k + ':' + i)) return;
          const dv = (v.x - a.x) * nrm.x + (v.y - a.y) * nrm.y;
          if (Math.abs(dv - d) < 8 / x.s && (!best || Math.abs(dv - d) < Math.abs(best.dv - d))) best = { dv, v };
        }));
        if (best) {
          d = best.dv;
          const m = { x: (a.x + b.x) / 2 + nrm.x * d, y: (a.y + b.y) / 2 + nrm.y * d };
          this.guides.push({ from: best.v, to: m });
        } else d = round(d, this.hasImage ? 0.01 : 0.05);
      }
      h.by = d;
      const shift = (k) => new Set(h.links.filter(([kk]) => kk === k).flatMap(([, ed]) => [ed, (ed + 1) % this.rooms[k].polygon.length]));
      this.live = this.rooms.map((rm, k) => {
        const vs = shift(k);
        return vs.size ? { ...rm, polygon: rm.polygon.map((v, i) => (vs.has(i) ? { x: v.x + nrm.x * d, y: v.y + nrm.y * d } : v)) } : rm;
      });
      if (!this.sel || this.sel.id !== r.id || this.sel.edge !== h.edge) { this.sel = { kind: 'room', id: r.id, edge: h.edge }; this.h.changed(); }
    }
  }

  async up(h) {
    const r = this.room(h.room);
    this.guides = [];
    if (!r) { this.live = null; return; }
    if (h.type === 'window') {
      if (h.b && dist(h.a, h.b) >= 0.25) await this.drawWindow(h.room, h.edge, h.a, h.b);
      else { this.winDrag = null; this.h.redraw(); }
      return;
    }
    let reply = null;
    this.busy = true;
    if (h.type === 'corner' && h.to && dist(h.to, r.polygon[h.i]) > 0.004) {
      reply = await this.h.commit('moveCorner', { room: r.id, corner: h.i, pos: h.to });
    } else if (h.type === 'bend' && h.outline) {
      reply = await this.h.commit('reshapeRoom', { room: r.id, outline: h.outline });
      if (reply) this.sel = { kind: 'room', id: r.id, corner: h.edge + 1 };
    } else if (h.type === 'wall' && Math.abs(h.by ?? 0) > 0.004) {
      reply = await this.h.commit('moveWall', { room: r.id, edge: h.edge, by: h.by });
    }
    this.busy = false;
    if (!reply) { this.live = null; this.h.redraw(); }
    this.h.changed();
  }

  tap(q, x, e) {
    if (this.busy) return;
    const w = x.world(q);
    if (this.mode === 'window') {
      // A window clicked: it's picked, to size it or take it out. A wall clicked: a 1.2 m window there.
      const win = this.windowAt(q, x);
      if (win) { this.sel = { kind: 'window', room: win.room, n: win.n }; this.h.changed(); return; }
      const wall = this.outsideAt(q, x);
      if (wall) { const p = this.onWall(wall.room, wall.edge, wall.p); this.drawWindow(wall.room, wall.edge, p, p); return; }
      this.sel = null;
      this.h.changed();
      return;
    }
    if (this.mode === 'draw') {
      const first = this.draft[0];
      if (this.draft.length >= 3 && first && dist(x.pt(first), q) <= 12) { this.finish(); return; }
      const refs = [this.draft[this.draft.length - 1], first].filter(Boolean);
      this.draft.push(this.snap(w, x, { refs, free: e.shiftKey }));
      this.h.changed();
      return;
    }
    if (this.mode === 'measure') {
      // A wall clicked: its length is the one you know. Else two points on the plan (the scale bar, a dimension line).
      const wall = !this.measure.length && !e.shiftKey && this.wallAt(q, x);
      if (wall) {
        const r = this.room(wall.room), n = r.polygon.length;
        this.hoverWall = null;
        this.h.measured(r.polygon[wall.edge], r.polygon[(wall.edge + 1) % n], true);
        return;
      }
      this.measure.push(this.snap(w, x, { refs: this.measure.slice(-1), free: e.shiftKey }));
      if (this.measure.length === 2) {
        const [a, b] = this.measure;
        if (dist(a, b) < 0.05) { this.measure = [b]; return; }
        this.h.measured(a, b, false);
      }
      this.h.changed();
      return;
    }
    const r = this.selRoom(), h = r && this.handleAt(q, x), win = !h && this.windowAt(q, x);
    if (h?.type === 'corner') this.sel = { kind: 'room', id: r.id, corner: h.i };
    else if (win && win.d <= 5) this.sel = { kind: 'window', room: win.room, n: win.n };
    else {
      const wall = this.wallAt(q, x);
      if (wall) this.sel = { kind: 'room', id: wall.room, edge: wall.edge };
      else {
        const room = this.rooms.find((rm) => rm.polygon.length >= 3 && pointInPolygon(w, rm.polygon));
        const gap = !room && this.gaps.find((g) => pointInPolygon(w, g.polygon));
        this.sel = room ? { kind: 'room', id: room.id } : gap ? { kind: 'gap', key: gap.key } : null;
      }
    }
    this.h.changed();
  }

  hover(q, x, e) {
    if (this.mode === 'window') {
      const win = this.windowAt(q, x), wall = !win && this.outsideAt(q, x);
      this.hoverWall = wall || null;
      this.hoverPt = wall ? this.onWall(wall.room, wall.edge, wall.p) : null;
      if (this.canvas) this.canvas.style.cursor = win ? 'pointer' : wall ? 'crosshair' : '';
      return;
    }
    if (this.mode === 'draw' || this.mode === 'measure') {
      const refs = this.mode === 'draw' ? [this.draft[this.draft.length - 1], this.draft[0]].filter(Boolean) : this.measure.slice(-1);
      this.hoverWall = this.mode === 'measure' && !this.measure.length && !e.shiftKey ? this.wallAt(q, x) : null;
      this.hoverPt = this.hoverWall ? null : this.snap(x.world(q), x, { refs, free: e.shiftKey });
      if (this.canvas) this.canvas.style.cursor = this.hoverWall ? 'pointer' : 'crosshair';
      return;
    }
    if (!this.canvas) return;
    const r = this.selRoom(), h = r && this.handleAt(q, x);
    let cursor = '';
    if (h) cursor = h.type === 'corner' ? 'move' : 'copy';
    else {
      const w = this.wallAt(q, x);
      if (w) {
        const room = this.room(w.room), a = x.pt(room.polygon[w.edge]), b = x.pt(room.polygon[(w.edge + 1) % room.polygon.length]);
        cursor = Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? 'ns-resize' : 'ew-resize';
      } else cursor = 'pointer';
    }
    this.canvas.style.cursor = cursor;
  }

  // MARK: Drawing a room

  finish() {
    if (this.draft.length < 3) return;
    const pts = this.draft;
    this.draft = [];
    this.hoverPt = null;
    this.h.finishRoom(pts);
  }
  undoPoint() { this.draft.pop(); this.h.changed(); this.h.redraw(); }
  escape() {
    if (this.sel?.kind === 'window') { this.sel = null; this.h.changed(); this.h.redraw(); }
    else if (this.mode !== 'edit') this.setMode('edit');
    else { this.sel = null; this.h.changed(); this.h.redraw(); }
  }

  // MARK: Shape changes from the panel

  /// The picked corner taken out.
  removeCorner() {
    const r = this.selRoom(), i = this.sel?.corner;
    if (!r || i == null) return null;
    if (r.polygon.length <= 3) return Promise.resolve(null);
    return this.h.commit('reshapeRoom', { room: r.id, outline: r.polygon.filter((_, k) => k !== i) });
  }

  /// Is the picked corner an outside corner (cutting it makes an L) or an inside one (filling it squares it off)?
  cornerKind() {
    const r = this.selRoom(), i = this.sel?.corner;
    if (!r || i == null) return null;
    const p = r.polygon, n = p.length, a = p[(i + n - 1) % n], v = p[i], b = p[(i + 1) % n];
    const cross = (v.x - a.x) * (b.y - v.y) - (v.y - a.y) * (b.x - v.x);
    return cross * Math.sign(signedArea(p)) > 0 ? 'outside' : 'inside';
  }

  /// An outside corner cut out square (a metre each way, or less on a short wall): the room becomes an L you then drag
  /// to fit. An inside corner filled in (the L squared off).
  squareCorner() {
    const r = this.selRoom(), i = this.sel?.corner;
    if (!r || i == null) return null;
    const p = r.polygon, n = p.length, a = p[(i + n - 1) % n], v = p[i], b = p[(i + 1) % n];
    let outline;
    if (this.cornerKind() === 'outside') {
      const la = dist(a, v), lb = dist(v, b);
      const ua = { x: (a.x - v.x) / la, y: (a.y - v.y) / la }, ub = { x: (b.x - v.x) / lb, y: (b.y - v.y) / lb };
      const da = Math.min(1, la * 0.4), db = Math.min(1, lb * 0.4);
      const p1 = { x: v.x + ua.x * da, y: v.y + ua.y * da }, p3 = { x: v.x + ub.x * db, y: v.y + ub.y * db };
      const p2 = { x: p1.x + ub.x * db, y: p1.y + ub.y * db };
      outline = [...p.slice(0, i), p1, p2, p3, ...p.slice(i + 1)];
    } else {
      outline = p.map((q, k) => (k === i ? { x: a.x + b.x - v.x, y: a.y + b.y - v.y } : q));
    }
    return this.h.commit('reshapeRoom', { room: r.id, outline });
  }

  // MARK: Drawing (plan.js)

  /// A metre grid when there's no plan image to draw over.
  underlay(g, x) {
    if (this.hasImage) return;
    const W = g.canvas.clientWidth, H = g.canvas.clientHeight;
    const a = x.world({ x: 0, y: H }), b = x.world({ x: W, y: 0 });
    const step = x.s < 14 ? 5 : 1;
    g.lineWidth = 1;
    for (let gx = Math.floor(a.x / step) * step; gx <= b.x; gx += step) {
      const sx = x.pt({ x: gx, y: 0 }).x;
      g.strokeStyle = gx % 5 === 0 ? 'rgba(16,16,16,0.09)' : 'rgba(16,16,16,0.045)';
      g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx, H); g.stroke();
    }
    for (let gy = Math.floor(a.y / step) * step; gy <= b.y; gy += step) {
      const sy = x.pt({ x: 0, y: gy }).y;
      g.strokeStyle = gy % 5 === 0 ? 'rgba(16,16,16,0.09)' : 'rgba(16,16,16,0.045)';
      g.beginPath(); g.moveTo(0, sy); g.lineTo(W, sy); g.stroke();
    }
  }

  overlay(g, x) {
    const rooms = this.liveRooms();
    // The picked gap.
    if (this.sel?.kind === 'gap') {
      const gap = this.gaps.find((gg) => gg.key === this.sel.key);
      if (gap) { this.path(g, gap.polygon.map(x.pt)); g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke(); }
    }
    // The picked room: its outline, every wall's length, its corners and a + on each wall to put a corner in.
    const sel = this.sel?.kind === 'room' ? rooms.find((r) => r.id === this.sel.id) : null;
    if (sel && this.mode === 'edit') {
      const pts = sel.polygon.map(x.pt), n = pts.length;
      this.path(g, pts);
      g.strokeStyle = T.accent; g.lineWidth = 3; g.stroke();
      if (this.sel.edge != null && this.sel.edge < n) {
        g.beginPath(); g.moveTo(pts[this.sel.edge].x, pts[this.sel.edge].y); g.lineTo(pts[(this.sel.edge + 1) % n].x, pts[(this.sel.edge + 1) % n].y);
        g.strokeStyle = T.accentDeep; g.lineWidth = 6; g.lineCap = 'round'; g.stroke();
      }
      // Each wall's length, just outside it (clear of the + and the room's own label).
      const outward = -(Math.sign(signedArea(sel.polygon)) || 1);
      g.font = `800 10px ${FONT}`;
      for (let i = 0; i < n && this.sized; i++) {
        const a = sel.polygon[i], b = sel.polygon[(i + 1) % n];
        if (dist(pts[i], pts[(i + 1) % n]) < 46) continue;
        const text = metres(dist(a, b)), nm = normal(a, b);
        const px = 7 + Math.abs(nm.x) * (g.measureText(text).width / 2 + 5) + Math.abs(nm.y) * 8, off = px / x.s * outward;
        const m = x.pt({ x: (a.x + b.x) / 2 + nm.x * off, y: (a.y + b.y) / 2 + nm.y * off });
        this.tag(g, text, m.x, m.y, '#fff', T.ink);
      }
      if (!this.live) {
        for (const h of this.handles(x)) {
          if (h.type !== 'bend') continue;
          g.beginPath(); g.arc(h.x, h.y, 7, 0, Math.PI * 2); g.fillStyle = T.accentSoft; g.fill();
          g.strokeStyle = T.accentDeep; g.lineWidth = 1.5; g.stroke();
          g.beginPath(); g.moveTo(h.x - 3.5, h.y); g.lineTo(h.x + 3.5, h.y); g.moveTo(h.x, h.y - 3.5); g.lineTo(h.x, h.y + 3.5); g.stroke();
        }
      }
      pts.forEach((p, i) => {
        const on = this.sel.corner === i;
        g.beginPath(); g.arc(p.x, p.y, on ? 7.5 : 6, 0, Math.PI * 2);
        g.fillStyle = on ? T.accent : '#fff'; g.fill();
        g.strokeStyle = T.ink; g.lineWidth = 2; g.stroke();
      });
    }
    // Drawing windows: the outside walls dashed (where they can go), the one under the pointer, the window being drawn.
    if (this.mode === 'window') {
      g.save();
      g.setLineDash([7, 5]); g.strokeStyle = 'rgba(46,134,193,0.9)'; g.lineWidth = 3.5; g.lineCap = 'butt';
      for (const r of rooms) {
        const n = r.polygon.length;
        for (let e = 0; e < n; e++) {
          if (!r.outside?.[e]) continue;
          const a = x.pt(r.polygon[e]), b = x.pt(r.polygon[(e + 1) % n]);
          g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
      }
      g.restore();
      // The windows back over the dashes.
      for (const r of rooms) {
        (r.windows ?? []).forEach((w, k) => drawWindowMark(g, x.pt(w[0]), x.pt(w[1]), {
          door: (r.glass?.[k]?.height ?? 1.2) >= 2, s: x.s, on: this.sel?.kind === 'window' && this.sel.room === r.id && this.sel.n === k,
        }));
      }
      const hw = !this.winDrag && this.hoverWall && this.room(this.hoverWall.room);
      if (hw) {
        const n = hw.polygon.length, a = x.pt(hw.polygon[this.hoverWall.edge]), b = x.pt(hw.polygon[(this.hoverWall.edge + 1) % n]);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.strokeStyle = 'rgba(46,134,193,0.9)'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke();
        if (this.hoverPt) { const c = x.pt(this.hoverPt); g.beginPath(); g.arc(c.x, c.y, 4, 0, Math.PI * 2); g.fillStyle = '#2E86C1'; g.fill(); }
      }
      if (this.winDrag) {
        const { a, b } = this.winDrag, pa = x.pt(a), pb = x.pt(b);
        drawWindowMark(g, pa, pb, { door: dist(a, b) >= 2, s: x.s, on: true });
        for (const c of [pa, pb]) { g.beginPath(); g.arc(c.x, c.y, 4, 0, Math.PI * 2); g.fillStyle = T.accentDeep; g.fill(); }
        if (this.sized) this.tag(g, metres(dist(a, b)), (pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 16, T.accent, T.ink);
      }
    }
    // Where a drag or a click lands.
    for (const gd of this.guides) {
      if (gd.ring) {
        const c = x.pt(gd.ring);
        g.beginPath(); g.arc(c.x, c.y, gd.small ? 5 : 9, 0, Math.PI * 2); g.strokeStyle = T.cool; g.lineWidth = 2; g.stroke();
      } else {
        const a = x.pt(gd.from), b = x.pt(gd.to);
        g.setLineDash([4, 4]); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.strokeStyle = T.cool; g.lineWidth = 1.2; g.stroke(); g.setLineDash([]);
      }
    }
    // A room being drawn.
    if (this.mode === 'draw' && (this.draft.length || this.hoverPt)) {
      const pts = this.draft.map(x.pt), hov = this.hoverPt && x.pt(this.hoverPt);
      if (pts.length) {
        this.path(g, hov ? [...pts, hov] : pts, false);
        if (pts.length >= 2) { g.fillStyle = 'rgba(233,162,28,0.12)'; g.fill(); }
        g.strokeStyle = T.accentDeep; g.lineWidth = 2.5; g.stroke();
        for (let i = 1; i < this.draft.length && this.sized; i++) {
          const a = this.draft[i - 1], b = this.draft[i], m = x.pt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
          this.tag(g, metres(dist(a, b)), m.x, m.y - 12, '#fff', T.ink);
        }
        if (hov && this.sized) {
          const a = this.draft[this.draft.length - 1], m = x.pt({ x: (a.x + this.hoverPt.x) / 2, y: (a.y + this.hoverPt.y) / 2 });
          this.tag(g, metres(dist(a, this.hoverPt)), m.x, m.y - 12, T.accent, T.ink);
        }
      }
      pts.forEach((p, i) => {
        g.beginPath(); g.arc(p.x, p.y, i === 0 && pts.length >= 3 ? 9 : 5, 0, Math.PI * 2);
        g.fillStyle = i === 0 ? T.accent : '#fff'; g.fill(); g.strokeStyle = T.ink; g.lineWidth = 2; g.stroke();
      });
      if (hov) { g.beginPath(); g.arc(hov.x, hov.y, 4, 0, Math.PI * 2); g.fillStyle = T.ink; g.fill(); }
    }
    // A length being measured: a wall under the pointer, or two points.
    if (this.mode === 'measure' && this.hoverWall) {
      const r = this.room(this.hoverWall.room);
      if (r) {
        const n = r.polygon.length, a = x.pt(r.polygon[this.hoverWall.edge]), b = x.pt(r.polygon[(this.hoverWall.edge + 1) % n]);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.strokeStyle = T.cool; g.lineWidth = 6; g.lineCap = 'round'; g.stroke();
        this.tag(g, 'This wall', (a.x + b.x) / 2, (a.y + b.y) / 2 - 16, T.cool, '#fff');
      }
    }
    if (this.mode === 'measure') {
      const ends = [...this.measure, ...(this.measure.length < 2 && this.hoverPt ? [this.hoverPt] : [])];
      const pts = ends.map(x.pt);
      if (pts.length === 2) {
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y); g.lineTo(pts[1].x, pts[1].y);
        g.strokeStyle = T.cool; g.lineWidth = 3; g.stroke();
        if (this.sized) this.tag(g, metres(dist(ends[0], ends[1])) + ' now', (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2 - 14, T.cool, '#fff');
      }
      for (const p of pts) {
        g.beginPath(); g.moveTo(p.x - 8, p.y); g.lineTo(p.x + 8, p.y); g.moveTo(p.x, p.y - 8); g.lineTo(p.x, p.y + 8);
        g.strokeStyle = T.cool; g.lineWidth = 2; g.stroke();
      }
    }
  }

  path(g, pts, close = true) {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    if (close) g.closePath();
  }

  tag(g, text, cx, cy, bg, fg) {
    g.font = `800 10px ${FONT}`;
    const w = g.measureText(text).width + 10;
    g.beginPath(); g.roundRect(cx - w / 2, cy - 8, w, 16, 8); g.fillStyle = bg; g.fill();
    if (bg === '#fff') { g.strokeStyle = 'rgba(16,16,16,0.12)'; g.lineWidth = 1; g.stroke(); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, cy + 0.5);
  }
}
