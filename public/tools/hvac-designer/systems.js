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

/// The ducted system on its own: the house less B's rooms, and no outlet or zone pick left in them.
export function ductedPart(p) {
  const off = splitSet(p);
  const out = { ...p, rooms: p.rooms.filter((r) => !off.has(r.id)), system: 'ducted' };
  delete out.splitRooms; delete out.split;
  if (p.design) out.design = { ...p.design, outlets: (p.design.outlets ?? []).filter((o) => !off.has(o.roomId)) };
  if (p.zonePlan) out.zonePlan = Object.fromEntries(Object.entries(p.zonePlan).filter(([k, v]) => !off.has(k) && !off.has(v)));
  if (p.spill?.room && off.has(p.spill.room)) delete out.spill;
  return out;
}

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
  const off = splitSet(full);
  const mine = kind === 'split' ? (r) => off.has(r.id) : kind === 'ducted' ? (r) => !off.has(r.id) : () => true;
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
    // Where the zone cards were moved to by hand: the page's, not the engine's, so it's carried through every reply.
    if (r?.project?.rooms && full.zoneCards && r.project.zoneCards == null) r.project.zoneCards = full.zoneCards;
    return r;
  }

  /// The send checks, the materials and the reports: system A's then system B's.
  async function both(cmd, args, full) {
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
