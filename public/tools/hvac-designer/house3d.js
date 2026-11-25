// The house in 3D (Jake, 22 Nov 2026: "let's start on the 3D version"): a clean model to look at, not to edit — rooms
// tinted by zone (or by heat), white walls that fade on the side you're looking from, and the system sitting in the
// roof space with the roof off: the fan coil, BDOs, ducts in their size colours, a vent in each ceiling, the return.
// Air moves along the open ducts and falls out of each vent, following whichever zones are on. Drag to spin, scroll to
// zoom, tap a room or a vent. Drawn with WebGL directly: no library to load.

import { zoneColour, ductColour } from './plan.js?v=2d2ac5b-202611252120';

const rgb = (hex, a = 1) => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, a]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] ?? 1];
const WHITE = [1, 1, 1, 1], WALL = rgb('#FBFBFC'), FLOOR_OFF = rgb('#E9EBEF'), DARK = rgb('#1E2227'), STEEL = rgb('#C9CFD6');
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function lookAt(eye, at, up) {
  const z = norm(sub(eye, at)), x = norm(cross(up, z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}
function matMul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}

const area2 = (P) => P.reduce((t, p, i) => { const q = P[(i + 1) % P.length]; return t + p.x * q.y - q.x * p.y; }, 0);
/// A room's outline cut into triangles (ear clipping: rooms can be L-shaped). Indices into `P`.
function triangulate(P) {
  const idx = P.map((_, i) => i);
  if (area2(P) < 0) idx.reverse();
  const cr = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x), out = [];
  const inside = (p, a, b, c) => cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 2000) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      if (cr(P[a], P[b], P[c]) <= 1e-9) continue;
      if (idx.some((j) => j !== a && j !== b && j !== c && inside(P[j], P[a], P[b], P[c]))) continue;
      out.push(a, b, c); idx.splice(i, 1); cut = true; break;
    }
    if (!cut) break;
  }
  if (idx.length === 3) out.push(...idx);
  return out;
}
const inPoly = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
/// A routed line with its corners rounded off (two passes of corner cutting), its ends kept.
function soften(pts) {
  let p = pts;
  for (let k = 0; k < 2 && p.length > 2; k++) {
    const o = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      o.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    o.push(p[p.length - 1]);
    p = o;
  }
  return p;
}

const VS = `attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aCol; uniform mat4 uMVP; uniform vec3 uLight; uniform float uAlpha; uniform float uPoint;
varying vec4 vCol;
void main() { float l = length(aNor) < 0.1 ? 1.0 : 0.8 + 0.2 * abs(dot(normalize(aNor), uLight)); vCol = vec4(aCol.rgb * l, aCol.a * uAlpha);
  gl_Position = uMVP * vec4(aPos, 1.0); gl_PointSize = uPoint; }`;
const FS = `precision mediump float; varying vec4 vCol; uniform float uRound;
void main() { if (uRound > 0.5) { vec2 d = gl_PointCoord - vec2(0.5); if (dot(d, d) > 0.25) discard; } gl_FragColor = vCol; }`;

/// Triangles gathered as flat arrays, with a few shapes to add.
class Mesh {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  get count() { return this.pos.length / 3; }
  tri(a, b, c, col, n = norm(cross(sub(b, a), sub(c, a)))) { this.pos.push(...a, ...b, ...c); this.nor.push(...n, ...n, ...n); this.col.push(...col, ...col, ...col); }
  quad(a, b, c, d, col, n) { this.tri(a, b, c, col, n); this.tri(a, c, d, col, n); }
  /// A box with its base rectangle given by a centre, a direction along its length, its size and its floor height.
  box(c, dir, len, wid, z0, h, col) {
    const u = [dir.x * len / 2, dir.y * len / 2], w = [-dir.y * wid / 2, dir.x * wid / 2];
    const p = (su, sw, z) => [c.x + su * u[0] + sw * w[0], c.y + su * u[1] + sw * w[1], z];
    const b = [p(-1, -1, z0), p(1, -1, z0), p(1, 1, z0), p(-1, 1, z0)], t = b.map((q) => [q[0], q[1], z0 + h]);
    this.quad(t[0], t[1], t[2], t[3], col);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(b[i], b[j], t[j], t[i], col); }
  }
  /// A flat many-sided disc (a vent's face, or a ring when a smaller one's drawn over it).
  disc(c, r, z, col, sides = 20) {
    for (let i = 0; i < sides; i++) {
      const a = i / sides * Math.PI * 2, b = (i + 1) / sides * Math.PI * 2;
      this.tri([c.x, c.y, z], [c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, z], [c.x + Math.cos(b) * r, c.y + Math.sin(b) * r, z], col, [0, 0, 1]);
    }
  }
  /// A round duct along a line of 3D points.
  tube(pts, r, col, sides = 10) {
    if (pts.length < 2) return;
    const rings = pts.map((p, i) => {
      const t = norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]));
      let n = cross(t, [0, 0, 1]);
      if (Math.hypot(...n) < 0.05) n = cross(t, [1, 0, 0]);
      n = norm(n);
      const b = norm(cross(n, t));
      return Array.from({ length: sides }, (_, k) => { const a = k / sides * Math.PI * 2, d = add(mul(n, Math.cos(a)), mul(b, Math.sin(a))); return { p: add(p, mul(d, r)), n: d }; });
    });
    for (let i = 0; i < rings.length - 1; i++) {
      for (let k = 0; k < sides; k++) {
        const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][(k + 1) % sides], d = rings[i + 1][k];
        this.pos.push(...a.p, ...b.p, ...c.p, ...a.p, ...c.p, ...d.p);
        this.nor.push(...a.n, ...b.n, ...c.n, ...a.n, ...c.n, ...d.n);
        for (let q = 0; q < 6; q++) this.col.push(...col);
      }
    }
  }
}

