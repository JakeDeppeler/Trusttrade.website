// Build-time generator for public SEO tradie profile pages at /tradie/<slug>.
// Runs on every build (npm "prebuild"), fetches APPROVED listings from Supabase
// via the public REST API (publishable key — safe), and emits fully static,
// self-contained HTML so Google indexes real content instantly and social
// scrapers get proper cards. Also writes a /tradie directory index and a
// tradie sitemap. Failures are non-fatal so a network blip never breaks a deploy.

import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

const SB = "https://pvcblfpxgrznzqgxbujy.supabase.co";
const KEY = "sb_publishable_xXxZpIBsumD14mC4zn9qLQ_i4Su8yEN";
const SITE = "https://trusttrade.au";
const OUT = "public/tradie";

const H = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
const num = (v) => (v == null || v === "" || isNaN(+v) ? null : +v);

async function api(path) {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: KEY, authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

function photosOf(l) {
  const out = [];
  const push = (u) => { if (u && typeof u === "string" && !out.includes(u)) out.push(u); };
  (Array.isArray(l.work_photos) ? l.work_photos : []).forEach((p) => push(typeof p === "string" ? p : p && p.url));
  (Array.isArray(l.photos) ? l.photos : []).forEach(push);
  (Array.isArray(l.gallery) ? l.gallery : []).forEach((p) => push(typeof p === "string" ? p : p && (p.image_url || p.url)));
  return out.slice(0, 8);
}
function servicesOf(l) {
  const s = Array.isArray(l.priced_services) ? l.priced_services : [];
  return s.map((x) => ({
    name: x.name || x.title || "",
    detail: x.detail || x.desc || "",
    price: x.price != null ? x.price : x.amount != null ? x.amount : "",
  })).filter((x) => x.name);
}
const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));

function page(l, reviews) {
  const rating = num(l.rating) || num(l.google_rating);
  const rc = num(l.review_count) || num(l.google_review_count) || 0;
  const trade = l.trade || "Tradie";
  const suburb = l.suburb || "";
  const region = "VIC";
  const url = `${SITE}/tradie/${l.slug}`;
  const title = `${l.name} — ${trade}${suburb ? " in " + suburb : ""}, ${region} | Trust Trade`;
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
  (Array.isArray(l.badges) ? l.badges : []).forEach((b) => { const t = typeof b === "string" ? b : b && (b.label || b.name); if (t && !badges.includes(t)) badges.push(t); });

  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: l.name,
    image: ogImg,
    url,
    ...(l.phone ? { telephone: l.phone } : {}),
    ...(l.website ? { sameAs: [l.website] } : {}),
    description: desc,
    address: { "@type": "PostalAddress", addressLocality: suburb, addressRegion: region, ...(l.postcode ? { postalCode: String(l.postcode) } : {}), addressCountry: "AU" },
    areaServed: suburb || "Victoria",
    priceRange: "$$",
    ...(rating && rc ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: rc } } : {}),
  };

  const revHtml = (reviews || []).slice(0, 5).map((r) =>
    `<div class="rev"><div class="rh"><b>${H(r.from_name || "Customer")}</b><span class="st">${stars(r.rating)}</span></div><p>${H(r.review_text || "")}</p></div>`
  ).join("");

  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${H(title)}</title>
<meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#f2a900">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="profile"><meta property="og:title" content="${H(l.name + " — " + trade + (suburb ? " in " + suburb : ""))}">
<meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${H(ogImg)}"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${H(l.name)}"><meta name="twitter:description" content="${H(desc)}"><meta name="twitter:image" content="${H(ogImg)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#15110d;background:#fffdf8;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:860px;margin:0 auto;padding:0 20px}
.top{border-bottom:1px solid rgba(21,17,13,.08);background:#fff}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px;text-decoration:none}
.logo .m{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#FFCB63,#F2A222)}
.cta{display:inline-block;background:#f2a900;color:#231700;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:999px;font-size:14px}
.hero{padding:40px 0 8px}
.ey{font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#b5740f;font-weight:700}
h1{font-size:clamp(30px,6vw,44px);font-weight:800;letter-spacing:-.02em;margin:10px 0 6px}
.sub{color:#574b3b;font-size:16px}
.meta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0}
.rate{color:#f2a900;font-size:18px;letter-spacing:2px}
.badge{display:inline-block;background:#e7f6ee;color:#1fa463;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px}
.card{background:#fff;border:1px solid rgba(21,17,13,.08);border-radius:16px;padding:22px;margin:16px 0;box-shadow:0 1px 2px rgba(20,22,30,.04),0 10px 30px -18px rgba(20,22,30,.15)}
h2{font-size:20px;font-weight:800;margin-bottom:12px}
.svc{display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid rgba(21,17,13,.07)}
.svc:last-child{border-bottom:0}.svc .n{font-weight:650}.svc .d{color:#8b7c66;font-size:13.5px}.svc .p{font-weight:700;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.grid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:11px;background:#eee}
.rev{padding:13px 0;border-bottom:1px solid rgba(21,17,13,.07)}.rev:last-child{border-bottom:0}
.rh{display:flex;align-items:center;gap:8px}.rh .st{color:#f2a900}.rev p{color:#3a3d45;font-size:14.5px;margin-top:5px}
.kv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(21,17,13,.07);font-size:14.5px}.kv:last-child{border-bottom:0}.kv span{color:#8b7c66}
.foot{border-top:1px solid rgba(21,17,13,.08);margin-top:32px;padding:26px 0;color:#8b7c66;font-size:13px;text-align:center}
.big{display:block;text-align:center;background:#f2a900;color:#231700;font-weight:800;text-decoration:none;padding:16px;border-radius:14px;font-size:16px;margin:8px 0}
</style></head><body>
<header class="top"><div class="wrap"><a class="logo" href="/"><span class="m"></span>Trust Trade</a><a class="cta" href="/">Find a tradie</a></div></header>
<main class="wrap">
 <section class="hero">
  <div class="ey">Verified ${H(trade)}${suburb ? " · " + H(suburb) + ", " + region : ""}</div>
  <h1>${H(l.name)}</h1>
  <div class="sub">${H(trade)}${suburb ? " serving " + H(suburb) + " &amp; nearby" : " in Victoria"}</div>
  <div class="meta">${rating ? `<span class="rate">${stars(rating)}</span> <b>${rating.toFixed(1)}</b> <span style="color:#8b7c66">(${rc} review${rc === 1 ? "" : "s"})</span>` : ""}${badges.map((b) => `<span class="badge">${H(b)}</span>`).join("")}</div>
 </section>
 ${l.description ? `<div class="card"><h2>About</h2><p style="color:#3a3d45;white-space:pre-line">${H(l.description)}</p></div>` : ""}
 ${services.length ? `<div class="card"><h2>Services &amp; pricing</h2>${services.map((s) => `<div class="svc"><div><div class="n">${H(s.name)}</div>${s.detail ? `<div class="d">${H(s.detail)}</div>` : ""}</div><div class="p">${s.price !== "" && s.price != null ? (isNaN(+s.price) ? H(s.price) : "$" + s.price) : ""}</div></div>`).join("")}</div>` : ""}
 ${photos.length ? `<div class="card"><h2>Recent work</h2><div class="grid">${photos.map((p) => `<img src="${H(p)}" alt="${H(l.name)} work photo" loading="lazy">`).join("")}</div></div>` : ""}
 ${revHtml ? `<div class="card"><h2>Reviews</h2>${revHtml}</div>` : ""}
 <div class="card"><h2>Get in touch</h2>
  ${l.suburb ? `<div class="kv"><span>Area</span><b>${H(l.suburb)} ${H(l.postcode || "")}</b></div>` : ""}
  ${l.service_radius_km ? `<div class="kv"><span>Service radius</span><b>${H(l.service_radius_km)} km</b></div>` : ""}
  ${l.hourly_rate ? `<div class="kv"><span>Hourly rate</span><b>$${H(l.hourly_rate)}</b></div>` : ""}
  ${l.call_out_fee ? `<div class="kv"><span>Call-out fee</span><b>$${H(l.call_out_fee)}</b></div>` : ""}
 </div>
 <a class="big" href="/">Get a quote from ${H(l.name.split(" ")[0] || l.name)} on Trust Trade →</a>
 <p style="text-align:center;color:#8b7c66;font-size:13px">Verified, insured and recommended. Message and book through the Trust Trade app.</p>
</main>
<footer class="foot"><div class="wrap"><a href="/tradie" style="color:#b5740f;font-weight:700;text-decoration:none">← All tradies</a> · Trust Trade® — Australia's honest trade app</div></footer>
</body></html>`;
}

function directory(listings) {
  const cards = listings.map((l) => {
    const rating = num(l.rating) || num(l.google_rating);
    const rc = num(l.review_count) || num(l.google_review_count) || 0;
    return `<a class="tc" href="/tradie/${l.slug}"><div class="tn">${H(l.name)}</div><div class="tt">${H(l.trade || "")}${l.suburb ? " · " + H(l.suburb) : ""}</div>${rating ? `<div class="tr">${stars(rating)} <b>${rating.toFixed(1)}</b> <span>(${rc})</span></div>` : ""}</a>`;
  }).join("");
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/tradie/${l.slug}`, name: l.name })),
  };
  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verified Local Tradies in Victoria | Trust Trade</title>
<meta name="description" content="Browse verified, insured local tradies on Trust Trade — electricians, plumbers, HVAC and more across Victoria. Every one licence-checked.">
<link rel="canonical" href="${SITE}/tradie">
<meta name="theme-color" content="#f2a900"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<meta property="og:title" content="Verified Local Tradies in Victoria"><meta property="og:description" content="Browse verified, insured local tradies on Trust Trade."><meta property="og:url" content="${SITE}/tradie"><meta property="og:image" content="${SITE}/og-image.png">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#15110d;background:#fffdf8}.wrap{max-width:960px;margin:0 auto;padding:0 20px}.top{border-bottom:1px solid rgba(21,17,13,.08);background:#fff}.top .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}.logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px;text-decoration:none}.logo .m{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#FFCB63,#F2A222)}h1{font-size:clamp(28px,5vw,40px);font-weight:800;letter-spacing:-.02em;margin:36px 0 6px}.sub{color:#574b3b;margin-bottom:22px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;padding-bottom:40px}.tc{display:block;background:#fff;border:1px solid rgba(21,17,13,.08);border-radius:14px;padding:18px;text-decoration:none;box-shadow:0 1px 2px rgba(20,22,30,.04),0 10px 30px -20px rgba(20,22,30,.16)}.tn{font-weight:800;font-size:17px}.tt{color:#8b7c66;font-size:14px;margin-top:3px}.tr{margin-top:8px;color:#f2a900}.tr span{color:#8b7c66}</style></head><body>
<header class="top"><div class="wrap"><a class="logo" href="/"><span class="m"></span>Trust Trade</a><a href="/" style="text-decoration:none;color:#b5740f;font-weight:700">Home</a></div></header>
<main class="wrap"><h1>Verified local tradies</h1><div class="sub">Every tradie on Trust Trade is ABN-checked, licence-verified and insured.</div><div class="g">${cards}</div></main>
</body></html>`;
}

(async () => {
  try {
    const listings = (await api(
      "listings?status=eq.approved&select=id,slug,name,trade,suburb,postcode,description,priced_services,photos,work_photos,gallery,badges,rating,review_count,google_rating,google_review_count,insured,qualified,licence,phone,email,website,hourly_rate,call_out_fee,service_radius_km"
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
    writeFileSync(
      "public/sitemap-tradies.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
        .join("\n")}\n</urlset>\n`
    );

    console.log(`[tradie-pages] generated ${listings.length} profiles + directory + sitemap`);
  } catch (e) {
    console.warn("[tradie-pages] SKIPPED (non-fatal):", e.message);
  }
})();
