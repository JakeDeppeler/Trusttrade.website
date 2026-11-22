// A job with two systems (Jake, 16 Nov 2026: "ducted plus bulkhead on one job"): system A is the ducted system, and
// system B a multi-head split (bulkhead, wall or VRF heads) for the rooms listed in project.splitRooms, such as an
// extension with no roof space. The engine designs one system per job, so every call for a two-system job goes to it
// with the part it's about: the ducted part (the house less B's rooms) or the split part (B's rooms only). Whatever
// comes back is merged into the whole job. Calls about the whole house (the rooms, the plan, the loads) get the
// whole job. The page calls `jobCall` wherever it used to call the engine.

/// Rooms on system B, as a set of ids.
export const splitSet = (p) => new Set(p?.splitRooms ?? []);
/// Two systems: a ducted job with rooms on a split as well.
export const isMixed = (p) => !!p && p.system !== 'multiSplit' && (p.splitRooms?.length ?? 0) > 0;

// System B ducted as well (Jake, 22 Nov 2026: "the front half a ducted split and then the back half as a different roof
// high and also a ducted split"): two ducted systems, each in its own roof space, on one VRF outdoor unit. The system
// being worked on (project.activeSys, A unless it says B) keeps its design, zones, spill and unit picks where a
// one-system job keeps them, so every screen works on it as it is; the other system's wait in project.other until the
// A/B tab swaps them over.

/// System B is ducted too.
export const isDuctedB = (p) => isMixed(p) && p.systemB === 'ducted';
/// The ducted system being worked on: 'A' or 'B'.
export const activeSys = (p) => (isDuctedB(p) && p.activeSys === 'B' ? 'B' : 'A');
/// The unit picks that are each system's own (the brand, duct speeds and the rest are the job's).
export const SYS_SITE = ['unitSizingPref', 'unitKWPref', 'zoningPref'];
const sysSite = (site) => Object.fromEntries(SYS_SITE.map((k) => [k, site?.[k] ?? null]));
/// Keys only the page knows: carried through every engine reply.
const PAGE_KEYS = ['zoneCards', 'systemB', 'activeSys', 'other', 'vrfSpot'];

/// The other ducted system to the front: its design, zones, spill and unit picks swapped with the active one's.
export function swapSystems(p) {
  const o = p.other ?? {}, out = { ...p, activeSys: activeSys(p) === 'B' ? 'A' : 'B' };
  out.other = { design: p.design ?? null, zonePlan: p.zonePlan ?? null, spill: p.spill ?? null, site: sysSite(p.site) };
  for (const k of ['design', 'zonePlan', 'spill']) { if (o[k] != null) out[k] = o[k]; else delete out[k]; }
  out.site = { ...p.site, ...sysSite(o.site) };
  if (out.activeSys === 'A') delete out.activeSys;
  return out;
}

/// One ducted system on its own ('A': the house less B's rooms; 'B': B's rooms, when B is ducted), with its own design,
/// zones and spill, and no outlet or zone pick left in the other's rooms.
export function ductedPartOf(p, sys) {
  const off = splitSet(p), mineB = sys === 'B', have = new Set(p.rooms.map((r) => r.id));
  const mine = (id) => have.has(id) && off.has(id) === mineB;
  const src = !isDuctedB(p) || sys === activeSys(p) ? p
    : { ...p, design: p.other?.design ?? undefined, zonePlan: p.other?.zonePlan ?? undefined, spill: p.other?.spill ?? undefined, site: { ...p.site, ...sysSite(p.other?.site) } };
  const out = { ...src, rooms: p.rooms.filter((r) => mine(r.id)), system: 'ducted' };
  for (const k of ['splitRooms', 'split', ...PAGE_KEYS]) delete out[k];
  for (const k of ['design', 'zonePlan', 'spill']) if (out[k] == null) delete out[k];
  if (src.design) out.design = { ...src.design, outlets: (src.design.outlets ?? []).filter((o) => mine(o.roomId)) };
  if (src.zonePlan) out.zonePlan = Object.fromEntries(Object.entries(src.zonePlan).filter(([k, v]) => mine(k) && mine(v)));
  if (src.spill?.room && !mine(src.spill.room)) delete out.spill;
  // B's fan coil is piped to A's outdoor unit: the one VRF outdoor (p.vrfSpot: where A's stands, and its way out).
  if (mineB && isDuctedB(p) && out.design && p.vrfSpot) out.design = { ...out.design, outdoor: p.vrfSpot[0], outdoorOut: p.vrfSpot[1] };
  return out;
}
/// The ducted system being worked on, on its own (system A, unless B is ducted and in front).
export const ductedPart = (p) => ductedPartOf(p, activeSys(p));

