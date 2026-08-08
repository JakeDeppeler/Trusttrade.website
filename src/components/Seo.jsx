import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://trusttrade.au";
const DEFAULT_TITLE = "Trust Trade®: Find a Verified, Insured Local Tradie in Australia";
const DEFAULT_DESC =
  "Find a tradie, done proper. Trust Trade routes you to verified, insured, licence-checked local tradies across Australia: electricians, plumbers, HVAC and more. Free to use.";

// Per-route title + meta description. Google reads these after it renders the
// SPA, and a prerender pass captures them into the static HTML too. Keeping this
// in one map (rather than a <Seo> in every page) means one place to tune copy.
export const ROUTE_META = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESC, exactTitle: true },
  "/how-it-works": {
    title: "How Trust Trade Works: From Job to Verified Tradie",
    description:
      "See how Trust Trade works: describe your job in plain English, get routed to verified local tradies, approve one call-out fee, and track the job to your door.",
  },
  "/how-we-verify": {
    title: "How We Verify Every Tradie",
    description:
      "Every Trust Trade tradie is checked against ABN, licence registers (VBA, ESV), trade bodies and public liability insurance before they can take a job.",
  },
  "/for-tradies": {
    title: "For Tradies: Real Local Jobs, Routed to You",
    description:
      "Get real homeowner jobs routed by trade and postcode, not blasted to a mailing list. Free to apply, free to be listed. Founding-member pricing for the first 50.",
  },
  "/for-homeowners": {
    title: "For Homeowners: Find a Trusted Local Tradie",
    description:
      "Find a verified, insured local tradie for any job around the house. Compare, chat, and book, with one clear call-out fee you approve before anyone turns up.",
  },
  "/trades": {
    title: "Trades We Cover: Electricians, Plumbers, HVAC & More",
    description:
      "Electricians, plumbers, HVAC, carpenters, builders and more, all verified and insured. See every trade Trust Trade covers across Australia.",
  },
  "/faq": {
    title: "Frequently Asked Questions",
    description:
      "Answers on how Trust Trade works, what it costs, how tradies are verified, and where we operate. Free for homeowners, free to apply for tradies.",
  },
  "/about": {
    title: "About Trust Trade",
    description:
      "Trust Trade is Australia's honest trade app, connecting homeowners with verified, insured, recommended local tradies. Learn what we stand for.",
  },
  "/our-story": {
    title: "Our Story",
    description:
      "Why we built Trust Trade: to take the guesswork and dodgy operators out of finding a tradie, and give honest tradies a fair way to win work.",
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
    const meta = ROUTE_META[pathname] || {
      title: "Trust Trade®",
      description: DEFAULT_DESC,
    };
    const fullTitle = meta.exactTitle ? meta.title : `${meta.title} | Trust Trade®`;
    const url = SITE + (pathname === "/" ? "/" : pathname);

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
