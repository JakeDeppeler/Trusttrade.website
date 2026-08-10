// Build-time generator for public SEO tradie pages at /tradie and /tradie/<slug>.
// Runs on every build, fetches PUBLIC listings from Supabase via the REST API
// (publishable key — safe) using the SAME filter the app uses so the website and
// app line up exactly: status='approved' OR was_approved=true (matches the
// public_read_approved_listings RLS policy). Emits self-contained static HTML
// styled to look like the app's tradie cards/profiles. Non-fatal on error.

import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

const SB = "https://pvcblfpxgrznzqgxbujy.supabase.co";
const KEY = "sb_publishable_xXxZpIBsumD14mC4zn9qLQ_i4Su8yEN";
const SITE = "https://trusttrade.au";
const OUT = "public/tradie";

const H = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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

function photosOf(l) {
  const out = [];
  const push = (u) => { if (u && typeof u === "string" && !out.includes(u)) out.push(u); };
  (Array.isArray(l.work_photos) ? l.work_photos : []).forEach((p) => push(typeof p === "string" ? p : p && p.url));
  (Array.isArray(l.photos) ? l.photos : []).forEach(push);
  (Array.isArray(l.gallery) ? l.gallery : []).forEach((p) => push(typeof p === "string" ? p : p && (p.image_url || p.url)));
  push(l.img); push(l.photo);
  return out.slice(0, 8);
}
const coverOf = (l) => photosOf(l)[0] || null;
function servicesOf(l) {
  const s = Array.isArray(l.priced_services) ? l.priced_services : [];
  return s.map((x) => ({ name: x.name || x.title || "", detail: x.detail || x.desc || "", price: x.price != null ? x.price : x.amount != null ? x.amount : "" }))
    .filter((x) => x.name);
}
const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));
// Soft trade-tinted placeholder (matches the app's coloured cover when no photo).
function tint(trade) {
  const t = (trade || "").toLowerCase();
  if (t.includes("elec")) return "#F7E9C6";
  if (t.includes("plumb")) return "#DCE7FF";
  if (t.includes("hvac") || t.includes("air") || t.includes("gas")) return "#D9EEDE";
  if (t.includes("carp") || t.includes("build")) return "#F0E4D4";
  if (t.includes("paint")) return "#F3DFE6";
  return "#EDE7DA";
}
const GLYPH = `<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#15110d" stroke-opacity=".22" stroke-width="1.4"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-1.7-.3-.3-1.7 2.3-2.3z"/></svg>`;
function ratingBits(l) {
  const rating = num(l.rating) || num(l.google_rating);
  const rc = num(l.review_count) || num(l.google_review_count) || 0;
  return { rating, rc };
}

function coverHtml(l, tall) {
  const cov = coverOf(l);
  const h = tall ? "200px" : "150px";
  const inner = cov
    ? `background:#e9e9ec url('${H(cov)}') center/cover`
    : `background:${tint(l.trade)};display:grid;place-items:center`;
  return `<div class="cover" style="${inner};height:${h}">${cov ? "" : GLYPH}<span class="verified">✓ Verified</span></div>`;
}

function page(l, reviews) {
  const { rating, rc } = ratingBits(l);
  const trade = l.trade || "Tradie";
  const suburb = l.suburb || "";
  const url = `${SITE}/tradie/${l.slug}`;
  const title = `${l.name} — ${trade}${suburb ? " in " + suburb : ""}, VIC | Trust Trade`;
  const desc = (l.description && l.description.trim())
    ? l.description.trim().slice(0, 155)
    : `${l.name} is a verified, insured ${trade.toLowerCase()}${suburb ? " serving " + suburb + " and nearby" : " in Victoria"}. See services, reviews and get a quote on Trust Trade.`;
  const photos = photosOf(l);
  const services = servicesOf(l);
  const ogImg = photos[0] || `${SITE}/og-image.png`;
  const badges = [];
  if (l.insured) badges.push("Insured");
  if (l.qualified) badges.push("Qualified");
  if (l.licence) badges.push("Licensed");

  const ld = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: l.name, image: ogImg, url,
    ...(l.phone ? { telephone: l.phone } : {}), ...(l.website ? { sameAs: [l.website] } : {}),
    description: desc,
    address: { "@type": "PostalAddress", addressLocality: suburb, addressRegion: "VIC", ...(l.postcode ? { postalCode: String(l.postcode) } : {}), addressCountry: "AU" },
    areaServed: suburb || "Victoria", priceRange: "$$",
    ...(rating && rc ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: rc } } : {}),
  };
  const revHtml = (reviews || []).slice(0, 5).map((r) =>
    `<div class="rev"><div class="rh"><b>${H(r.from_name || "Customer")}</b><span class="st">${stars(r.rating)}</span></div><p>${H(r.review_text || "")}</p></div>`).join("");
  const rateLine = rc
    ? `<span class="rate">${stars(rating)}</span> <b>${(rating || 0).toFixed(1)}</b> <span class="muted">(${rc} review${rc === 1 ? "" : "s"})</span>`
    : `<b>New</b> <span class="muted">· No reviews yet</span>`;

  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${H(title)}</title><meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="profile"><meta property="og:title" content="${H(l.name + " — " + trade + (suburb ? " in " + suburb : ""))}"><meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${H(ogImg)}"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${H(l.name)}"><meta name="twitter:description" content="${H(desc)}"><meta name="twitter:image" content="${H(ogImg)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${STYLE}</head><body>