/// The split on its own: B's rooms only, its range and heads. The extras and drawn lines stay with A, so the materials
/// don't list them twice.
export function splitPart(p) {
  const on = splitSet(p);
  const out = { ...p, rooms: p.rooms.filter((r) => on.has(r.id)), system: 'multiSplit', split: p.split ?? { range: defaultRange } };
  for (const k of ['splitRooms', 'design', 'spill', 'zonePlan', 'twoStorey', 'existing', 'extras', 'lines']) delete out[k];
  return out;
}
/// A new system B: slim ducted heads in bulkheads (the mock's "B · Bulkhead").
export const defaultRange = 'mitsubishi-mxz';

/// A part (or the whole job) as the engine sent it back, into the job: its rooms in place of the part's (a room it
/// deleted goes, one it added joins in), everything else it owns. The engine doesn't know splitRooms; they're kept,
/// less any room that's gone, and spread to the whole of an open area (an open area is one space: one system).
export function mergePart(full, got, kind) {
  const off = splitSet(full), bDucts = activeSys(full) === 'B';
  const mine = kind === 'split' ? (r) => off.has(r.id) : kind === 'ducted' ? (r) => off.has(r.id) === bDucts : () => true;
  const gotRooms = new Map(got.rooms.map((r) => [r.id, r]));
  const rooms = kind === 'whole' ? got.rooms : [];
  if (kind !== 'whole') for (const r of full.rooms) {
    if (!mine(r)) rooms.push(r);
    else if (gotRooms.has(r.id)) { rooms.push(gotRooms.get(r.id)); gotRooms.delete(r.id); }
  }
  if (kind !== 'whole') rooms.push(...gotRooms.values());
  let out;
  if (kind === 'split') {
    out = { ...full, split: got.split, rooms };
  } else {
    out = { ...got, rooms, system: kind === 'ducted' ? full.system : got.system };
    if (kind === 'ducted') { if (full.split) out.split = full.split; else delete out.split; }
  }
  return withSplitRooms(out, kind === 'whole' && got.system === 'multiSplit' ? [] : full.splitRooms ?? []);
}

/// splitRooms set on a job: only rooms still there, every room of an open area once any of it is on B.
export function withSplitRooms(p, ids) {
  const have = new Set(p.rooms.map((r) => r.id));
  const on = new Set(ids.filter((id) => have.has(id)));
  for (const r of p.rooms) if (on.has(r.id) && r.openArea != null) for (const s of p.rooms) if (s.openArea === r.openArea) on.add(s.id);
  const out = { ...p };
  if (on.size && out.system !== 'multiSplit') out.splitRooms = p.rooms.filter((r) => on.has(r.id)).map((r) => r.id);
  else delete out.splitRooms;
  return out;
}

// Which part each call is about. Anything not listed is about the whole job.
const DUCTED_CMDS = new Set(['autoDesign', 'startDesign', 'route', 'balance', 'systemCards', 'air']);
const SPLIT_CMDS = new Set(['splitPlan']);
const SPLIT_OPS = new Set(['setSplitRange', 'setHeadRoom', 'setHeadSize', 'moveHead', 'moveSplitOutdoor', 'addSplitOutdoor',
  'setHeadUnit', 'removeSplitOutdoor', 'autoSplitUnits', 'resetSplit', 'setHeadCount']);
