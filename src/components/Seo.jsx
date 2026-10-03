import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://trusttrade.au";
const DEFAULT_TITLE = "Trust Trade®: Find a Licence-Checked Local Tradie in Australia";
const DEFAULT_DESC =
  "Find a tradie, done proper. Trust Trade routes you to verified, licence-checked local tradies across Australia: electricians, plumbers, HVAC and more. Free to use.";

// Per-route title + meta description. Google reads these after it renders the
// SPA, and a prerender pass captures them into the static HTML too. Keeping this
// in one map (rather than a <Seo> in every page) means one place to tune copy.
export const ROUTE_META = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESC, exactTitle: true },
  "/how-we-verify": {
    title: "Trust & Safety: How We Check Every Tradie",
    description:
      "Every Trust Trade tradie has their trade licence checked on the state register, their ABN checked and their photo ID matched, by a person, before they're listed.",
  },
  "/for-tradies": {
    title: "For Tradies: Real Jobs, No Lead Fees",
    description:
      "Homeowners nearby pick you and send you the job. No lead fees, no commission, limited spots per area. Quote, book and manage jobs in one app. Free to apply.",
  },
  "/trades": {
    title: "Trades We Cover: Electricians, Plumbers, HVAC & More",
    description:
      "Plumbers, gas fitters, electricians, HVAC, carpenters, roofers, painters, tilers and handyman services, all licence-checked before they're listed.",
  },
  "/faq": {
    title: "Frequently Asked Questions",
    description:
      "Answers on how Trust Trade works, what it costs, how tradies are checked, and where it operates. Free for homeowners, free to apply for tradies.",
  },
  "/about": {
    title: "About Trust Trade",
    description:
      "Trust Trade was started by a Melbourne mechanical plumber to make finding a good tradie easy: licence-checked tradies, one enquiry, fixed-price quotes.",
  },
  "/tools": {
    title: "Free Trade Tools: Ducted Designer & Job Calculator",
    description:
      "Free tools for tradies and homeowners: an auto-routing ducted air-conditioning designer and a job cost calculator. Built by Trust Trade.",
  },
};

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Normalize a trailing slash (e.g. /for-tradies/) back to the keyed path so a
    // stray inbound link still gets the right title/description instead of the
    // generic fallback.
    const key = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const meta = ROUTE_META[key] || {
      title: "Trust Trade®",
      description: DEFAULT_DESC,
    };
    const fullTitle = meta.exactTitle ? meta.title : `${meta.title} | Trust Trade®`;
    const url = SITE + (key === "/" ? "/" : key);

    document.title = fullTitle;
    upsertMeta("name", "description", meta.description);
    upsertMeta("property", "og:title", meta.exactTitle ? meta.title : `${meta.title} · Trust Trade`);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("name", "twitter:title", meta.exactTitle ? meta.title : `${meta.title} · Trust Trade`);
    upsertMeta("name", "twitter:description", meta.description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [pathname]);

  return null;
}