<header class="top"><div class="wrap"><a class="logo" href="/"><span class="m"></span>Trust Trade</a><a class="cta" href="/">Find a tradie</a></div></header>
<main class="wrap prof">
 <div class="phero">${coverHtml(l, true)}
  <div class="pbody">
   <div class="ptop"><div><h1>${H(l.name)}</h1><div class="sub">${H(trade)}${suburb ? " · " + H(suburb) + ", VIC" : ""}</div></div><div class="prate">${rateLine}</div></div>
   <div class="pills">${badges.map((b) => `<span class="pill">${H(b)}</span>`).join("")}</div>
  </div>
 </div>
 ${l.description ? `<div class="card"><h2>About</h2><p class="body">${H(l.description)}</p></div>` : ""}
 ${services.length ? `<div class="card"><h2>Services &amp; pricing</h2>${services.map((s) => `<div class="svc"><div><div class="n">${H(s.name)}</div>${s.detail ? `<div class="d">${H(s.detail)}</div>` : ""}</div><div class="p">${s.price !== "" && s.price != null ? (isNaN(+s.price) ? H(s.price) : "$" + s.price) : ""}</div></div>`).join("")}</div>` : ""}
 ${photos.length ? `<div class="card"><h2>Recent work</h2><div class="grid">${photos.map((p) => `<img src="${H(p)}" alt="${H(l.name)} work photo" loading="lazy">`).join("")}</div></div>` : ""}
 ${revHtml ? `<div class="card"><h2>Reviews</h2>${revHtml}</div>` : ""}
 <div class="card"><h2>Get in touch</h2>
  ${suburb ? `<div class="kv"><span>Area</span><b>${H(suburb)} ${H(l.postcode || "")}</b></div>` : ""}
  ${l.service_radius_km ? `<div class="kv"><span>Service radius</span><b>${H(l.service_radius_km)} km</b></div>` : ""}
  ${l.hourly_rate ? `<div class="kv"><span>Hourly rate</span><b>$${H(l.hourly_rate)}</b></div>` : ""}
  ${l.call_out_fee ? `<div class="kv"><span>Call-out fee</span><b>$${H(l.call_out_fee)}</b></div>` : ""}
 </div>
 <a class="big" href="/">Get a quote from ${H((l.name || "").split(" ")[0] || l.name)} on Trust Trade →</a>
 <p class="fineprint">Verified, insured and recommended. Message and book through the Trust Trade app.</p>
</main>
<footer class="foot"><div class="wrap"><a href="/tradie" class="back">← All tradies</a> · Trust Trade® — Australia's honest trade app</div></footer>
<script>
// LIVE: if this tradie has been hidden/denied/removed in admin since the last
// build, reflect it immediately instead of showing a stale profile.
(function(){var slug='${l.slug}';
 fetch('${SB}/rest/v1/listings?select=slug&status=eq.approved&deleted_at=is.null&slug=eq.'+encodeURIComponent(slug),{headers:{apikey:'${KEY}',authorization:'Bearer ${KEY}'}})
 .then(function(r){return r.json();}).then(function(d){if(Array.isArray(d)&&d.length===0){var m=document.querySelector('main.prof');if(m)m.innerHTML='<div class="card" style="text-align:center;margin-top:34px"><h2>Not available</h2><p class="body">This listing isn\\u2019t available right now.</p><a class="big" href="/tradie">Browse verified tradies \\u2192</a></div>';}}).catch(function(){});})();