const DUCTED_OPS = new Set(['setZone', 'joinRooms', 'unjoinRoom', 'setZonePlan', 'removeOutlet', 'moveOutletToBox', 'setSpill',
  'setOutletStyle', 'setRunSize', 'pinBox', 'dropUnit', 'dropReturn', 'dropOutdoor', 'resetOutdoor', 'dropBox', 'dropOutlet',
  'addOutlet', 'rotateUnit', 'setTakeoffs', 'resetHandBoxes', 'setExisting', 'addDropper', 'moveDropper', 'removeDropper',
  'addLine', 'removeLine', 'setLineDrop', 'setDropperLevel', 'setDropperSize', 'setDropperRooms', 'setDuctDownstairs',
  'makeBox', 'unBox', 'setReturnSize', 'startHand', 'stopHand', 'addHandRun', 'removeHandRun', 'removeHandBox', 'setHandVia', 'turnBox']);

/// `call` (the engine's), wrapped so a two-system job's calls go with the right part. A one-system job's go as they are.
export function jobCalls(call) {
  async function jobCall(cmd, args = {}) {
    const full = args.project;
    if (!full?.rooms) return call(cmd, args);
    const mixed = isMixed(full);
    const kind = !mixed ? 'whole'
      : DUCTED_CMDS.has(cmd) || (cmd === 'edit' && DUCTED_OPS.has(args.op)) ? 'ducted'
      : SPLIT_CMDS.has(cmd) || (cmd === 'edit' && SPLIT_OPS.has(args.op)) ? 'split'
      : (cmd === 'checks' || cmd === 'takeoff' || cmd === 'report') ? 'both' : 'whole';
    if (kind === 'both') return both(cmd, args, full);
    const part = kind === 'ducted' ? ductedPart(full) : kind === 'split' ? splitPart(full) : full;
    const r = await call(cmd, { ...args, project: part });
    if (mixed && r?.project?.rooms) r.project = mergePart(full, r.project, kind);   // a one-system job's come back as they are
    // What only the page keeps (where the zone cards were moved to, the second ducted system): carried through every reply.
    if (r?.project?.rooms) for (const k of PAGE_KEYS) if (full[k] != null && r.project[k] == null) r.project[k] = full[k];
    return r;
  }

  /// Two ducted systems on one VRF outdoor: A's checks, materials and reports, then B's (once it has a design), with the
  /// two ducted splits' outdoor units swapped for the one VRF outdoor and its branch joint.
  async function bothDucted(cmd, args, full) {
    const pa = ductedPartOf(full, 'A'), pb = ductedPartOf(full, 'B');
    // B's materials are its own: the job's extras and drawn lines are listed once, with A.
    delete pb.extras; delete pb.lines;
    const [a, b] = await Promise.all([call(cmd, { ...args, project: pa }).catch((e) => ({ error: e })),
      pb.design ? call(cmd, { ...args, project: pb }).catch((e) => ({ error: e })) : null]);
    const vrf = await vrfPlan(full).catch(() => null);
    if (cmd === 'checks') {
      // The job's own (the climate and such) are said once, with A.
      const seen = new Set((a.checks ?? []).map((c) => c.title + '|' + c.detail));
      const bChecks = b && !b.error ? b.checks.filter((c) => !seen.has(c.title + '|' + c.detail)).map((c) => ({ ...c, id: 'B-' + c.id, title: 'System B: ' + c.title })) : [];
      if (!pb.design) bChecks.push({ id: 'B-design', level: 'warn', title: 'System B: not designed yet', detail: 'Its fan coil, ducts and vents go in on Air & pipes, under B.' });
      return { checks: [...(a.checks ?? []), ...bChecks, ...(vrf?.checks ?? [])] };
    }
    if (a.error) throw a.error;
    if (cmd === 'takeoff') {
      const bGroups = b && !b.error ? b.groups.map((grp) => ({ ...grp, name: 'System B · ' + grp.name })) : [];
      const groups = vrfMaterials([...a.groups.map((grp) => ({ ...grp, name: (pb.design ? 'System A · ' : '') + grp.name })), ...bGroups], vrf);
      return { groups, csv: takeoffCSV(groups) };
    }
    const bBlocks = b && !b.error ? (b.blocks ?? []).filter((x) => !['letterhead', 'title', 'subtitle'].includes(x.type)) : [];
    const vrfBlocks = vrf?.pick ? [{ type: 'text', text: `Both systems run off one ${vrf.pick.model} VRF outdoor unit (${vrf.pick.kw} kW), with a refrigerant branch joint splitting its pipes to the two fan coils.` }] : [];
    return { ...a, blocks: [...(a.blocks ?? []), ...vrfBlocks, ...(bBlocks.length ? [{ type: 'page' }, { type: 'heading', text: 'System B: the back ducted system' }, ...bBlocks] : [])] };
  }

  /// The one VRF outdoor for two ducted systems: the smallest City Multi PUMY that covers the whole home's load and
  /// takes both fan coils within its connectable range (single phase: the SP models only).
  async function vrfPlan(full) {
    const [opts, va, vb] = await Promise.all([options ??= call('options'), call('view', { project: ductedPartOf(full, 'A') }),
      call('view', { project: ductedPartOf(full, 'B') })]);
    const range = opts.splitRanges?.find((r) => r.id === 'mitsubishi-pumy');
    const ua = va?.totals?.unit, ub = vb?.totals?.unit;
    const load = (va?.totals?.wholeHomeKW ?? va?.totals?.connectedKW ?? 0) + (vb?.totals?.wholeHomeKW ?? vb?.totals?.connectedKW ?? 0);
    const indoor = (ua?.kw ?? 0) + (ub?.kw ?? 0);
    const single = !full.site?.threePhasePref;
    const fits = (range?.outdoors ?? []).filter((o) => (!single || o.phase !== '3Ø') && o.kw >= load - 0.05 && indoor >= o.connect[0] - 0.05 && indoor <= o.connect[1] + 0.05)
      .sort((x, y) => x.kw - y.kw);
    const pick = fits[0] ?? null, checks = [];
    if (!pick) checks.push({ id: 'vrf-size', level: 'warn', title: 'VRF outdoor: none fits',
      detail: `${Math.round(load * 10) / 10} kW of home on ${Math.round(indoor * 10) / 10} kW of fan coils is past what a ${single ? 'single phase ' : ''}PUMY takes. ${single ? 'Three phase opens up the P200–P300 (Equipment), or split' : 'Split'} the job across two outdoor units.` });
    for (const [n, u] of [['A', ua], ['B', ub]]) if (u && u.kw > 14.05) checks.push({ id: 'vrf-indoor-' + n, level: 'warn', title: `System ${n}: fan coil for the VRF`,
      detail: `${u.kw} kW is past the City Multi slim ducted range: check a PEFY of this size is on the PUMY's connection list.` });
    return { pick, load, indoor, units: [ua, ub], checks, single };
  }
  let options = null;

  /// The send checks, the materials and the reports: system A's then system B's.
  async function both(cmd, args, full) {
    if (isDuctedB(full)) return bothDucted(cmd, args, full);
    const [a, b0] = await Promise.all([call(cmd, { ...args, project: ductedPart(full) }).catch((e) => ({ error: e })),
      call(cmd, { ...args, project: splitPart(full) }).catch((e) => ({ error: e }))]);
    let b = b0;
    if (b.error && cmd === 'report' && args.kind === 'customer') {
      // The engine's customer report is the ducted one; B's part is its heads and outdoor units, set out here.
      b = { blocks: splitCustomerBlocks(await call('splitPlan', { project: splitPart(full) })) };
    }
    if (b.error) throw b.error;
    if (cmd === 'checks') {
      return { checks: [...(a.checks ?? []), ...b.checks.map((c) => ({ ...c, id: 'B-' + c.id, title: 'System B: ' + c.title }))] };
    }
    if (cmd === 'takeoff') {
      if (a.error) throw a.error;
      const bGroups = b.groups.map((grp) => ({ ...grp, name: 'System B · ' + grp.name }));
      const bRows = b.csv.split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.replace(/^"/, '"System B · '));
      return { groups: [...a.groups, ...bGroups], csv: [...a.csv.split(/\r?\n/).filter(Boolean), ...bRows].join('\r\n') + '\r\n' };
    }
    // A report: system A's blocks, then B's under a heading of its own.
    if (a.error) throw a.error;
    const bBlocks = (b.blocks ?? []).filter((x) => !['letterhead', 'title', 'subtitle'].includes(x.type));
    return { ...a, blocks: [...(a.blocks ?? []), { type: 'page' }, { type: 'heading', text: 'System B: the split' }, ...bBlocks] };
  }

  return jobCall;
}

/// System B on the customer report: what goes in each room, and the outdoor units.
function splitCustomerBlocks(sp) {
  const r = sp.range ?? {}, heads = sp.heads ?? [], outs = sp.outdoors ?? [];
  const what = r.vrf ? 'a slim ducted head in a bulkhead, on a VRF system' : r.wall ? 'a wall-mounted head' : 'a slim ducted head in a bulkhead';
  const kw = (n) => `${Math.round(n * 10) / 10} kW`;
  return [
    { type: 'text', text: `${[...new Set(heads.map((h) => h.roomName))].join(', ')}: each gets ${what}, sized to the room and run on its own controller, on ${outs.length === 1 ? 'an outdoor unit' : outs.length + ' outdoor units'} of ${outs.length === 1 ? 'its' : 'their'} own. ${r.brand ?? ''} ${r.name ?? ''}.` },
    { type: 'table', cols: [{ title: 'Room', width: 0.4 }, { title: 'Head', width: 0.4 }, { title: 'Cooling', width: 0.2, align: 'right' }],
      rows: heads.map((h) => [h.roomName, h.model, kw(h.coolKW)]) },
    { type: 'table', cols: [{ title: 'Outdoor unit', width: 0.4 }, { title: 'Runs', width: 0.4 }, { title: 'Capacity', width: 0.2, align: 'right' }],
      rows: outs.map((o) => [o.model, `${o.heads.length} head${o.heads.length === 1 ? '' : 's'}`, kw(o.coolKW)]) },
  ];
}

/// Two ducted systems on one VRF: the materials' outdoor units (one per ducted split) out, the one VRF outdoor and its
/// branch joint in, and each fan coil marked as a City Multi ducted indoor of its size.
function vrfMaterials(groups, vrf) {
  const out = groups.map((grp) => ({ ...grp, lines: grp.lines.filter((l) => !/^Outdoor unit · /.test(l.desc)).map((l) => /^Indoor unit \(ducted\) · /.test(l.desc)
    ? { ...l, desc: l.desc.replace('Indoor unit (ducted) · ', 'Indoor unit (ducted, on the VRF) · '), note: l.note + ' · a City Multi ducted indoor (PEFY/PEAD) of this size to suit the PUMY' }
    : l) }));
  const kw = (n) => `${Math.round(n * 10) / 10} kW`;
  const line = (desc, note, term) => ({ desc, note, qty: 1, uom: 'ea', qtyText: '1', term, url: 'https://www.reece.com.au/search?query=' + encodeURIComponent(term) });
  const lines = vrf?.pick
    ? [line(`VRF outdoor unit · Mitsubishi Electric ${vrf.pick.model}`, `${kw(vrf.pick.kw)} City Multi, ${vrf.pick.phase === '3Ø' ? 'three phase, 400 V' : 'single phase, 230 V'} · runs both systems (${kw(vrf.indoor)} of fan coils on a ${kw(vrf.load)} home)`, `mitsubishi ${vrf.pick.model}`),
      line(`Refrigerant branch joint · Mitsubishi Electric ${vrf.indoor <= 20.2 ? 'CMY-Y62-G-E' : 'CMY-Y64-G-E'}`, 'splits the VRF pipes to the two fan coils · check the size against the install manual', `mitsubishi ${vrf.indoor <= 20.2 ? 'CMY-Y62-G-E' : 'CMY-Y64-G-E'}`)]
    : [line('VRF outdoor unit · to be picked', `no PUMY fits ${kw(vrf?.indoor ?? 0)} of fan coils on a ${kw(vrf?.load ?? 0)} home`, 'mitsubishi pumy')];
  out.unshift({ name: 'VRF outdoor', lines });
  return out.filter((grp) => grp.lines.length);
}

/// The materials as CSV, the engine's way (Takeoff.csv).
function takeoffCSV(groups) {
  const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [['Group', 'Item', 'Detail', 'Qty', 'Unit', 'Reece search']];
  for (const grp of groups) for (const l of grp.lines) rows.push([grp.name, l.desc, l.note, l.qty === Math.round(l.qty) ? String(l.qty) : String(l.qty), l.uom, l.url]);
  return rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
}
