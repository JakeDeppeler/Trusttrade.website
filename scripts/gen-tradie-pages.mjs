// Build-time generator for public SEO tradie pages at /tradie and /tradie/<slug>.
// Runs on every build, fetches PUBLIC listings from Supabase via the REST API
// (publishable key — safe) using the SAME filter the app uses so the website and
// app line up exactly: status='approved' OR was_approved=true (matches the
// public_read_approved_listings RLS policy). Emits self-contained static HTML in the
// site's look (its floating header, footer, Archivo type) with the profile and the
// tradie cards drawn the way the app draws them: see scripts/tradie-render.js, which
// the pages also run in the browser to show live data. Non-fatal on error.

import { mkdirSync, writeFileSync, rmSync, readFileSync } from "fs";
import { join } from "path";

const SB = "https://pvcblfpxgrznzqgxbujy.supabase.co";
const KEY = "sb_publishable_xXxZpIBsumD14mC4zn9qLQ_i4Su8yEN";
const SITE = "https://trusttrade.au";
const OUT = "public/tradie";

// The profile/card renderer, shared with the browser (inlined into the pages below).
const RENDER_SRC = readFileSync(new URL("./tradie-render.js", import.meta.url), "utf8");
const TT = new Function(RENDER_SRC + "\nreturn TT;")();
const APP_STORE = TT.APP_STORE;