</script>
</body></html>`;
}

function directory(listings, areaLinks) {
  const cards = listings.map((l) => {
    const { rating, rc } = ratingBits(l);
    const rl = rc ? `<span class="rate">${stars(rating)}</span> <b>${(rating || 0).toFixed(1)}</b> <span class="muted">(${rc})</span>` : `<b>New</b>`;
    const search = `${l.name} ${l.trade || ""} ${l.suburb || ""} ${l.postcode || ""}`.toLowerCase();
    return `<a class="tc" href="/tradie/${l.slug}" data-s="${H(search)}" data-trade="${H((l.trade || "").toLowerCase())}">
      ${coverHtml(l, false)}
      <div class="tcb"><div class="tn">${H(l.name)}</div><div class="tt">${H(l.trade || "")}${l.suburb ? " · " + H(l.suburb) : ""}</div>
      <div class="tr">${rl}${l.insured ? '<span class="pill sm">Insured</span>' : ""}</div></div></a>`;
  }).join("");
  const trades = [...new Set(listings.map((l) => l.trade).filter(Boolean))].sort();
  const ld = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/tradie/${l.slug}`, name: l.name })) };
  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verified Local Tradies in Victoria | Trust Trade</title>
<meta name="description" content="Browse verified, insured local tradies on Trust Trade — electricians, plumbers, HVAC and more across Victoria. Every one licence-checked.">
<link rel="canonical" href="${SITE}/tradie"><meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<meta property="og:title" content="Verified Local Tradies in Victoria"><meta property="og:description" content="Browse verified, insured local tradies on Trust Trade."><meta property="og:url" content="${SITE}/tradie"><meta property="og:image" content="${SITE}/og-image.png">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${STYLE}</head><body>
<header class="top"><div class="wrap"><a class="logo" href="/"><span class="m"></span>Trust Trade</a><a href="/" class="back">Home</a></div></header>
<main class="wrap"><h1 class="dh">Find a verified tradie</h1><div class="dsub">Every tradie is ABN-checked, licence-verified and insured.</div>
 <div class="filters"><input id="q" placeholder="Search name, trade or suburb…" oninput="flt()"><select id="tr" onchange="flt()"><option value="">All trades</option>${trades.map((t) => `<option value="${H(t.toLowerCase())}">${H(t)}</option>`).join("")}</select></div>
 <div class="g" id="g">${cards}</div>
 <div id="none" class="none" style="display:none">No tradies match — try a different search.</div>
 ${areaLinks && areaLinks.length ? `<div class="links" style="margin-top:34px"><h3>Browse by trade &amp; area</h3><div class="lg">${areaLinks.map((a) => `<a href="${a.url}">${H(a.label)}</a>`).join("")}</div></div>` : ""}
