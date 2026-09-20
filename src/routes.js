export const HREF_TO_ROUTE = {
  "Trust Trade Landing.html": "/",
  "How it works.html": "/how-it-works",
  "How we verify.html": "/how-we-verify",
  "For Tradies.html": "/for-tradies",
  "For Homeowners.html": "/for-homeowners",
  "Trades we cover.html": "/trades",
  "FAQ.html": "/faq",
  "About.html": "/about",
  "Our Story.html": "/our-story",
  "Tools.html": "/tools",
};

// The live App Store listing. Australia-only, so the /au/ path is required:
// the region-less apps.apple.com/app/<id> form 404s for this app.
export const APP_STORE_URL = "https://apps.apple.com/au/app/trust-trade/id6778369757";

export function resolveHref(href) {
  if (!href) return href;
  const [pathOnly, hash = ""] = href.split("#");
  const mapped = HREF_TO_ROUTE[pathOnly];
  if (mapped) return mapped + (hash ? "#" + hash : "");
  return href;
}

export function isInternal(href) {
  if (!href) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (/^https?:\/\//.test(href)) return false;
  if (href.startsWith("#")) return false;
  const [pathOnly] = href.split("#");
  return HREF_TO_ROUTE[pathOnly] !== undefined;
}