const H = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// "a plumber", "an electrician", "an HVAC technician".
const an = (w) => (/^(?:[aeiou]|hvac)/i.test(String(w)) ? "an" : "a");
// JSON for an inline <script>: never let data close the tag.
const J = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const num = (v) => (v == null || v === "" || isNaN(+v) ? null : +v);
const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Normalise any trade string into a category (so "HVAC Technician" and "HVAC"
// share one page). Returns {slug, plural, singular}.
function tradeCat(trade) {
  const t = (trade || "").toLowerCase();
  if (t.includes("plumb")) return { slug: "plumbers", plural: "Plumbers", singular: "plumber" };
  if (t.includes("elec")) return { slug: "electricians", plural: "Electricians", singular: "electrician" };
  if (t.includes("gas")) return { slug: "gas-fitters", plural: "Gas fitters", singular: "gas fitter" };
  if (t.includes("hvac") || t.includes("air") || t.includes("heat") || t.includes("cool")) return { slug: "hvac", plural: "HVAC & air-con technicians", singular: "HVAC technician" };
  if (t.includes("carp") || t.includes("build")) return { slug: "carpenters", plural: "Carpenters", singular: "carpenter" };
  if (t.includes("roof")) return { slug: "roofers", plural: "Roofers", singular: "roofer" };
  if (t.includes("paint")) return { slug: "painters", plural: "Painters", singular: "painter" };
  if (t.includes("tile") || t.includes("tiler")) return { slug: "tilers", plural: "Tilers", singular: "tiler" };
  if (t.includes("handy")) return { slug: "handyman-services", plural: "Handyman services", singular: "handyman" };
  const s = slugify(trade) || "tradies";
  return { slug: s, plural: (trade || "Tradies"), singular: (trade || "tradie").toLowerCase() };
}
// Canonical trades the platform supports — one hub page each (indexed once it
// has ≥1 verified tradie; a browsable "onboarding" page, noindexed, until then).
const ALL_TRADES = [
  { slug: "plumbers", plural: "Plumbers", singular: "plumber" },
  { slug: "gas-fitters", plural: "Gas fitters", singular: "gas fitter" },
  { slug: "electricians", plural: "Electricians", singular: "electrician" },
  { slug: "hvac", plural: "HVAC & air-con technicians", singular: "HVAC technician" },
  { slug: "carpenters", plural: "Carpenters", singular: "carpenter" },
  { slug: "roofers", plural: "Roofers", singular: "roofer" },
  { slug: "painters", plural: "Painters", singular: "painter" },
  { slug: "tilers", plural: "Tilers", singular: "tiler" },
  { slug: "handyman-services", plural: "Handyman services", singular: "handyman" },
];
// Great-circle distance in km between two lat/lng points.
function haversine(a, b, c, d) {
  if ([a, b, c, d].some((v) => v == null || isNaN(+v))) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLa = toR(c - a), dLo = toR(d - b);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
// Does tradie `l` serve `loc` (same suburb, or within their service radius)?
function serves(l, loc) {
  if ((l.suburb || "").toLowerCase() === (loc.suburb || "").toLowerCase()) return true;
  const d = haversine(num(l.lat), num(l.lng), num(loc.lat), num(loc.lng));
  if (d == null) return false;
  return d <= (num(l.service_radius_km) || 25) + 0.5;
}

async function api(path) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

// ───────────────────────── site chrome (matches src/components/PageChrome.jsx) ─────────────────────────
const NAV = [["How it works", "/how-it-works"], ["For tradies", "/for-tradies"], ["Trade tools", "/tools"], ["Our story", "/our-story"]];
const LOGO = `<picture><source srcset="/assets/mascot-toolbox-sm.avif" type="image/avif"><img class="brand-mascot" src="/assets/mascot-toolbox-sm.webp" alt="" aria-hidden="true" width="160" height="112" decoding="async"></picture>`;
const BURGER = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`;
const CLOSE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>`;
const HEADER = `<header class="hdr"><div class="hdr-in">
 <a class="brand" href="/">${LOGO}Trust Trade<span class="reg">®</span></a>
 <nav class="nav">${NAV.map(([l, h]) => `<a href="${h}">${l}</a>`).join("")}</nav>
 <div class="hcta"><a class="btn-amber" href="${APP_STORE}" target="_blank" rel="noopener">Download app</a><button type="button" class="menu-btn" aria-label="Open menu" onclick="ttMenu(true)">${BURGER}</button></div>
</div></header>
<div class="menu" id="ttmenu" role="dialog" aria-modal="true" aria-label="Site menu"><div class="menu-head"><a class="brand" href="/">Trust Trade<span class="reg">®</span></a><button type="button" class="menu-btn" aria-label="Close menu" onclick="ttMenu(false)">${CLOSE}</button></div><nav class="menu-links">${NAV.map(([l, h]) => `<a href="${h}">${l}</a>`).join("")}</nav><div class="menu-cta"><a class="btn-amber" href="${APP_STORE}" target="_blank" rel="noopener">Download app →</a></div></div>
<script>function ttMenu(o){var m=document.getElementById('ttmenu');if(!m)return;m.classList.toggle('on',o);document.body.style.overflow=o?'hidden':'';}</script>`;
const FOOTER = `<footer class="foot"><div class="fwrap">
 <div class="foot-top">
  <div class="foot-brand"><div class="brand">${LOGO.replace('decoding="async"', 'loading="lazy" decoding="async"')}Trust Trade<span class="reg">®</span></div>
   <p>Verified. Insured. Done proper. Built in Melbourne for Aussie homes and Aussie trades.</p>
   ${TT.appStore("light")}</div>
  <div class="foot-col"><h3>Product</h3><ul><li><a href="/how-it-works">How it works</a></li><li><a href="/for-homeowners">For homeowners</a></li><li><a href="/how-we-verify">How we verify</a></li><li><a href="/trades">Trades we cover</a></li><li><a href="/faq">FAQ</a></li></ul></div>
  <div class="foot-col"><h3>For Tradies</h3><ul><li><a href="/for-tradies">Why join</a></li><li><a href="/apply">Apply</a></li><li><a href="/faq#tradies">Tradie FAQ</a></li><li><a href="mailto:jake@trusttrade.au">Contact</a></li></ul></div>
  <div class="foot-col"><h3>Company</h3><ul><li><a href="/our-story">Our story</a></li><li><a href="mailto:jake@trusttrade.au">Support</a></li><li><a href="mailto:jake@trusttrade.au?subject=Privacy%20question">Privacy</a></li><li><a href="mailto:jake@trusttrade.au?subject=Terms%20question">Terms</a></li></ul></div>
 </div>
 <div class="foot-bottom"><div>© 2026 Trust Trade® · ABN 40 873 784 535</div><div>Made in Melbourne · Australia · <a href="/dashboard">Tradie login</a></div></div>
</div></footer>`;
const FONTS = `<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>`;

const STYLE = `<style>
@font-face{font-family:"Archivo";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/archivo.woff2) format("woff2")}
@font-face{font-family:"Archivo";font-style:italic;font-weight:100 900;font-display:swap;src:url(/fonts/archivo-italic.woff2) format("woff2")}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:100 800;font-display:swap;src:url(/fonts/jetbrains-mono.woff2) format("woff2")}
:root{--bg:#ffffff;--bg-1:#fafaf7;--bg-2:#f5f2eb;--bg-3:#ebe6d9;--text:#15110d;--text-dim:#5d503e;--text-faint:#6f6051;--accent:#f2a900;--accent-hi:#f0b946;--accent-ink:#8a6200;--line:rgba(21,17,13,.06);--line-strong:rgba(21,17,13,.14);--green:#1a8f57;--star:#E9A21C;
 --font:"Archivo","Helvetica Neue",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--shadow:0 1px 3px rgba(16,16,16,.05),0 18px 40px -26px rgba(16,16,16,.35)}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:150px}
body{margin:0;font-family:var(--font);font-size:17px;line-height:1.5;color:var(--text);background:var(--bg-1);-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
body::before{content:"";position:absolute;left:-5%;right:-5%;top:0;height:640px;z-index:-1;pointer-events:none;background:radial-gradient(60% 50% at 50% 0%,rgba(255,200,54,.30),transparent 70%),radial-gradient(40% 40% at 15% 20%,rgba(242,184,31,.16),transparent 70%),radial-gradient(40% 40% at 85% 15%,rgba(242,184,31,.14),transparent 70%)}
body::after{content:"";position:absolute;left:0;right:0;top:380px;height:260px;z-index:-1;pointer-events:none;background:linear-gradient(to bottom,rgba(250,250,247,0),var(--bg-1))}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.ti{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.ti.fill{fill:currentColor;stroke:none}
/* header: the site's floating island */
.hdr{position:fixed;top:clamp(10px,1.4vw,18px);left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:1060px;z-index:60}
.hdr-in{height:62px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:0 12px 0 20px;border-radius:999px;background:rgba(255,255,255,.82);border:1px solid var(--line-strong);box-shadow:0 14px 44px -16px rgba(23,17,10,.18),0 1px 0 rgba(255,255,255,.6) inset;-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%)}
.brand{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:19px;letter-spacing:-.025em;white-space:nowrap;color:var(--text)}
.brand-mascot{height:32px;width:auto;display:block}
.brand .reg{font-size:10px;font-weight:700;transform:translateY(-9px);color:var(--text-dim)}
.nav{display:none;justify-self:center;gap:24px;white-space:nowrap}
.nav a{font-size:14px;font-weight:500;color:var(--text-dim)}.nav a:hover{color:var(--text)}
.hcta{justify-self:end;display:flex;align-items:center;gap:10px}
.btn-amber{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:40px;padding:0 16px;border-radius:999px;background:var(--accent);color:#17110a;font-size:13px;font-weight:600;letter-spacing:-.005em;border:1px solid transparent;box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 14px 32px -10px rgba(242,169,0,.55);white-space:nowrap}
.btn-amber:hover{background:var(--accent-hi)}
.menu-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1px solid var(--line-strong);border-radius:999px;background:transparent;color:var(--text);cursor:pointer}
@media(min-width:860px){.nav{display:flex}.menu-btn{display:none}}
@media(max-width:760px){.hcta .btn-amber{display:none}}
.menu{position:fixed;inset:0;z-index:100;display:none;flex-direction:column;padding:14px clamp(20px,4vw,56px) 28px;background:rgba(41,33,26,.96);-webkit-backdrop-filter:saturate(140%) blur(18px);backdrop-filter:saturate(140%) blur(18px)}
.menu.on{display:flex}
.menu-head{display:flex;align-items:center;justify-content:space-between;height:40px;margin-bottom:40px}
.menu-head .brand,.menu-head .brand .reg{color:#f5eedf}.menu-head .menu-btn{color:#f5eedf;border-color:rgba(245,238,223,.2)}
.menu-links{display:flex;flex-direction:column;border-top:1px solid rgba(245,238,223,.1)}
.menu-links a{display:block;padding:18px 0;border-bottom:1px solid rgba(245,238,223,.1);font-weight:800;font-size:24px;letter-spacing:-.02em;color:#f5eedf}
.menu-cta{margin-top:auto;padding-top:28px}.menu-cta .btn-amber{width:100%;height:52px;font-size:15px}
/* App Store button, as on the site */
.appstore{display:inline-flex;align-items:center;gap:12px;height:58px;padding:0 24px 0 20px;border-radius:14px;background:#17110A;color:#F3ECDD;box-shadow:0 14px 30px -12px rgba(0,0,0,.5);transition:transform .15s ease}
.appstore:hover{transform:translateY(-1px)}
.appstore .glyph{display:inline-flex;line-height:0}
.appstore .as-txt{display:flex;flex-direction:column;line-height:1.05;text-align:left}
.appstore .small{font-size:11px;opacity:.85;letter-spacing:.02em}.appstore .big{font-weight:700;font-size:19px;letter-spacing:-.01em}
.appstore.light{background:#fff;color:#17110A;border:1px solid var(--line-strong);box-shadow:none}
/* footer, as on the site */
.foot{background:#fff;border-top:1px solid var(--line);padding:80px 0 32px;margin-top:72px}
.fwrap{max-width:1280px;margin:0 auto;padding:0 clamp(20px,4vw,56px)}
.foot-top{display:grid;grid-template-columns:1fr;gap:40px;padding-bottom:60px;border-bottom:1px solid var(--line)}
@media(min-width:800px){.foot-top{grid-template-columns:1.3fr 1fr 1fr 1fr}}
.foot-brand .brand{font-size:28px;font-weight:800}.foot-brand .brand-mascot{height:38px}
.foot-brand p{margin:14px 0 22px;color:var(--text-dim);font-size:14px;max-width:32ch}
.foot-col h3{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);margin:0 0 18px}
.foot-col ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.foot-col a,.foot-bottom a{color:var(--text-dim);font-size:15px;text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px}
.foot-col a:hover,.foot-bottom a:hover{color:var(--text)}
.foot-bottom{padding-top:24px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;font-size:13px;color:var(--text-dim)}
.foot-bottom a{font-size:13px}
@media(max-width:760px){.foot{padding:48px 0 24px}.foot-top{grid-template-columns:1fr 1fr;gap:28px;padding-bottom:32px}.foot-brand{grid-column:1/-1}.foot-brand .brand{font-size:22px}.foot-brand p{font-size:13px;max-width:none}.foot-col h3{margin:0 0 12px;font-size:10px}.foot-col ul{gap:8px}.foot-col a{font-size:14px}.foot-bottom{font-size:12px;gap:8px}}
/* page frame */
.page{max-width:1120px;margin:0 auto;padding:118px 20px 0}
.crumbs{font-size:13px;color:var(--text-faint);margin:0 0 16px}.crumbs a{color:var(--accent-ink);font-weight:600}.crumbs span{color:var(--text-dim)}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--text-dim);background:rgba(21,17,13,.04);border:1px solid var(--line);border-radius:999px;padding:7px 16px}
.eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent)}
.dh{font-size:clamp(40px,6.4vw,76px);font-weight:900;letter-spacing:-.035em;line-height:.95;margin:18px 0 14px}
.dsub{font-size:17px;color:var(--text-dim);max-width:62ch;margin:0 0 26px}
.filters{display:flex;gap:10px;margin:0 0 22px;flex-wrap:wrap}
.filters input,.filters select{height:52px;padding:0 20px;border:1px solid var(--line-strong);border-radius:999px;font:inherit;font-size:15px;background:#fff;color:var(--text)}
.filters input{flex:1;min-width:220px}.filters select{padding-right:14px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;padding-bottom:10px}
.none{text-align:center;color:var(--text-dim);padding:40px 0}.none a{color:var(--accent-ink);font-weight:600;text-decoration:underline}
.trust{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px}.trust span{background:rgba(34,168,99,.12);color:var(--green);font-size:13px;font-weight:700;padding:7px 13px;border-radius:999px}
.links{margin:30px 0}.links h3{font-size:16px;font-weight:800;letter-spacing:-.01em;margin:0 0 12px}
.lg{display:flex;flex-wrap:wrap;gap:8px}.lg a{background:#fff;border:1px solid var(--line-strong);color:var(--text-dim);font-size:14px;font-weight:600;padding:9px 15px;border-radius:999px;transition:border-color .12s}.lg a:hover{border-color:var(--accent);color:var(--text)}
.card{background:#fff;border-radius:26px;border:1px solid var(--line);box-shadow:var(--shadow);padding:26px 28px;margin:20px 0}
.card h2{font-size:21px;font-weight:800;letter-spacing:-.03em;margin:0 0 10px}
.body{margin:0;color:var(--text-dim);font-size:16px;line-height:1.6;white-space:pre-line}
a.big{display:flex;justify-content:center;align-items:center;background:var(--accent);color:#17110a;font-weight:700;padding:16px 20px;border-radius:999px;font-size:16px;margin:20px 0;box-shadow:0 14px 32px -10px rgba(242,169,0,.55)}
a.big:hover{background:var(--accent-hi)}
/* tradie cards (the app's Find cards) */
.tc{display:flex;flex-direction:column;background:#fff;border-radius:26px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);transition:transform .15s,box-shadow .15s}
.tc:hover{transform:translateY(-3px);box-shadow:0 24px 50px -28px rgba(23,17,10,.4)}
.tc-cover{position:relative;display:grid;place-items:center;aspect-ratio:16/10;background-size:cover;background-repeat:no-repeat}
.tc-glyph{width:54px;height:54px;stroke:#15110d;opacity:.22;stroke-width:1.3}
.tc-ver{position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.95);color:var(--green);font-size:12px;font-weight:800;padding:5px 11px 5px 8px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.tc-ver .ti{width:13px;height:13px;stroke-width:3}
.tc-body{display:flex;flex-direction:column;gap:3px;padding:16px 18px 18px}
.tc-name{font-size:18px;font-weight:800;letter-spacing:-.02em;line-height:1.2}
.tc-sub{font-size:14px;color:var(--text-dim)}
.tc-rate{display:inline-flex;align-items:center;gap:5px;margin-top:8px;font-size:14px}.tc-rate .ti{width:15px;height:15px;color:var(--star)}.tc-rate span{color:var(--text-dim)}
.tc-new{color:var(--text-dim);font-weight:600;font-size:13px}
/* the profile (the app's NewProfile) */
.tp{max-width:1120px;margin:0 auto;padding:108px 20px 0}
.tp-hero{position:relative;height:clamp(300px,40vw,460px);border-radius:32px;overflow:hidden;background:#D9D1C3 center/cover no-repeat;box-shadow:var(--shadow)}
.tp-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:65%;background:linear-gradient(to top,rgba(14,13,11,.9) 6%,rgba(14,13,11,.35) 55%,rgba(14,13,11,0));pointer-events:none}
.tp-nophoto::after{display:none}
.tp-heroic{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);width:92px;height:92px;stroke:#15110d;opacity:.2;stroke-width:1.1}
.tp-id{position:absolute;left:clamp(22px,4vw,44px);right:clamp(22px,4vw,44px);bottom:clamp(50px,6vw,70px);z-index:2;color:#fff}
.tp-id h1{margin:0;font-size:clamp(34px,5.4vw,62px);font-weight:900;letter-spacing:-.045em;line-height:.98}
.tp-id p{margin:10px 0 0;font-size:clamp(15px,1.6vw,18px);color:rgba(255,255,255,.88)}
.tp-nophoto .tp-id{color:var(--text)}.tp-nophoto .tp-id p{color:var(--text-dim)}
.tp-stats{position:relative;z-index:3;margin:-36px auto 0;max-width:620px;display:flex;background:#fff;border:1px solid var(--line);border-radius:24px;padding:14px 8px;box-shadow:0 18px 40px -18px rgba(16,16,16,.35)}
.tp-stat{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 6px;border-right:1px solid var(--line)}.tp-stat:last-child{border-right:0}
.tp-stat b{display:flex;align-items:center;gap:5px;font-size:22px;font-weight:800;letter-spacing:-.035em;white-space:nowrap}
.tp-stat span{font-size:12.5px;color:var(--text-dim);white-space:nowrap}
.tp-star{width:17px;height:17px;color:var(--star)}
.tp-tabs{position:sticky;top:90px;z-index:20;display:flex;max-width:520px;margin:22px auto 0;padding:4px;background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:999px;box-shadow:0 2px 14px rgba(16,16,16,.07)}
.tp-tabs a{flex:1;text-align:center;padding:10px 0;border-radius:999px;font-size:14.5px;font-weight:600;color:var(--text-dim);transition:background .15s,color .15s}
.tp-tabs a.on{background:var(--text);color:#fff;font-weight:700}
.tp-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px;align-items:start;margin-top:22px}
.tp-main{display:flex;flex-direction:column;gap:20px;min-width:0}
.tp-side{position:sticky;top:150px;display:flex;flex-direction:column;gap:20px}
.tp-card{background:#fff;border:1px solid var(--line);border-radius:30px;overflow:hidden;box-shadow:var(--shadow);scroll-margin-top:150px}
.tp-sec{padding:24px 26px;border-bottom:1px solid var(--line)}.tp-sec:last-child{border-bottom:0}
.tp-sec h2{margin:0 0 12px;font-size:21px;font-weight:800;letter-spacing:-.03em;line-height:1.2}
.tp-shead{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.tp-shead span{font-size:13px;color:var(--text-dim)}
.tp-bio{margin:0;font-size:16px;line-height:1.6;color:var(--text-dim);white-space:pre-line}.tp-mu{color:var(--text-faint)}
.tp-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.tp-chip{display:inline-flex;align-items:center;gap:6px;background:var(--bg-2);color:var(--text);border-radius:999px;padding:7px 13px;font-size:13.5px;font-weight:600}
.tp-chip.g{background:rgba(34,168,99,.13);color:var(--green)}
.tp-dealer{font-style:normal;font-size:11px;font-weight:700;background:var(--accent);color:#17110a;border-radius:999px;padding:1px 7px}
.tp-map{position:relative;height:240px;border-radius:22px;overflow:hidden;background:#EAE6DD}
.tp-mapsvg{position:absolute;inset:0;width:100%;height:100%}
.tp-mappin{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:999px;background:var(--text);color:#fff;display:grid;place-items:center;box-shadow:0 6px 16px rgba(16,16,16,.3)}
.tp-mapchip{position:absolute;left:12px;top:12px;background:#fff;color:#101010;border-radius:999px;padding:6px 12px;font-size:12.5px;font-weight:700;box-shadow:0 2px 8px rgba(16,16,16,.12)}
.tp-base{display:flex;align-items:center;gap:8px;margin:14px 0 0;font-size:15px}
.tp-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.tp-photos a{display:block;border-radius:14px;overflow:hidden;background:var(--bg-2)}
.tp-photos img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;transition:transform .2s}.tp-photos a:hover img{transform:scale(1.03)}
.tp-note{display:flex;align-items:flex-start;gap:8px;margin:16px 0 0;font-size:13px;line-height:1.5;color:var(--text-dim)}.tp-note .ti{width:16px;height:16px;margin-top:1px}
.tp-rows{display:flex;flex-direction:column}
.tp-svc,.tp-chk{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)}
.tp-rows>:last-child{border-bottom:0}
.tp-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.tp-tx b{font-size:15.5px;font-weight:650;line-height:1.3}.tp-tx small{font-size:13px;color:var(--text-dim);line-height:1.4}
.tp-price{flex-shrink:0;align-self:flex-start;background:var(--bg-2);border-radius:999px;padding:5px 11px;font-size:12.5px;font-weight:650;white-space:nowrap}
.tp-ic{width:38px;height:38px;border-radius:12px;background:var(--bg-2);display:grid;place-items:center;flex-shrink:0}
.tp-tag{flex-shrink:0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;background:var(--bg-2)}.tp-tag.g{background:rgba(34,168,99,.13);color:var(--green)}
.tp-how{display:inline-block;margin-top:12px;font-size:14px;font-weight:650;color:var(--accent-ink);text-decoration:underline;text-underline-offset:2px}
.tp-hrs{display:flex;flex-direction:column;gap:4px;font-size:14.5px;font-weight:600}
.tp-rsum{display:flex;align-items:center;gap:24px}
.tp-rbig{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0}.tp-rbig b{font-size:46px;font-weight:900;letter-spacing:-.04em;line-height:1}.tp-rbig small{font-size:12.5px;color:var(--text-dim)}
.tp-bars{flex:1;display:flex;flex-direction:column;gap:5px}
.tp-bar{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim)}.tp-bar i{flex:1;height:6px;border-radius:99px;background:var(--bg-3);overflow:hidden}.tp-bar i b{display:block;height:100%;background:var(--star)}.tp-bar em{font-style:normal;width:18px;text-align:right}
.tp-stars{display:inline-flex;gap:1px}.tst{width:14px;height:14px;fill:var(--bg-3)}.tst.on{fill:var(--star)}
.tp-rev{display:flex;flex-direction:column;gap:8px;padding:16px 0;border-bottom:1px solid var(--line)}
.tp-revh{display:flex;align-items:center;gap:10px}
.tp-revav{width:38px;height:38px;border-radius:999px;background:var(--bg-2);display:grid;place-items:center;font-weight:700;flex-shrink:0}
.tp-rev p{margin:0;font-size:15px;line-height:1.55;color:var(--text-dim)}
.tp-vjob{align-self:flex-start;display:inline-flex;align-items:center;gap:4px;background:rgba(34,168,99,.13);color:var(--green);border-radius:999px;padding:3px 9px 3px 6px;font-size:12px;font-weight:700}.tp-vjob .ti{width:14px;height:14px}
.tp-reply{background:var(--bg-2);border-radius:16px;padding:12px 14px;font-size:14px;line-height:1.5;color:var(--text-dim)}.tp-reply b{display:block;color:var(--text);margin-bottom:2px}
.tp-rempty{text-align:center;padding:40px 26px}.tp-rempty>.ti{width:30px;height:30px;color:var(--text-faint)}.tp-rempty h2{margin:10px 0 6px}.tp-rempty p{margin:0 auto;max-width:40ch;color:var(--text-dim);font-size:15px}
.tp-cta{padding:28px 26px;background:#17110A;color:#F3ECDD;border:0;box-shadow:0 30px 60px -30px rgba(23,17,10,.55)}
.tp-cta h2{margin:0 0 8px;color:#F3ECDD;font-size:25px;font-weight:900;letter-spacing:-.035em;line-height:1.1}
.tp-cta p{margin:0 0 20px;color:rgba(243,236,221,.75);font-size:15px;line-height:1.55}
.tp-cta .appstore{background:#F3ECDD;color:#17110A}
.tp-cta small{display:block;margin-top:14px;color:rgba(243,236,221,.6);font-size:12.5px}
.tp-na{text-align:center;padding:48px 26px;margin-top:10px}.tp-na p{color:var(--text-dim);margin:0 0 20px}
.tp-dock{display:none}
@media(max-width:960px){
 .tp-grid{grid-template-columns:minmax(0,1fr)}.tp-side{position:static}
 .tp{padding-bottom:110px}
 .tp-dock{display:flex;flex-direction:column;align-items:center;gap:5px;position:fixed;left:12px;right:12px;bottom:12px;z-index:50;padding:10px 12px 8px;border-radius:26px;background:rgba(255,255,255,.95);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid var(--line-strong);box-shadow:0 14px 44px -16px rgba(23,17,10,.3)}
 .tp-dock a{display:block;width:100%;text-align:center;background:var(--text);color:#fff;font-weight:700;font-size:15.5px;border-radius:999px;padding:14px}
 .tp-dock small{font-size:12px;color:var(--text-dim);text-align:center}
}
@media(max-width:640px){
 .page{padding:96px 14px 0}.tp{padding:92px 12px 110px}
 .tp-hero{border-radius:26px;height:340px}.tp-stats{margin:-30px 6px 0}.tp-stat b{font-size:19px}
 .tp-tabs{top:80px}.tp-tabs a{font-size:13.5px}
 .tp-sec{padding:20px}.tp-rsum{gap:16px}.tp-photos{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.tp-photos a{border-radius:10px}
 .card{padding:22px 20px}
}
</style>`;

// Keeps the profile's tab pill on the section you're reading.
const TABS_JS = `<script>(function(){var t=document.querySelectorAll('.tp-tabs a');if(!t.length||!('IntersectionObserver' in window))return;var on=function(id){t.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+id);});};var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)on(e.target.id);});},{rootMargin:'-40% 0px -55% 0px'});['about','photos','services','reviews'].forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});})();</script>`;

function crumbsFor(l) {
  const cat = tradeCat(l.trade);
  const hub = ALL_TRADES.some((t) => t.slug === cat.slug) ? ` › <a href="/find/${cat.slug}">${H(cat.plural)}</a>` : "";
  return `<nav class="crumbs"><a href="/">Home</a> › <a href="/tradie">Find a tradie</a>${hub} › <span>${H(l.name)}</span></nav>`;
}

function page(l, reviews) {
  const trade = l.trade || "Tradie";
  const suburb = l.suburb || "";
  const url = `${SITE}/tradie/${l.slug}`;
  const title = `${l.name} — ${trade}${suburb ? " in " + suburb : ""}, VIC | Trust Trade`;
  const desc = (l.description && l.description.trim())
    ? l.description.trim().slice(0, 155)
    : `${l.name} is a verified, insured ${trade.toLowerCase()}${suburb ? " serving " + suburb + " and nearby" : " in Victoria"}. See services, reviews and get a quote on Trust Trade.`;
  const ogImg = TT.ownPhotos(l)[0] || l.photo || `${SITE}/og-image.png`;
  const r = TT.rating(reviews);
  const ld = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: l.name, image: ogImg, url,
    ...(l.phone ? { telephone: l.phone } : {}), ...(l.website ? { sameAs: [l.website] } : {}),
    description: desc,
    address: { "@type": "PostalAddress", addressLocality: suburb, addressRegion: "VIC", ...(l.postcode ? { postalCode: String(l.postcode) } : {}), addressCountry: "AU" },
    areaServed: suburb || "Victoria", priceRange: "$$",
    // Only real Trust Trade reviews, never the listing's stored rating.
    ...(r.n ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(r.avg.toFixed(1)), reviewCount: r.n } } : {}),
  };

  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="apple-itunes-app" content="app-id=6778369757">