</main>
<script>
var SB='${SB}',KEY='${KEY}';
var GLYPH='<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#15110d" stroke-opacity=".22" stroke-width="1.4"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-1.7-.3-.3-1.7 2.3-2.3z"/></svg>';
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function stars(r){r=Math.round(r||0);return '\\u2605'.repeat(r)+'\\u2606'.repeat(5-r);}
function tint(t){t=(t||'').toLowerCase();if(t.indexOf('elec')>=0)return '#F7E9C6';if(t.indexOf('plumb')>=0)return '#DCE7FF';if(t.indexOf('hvac')>=0||t.indexOf('air')>=0||t.indexOf('gas')>=0)return '#D9EEDE';if(t.indexOf('carp')>=0||t.indexOf('build')>=0)return '#F0E4D4';if(t.indexOf('paint')>=0)return '#F3DFE6';return '#EDE7DA';}
function coverOf(l){var a=[];[].concat(l.work_photos||[]).forEach(function(p){var u=typeof p==='string'?p:(p&&p.url);if(u)a.push(u);});[].concat(l.photos||[]).forEach(function(u){if(u)a.push(u);});if(l.img)a.push(l.img);if(l.photo)a.push(l.photo);return a[0]||null;}
function cover(l){var c=coverOf(l);var inner=c?("background:#e9e9ec url('"+c+"') center/cover"):('background:'+tint(l.trade)+';display:grid;place-items:center');return '<div class="cover" style="'+inner+';height:150px">'+(c?'':GLYPH)+'<span class="verified">\\u2713 Verified</span></div>';}
function card(l){var rating=(+l.rating)||(+l.google_rating)||0,rc=(+l.review_count)||(+l.google_review_count)||0;var rl=rc?('<span class="rate">'+stars(rating)+'</span> <b>'+rating.toFixed(1)+'</b> <span class="muted">('+rc+')</span>'):'<b>New</b>';var s=((l.name||'')+' '+(l.trade||'')+' '+(l.suburb||'')+' '+(l.postcode||'')).toLowerCase();return '<a class="tc" href="/tradie/'+encodeURIComponent(l.slug)+'" data-s="'+esc(s)+'" data-trade="'+esc((l.trade||'').toLowerCase())+'">'+cover(l)+'<div class="tcb"><div class="tn">'+esc(l.name)+'</div><div class="tt">'+esc(l.trade||'')+(l.suburb?' \\u00b7 '+esc(l.suburb):'')+'</div><div class="tr">'+rl+(l.insured?'<span class="pill sm">Insured</span>':'')+'</div></div></a>';}
function flt(){var q=(document.getElementById('q').value||'').toLowerCase().trim(),t=document.getElementById('tr').value,n=0;document.querySelectorAll('.tc').forEach(function(c){var ok=(!q||c.dataset.s.indexOf(q)>=0)&&(!t||c.dataset.trade===t);c.style.display=ok?'':'none';if(ok)n++;});document.getElementById('none').style.display=n?'none':'block';}
// LIVE: re-render the grid from current Supabase data on every load, so admin
// changes (approve / hide / edit) show immediately without a redeploy.
(function(){fetch(SB+'/rest/v1/listings?select=slug,name,trade,suburb,postcode,rating,review_count,google_rating,google_review_count,insured,photos,work_photos,img,photo&status=eq.approved&deleted_at=is.null&order=rating.desc.nullslast',{headers:{apikey:KEY,authorization:'Bearer '+KEY}}).then(function(r){return r.json();}).then(function(d){if(!Array.isArray(d))return;var g=document.getElementById('g');g.innerHTML=d.filter(function(l){return l.slug;}).map(card).join('');var none=document.getElementById('none');if(!d.length){none.textContent='No tradies listed yet — check back soon.';none.style.display='block';}flt();}).catch(function(){});})();
</script>
</body></html>`;
}

// One tradie card for the area grid (server-rendered; the client re-renders live).
function areaCard(l) {
  const { rating, rc } = ratingBits(l);
  const rl = rc ? `<span class="rate">${stars(rating)}</span> <b>${(rating || 0).toFixed(1)}</b> <span class="muted">(${rc})</span>` : `<b>New</b>`;
  return `<a class="tc" href="/tradie/${l.slug}">${coverHtml(l, false)}<div class="tcb"><div class="tn">${H(l.name)}</div><div class="tt">${H(l.trade || "")}${l.suburb ? " · " + H(l.suburb) : ""}</div><div class="tr">${rl}${l.insured ? '<span class="pill sm">Insured</span>' : ""}</div></div></a>`;
}

// Trade × suburb landing page — the SEO target for "[trade] in [suburb]" searches.
function areaPage(cat, loc, serving, otherAreas, otherTrades) {
  const suburb = loc.suburb;
  const url = `${SITE}/find/${cat.slug}-in-${slugify(suburb)}`;
  const n = serving.length;
  const title = `${cat.plural} in ${suburb}, VIC — Verified & Insured | Trust Trade`;
  const desc = `Find a verified ${cat.singular} in ${suburb}. Every ${cat.singular} on Trust Trade is licence-checked, ABN-verified and insured. ${n} near ${suburb} — see reviews and get a quote.`;
  const cards = serving.map(areaCard).join("");
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
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${H(title)}</title><meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#f2a900"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:title" content="${H(cat.plural + " in " + suburb + ", VIC")}"><meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.png"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${STYLE}</head><body>
<header class="top"><div class="wrap"><a class="logo" href="/"><span class="m"></span>Trust Trade</a><a class="cta" href="/">Find a tradie</a></div></header>
<main class="wrap">
 <nav class="crumbs"><a href="/">Home</a> › <a href="/tradie">Find a tradie</a> › <span>${H(cat.plural)} in ${H(suburb)}</span></nav>
 <h1 class="dh">${H(cat.plural)} in ${H(suburb)}</h1>
 <div class="dsub">Verified, insured and licence-checked. Every ${H(cat.singular)} here is ABN-checked and covers ${H(suburb)}${loc.postcode ? " " + H(loc.postcode) : ""}.</div>
 <div class="trust"><span>✓ Licence verified</span><span>✓ $5M insured</span><span>✓ ABN checked</span><span>✓ Real reviews</span></div>
 <div class="g" id="g">${cards}</div>
 <div id="none" class="none" style="display:none">No ${H(cat.singular)}s listed for ${H(suburb)} yet — <a href="/tradie">browse all verified tradies</a>.</div>
 <div class="card"><h2>Why book a ${H(cat.singular)} through Trust Trade</h2><p class="body">We hand-check every ${H(cat.singular)} before they can appear: a current licence for the work they do, $5M public-liability insurance sighted, ABN verified against the Australian Business Register, and photo ID confirmed. You message and book the one you pick — no lead auctions, no five callbacks, no spam.</p></div>
 ${otherAreaLinks ? `<div class="links"><h3>${H(cat.plural)} in nearby areas</h3><div class="lg">${otherAreaLinks}</div></div>` : ""}
 ${otherTradeLinks ? `<div class="links"><h3>Other trades in ${H(suburb)}</h3><div class="lg">${otherTradeLinks}</div></div>` : ""}
 <a class="big" href="/">Find your ${H(cat.singular)} on Trust Trade →</a>
</main>
<footer class="foot"><div class="wrap"><a href="/tradie" class="back">← All verified tradies</a> · Trust Trade® — Australia's honest trade app</div></footer>
<script>
var SB='${SB}',KEY='${KEY}';
var CATSLUG=${JSON.stringify(cat.slug)},LOC=${JSON.stringify({ suburb, lat: num(loc.lat), lng: num(loc.lng) })};
var GLYPH='<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#15110d" stroke-opacity=".22" stroke-width="1.4"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-1.7-.3-.3-1.7 2.3-2.3z"/></svg>';
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function stars(r){r=Math.round(r||0);return '\\u2605'.repeat(r)+'\\u2606'.repeat(5-r);}
function tint(t){t=(t||'').toLowerCase();if(t.indexOf('elec')>=0)return '#F7E9C6';if(t.indexOf('plumb')>=0)return '#DCE7FF';if(t.indexOf('hvac')>=0||t.indexOf('air')>=0||t.indexOf('gas')>=0)return '#D9EEDE';if(t.indexOf('carp')>=0||t.indexOf('build')>=0)return '#F0E4D4';if(t.indexOf('paint')>=0)return '#F3DFE6';return '#EDE7DA';}
function catOf(t){t=(t||'').toLowerCase();if(t.indexOf('plumb')>=0)return 'plumbers';if(t.indexOf('elec')>=0)return 'electricians';if(t.indexOf('gas')>=0)return 'gas-fitters';if(t.indexOf('hvac')>=0||t.indexOf('air')>=0||t.indexOf('heat')>=0||t.indexOf('cool')>=0)return 'hvac';if(t.indexOf('carp')>=0||t.indexOf('build')>=0)return 'carpenters';if(t.indexOf('roof')>=0)return 'roofers';if(t.indexOf('paint')>=0)return 'painters';if(t.indexOf('tile')>=0)return 'tilers';if(t.indexOf('handy')>=0)return 'handyman-services';return (t||'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+'s';}
function hav(a,b,c,d){if([a,b,c,d].some(function(v){return v==null||isNaN(+v);}))return null;var R=6371,r=function(x){return x*Math.PI/180;};var dLa=r(c-a),dLo=r(d-b);var h=Math.pow(Math.sin(dLa/2),2)+Math.cos(r(a))*Math.cos(r(c))*Math.pow(Math.sin(dLo/2),2);return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));}
function serves(l){if((l.suburb||'').toLowerCase()===(LOC.suburb||'').toLowerCase())return true;var d=hav(+l.lat,+l.lng,LOC.lat,LOC.lng);if(d==null)return false;return d<=((+l.service_radius_km)||25)+0.5;}
function coverOf(l){var a=[];[].concat(l.work_photos||[]).forEach(function(p){var u=typeof p==='string'?p:(p&&p.url);if(u)a.push(u);});[].concat(l.photos||[]).forEach(function(u){if(u)a.push(u);});if(l.img)a.push(l.img);if(l.photo)a.push(l.photo);return a[0]||null;}
function cover(l){var c=coverOf(l);var inner=c?("background:#e9e9ec url('"+c+"') center/cover"):('background:'+tint(l.trade)+';display:grid;place-items:center');return '<div class="cover" style="'+inner+';height:150px">'+(c?'':GLYPH)+'<span class="verified">\\u2713 Verified</span></div>';}
function card(l){var rating=(+l.rating)||(+l.google_rating)||0,rc=(+l.review_count)||(+l.google_review_count)||0;var rl=rc?('<span class="rate">'+stars(rating)+'</span> <b>'+rating.toFixed(1)+'</b> <span class="muted">('+rc+')</span>'):'<b>New</b>';return '<a class="tc" href="/tradie/'+encodeURIComponent(l.slug)+'">'+cover(l)+'<div class="tcb"><div class="tn">'+esc(l.name)+'</div><div class="tt">'+esc(l.trade||'')+(l.suburb?' \\u00b7 '+esc(l.suburb):'')+'</div><div class="tr">'+rl+(l.insured?'<span class="pill sm">Insured</span>':'')+'</div></div></a>';}
// LIVE: re-render from current data so approvals/edits/new tradies show with no redeploy.
(function(){fetch(SB+'/rest/v1/listings?select=slug,name,trade,suburb,postcode,rating,review_count,google_rating,google_review_count,insured,photos,work_photos,img,photo,lat,lng,service_radius_km&status=eq.approved&deleted_at=is.null&order=rating.desc.nullslast',{headers:{apikey:KEY,authorization:'Bearer '+KEY}}).then(function(r){return r.json();}).then(function(d){if(!Array.isArray(d))return;var list=d.filter(function(l){return l.slug&&catOf(l.trade)===CATSLUG&&serves(l);});var g=document.getElementById('g'),none=document.getElementById('none');g.innerHTML=list.map(card).join('');none.style.display=list.length?'none':'block';}).catch(function(){});})();
</script>
</body></html>`;
}

