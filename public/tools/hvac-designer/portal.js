// The designer inside an installer's own system (the Advanced Gas portal, 28 Nov 2026: "push this to a tool in the
// portal ... link it to a job ... build a full quote in the job ... push a button and it will update the quote").
//
// The portal shows this page in a frame with ?portal=1. It hands over the job (its number, the customer, the
// address), the design saved on it if there is one, and the sizes it stocks; the designer hands back the project
// each time it's saved, its plan images once each, and — on Build quote — the materials list and a summary for the
// quote. The portal keeps the design against the job and writes the quote; nothing here talks to a server.
//
// Messages only go to, and are only taken from, the portals listed here.

const PORTALS = [
  // The live portal (www.), and a branch test address such as new.advancedgas.com.au.
  /^https:\/\/([a-z0-9-]+\.)?advancedgas\.com\.au$/,
  // Vercel's preview builds of the AGA site.
  /^https:\/\/advanced-gas-website[a-z0-9-]*\.vercel\.app$/,
  // A portal on this computer, only while the designer is too (never the live designer).
  ...(location.hostname === 'localhost' ? [/^http:\/\/localhost:\d+$/] : []),
];

export const portal = {
  /** Framed by a portal and asked to be (?portal=1). */
  on: false,
  origin: null,
  /** The job as the portal sent it: { number, customer, address, phone, email }. */
  job: null,
  /** The quote already on the job, if any: { estimateId, total, at }. */
  quoted: null,
};

const framed = (() => { try { return window.parent && window.parent !== window; } catch (_) { return true; } })();
portal.on = framed && new URLSearchParams(location.search).get('portal') === '1';

function send(type, body) {
  if (!portal.on || !portal.origin) return;
  window.parent.postMessage({ type, ...body }, portal.origin);
}

let onOpen = null;
let onQuoted = null;

/** Wait for the portal's job (and say we're ready for it). */
export function listen(handlers) {
  onOpen = handlers.open;
  onQuoted = handlers.quoted;
  window.addEventListener('message', (e) => {
    if (!PORTALS.some((re) => re.test(e.origin))) return;
    if (portal.origin && e.origin !== portal.origin) return;
    const m = e.data;
    if (!m || typeof m.type !== 'string') return;
    if (m.type === 'tt:open') {
      portal.origin = e.origin;
      portal.job = m.job ?? null;
      portal.quoted = m.quoted ?? null;
      onOpen?.(m);
    } else if (m.type === 'tt:quoted') {
      portal.quoted = m.quoted ?? null;
      onQuoted?.(m);
    }
  });
  // The portal's origin isn't known until it writes, so "ready" goes to each one it could be; only the real
  // parent receives it.
  for (const o of ['https://advancedgas.com.au', 'https://www.advancedgas.com.au', document.referrer && new URL(document.referrer).origin].filter(Boolean)) {
    if (PORTALS.some((re) => re.test(o))) { try { window.parent.postMessage({ type: 'tt:ready' }, o); } catch (_) {} }
  }
}

let saveTimer = null;
/** The project, a moment after the last change (a drag sends one save, not fifty). */
export function saved(project, summary) {
  if (!portal.on) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => send('tt:save', { project, summary }), 1200);
}

/** Saves still waiting go now (before a quote, so the design on the job is the one quoted). */
export function flush(project, summary) {
  if (!portal.on) return;
  clearTimeout(saveTimer);
  send('tt:save', { project, summary });
}

const sentImages = new Set();
/** A plan image, once: the portal keeps it with the job so the plan opens under the rooms on any computer. */
export async function image(name, blob) {
  if (!portal.on || !blob || sentImages.has(name)) return;
  sentImages.add(name);
  send('tt:image', { name, blob });
}
export function imageKnown(name) { sentImages.add(name); }

export function quote(body) { send('tt:quote', body); }
