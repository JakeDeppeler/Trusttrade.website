/* Static generator for the Trust Trade guides / SEO content engine.
   Reads scripts/guides.data.mjs and writes:
     public/guides/index.html            — the guides hub
     public/guides/<slug>/index.html     — each guide (Article + FAQPage + Breadcrumb schema)
     public/sitemap-guides.xml           — sitemap for the guides
   Matches the site's premium brand (self-hosted Archivo, cream + gold) so the content reads high-end
   and consistent with the homepage. Fully static → fast, indexable, no client JS needed. */

import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GUIDES, UPDATED } from "./guides.data.mjs";

const SITE = "https://trusttrade.au";
const APP_STORE = "https://apps.apple.com/au/app/trust-trade/id6778369757";
const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "..", "public", "guides");

const H = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const prettyDate = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const bySlug = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));

/* ---------------------------------------------------------------- shared brand shell */
const STYLE = `<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#15110d;--sub:#574b3b;--muted:#8b7c66;--cream:#faf7f1;--card:#fff;--line:rgba(21,17,13,.09);--accent:#f2a900;--gold-ink:#8a6200}
html{scroll-behavior:smooth}
body{font-family:"Archivo",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--cream);line-height:1.65;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit;text-decoration:none}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
.wrap.wide{max-width:1040px}
/* header */
.top{background:rgba(250,247,241,.86);backdrop-filter:saturate(1.1) blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
.top .row{display:flex;align-items:center;justify-content:space-between;height:64px;max-width:1040px;margin:0 auto;padding:0 20px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:-.02em}
.logo .m{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#FFCB63,#F2A222);box-shadow:0 2px 8px rgba(242,169,0,.35)}
.nav{display:flex;align-items:center;gap:20px;font-size:14.5px;font-weight:600;color:var(--sub)}
.nav a.here{color:var(--ink)}
.cta{background:var(--accent);color:#231700;font-weight:800;padding:10px 17px;border-radius:999px;font-size:14px;box-shadow:0 6px 18px -6px rgba(242,169,0,.6)}
.cta:hover{filter:brightness(1.03)}
@media(max-width:640px){.nav a:not(.cta){display:none}}
/* article */
main{padding:14px 0 20px}
.crumbs{font-size:13px;color:var(--muted);margin:24px 0 14px}
.crumbs a{color:var(--gold-ink);font-weight:600}.crumbs a:hover{text-decoration:underline}
.chip{display:inline-block;background:#f3ead6;color:var(--gold-ink);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:6px 12px;border-radius:999px}
h1{font-size:clamp(30px,5.4vw,46px);font-weight:800;letter-spacing:-.028em;line-height:1.08;margin:16px 0 12px}
.meta{color:var(--muted);font-size:14px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:22px}
.meta b{color:var(--sub);font-weight:700}
.lede{font-size:19.5px;line-height:1.6;color:var(--sub)}
.lede p{margin:0 0 8px}
.prose{font-size:17.5px}
.prose h2{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:40px 0 12px;line-height:1.2;scroll-margin-top:84px}
.prose p{margin:0 0 16px}
.prose ul,.prose ol{margin:0 0 18px;padding-left:22px}
.prose li{margin:0 0 8px}
.prose a{color:var(--gold-ink);font-weight:600;text-decoration:underline;text-decoration-color:rgba(138,98,0,.35);text-underline-offset:2px}
.prose a:hover{text-decoration-color:var(--gold-ink)}
.prose b{font-weight:700}
.note{background:#fff;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:15px 18px;margin:0 0 18px;font-size:16px;color:var(--sub)}
table{width:100%;border-collapse:collapse;margin:6px 0 20px;font-size:16px;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
thead th{background:#f4ecdd;text-align:left;font-weight:800;font-size:14px;letter-spacing:.02em;padding:12px 16px;color:var(--ink)}
tbody td{padding:12px 16px;border-top:1px solid var(--line);color:var(--sub)}
tbody tr td:last-child{font-weight:700;color:var(--ink);white-space:nowrap}
/* takeaways */
.tldr{background:linear-gradient(180deg,#fffdf8,#fff);border:1px solid var(--line);border-radius:18px;padding:20px 22px;margin:6px 0 30px;box-shadow:0 20px 40px -30px rgba(20,22,30,.25)}
.tldr h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:var(--gold-ink);margin:0 0 12px;font-weight:800}
.tldr ul{list-style:none;margin:0;padding:0;font-size:16.5px}
.tldr li{position:relative;padding:0 0 10px 30px;color:var(--sub)}
.tldr li:last-child{padding-bottom:0}
.tldr li::before{content:"";position:absolute;left:2px;top:9px;width:14px;height:8px;border-left:2.5px solid var(--accent);border-bottom:2.5px solid var(--accent);transform:rotate(-45deg)}
/* faq */
.faq{margin:36px 0 8px}
.faq h2{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0 0 14px}
details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:2px 18px;margin:0 0 10px}
details[open]{box-shadow:0 20px 40px -30px rgba(20,22,30,.25)}
summary{cursor:pointer;list-style:none;padding:16px 0;font-weight:700;font-size:17px;display:flex;justify-content:space-between;gap:14px;align-items:center}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";color:var(--accent);font-size:24px;font-weight:700;line-height:1}
details[open] summary::after{content:"\\2013"}
details p{padding:0 0 16px;color:var(--sub);font-size:16.5px;margin:0}
/* related + cta */
.related{margin:38px 0 0}
.related h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:800;margin:0 0 12px}
.pillrow{display:flex;flex-wrap:wrap;gap:9px}
.pillrow a{background:#fff;border:1px solid var(--line);color:var(--sub);font-size:14px;font-weight:650;padding:9px 15px;border-radius:999px;transition:border-color .12s,color .12s}
.pillrow a:hover{border-color:var(--accent);color:var(--ink)}
.appcta{background:var(--ink);color:#fff;border-radius:22px;padding:30px;margin:40px 0 10px;text-align:center;background-image:radial-gradient(120% 120% at 50% -20%,rgba(242,169,0,.18),transparent 60%)}
.appcta h2{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;color:#fff}
.appcta p{color:#d9cfc0;font-size:16.5px;margin:0 0 18px;max-width:52ch;margin-inline:auto}
.store{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#111;font-weight:800;padding:13px 22px;border-radius:14px;font-size:16px}
.store small{display:block;font-size:10px;font-weight:600;letter-spacing:.04em;opacity:.7;text-transform:uppercase;line-height:1}
/* hub cards */
.hub-hero{padding:34px 0 8px}
.hub-hero .chip{margin-bottom:14px}
.hub-hero p{font-size:19px;color:var(--sub);max-width:60ch;margin-top:8px}
.gcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;margin:26px 0 20px}
.gcard{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px 22px 20px;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(20,22,30,.04),0 18px 40px -30px rgba(20,22,30,.3);transition:transform .14s,box-shadow .14s}
.gcard:hover{transform:translateY(-3px);box-shadow:0 1px 2px rgba(20,22,30,.06),0 26px 50px -30px rgba(20,22,30,.4)}
.gcard .chip{align-self:flex-start;margin-bottom:12px}
.gcard h2{font-size:20px;font-weight:800;letter-spacing:-.018em;line-height:1.22;margin:0 0 8px}
.gcard p{color:var(--sub);font-size:15px;margin:0 0 16px;flex:1}
.gcard .more{color:var(--gold-ink);font-weight:800;font-size:14.5px}
/* footer */
.foot{border-top:1px solid var(--line);margin-top:40px;padding:28px 0;color:var(--muted);font-size:13.5px;text-align:center}
.foot a{color:var(--gold-ink);font-weight:600}
</style>`;