const STYLE = `<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#15110d;background:#f4f4f6;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:900px;margin:0 auto;padding:0 18px}
.top{background:#fff;border-bottom:1px solid rgba(21,17,13,.07);position:sticky;top:0;z-index:5}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px}
.logo .m{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#FFCB63,#F2A222)}
.cta{background:#f2a900;color:#231700;font-weight:700;padding:10px 16px;border-radius:999px;font-size:14px}
.back{color:#b5740f;font-weight:700}
.muted{color:#8b7c66}
.cover{position:relative;border-radius:16px 16px 0 0;overflow:hidden}
.verified{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.94);color:#1fa463;font-size:12px;font-weight:800;padding:5px 11px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.rate{color:#f2a900;letter-spacing:1px}
.pill{display:inline-block;background:#e7f6ee;color:#1fa463;font-size:12px;font-weight:700;padding:4px 11px;border-radius:999px}
.pill.sm{padding:3px 9px;font-size:11px}
/* directory */
.dh{font-size:clamp(26px,5vw,38px);font-weight:800;letter-spacing:-.02em;margin:30px 0 4px}
.dsub{color:#574b3b;margin-bottom:18px}
.filters{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.filters input{flex:1;min-width:200px;padding:13px 15px;border:1px solid rgba(21,17,13,.12);border-radius:12px;font-size:15px;background:#fff}
.filters select{padding:13px 15px;border:1px solid rgba(21,17,13,.12);border-radius:12px;font-size:15px;background:#fff}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;padding-bottom:44px}
.tc{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(20,22,30,.04),0 12px 30px -20px rgba(20,22,30,.22);transition:transform .12s,box-shadow .12s;display:block}
.tc:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(20,22,30,.06),0 18px 40px -20px rgba(20,22,30,.3)}
.tcb{padding:14px 16px 16px}
.tn{font-weight:800;font-size:17px;letter-spacing:-.01em}
.tt{color:#8b7c66;font-size:13.5px;margin-top:2px}
.tr{margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px}
.none{text-align:center;color:#8b7c66;padding:40px 0}
/* profile */
.prof{padding-bottom:40px}
.phero{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(20,22,30,.04),0 12px 30px -20px rgba(20,22,30,.2);margin:22px 0 16px}
.pbody{padding:18px 20px 20px}
.ptop{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
.phero h1{font-size:clamp(24px,5vw,34px);font-weight:800;letter-spacing:-.02em}
.phero .sub{color:#574b3b;margin-top:3px}
.prate{font-size:14px;white-space:nowrap}
.pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.card{background:#fff;border-radius:16px;padding:20px 22px;margin:14px 0;box-shadow:0 1px 2px rgba(20,22,30,.04),0 12px 30px -22px rgba(20,22,30,.16)}
.card h2{font-size:19px;font-weight:800;margin-bottom:12px}
.body{color:#3a3d45;white-space:pre-line}
.svc{display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid rgba(21,17,13,.07)}
.svc:last-child{border-bottom:0}.svc .n{font-weight:650}.svc .d{color:#8b7c66;font-size:13.5px}.svc .p{font-weight:700;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.grid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:11px;background:#eee}
.rev{padding:13px 0;border-bottom:1px solid rgba(21,17,13,.07)}.rev:last-child{border-bottom:0}
.rh{display:flex;align-items:center;gap:8px}.rh .st{color:#f2a900}.rev p{color:#3a3d45;font-size:14.5px;margin-top:5px}
.kv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(21,17,13,.07);font-size:14.5px}.kv:last-child{border-bottom:0}.kv span{color:#8b7c66}
.big{display:block;text-align:center;background:#f2a900;color:#231700;font-weight:800;padding:16px;border-radius:14px;font-size:16px;margin:10px 0}
.fineprint{text-align:center;color:#8b7c66;font-size:13px}
.foot{border-top:1px solid rgba(21,17,13,.07);margin-top:26px;padding:24px 0;color:#8b7c66;font-size:13px;text-align:center;background:#fff}
/* area landing pages */
.crumbs{font-size:13px;color:#8b7c66;margin:22px 0 10px}.crumbs a{color:#b5740f;font-weight:600}.crumbs span{color:#574b3b}
.trust{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 20px}
.trust span{background:#e7f6ee;color:#1a8f57;font-size:12.5px;font-weight:700;padding:6px 12px;border-radius:999px}
.links{margin:20px 0}.links h3{font-size:15px;font-weight:800;margin-bottom:10px}
.lg{display:flex;flex-wrap:wrap;gap:8px}
.lg a{background:#fff;border:1px solid rgba(21,17,13,.1);color:#3a3d45;font-size:13.5px;font-weight:600;padding:8px 13px;border-radius:999px;transition:border-color .12s}
.lg a:hover{border-color:#f2a900;color:#15110d}
</style>`;