<title>${H(title)}</title><meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="profile"><meta property="og:title" content="${H(l.name + " — " + trade + (suburb ? " in " + suburb : ""))}"><meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${H(ogImg)}"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${H(l.name)}"><meta name="twitter:description" content="${H(desc)}"><meta name="twitter:image" content="${H(ogImg)}">
<script type="application/ld+json">${J(ld)}</script>
${FONTS}${STYLE}</head><body>
${HEADER}
<main id="root">${TT.profile(l, reviews, { crumbs: crumbsFor(l) })}</main>
${FOOTER}
${TABS_JS}
<script>
// LIVE: if this tradie has been hidden/denied/removed in admin since the last
// build, reflect it immediately instead of showing a stale profile.
(function(){var slug=${J(l.slug)};
 fetch('${SB}/rest/v1/listings?select=slug&status=eq.approved&deleted_at=is.null&slug=eq.'+encodeURIComponent(slug),{headers:{apikey:'${KEY}',authorization:'Bearer ${KEY}'}})
 .then(function(r){return r.json();}).then(function(d){if(Array.isArray(d)&&d.length===0){var m=document.getElementById('root');if(m)m.innerHTML='<div class="tp"><div class="tp-card tp-na"><h2>Not available</h2><p>This listing isn\\u2019t available right now.</p><a class="btn-amber" href="/tradie">Browse verified tradies \\u2192</a></div></div>';}}).catch(function(){});})();