const APPLE = `<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.5c0-2.3 1.9-3.4 2-3.46-1.09-1.6-2.79-1.82-3.39-1.84-1.44-.15-2.82.85-3.55.85-.74 0-1.86-.83-3.06-.81-1.57.02-3.02.91-3.83 2.32-1.64 2.84-.42 7.04 1.17 9.35.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.62-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.27-.02 2.07-1.15 2.84-2.29.9-1.31 1.27-2.58 1.29-2.65-.03-.01-2.47-.95-2.5-3.75zM14.7 5.36c.65-.79 1.09-1.88.97-2.97-.94.04-2.08.63-2.75 1.41-.6.7-1.13 1.82-.99 2.89 1.05.08 2.12-.53 2.77-1.33z"/></svg>`;

function header(active) {
  return `<header class="top"><div class="row">
<a class="logo" href="/"><span class="m"></span>Trust Trade</a>
<nav class="nav">
<a href="/how-it-works">How it works</a>
<a href="/guides/" class="${active === "guides" ? "here" : ""}">Guides</a>
<a href="/tradie">Find a tradie</a>
<a class="cta" href="${APP_STORE}">Download app</a>
</nav></div></header>`;
}
function footer() {
  return `<footer class="foot"><div class="wrap wide">
<p>© ${new Date().getFullYear()} Trust Trade — Australia's honest trade app. Verified, insured, local.</p>
<p style="margin-top:6px"><a href="/">Home</a> · <a href="/guides/">Guides</a> · <a href="/tradie">Find a tradie</a> · <a href="/for-tradies">For tradies</a> · <a href="/faq">FAQ</a></p>
</div></footer>`;
}
function appCta(title, sub) {
  return `<section class="appcta"><h2>${H(title)}</h2><p>${H(sub)}</p>
<a class="store" href="${APP_STORE}">${APPLE}<span><small>Download on the</small>App Store</span></a></section>`;
}
function headTag({ title, desc, url, ld }) {
  return `<!doctype html><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="apple-itunes-app" content="app-id=6778369757">
<title>${H(title)}</title><meta name="description" content="${H(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#f2a900"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article"><meta property="og:title" content="${H(title)}"><meta property="og:description" content="${H(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.png"><meta property="og:site_name" content="Trust Trade"><meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${H(title)}"><meta name="twitter:description" content="${H(desc)}"><meta name="twitter:image" content="${SITE}/og-image.png">
<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("")}
${STYLE}</head><body>`;
}

