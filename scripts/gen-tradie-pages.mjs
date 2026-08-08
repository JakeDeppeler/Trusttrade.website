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
</body></html>`;
}

function directory(listings) {
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
</main>
<script>
function flt(){var q=(document.getElementById('q').value||'').toLowerCase().trim(),t=document.getElementById('tr').value,n=0;
 document.querySelectorAll('.tc').forEach(function(c){var ok=(!q||c.dataset.s.indexOf(q)>=0)&&(!t||c.dataset.trade===t);c.style.display=ok?'':'none';if(ok)n++;});
 document.getElementById('none').style.display=n?'none':'block';}
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
</style>`;

(async () => {
  try {
    const listings = (await api(
      "listings?or=(status.eq.approved,was_approved.eq.true)&select=id,slug,name,trade,suburb,postcode,description,priced_services,photos,work_photos,gallery,img,photo,badges,rating,review_count,google_rating,google_review_count,insured,qualified,licence,phone,email,website,hourly_rate,call_out_fee,service_radius_km,status,was_approved&order=rating.desc.nullslast"
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
    writeFileSync(join(OUT, "index.html"), directory(listings));

    const urls = [`${SITE}/tradie`, ...listings.map((l) => `${SITE}/tradie/${l.slug}`)];
    writeFileSync("public/sitemap-tradies.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join("\n")}\n</urlset>\n`);

    console.log(`[tradie-pages] generated ${listings.length} profiles (app filter: approved OR was_approved) + directory + sitemap`);
  } catch (e) {
    console.warn("[tradie-pages] SKIPPED (non-fatal):", e.message);
  }
})();