</script>
</body></html>`;
}

// Live re-render of a card grid from current data (listings + their real reviews), so
// approvals, edits and new tradies show with no redeploy. `keep` filters the listings.
function liveGrid(keep) {
  return `<script>${RENDER_SRC}</script>
<script>
(function(){var SB='${SB}',KEY='${KEY}',h={headers:{apikey:KEY,authorization:'Bearer '+KEY}};
${keep}
Promise.all([
 fetch(SB+'/rest/v1/listings?select=id,slug,name,trade,suburb,location,postcode,photo,photos,cover_position,lat,lng,service_radius_km,rating&status=eq.approved&deleted_at=is.null&order=rating.desc.nullslast',h).then(function(r){return r.json();}),
 fetch(SB+'/rest/v1/listing_reviews?select=listing_id,rating,hidden',h).then(function(r){return r.json();}).catch(function(){return [];})
]).then(function(res){var d=res[0],rv=Array.isArray(res[1])?res[1]:[];if(!Array.isArray(d))return;
 var by={};rv.forEach(function(x){(by[x.listing_id]=by[x.listing_id]||[]).push(x);});
 var list=d.filter(function(l){return l.slug&&keep(l);});
 var g=document.getElementById('g');if(g)g.innerHTML=list.map(function(l){return TT.card(l,by[l.id]);}).join('');
 var none=document.getElementById('none');if(none)none.style.display=list.length?'none':'block';
 if(typeof flt==='function')flt();
}).catch(function(){});})();
</script>`;
}
// The trade category of a listing, client side (same rules as tradeCat above).
const CATOF_JS = `function catOf(t){t=(t||'').toLowerCase();if(t.indexOf('plumb')>=0)return 'plumbers';if(t.indexOf('elec')>=0)return 'electricians';if(t.indexOf('gas')>=0)return 'gas-fitters';if(t.indexOf('hvac')>=0||t.indexOf('air')>=0||t.indexOf('heat')>=0||t.indexOf('cool')>=0)return 'hvac';if(t.indexOf('carp')>=0||t.indexOf('build')>=0)return 'carpenters';if(t.indexOf('roof')>=0)return 'roofers';if(t.indexOf('paint')>=0)return 'painters';if(t.indexOf('tile')>=0)return 'tilers';if(t.indexOf('handy')>=0)return 'handyman-services';return (t||'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+'s';}`;

function directory(listings, reviewsById, hubLinks, areaLinks) {
  const cards = listings.map((l) => TT.card(l, reviewsById[l.id])).join("");
  const trades = [...new Set(listings.map((l) => l.trade).filter(Boolean))].sort();
  const ld = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/tradie/${l.slug}`, name: l.name })) };
  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="apple-itunes-app" content="app-id=6778369757">
<title>Verified Local Tradies in Victoria | Trust Trade</title>
<meta name="description" content="Browse verified, insured local tradies on Trust Trade — electricians, plumbers, HVAC and more across Victoria. Every one licence-checked.">
<link rel="canonical" href="${SITE}/tradie"><meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<meta property="og:title" content="Verified Local Tradies in Victoria"><meta property="og:description" content="Browse verified, insured local tradies on Trust Trade."><meta property="og:url" content="${SITE}/tradie"><meta property="og:image" content="${SITE}/og-image.png">
<script type="application/ld+json">${J(ld)}</script>
${FONTS}${STYLE}</head><body>
${HEADER}
<main class="page">
 <span class="eyebrow">Find a tradie</span>
 <h1 class="dh">Find a verified tradie</h1><p class="dsub">Every tradie is ABN-checked, licence-verified and insured.</p>
 ${hubLinks && hubLinks.length ? `<div class="links" style="margin:0 0 22px"><h3>Browse by trade</h3><div class="lg">${hubLinks.map((a) => `<a href="${a.url}">${H(a.label)}</a>`).join("")}</div></div>` : ""}
 <div class="filters"><input id="q" placeholder="Search name, trade or suburb…" aria-label="Search tradies" oninput="flt()"><select id="tr" aria-label="Trade" onchange="flt()"><option value="">All trades</option>${trades.map((t) => `<option value="${H(t.toLowerCase())}">${H(t)}</option>`).join("")}</select></div>
 <div class="g" id="g">${cards}</div>
 <div id="none" class="none" style="display:none">No tradies match. Try a different search.</div>
 ${areaLinks && areaLinks.length ? `<div class="links" style="margin-top:34px"><h3>Browse by trade &amp; area</h3><div class="lg">${areaLinks.map((a) => `<a href="${a.url}">${H(a.label)}</a>`).join("")}</div></div>` : ""}
</main>
${FOOTER}
<script>function flt(){var q=(document.getElementById('q').value||'').toLowerCase().trim(),t=document.getElementById('tr').value,n=0;document.querySelectorAll('.tc').forEach(function(c){var ok=(!q||(c.dataset.s||'').indexOf(q)>=0)&&(!t||c.dataset.trade===t);c.style.display=ok?'':'none';if(ok)n++;});document.getElementById('none').style.display=n?'none':'block';}</script>
${liveGrid("function keep(){return true;}")}
</body></html>`;
}

// Trade × suburb landing page — the SEO target for "[trade] in [suburb]" searches.
function areaPage(cat, loc, serving, reviewsById, otherAreas, otherTrades) {
  const suburb = loc.suburb;
  const url = `${SITE}/find/${cat.slug}-in-${slugify(suburb)}`;
  const n = serving.length;
  const title = `${cat.plural} in ${suburb}, VIC — Verified & Insured | Trust Trade`;
  const desc = `Find a verified ${cat.singular} in ${suburb}. Every ${cat.singular} on Trust Trade is licence-checked, ABN-verified and insured. ${n} near ${suburb} — see reviews and get a quote.`;
  const cards = serving.map((l) => TT.card(l, reviewsById[l.id])).join("");
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": url + "#page", url, name: title, description: desc,
        about: { "@type": "Service", serviceType: cat.plural, areaServed: { "@type": "Place", name: suburb + ", VIC, Australia" }, provider: { "@id": "https://trusttrade.au/#org" } } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Find a tradie", item: SITE + "/tradie" },
        { "@type": "ListItem", position: 3, name: `${cat.plural} in ${suburb}`, item: url } ] },
      { "@type": "ItemList", itemListElement: serving.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/tradie/${l.slug}`, name: l.name })) },
    ],
  };
  const otherAreaLinks = otherAreas.map((a) => `<a href="/find/${cat.slug}-in-${slugify(a.suburb)}">${H(cat.plural)} in ${H(a.suburb)}</a>`).join("");
  const otherTradeLinks = otherTrades.map((t) => `<a href="/find/${t.slug}-in-${slugify(suburb)}">${H(t.plural)} in ${H(suburb)}</a>`).join("");

  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="apple-itunes-app" content="app-id=6778369757">
<title>${H(title)}</title><meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#f2a900"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:title" content="${H(cat.plural + " in " + suburb + ", VIC")}"><meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.png"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<script type="application/ld+json">${J(ld)}</script>
${FONTS}${STYLE}</head><body>
${HEADER}
<main class="page">
 <nav class="crumbs"><a href="/">Home</a> › <a href="/tradie">Find a tradie</a> › <span>${H(cat.plural)} in ${H(suburb)}</span></nav>
 <h1 class="dh">${H(cat.plural)} in ${H(suburb)}</h1>
 <p class="dsub">Verified, insured and licence-checked. Every ${H(cat.singular)} here is ABN-checked and covers ${H(suburb)}${loc.postcode ? " " + H(loc.postcode) : ""}.</p>
 <div class="trust"><span>✓ Licence verified</span><span>✓ $5M insured</span><span>✓ ABN checked</span><span>✓ Real reviews</span></div>
 <div class="g" id="g">${cards}</div>
 <div id="none" class="none" style="display:none">No ${H(cat.singular)}s listed for ${H(suburb)} yet. <a href="/tradie">Browse all verified tradies</a>.</div>
 <div class="card"><h2>Why book ${an(cat.singular)} ${H(cat.singular)} through Trust Trade</h2><p class="body">We hand-check every ${H(cat.singular)} before they can appear: a current licence for the work they do, $5M public-liability insurance sighted, ABN verified against the Australian Business Register, and photo ID confirmed. You message and book the one you pick — no lead auctions, no five callbacks, no spam.</p></div>
 ${otherAreaLinks ? `<div class="links"><h3>${H(cat.plural)} in nearby areas</h3><div class="lg">${otherAreaLinks}</div></div>` : ""}
 ${otherTradeLinks ? `<div class="links"><h3>Other trades in ${H(suburb)}</h3><div class="lg">${otherTradeLinks}</div></div>` : ""}
 <a class="big" href="/">Find your ${H(cat.singular)} on Trust Trade →</a>
</main>
${FOOTER}
${liveGrid(`var CATSLUG=${J(cat.slug)},LOC=${J({ suburb, lat: num(loc.lat), lng: num(loc.lng) })};
${CATOF_JS}
function hav(a,b,c,d){if([a,b,c,d].some(function(v){return v==null||isNaN(+v);}))return null;var R=6371,r=function(x){return x*Math.PI/180;};var dLa=r(c-a),dLo=r(d-b);var q=Math.pow(Math.sin(dLa/2),2)+Math.cos(r(a))*Math.cos(r(c))*Math.pow(Math.sin(dLo/2),2);return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));}
function keep(l){if(catOf(l.trade)!==CATSLUG)return false;if((l.suburb||'').toLowerCase()===(LOC.suburb||'').toLowerCase())return true;var d=hav(+l.lat,+l.lng,LOC.lat,LOC.lng);if(d==null)return false;return d<=((+l.service_radius_km)||25)+0.5;}`)}
</body></html>`;
}