/* ---------------------------------------------------------------- guide page */
function guidePage(g) {
  const url = `${SITE}/guides/${g.slug}/`;
  const org = { "@type": "Organization", name: "Trust Trade", url: SITE, logo: `${SITE}/icon-512.png` };
  const ld = [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: g.title, description: g.description, inLanguage: "en-AU",
      datePublished: UPDATED, dateModified: UPDATED,
      author: org, publisher: org,
      image: `${SITE}/og-image.png`, mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: SITE + "/guides/" },
        { "@type": "ListItem", position: 3, name: g.title, item: url },
      ],
    },
  ];
  const related = (g.relatedGuides || []).map((s) => bySlug[s]).filter(Boolean);
  return `${headTag({ title: g.metaTitle || g.title, desc: g.description, url, ld })}
${header("guides")}
<main><article class="wrap">
<nav class="crumbs"><a href="/">Home</a> › <a href="/guides/">Guides</a> › <span>${H(g.category)}</span></nav>
<span class="chip">${H(g.category)}</span>
<h1>${H(g.title)}</h1>
<div class="meta"><span>Updated <b>${prettyDate(UPDATED)}</b></span><span>·</span><span><b>${g.readMins} min</b> read</span><span>·</span><span>Trust Trade</span></div>
<div class="lede">${g.intro}</div>

<section class="tldr"><h2>The short version</h2><ul>${g.takeaways.map((t) => `<li>${H(t)}</li>`).join("")}</ul></section>

<div class="prose">
${g.sections.map((s) => `<h2 id="${s.h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}">${H(s.h)}</h2>\n${s.body}`).join("\n")}
</div>

<section class="faq"><h2>Frequently asked questions</h2>
${g.faqs.map((f) => `<details><summary>${H(f.q)}</summary><p>${H(f.a)}</p></details>`).join("\n")}
</section>

<div class="related"><h3>Find a verified local</h3><div class="pillrow">${(g.relatedFind || []).map((r) => `<a href="${r.href}">${H(r.label)} →</a>`).join("")}</div></div>
${related.length ? `<div class="related"><h3>Keep reading</h3><div class="pillrow">${related.map((r) => `<a href="/guides/${r.slug}/">${H(r.title)}</a>`).join("")}</div></div>` : ""}

${appCta("Skip the guesswork — get it done proper.", "Trust Trade routes you to a verified, insured local who can actually fix it. Licence-checked, fixed call-out fees, real reviews. Now on iPhone.")}
</article></main>
${footer()}
</body></html>`;
}

/* ---------------------------------------------------------------- hub page */
function hubPage() {
  const url = `${SITE}/guides/`;
  const ld = [
    {
      "@context": "https://schema.org", "@type": "CollectionPage",
      name: "Trust Trade Guides", description: "Honest guides on hiring tradies in Australia — costs, licences and how to avoid getting stung.", url,
      hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.title, url: `${SITE}/guides/${g.slug}/`, description: g.description })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: url },
      ],
    },
  ];
  return `${headTag({ title: "Tradie Guides — Costs, Licences & Hiring Tips | Trust Trade", desc: "Honest, plain-English guides to hiring tradies in Australia: what jobs cost, how to check a licence, and the questions that stop you getting stung.", url, ld })}
${header("guides")}
<main class="wrap wide">
<section class="hub-hero"><span class="chip">Guides</span>
<h1>Hire a tradie without getting stung.</h1>
<p>Straight-talking guides on what jobs really cost, how to check a licence, and the questions worth asking before anyone rolls up. No fluff — just what a homeowner actually needs to know.</p></section>
<div class="gcards">
${GUIDES.map((g) => `<a class="gcard" href="/guides/${g.slug}/"><span class="chip">${H(g.category)}</span><h2>${H(g.title)}</h2><p>${H(g.description)}</p><span class="more">Read the guide →</span></a>`).join("\n")}
</div>
${appCta("Ready to get it done proper?", "Every tradie on Trust Trade is licence-checked and insured before they're listed. Tell us what's broken and we'll route you to the right local, first time.")}
</main>
${footer()}
</body></html>`;
}

/* ---------------------------------------------------------------- write */
(function main() {
  try {
    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, "index.html"), hubPage());
    const urls = [`${SITE}/guides/`];
    for (const g of GUIDES) {
      const dir = join(OUT, g.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), guidePage(g));
      urls.push(`${SITE}/guides/${g.slug}/`);
    }
    const lastmod = UPDATED;
    writeFileSync(join(__dir, "..", "public", "sitemap-guides.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n")}\n</urlset>\n`);
    console.log(`[guides] generated hub + ${GUIDES.length} guides + sitemap-guides.xml`);
  } catch (e) {
    console.warn("[guides] SKIPPED (non-fatal):", e.message);
  }
})();