// Dynamic profile: served for any /tradie/<slug> that has no static page yet
// (e.g. a tradie you just approved in admin). Renders the same design fully
// client-side from live Supabase data — so new tradies work with no redeploy.
function dynamicProfile() {
  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tradie · Trust Trade</title><meta name="robots" content="index, follow">
<meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
${STYLE}</head><body>
<header class="top"><div class="wrap"><a class="logo" href="/"><span class="m"></span>Trust Trade</a><a class="cta" href="/">Find a tradie</a></div></header>
<main class="wrap prof" id="root"><div class="card" style="text-align:center;margin-top:34px"><p class="body">Loading…</p></div></main>
<footer class="foot"><div class="wrap"><a href="/tradie" class="back">← All tradies</a> · Trust Trade®</div></footer>
<script>
var SB='${SB}',KEY='${KEY}';
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function stars(r){r=Math.round(r||0);return '\\u2605'.repeat(r)+'\\u2606'.repeat(5-r);}
function tint(t){t=(t||'').toLowerCase();if(t.indexOf('elec')>=0)return '#F7E9C6';if(t.indexOf('plumb')>=0)return '#DCE7FF';if(t.indexOf('hvac')>=0||t.indexOf('air')>=0||t.indexOf('gas')>=0)return '#D9EEDE';if(t.indexOf('carp')>=0||t.indexOf('build')>=0)return '#F0E4D4';if(t.indexOf('paint')>=0)return '#F3DFE6';return '#EDE7DA';}
var GLYPH='<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#15110d" stroke-opacity=".22" stroke-width="1.4"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.3 2.3-1.7-.3-.3-1.7 2.3-2.3z"/></svg>';
function photos(l){var a=[];[].concat(l.work_photos||[]).forEach(function(p){var u=typeof p==='string'?p:(p&&p.url);if(u)a.push(u);});[].concat(l.photos||[]).forEach(function(u){if(u)a.push(u);});if(l.img)a.push(l.img);if(l.photo)a.push(l.photo);return a.slice(0,8);}
function notFound(){document.getElementById('root').innerHTML='<div class="card" style="text-align:center;margin-top:34px"><h2>Not available</h2><p class="body">This listing isn\\u2019t available right now.</p><a class="big" href="/tradie">Browse verified tradies \\u2192</a></div>';}
var slug=location.pathname.split('/').filter(Boolean).pop();
fetch(SB+'/rest/v1/listings?select=*&status=eq.approved&deleted_at=is.null&slug=eq.'+encodeURIComponent(slug),{headers:{apikey:KEY,authorization:'Bearer '+KEY}})
.then(function(r){return r.json();}).then(function(d){
 if(!Array.isArray(d)||!d.length){notFound();return;}
 var l=d[0];var trade=l.trade||'Tradie',suburb=l.suburb||'';
 document.title=l.name+' — '+trade+(suburb?' in '+suburb:'')+', VIC | Trust Trade';
 var rating=(+l.rating)||(+l.google_rating)||0,rc=(+l.review_count)||(+l.google_review_count)||0;
 var rl=rc?('<span class="rate">'+stars(rating)+'</span> <b>'+rating.toFixed(1)+'</b> <span class="muted">('+rc+' review'+(rc===1?'':'s')+')</span>'):'<b>New</b> <span class="muted">· No reviews yet</span>';
 var ph=photos(l);var cov=ph[0];
 var coverInner=cov?("background:#e9e9ec url('"+cov+"') center/cover"):('background:'+tint(trade)+';display:grid;place-items:center');
 var badges=[];if(l.insured)badges.push('Insured');if(l.qualified)badges.push('Qualified');if(l.licence)badges.push('Licensed');
 var svc=(l.priced_services||[]).map(function(s){return {name:s.name||s.title||'',detail:s.detail||'',price:(s.price!=null?s.price:(s.amount!=null?s.amount:''))};}).filter(function(s){return s.name;});
 var html='<div class="phero"><div class="cover" style="'+coverInner+';height:200px">'+(cov?'':GLYPH)+'<span class="verified">\\u2713 Verified</span></div>'
  +'<div class="pbody"><div class="ptop"><div><h1>'+esc(l.name)+'</h1><div class="sub">'+esc(trade)+(suburb?' \\u00b7 '+esc(suburb)+', VIC':'')+'</div></div><div class="prate">'+rl+'</div></div>'
  +'<div class="pills">'+badges.map(function(b){return '<span class="pill">'+esc(b)+'</span>';}).join('')+'</div></div></div>';
 if(l.description)html+='<div class="card"><h2>About</h2><p class="body">'+esc(l.description)+'</p></div>';
 if(svc.length)html+='<div class="card"><h2>Services &amp; pricing</h2>'+svc.map(function(s){return '<div class="svc"><div><div class="n">'+esc(s.name)+'</div>'+(s.detail?'<div class="d">'+esc(s.detail)+'</div>':'')+'</div><div class="p">'+(s.price!==''&&s.price!=null?(isNaN(+s.price)?esc(s.price):'$'+s.price):'')+'</div></div>';}).join('')+'</div>';
 if(ph.length)html+='<div class="card"><h2>Recent work</h2><div class="grid">'+ph.map(function(p){return '<img src="'+esc(p)+'" alt="'+esc(l.name)+' work photo" loading="lazy">';}).join('')+'</div></div>';
 html+='<div class="card"><h2>Get in touch</h2>'+(suburb?'<div class="kv"><span>Area</span><b>'+esc(suburb)+' '+esc(l.postcode||'')+'</b></div>':'')+(l.service_radius_km?'<div class="kv"><span>Service radius</span><b>'+esc(l.service_radius_km)+' km</b></div>':'')+(l.hourly_rate?'<div class="kv"><span>Hourly rate</span><b>$'+esc(l.hourly_rate)+'</b></div>':'')+(l.call_out_fee?'<div class="kv"><span>Call-out fee</span><b>$'+esc(l.call_out_fee)+'</b></div>':'')+'</div>';
 html+='<a class="big" href="/">Get a quote from '+esc((l.name||'').split(' ')[0]||l.name)+' on Trust Trade \\u2192</a><p class="fineprint">Verified, insured and recommended. Message and book through the Trust Trade app.</p>';
 document.getElementById('root').innerHTML=html;
 fetch(SB+'/rest/v1/listing_reviews?select=from_name,rating,review_text&order=created_at.desc&listing_id=eq.'+l.id,{headers:{apikey:KEY,authorization:'Bearer '+KEY}}).then(function(r){return r.json();}).then(function(rv){if(Array.isArray(rv)&&rv.length){var box=document.createElement('div');box.className='card';box.innerHTML='<h2>Reviews</h2>'+rv.slice(0,5).map(function(x){return '<div class="rev"><div class="rh"><b>'+esc(x.from_name||'Customer')+'</b><span class="st">'+stars(x.rating)+'</span></div><p>'+esc(x.review_text||'')+'</p></div>';}).join('');var big=document.querySelector('#root .big');if(big)big.parentNode.insertBefore(box,big);else document.getElementById('root').appendChild(box);}}).catch(function(){});
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
      "listings?status=eq.approved&deleted_at=is.null&select=id,slug,name,trade,suburb,postcode,description,priced_services,photos,work_photos,gallery,img,photo,badges,rating,review_count,google_rating,google_review_count,insured,qualified,licence,phone,email,website,hourly_rate,call_out_fee,service_radius_km,lat,lng&order=rating.desc.nullslast"
    )).filter((l) => l.slug);

    let reviewsById = {};
    try {
      const ids = listings.map((l) => l.id);
      if (ids.length) {
        const revs = await api(`listing_reviews?listing_id=in.(${ids.join(",")})&select=listing_id,from_name,rating,review_text,created_at&order=created_at.desc`);
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

    writeFileSync(join(OUT, "index.html"), directory(listings, areaLinks));
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
      writeFileSync(join(dir, "index.html"), areaPage(c, loc, serving, otherAreas, otherTrades));
      areaUrls.push(`${SITE}/find/${c.slug}-in-${slugify(loc.suburb)}`);
    }

    const urls = [`${SITE}/tradie`, ...listings.map((l) => `${SITE}/tradie/${l.slug}`), ...areaUrls];
    writeFileSync("public/sitemap-tradies.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join("\n")}\n</urlset>\n`);

    console.log(`[tradie-pages] generated ${listings.length} profiles + ${areaUrls.length} area pages + directory + _dynamic + sitemap`);
  } catch (e) {
    console.warn("[tradie-pages] SKIPPED (non-fatal):", e.message);
  }
})();