// Trade hub page — /find/<trade> — lists every verified tradie of that trade
// across all areas. Indexed when it has ≥1; a browsable, noindexed "onboarding"
// page until then (so users see the trade, but Google isn't fed an empty page).
function tradeHubPage(cat, tradies, reviewsById, areaSuburbs) {
  const url = `${SITE}/find/${cat.slug}`;
  const has = tradies.length > 0;
  const title = has
    ? `Verified ${cat.plural} in Victoria — Insured & Licence-Checked | Trust Trade`
    : `${cat.plural} — Verified & Insured | Trust Trade`;
  const desc = has
    ? `Find a verified ${cat.singular} on Trust Trade. Every ${cat.singular} is licence-checked, ABN-verified and $5M insured. Browse ${tradies.length} across Victoria, see reviews and get a quote.`
    : `Trust Trade is onboarding verified, insured ${cat.plural.toLowerCase()} across Australia. Every one licence-checked and ABN-verified. Get the app to be first in line.`;
  const cards = tradies.map((l) => TT.card(l, reviewsById[l.id])).join("");
  const suburbLinks = areaSuburbs.map((s) => `<a href="/find/${cat.slug}-in-${slugify(s.suburb)}">${H(cat.plural)} in ${H(s.suburb)}</a>`).join("");
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": url + "#page", url, name: title, description: desc,
        about: { "@type": "Service", serviceType: cat.plural, areaServed: { "@type": "State", name: "Victoria, Australia" }, provider: { "@id": "https://trusttrade.au/#org" } } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Find a tradie", item: SITE + "/tradie" },
        { "@type": "ListItem", position: 3, name: cat.plural, item: url } ] },
      ...(has ? [{ "@type": "ItemList", itemListElement: tradies.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/tradie/${l.slug}`, name: l.name })) }] : []),
    ],
  };
  const body = has
    ? `<h1 class="dh">${H(cat.plural)} on Trust Trade</h1>
 <p class="dsub">Verified, insured and licence-checked ${H(cat.plural.toLowerCase())} across Victoria. Pick one, message them, and book — no lead auctions, no spam.</p>
 <div class="trust"><span>✓ Licence verified</span><span>✓ $5M insured</span><span>✓ ABN checked</span><span>✓ Real reviews</span></div>
 <div class="g" id="g">${cards}</div>
 <div id="none" class="none" style="display:none">No ${H(cat.plural.toLowerCase())} listed yet. <a href="/tradie">Browse all verified tradies</a>.</div>
 ${suburbLinks ? `<div class="links"><h3>${H(cat.plural)} by suburb</h3><div class="lg">${suburbLinks}</div></div>` : ""}
 <div class="card"><h2>Why book ${an(cat.singular)} ${H(cat.singular)} through Trust Trade</h2><p class="body">Every ${H(cat.singular)} is hand-checked before they appear: a current licence for the work they do, $5M public-liability insurance sighted, ABN verified against the Australian Business Register, and photo ID confirmed. You message and book the one you choose — no auctions, no five callbacks.</p></div>
 <a class="big" href="/">Find your ${H(cat.singular)} on Trust Trade →</a>`
    : `<h1 class="dh">${H(cat.plural)}</h1>
 <p class="dsub">We're onboarding verified, insured ${H(cat.plural.toLowerCase())} right now. Every one is licence-checked and ABN-verified before they can appear.</p>
 <div class="trust"><span>✓ Licence verified</span><span>✓ $5M insured</span><span>✓ ABN checked</span><span>✓ Real reviews</span></div>
 <div class="g" id="g"></div>
 <div class="card"><h2>Be first when ${an(cat.singular)} ${H(cat.singular)} joins</h2><p class="body">Trust Trade only lists a handful of tradies per area, then it locks. Get the app and we'll notify you the moment a verified ${H(cat.singular)} covers your suburb.</p><a class="big" href="/">Get the Trust Trade app →</a></div>
 <div class="card"><h2>Are you ${an(cat.singular)} ${H(cat.singular)}?</h2><p class="body">List your business free while we grow — a few spots per suburb, then it locks. Verified tradies get real jobs, not lead-auction spam.</p><a class="big" href="/for-tradies">List your business →</a></div>`;

  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="apple-itunes-app" content="app-id=6778369757">
<title>${H(title)}</title><meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="${has ? "index, follow, max-image-preview:large" : "noindex, follow"}">
<meta name="theme-color" content="#f2a900"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:title" content="${H(cat.plural + " — Trust Trade")}"><meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.png"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<script type="application/ld+json">${J(ld)}</script>
${FONTS}${STYLE}</head><body>
${HEADER}
<main class="page">
 <nav class="crumbs"><a href="/">Home</a> › <a href="/tradie">Find a tradie</a> › <span>${H(cat.plural)}</span></nav>
 ${body}
</main>
${FOOTER}
${liveGrid(`var CATSLUG=${J(cat.slug)};
${CATOF_JS}
function keep(l){return catOf(l.trade)===CATSLUG;}`)}
</body></html>`;
}

// Dynamic profile: served for any /tradie/<slug> that has no static page yet
// (e.g. a tradie you just approved in admin). Renders the same design fully
// client-side from live Supabase data — so new tradies work with no redeploy.
function dynamicProfile() {
  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="apple-itunes-app" content="app-id=6778369757">
<title>Tradie · Trust Trade</title><meta name="robots" content="index, follow">
<meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
${FONTS}${STYLE}</head><body>
${HEADER}
<main id="root"><div class="tp"><div class="tp-card tp-na"><p>Loading…</p></div></div></main>
${FOOTER}
<script>${RENDER_SRC}</script>
<script>
var SB='${SB}',KEY='${KEY}',h={headers:{apikey:KEY,authorization:'Bearer '+KEY}};
function notFound(){document.getElementById('root').innerHTML='<div class="tp"><div class="tp-card tp-na"><h2>Not available</h2><p>This listing isn\\u2019t available right now.</p><a class="btn-amber" href="/tradie">Browse verified tradies \\u2192</a></div></div>';}
${CATOF_JS}
var HUBS=${J(Object.fromEntries(ALL_TRADES.map((t) => [t.slug, t.plural])))};
var slug=location.pathname.split('/').filter(Boolean).pop();
fetch(SB+'/rest/v1/listings?select=*&status=eq.approved&deleted_at=is.null&slug=eq.'+encodeURIComponent(slug),h)
.then(function(r){return r.json();}).then(function(d){
 if(!Array.isArray(d)||!d.length){notFound();return;}
 var l=d[0],trade=l.trade||'Tradie',suburb=l.suburb||'';
 document.title=l.name+' \\u2014 '+trade+(suburb?' in '+suburb:'')+', VIC | Trust Trade';
 var c=catOf(l.trade),hub=HUBS[c]?' \\u203a <a href="/find/'+c+'">'+TT.esc(HUBS[c])+'</a>':'';
 var crumbs='<nav class="crumbs"><a href="/">Home</a> \\u203a <a href="/tradie">Find a tradie</a>'+hub+' \\u203a <span>'+TT.esc(l.name)+'</span></nav>';
 return fetch(SB+'/rest/v1/listing_reviews?select=from_name,rating,review_text,created_at,verified,booking_id,reply_text,hidden&order=created_at.desc&listing_id=eq.'+l.id,h)
  .then(function(r){return r.json();}).catch(function(){return [];})
  .then(function(rv){document.getElementById('root').innerHTML=TT.profile(l,Array.isArray(rv)?rv:[],{crumbs:crumbs});});
}).catch(notFound);
</script>
</body></html>`;
}

(async () => {
  try {
    // Only genuinely live, REAL tradies: currently approved + not demo/seed data.
    // Fully controlled by the status field an admin sets (approved/hidden/denied),
    // so hiding or approving in the admin console changes what's public.
    const listings = (await api(
      "listings?status=eq.approved&deleted_at=is.null&select=id,slug,name,trade,suburb,location,postcode,description,priced_services,services,photos,photo,photo_sections,cover_position,badges,brands,dealer_brands,team_size,rating,review_count,insured,qualified,licence,abn,phone,website,hourly_rate,call_out_fee,show_call_out,service_radius_km,lat,lng,business_hours,opening_hours,stat_jobs_complete,stat_response_count,stat_response_hours_total&order=rating.desc.nullslast"
    )).filter((l) => l.slug);

    // Real reviews only (hidden ones are filtered by RLS and again by the renderer).
    let reviewsById = {};
    try {
      const ids = listings.map((l) => l.id);
      if (ids.length) {
        const revs = await api(`listing_reviews?listing_id=in.(${ids.join(",")})&select=listing_id,from_name,rating,review_text,created_at,verified,booking_id,reply_text,hidden&order=created_at.desc`);
        revs.forEach((r) => { (reviewsById[r.listing_id] = reviewsById[r.listing_id] || []).push(r); });
      }
    } catch (e) { console.warn("[tradie-pages] reviews skipped:", e.message); }

    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    for (const l of listings) {
      mkdirSync(join(OUT, l.slug), { recursive: true });
      writeFileSync(join(OUT, l.slug, "index.html"), page(l, reviewsById[l.id]));
    }
    // ---- Trade × suburb area landing pages (SEO for "[trade] in [suburb]") ----
    // Target suburbs = every suburb at least one verified tradie is based in.
    const locs = [];
    const seenLoc = new Set();
    for (const l of listings) {
      const key = (l.suburb || "").toLowerCase();
      if (!l.suburb || seenLoc.has(key)) continue;
      seenLoc.add(key);
      locs.push({ suburb: l.suburb, postcode: l.postcode, lat: l.lat, lng: l.lng });
    }
    // Trade categories present (merges "HVAC Technician"/"HVAC" etc.).
    const catMap = {};
    for (const l of listings) { const c = tradeCat(l.trade); if (!catMap[c.slug]) catMap[c.slug] = c; }
    const cats = Object.values(catMap);
    // Which suburbs each category covers (same suburb OR within a tradie's radius).
    const coveredByCat = {};
    for (const c of cats) coveredByCat[c.slug] = locs.filter((loc) => listings.some((l) => tradeCat(l.trade).slug === c.slug && serves(l, loc)));
    const catsBySuburb = {};
    for (const c of cats) for (const loc of coveredByCat[c.slug]) (catsBySuburb[loc.suburb] = catsBySuburb[loc.suburb] || []).push(c);

    // Build the combos + the link list the directory uses.
    const combos = [];
    const areaLinks = [];
    for (const c of cats) {
      for (const loc of coveredByCat[c.slug]) {
        const serving = listings.filter((l) => tradeCat(l.trade).slug === c.slug && serves(l, loc));
        if (!serving.length) continue;
        combos.push({ c, loc, serving });
        areaLinks.push({ url: `/find/${c.slug}-in-${slugify(loc.suburb)}`, label: `${c.plural} in ${loc.suburb}` });
      }
    }

    // Every supported trade gets a browsable hub link (even ones with no tradie yet).
    const hubLinks = ALL_TRADES.map((t) => ({ url: `/find/${t.slug}`, label: t.plural }));

    writeFileSync(join(OUT, "index.html"), directory(listings, reviewsById, hubLinks, areaLinks));
    writeFileSync(join(OUT, "_dynamic.html"), dynamicProfile());

    const areaOut = "public/find";
    rmSync(areaOut, { recursive: true, force: true });
    mkdirSync(areaOut, { recursive: true });
    const areaUrls = [];
    for (const { c, loc, serving } of combos) {
      const otherAreas = coveredByCat[c.slug].filter((a) => a.suburb !== loc.suburb).slice(0, 8);
      const otherTrades = (catsBySuburb[loc.suburb] || []).filter((t) => t.slug !== c.slug).slice(0, 8);
      const dir = join(areaOut, `${c.slug}-in-${slugify(loc.suburb)}`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), areaPage(c, loc, serving, reviewsById, otherAreas, otherTrades));
      areaUrls.push(`${SITE}/find/${c.slug}-in-${slugify(loc.suburb)}`);
    }

    // Trade hub pages: /find/<trade> — indexed only when it has ≥1 verified tradie.
    const hubUrls = [];
    let hubIndexed = 0;
    for (const t of ALL_TRADES) {
      const mine = listings.filter((l) => tradeCat(l.trade).slug === t.slug);
      const dir = join(areaOut, t.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), tradeHubPage(t, mine, reviewsById, coveredByCat[t.slug] || []));
      if (mine.length) { hubUrls.push(`${SITE}/find/${t.slug}`); hubIndexed++; }
    }

    const urls = [`${SITE}/tradie`, ...listings.map((l) => `${SITE}/tradie/${l.slug}`), ...hubUrls, ...areaUrls];
    const lastmod = new Date().toISOString().slice(0, 10); // build date — tells crawlers these regenerated today
    writeFileSync("public/sitemap-tradies.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join("\n")}\n</urlset>\n`);

    console.log(`[tradie-pages] generated ${listings.length} profiles + ${ALL_TRADES.length} trade hubs (${hubIndexed} indexed) + ${areaUrls.length} area pages + directory + _dynamic + sitemap`);
  } catch (e) {
    console.warn("[tradie-pages] SKIPPED (non-fatal):", e.message);
  }
})();