export class House3D {
  /// `host`: the element it fills. `handlers.select(item)`: a room, vent, BDO, the fan coil or the return tapped.
  constructor(host, handlers = {}, cam = null) {
    this.host = host; this.on = handlers;
    this.cv = document.createElement('canvas'); this.ov = document.createElement('canvas');
    for (const c of [this.cv, this.ov]) { c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; host.append(c); }
    this.ov.style.pointerEvents = 'none';
    this.cv.style.touchAction = 'none'; this.cv.style.cursor = 'grab';
    this.cam = cam ?? { az: -1.92, el: 0.9, dist: 0, at: null };
    this.d = { view: null, layout: null, air: null, selection: null, heat: false, sound: true, airOn: true };
    this.gl = this.cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!this.gl) {
      const note = document.createElement('div');
      note.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;color:#5B6170';
      note.textContent = 'This browser can\'t draw 3D.';
      host.append(note);
      return;
    }
    this.initGL();
    this.bind();
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(host);
    this.t0 = performance.now();
    const loop = () => { if (this.dead) return; if (this.d.airOn && this.parts?.length && !document.hidden) this.draw(); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  destroy() { this.dead = true; cancelAnimationFrame(this.raf); this.ro?.disconnect(); this.cv.remove(); this.ov.remove(); }

  initGL() {
    const gl = this.gl, sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = this.pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    this.loc = { pos: gl.getAttribLocation(pr, 'aPos'), nor: gl.getAttribLocation(pr, 'aNor'), col: gl.getAttribLocation(pr, 'aCol'),
      mvp: gl.getUniformLocation(pr, 'uMVP'), light: gl.getUniformLocation(pr, 'uLight'), alpha: gl.getUniformLocation(pr, 'uAlpha'),
      point: gl.getUniformLocation(pr, 'uPoint'), round: gl.getUniformLocation(pr, 'uRound') };
    this.buf = { solid: this.buffers(), walls: this.buffers(), pts: this.buffers() };
  }
  buffers() { const gl = this.gl; return { pos: gl.createBuffer(), nor: gl.createBuffer(), col: gl.createBuffer(), n: 0 }; }
  upload(b, m, dynamic = false) {
    const gl = this.gl, use = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
    gl.bindBuffer(gl.ARRAY_BUFFER, b.pos); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.pos), use);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.nor); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.nor), use);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.col); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.col), use);
    b.n = m.pos.length / 3;
  }
  point(b) {
    const gl = this.gl, L = this.loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, b.pos); gl.enableVertexAttribArray(L.pos); gl.vertexAttribPointer(L.pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.nor); gl.enableVertexAttribArray(L.nor); gl.vertexAttribPointer(L.nor, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.col); gl.enableVertexAttribArray(L.col); gl.vertexAttribPointer(L.col, 4, gl.FLOAT, false, 0, 0);
  }

  set(data) {
    const rebuild = ['view', 'layout', 'air', 'heat', 'selection'].some((k) => k in data && data[k] !== this.d[k]);
    Object.assign(this.d, data);
    if (!this.gl) return;
    if (rebuild) this.build();
    this.draw();
  }

  /// The ceiling the roof space sits on (the tallest room's), and how high the ducts ride over it.
  get top() { const cs = (this.d.view?.rooms ?? []).map((r) => r.ceiling ?? 2.4); return cs.length ? Math.max(...cs) : 2.4; }

  build() {
    const { view: v, layout: l, heat, selection: sel } = this.d;
    if (!v) return;
    const solid = new Mesh(), walls = new Mesh();
    this.wallParts = []; this.paths = []; this.marks = [];
    const H = this.top, zd = H + 0.34;
    const dens = v.rooms.filter((r) => r.conditioned && r.area > 0).map((r) => r.kw * 1000 / r.area);
    const lo = Math.min(...dens, 60), hi = Math.max(...dens, lo + 40);
    for (const r of v.rooms) {
      const P = r.polygon;
      if (!(P?.length >= 3)) continue;
      // Floor: its zone's colour washed out (or how hard it works per m², pale to hot), stronger when it's the one picked.
      let col = FLOOR_OFF;
      if (r.conditioned) {
        if (heat) col = mix(rgb('#FCEFEA'), rgb('#E0502F'), Math.max(0, Math.min(1, (r.kw * 1000 / Math.max(r.area, 0.1) - lo) / (hi - lo))) * 0.85);
        else col = mix(rgb(r.zone ? zoneColour(r.zone) : '#8A909B'), WHITE, 0.74);
      }
      if (sel?.kind === 'room' && sel.id === r.id) col = mix(col, rgb('#F59E0B'), 0.45);
      const tr = triangulate(P);
      for (let i = 0; i < tr.length; i += 3) solid.tri([P[tr[i]].x, P[tr[i]].y, 0], [P[tr[i + 1]].x, P[tr[i + 1]].y, 0], [P[tr[i + 2]].x, P[tr[i + 2]].y, 0], col, [0, 0, 1]);
      // Walls: a slab on each edge, inside the room's own outline for an inside wall (the room next door has its half),
      // outside it for an outside wall. Each remembers which way is out, to fade when it's between you and its room.
      const ccw = area2(P) > 0, h = r.ceiling ?? 2.4;
      P.forEach((a, i) => {
        const b = P[(i + 1) % P.length], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
        if (L < 0.05) return;
        const out = ccw ? { x: dy / L, y: -dx / L } : { x: -dy / L, y: dx / L }, ext = !!r.outside?.[i], t = ext ? 0.18 : 0.045, s = ext ? 1 : -1;
        const mid = { x: (a.x + b.x) / 2 + out.x * s * t / 2, y: (a.y + b.y) / 2 + out.y * s * t / 2 };
        const start = walls.count;
        walls.box(mid, { x: dx / L, y: dy / L }, L + (ext ? t : 0), t, 0, h, ext ? WALL : rgb('#F4F5F7'));
        this.wallParts.push({ start, n: walls.count - start, c: [mid.x, mid.y, h / 2], out: [out.x, out.y, 0] });
      });
      this.marks.push({ kind: 'room', id: r.id, at: [r.centroid.x, r.centroid.y, 0.02], text: r.name, sub: r.conditioned ? `${r.kw.toFixed(1)} kW` : '' });
    }
    if (l) {
      const ceilAt = (p) => v.rooms.find((r) => r.polygon?.length >= 3 && inPoly(p, r.polygon))?.ceiling ?? H;
      l.runs.forEach((r) => {
        if (!(r.path?.length >= 2) || !r.sizeMM) return;
        const flat = soften(r.path), pts = flat.map((p) => [p.x, p.y, zd]);
        // A leg drops into its vent's ceiling; the return rises out of its grille.
        if (r.outlet != null) { const e = flat[flat.length - 1]; pts.push([e.x, e.y, ceilAt(e) + 0.04]); }
        if (r.kind === 'return') { const e = flat[0]; pts.unshift([e.x, e.y, ceilAt(e) + 0.04]); }
        const open = r.open !== false;
        solid.tube(pts, r.sizeMM / 2000, open ? rgb(ductColour(r.sizeMM)) : rgb('#D5D9DF'));
        if (open && r.lps > 0) this.paths.push({ pts, lift: r.sizeMM / 2000 + 0.03, back: r.kind === 'return', speed: Math.min(Math.max(r.lps / 1000 / (Math.PI * (r.sizeMM / 2000) ** 2), 1), 6) });
      });
      for (const b of l.boxes) {
        const ax = b.axis && Math.hypot(b.axis.x, b.axis.y) > 0.1 ? b.axis : { x: 1, y: 0 };
        solid.box(b.pos, ax, 0.42, 0.36, zd - 0.16, 0.32, sel?.kind === 'box' && sel.id === b.bid ? rgb('#F59E0B') : DARK);
        this.marks.push({ kind: 'box', id: b.bid, at: [b.pos.x, b.pos.y, zd], pick: true });
      }
      // The fan coil: the unit, its plenum on the supply side and the return box on its back.
      const f = l.unitDir, wide = { x: -f.y, y: f.x };
      solid.box(l.unit, wide, 1.6, 0.7, zd - 0.2, 0.4, sel?.kind === 'unit' ? rgb('#F59E0B') : DARK);
      solid.box({ x: l.unit.x + f.x * 0.5, y: l.unit.y + f.y * 0.5 }, wide, 1.3, 0.3, zd - 0.17, 0.34, STEEL);
      solid.box({ x: l.unit.x - f.x * 0.43, y: l.unit.y - f.y * 0.43 }, wide, 1.1, 0.16, zd - 0.17, 0.34, STEEL);
      this.marks.push({ kind: 'unit', id: 'unit', at: [l.unit.x, l.unit.y, zd + 0.25], pick: true });
      for (const o of l.outlets) {
        if (o.dropper) continue;
        const z = ceilAt(o.pos), r = (o.sizeMM + 160) / 2000, on = sel?.kind === 'outlet' && sel.id === o.id;
        solid.disc(o.pos, r + 0.05, z + 0.012, on ? rgb('#F59E0B') : rgb(o.zone ? zoneColour(o.zone) : '#8A909B'));
        solid.disc(o.pos, r, z + 0.02, o.open === false ? rgb('#DADDE2') : WHITE);
        this.marks.push({ kind: 'outlet', id: o.id, at: [o.pos.x, o.pos.y, z + 0.05], pick: true, db: o.open !== false && o.lps > 0 ? o.dbA : null,
          loud: o.dbA > (v.rooms.find((q) => q.id === o.roomId)?.soundTarget ?? 99) + 0.5, vent: { z, lps: o.open === false ? 0 : o.lps, throwM: this.d.air?.outlets?.find((x) => x.id === o.id)?.throwM ?? 1.4 } });
      }
      const g = l.returnGrille, gz = ceilAt(g), gs = l.returnGrilleSize ?? [1000, 500];
      solid.box(g, wide, gs[0] / 1000, gs[1] / 1000, gz + 0.005, 0.03, sel?.kind === 'ret' ? rgb('#F59E0B') : rgb('#3A4048'));
      this.marks.push({ kind: 'ret', id: 'ret', at: [g.x, g.y, gz + 0.06], pick: true });
    }
    this.upload(this.buf.solid, solid);
    this.upload(this.buf.walls, walls);
    this.seed();
    // Framed on the house the first time (and whenever it's asked to fit).
    if (!this.cam.at || !this.cam.dist) this.fit(false);
  }

  /// The moving air: dots along each open duct, and falling out of each vent that's on.
  seed() {
    this.parts = [];
    for (const p of this.paths) {
      const seg = [0];
      for (let i = 1; i < p.pts.length; i++) seg.push(seg[i - 1] + Math.hypot(...sub(p.pts[i], p.pts[i - 1])));
      const len = seg[seg.length - 1], n = Math.max(2, Math.round(len / 0.45));
      for (let k = 0; k < n; k++) this.parts.push({ duct: p, seg, len, off: k / n, col: p.back ? rgb('#8E2E7C') : rgb('#0E1116', 0.85) });
    }
    for (const m of this.marks) {
      if (!m.vent || !(m.vent.lps > 0)) continue;
      const n = Math.round(Math.min(Math.max(m.vent.lps / 9, 8), 26));
      for (let k = 0; k < n; k++) this.parts.push({ vent: m, ang: k * 2.399963, off: (k * 0.618) % 1, spread: 0.35 + (k % 5) / 5 * 0.65, col: rgb('#3E6CF0', 0.8) });
    }
  }
  partPos(p, t) {
    if (p.duct) {
      let s = ((p.off + t * p.duct.speed * 0.07 / Math.max(p.len, 0.5)) % 1) * p.len;
      if (p.duct.back) s = p.len - s;
      let i = 1;
      while (i < p.seg.length - 1 && p.seg[i] < s) i++;
      const a = p.duct.pts[i - 1], b = p.duct.pts[i], k = (s - p.seg[i - 1]) / Math.max(p.seg[i] - p.seg[i - 1], 1e-6);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k + p.duct.lift];
    }
    // Out of a ceiling vent: along the ceiling a little, then down and out to where its throw ends.
    const m = p.vent, f = (p.off + t * 0.16) % 1, reach = Math.min(m.vent.throwM, 3.2) * p.spread, r = 0.12 + reach * Math.sqrt(f);
    return [m.at[0] + Math.cos(p.ang) * r, m.at[1] + Math.sin(p.ang) * r, m.vent.z - 0.05 - (m.vent.z - 0.5) * f * f];
  }

  // MARK: Camera

  bounds() {
    const P = (this.d.view?.rooms ?? []).flatMap((r) => r.polygon ?? []);
    if (!P.length) return { c: [0, 0, 1], r: 8 };
    const xs = P.map((p) => p.x), ys = P.map((p) => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    return { c: [(x0 + x1) / 2, (y0 + y1) / 2, 1.2], r: Math.hypot(x1 - x0, y1 - y0) / 2 + 1 };
  }
  fit(redraw = true) { const b = this.bounds(); this.cam.at = b.c; this.cam.dist = b.r * 2.5; this.cam.az = -1.92; this.cam.el = 0.9; if (redraw) this.draw(); }
  zoomBy(f) { this.cam.dist = Math.min(Math.max(this.cam.dist / f, 3), 140); this.draw(); }
  eye() { const c = this.cam, ce = Math.cos(c.el); return add(c.at, [Math.cos(c.az) * ce * c.dist, Math.sin(c.az) * ce * c.dist, Math.sin(c.el) * c.dist]); }
  matrix() {
    const W = this.host.clientWidth || 1, Hh = this.host.clientHeight || 1;
    return matMul(perspective(0.6, W / Hh, 0.3, 400), lookAt(this.eye(), this.cam.at, [0, 0, 1]));
  }
  /// A point in the house → where it is on screen (CSS pixels), or null behind the camera.
  toScreen(p, m = this.mvp) {
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (w <= 0.01) return null;
    const x = (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w, y = (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w;
    return { x: (x + 1) / 2 * this.host.clientWidth, y: (1 - y) / 2 * this.host.clientHeight, w };
  }

  bind() {
    const cv = this.cv;
    let drag = null;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, moved: false, pan: e.button === 2 || e.shiftKey, cam: { ...this.cam, at: [...this.cam.at] } }; cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      if (drag.pan) {
        const k = drag.cam.dist / 900, right = [-Math.sin(drag.cam.az), Math.cos(drag.cam.az), 0], fwd = [-Math.cos(drag.cam.az), -Math.sin(drag.cam.az), 0];
        this.cam.at = add(drag.cam.at, add(mul(right, -dx * k), mul(fwd, -dy * k * 1.4)));
      } else {
        this.cam.az = drag.cam.az - dx * 0.008;
        this.cam.el = Math.min(Math.max(drag.cam.el + dy * 0.006, 0.18), 1.52);
      }
      this.draw();
    });
    const up = (e) => {
      const d = drag; drag = null; cv.style.cursor = 'grab';
      if (d && !d.moved && e.type === 'pointerup') this.tap(e);
      this.on.changed?.({ ...this.cam, at: [...this.cam.at] });
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); this.on.changed?.({ ...this.cam, at: [...this.cam.at] }); }, { passive: false });
  }
  /// What was tapped: a vent, BDO, the fan coil or the return if one's under the finger, else the room on the floor there.
  tap(e) {
    const r = this.cv.getBoundingClientRect(), q = { x: e.clientX - r.left, y: e.clientY - r.top };
    let best = null;
    for (const m of this.marks) {
      if (!m.pick) continue;
      const s = this.toScreen(m.at);
      if (!s) continue;
      const d = Math.hypot(s.x - q.x, s.y - q.y);
      if (d < 22 && (!best || d < best.d)) best = { d, m };
    }
    if (best) { this.on.select?.({ kind: best.m.kind, id: best.m.id }); return; }
    // The ray through the tap, down to the floor.
    const eye = this.eye(), c = this.cam, fw = norm(sub(c.at, eye)), rt = norm(cross(fw, [0, 0, 1])), upv = cross(rt, fw);
    const W = this.host.clientWidth, Hh = this.host.clientHeight, th = Math.tan(0.3);
    const dir = norm(add(fw, add(mul(rt, (q.x / W * 2 - 1) * th * W / Hh), mul(upv, (1 - q.y / Hh * 2) * th))));
    if (dir[2] >= -1e-4) { this.on.select?.(null); return; }
    const k = -eye[2] / dir[2], p = { x: eye[0] + dir[0] * k, y: eye[1] + dir[1] * k };
    const room = this.d.view?.rooms.find((x) => x.polygon?.length >= 3 && inPoly(p, x.polygon));
    this.on.select?.(room ? { kind: 'room', id: room.id } : null);
  }

  // MARK: Drawing

  draw() {
    const gl = this.gl;
    if (!gl || !this.d.view || !this.cam.at) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = this.host.clientWidth, Hh = this.host.clientHeight;
    if (!W || !Hh) return;
    for (const c of [this.cv, this.ov]) if (c.width !== Math.round(W * dpr) || c.height !== Math.round(Hh * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(Hh * dpr); }
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const L = this.loc, m = this.mvp = this.matrix(), eye = this.eye();
    gl.uniformMatrix4fv(L.mvp, false, new Float32Array(m));
    gl.uniform3fv(L.light, new Float32Array(norm([0.35, -0.5, 0.8])));
    gl.uniform1f(L.round, 0); gl.uniform1f(L.point, 1); gl.uniform1f(L.alpha, 1);
    // Walls on the far side of their rooms, solid; then everything in the house and the roof space.
    this.point(this.buf.walls);
    const near = [], far = [];
    for (const w of this.wallParts ?? []) (dot(w.out, sub(eye, w.c)) > 0 ? near : far).push(w);
    for (const w of far) gl.drawArrays(gl.TRIANGLES, w.start, w.n);
    this.point(this.buf.solid);
    gl.drawArrays(gl.TRIANGLES, 0, this.buf.solid.n);
    // The air.
    if (this.d.airOn && this.parts?.length) {
      const t = (performance.now() - this.t0) / 1000, pm = new Mesh();
      for (const p of this.parts) { pm.pos.push(...this.partPos(p, t)); pm.nor.push(0, 0, 0); pm.col.push(...p.col); }
      this.upload(this.buf.pts, pm, true);
      this.point(this.buf.pts);
      gl.uniform1f(L.round, 1); gl.uniform1f(L.point, Math.max(3.5, Math.min(7, 150 / this.cam.dist)) * dpr);
      gl.drawArrays(gl.POINTS, 0, this.buf.pts.n);
      gl.uniform1f(L.round, 0);
    }
    // Walls between you and their rooms: a ghost of themselves, drawn last so the rooms show through.
    this.point(this.buf.walls);
    gl.depthMask(false); gl.uniform1f(L.alpha, 0.1);
    near.sort((a, b) => Math.hypot(...sub(eye, b.c)) - Math.hypot(...sub(eye, a.c)));
    for (const w of near) gl.drawArrays(gl.TRIANGLES, w.start, w.n);
    gl.depthMask(true);
    this.labels(dpr, W, Hh);
  }

  /// Names on the floors and each vent's sound over it, drawn flat over the 3D.
  labels(dpr, W, Hh) {
    const g = this.ov.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const pill = (text, x, y, fg, bg, bold) => {
      g.font = `${bold ? 600 : 500} ${bold ? 12 : 10.5}px Geist, -apple-system, sans-serif`;
      const w = g.measureText(text).width + 12;
      g.beginPath(); g.roundRect(x - w / 2, y - 9, w, 18, 9); g.fillStyle = bg; g.fill();
      g.fillStyle = fg; g.fillText(text, x, y + 0.5);
    };
    for (const m of this.marks ?? []) {
      const s = this.toScreen(m.at);
      if (!s || s.x < -40 || s.x > W + 40 || s.y < -20 || s.y > Hh + 20) continue;
      if (m.kind === 'room') pill(m.sub ? `${m.text} · ${m.sub}` : m.text, s.x, s.y, '#0E1116', 'rgba(255,255,255,0.86)', true);
      else if (m.kind === 'outlet' && this.d.sound && m.db != null) pill(`${Math.round(m.db)} dB`, s.x, s.y - 16, m.loud ? '#fff' : '#3B4250', m.loud ? '#C2412D' : 'rgba(255,255,255,0.9)', false);
      else if (m.kind === 'unit') pill('Fan coil', s.x, s.y - 14, '#fff', '#1E2227', false);
    }
  }
}
