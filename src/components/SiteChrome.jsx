import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLink from "./PageLink.jsx";
import { APP_STORE_URL } from "../routes.js";

// The site's chrome in the phone app's design language: a floating white pill
// header (like the app's tab dock), amber primary action, app-style footer.
// Every class is `s-` prefixed and scoped under `.site` (src/styles/site.css) so
// the old landing.css rules can't leak in while the other pages move over.

export const NAV = [
  { label: "About", href: "About.html" },
  { label: "Safety", href: "How we verify.html" },
  { label: "Tradies", href: "For Tradies.html" },
];

export function AppleGlyph({ size = 20 }) {
  return (
    <svg width={size} height={size + 2} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.94c.02-2.34 1.92-3.47 2-3.52-1.09-1.6-2.79-1.82-3.4-1.85-1.43-.15-2.81.86-3.54.86-.74 0-1.86-.84-3.06-.82-1.57.02-3.03.92-3.84 2.33-1.65 2.86-.42 7.08 1.18 9.4.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.63-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.27-.02 2.07-1.15 2.84-2.29.9-1.31 1.27-2.59 1.29-2.65-.03-.01-2.47-.95-2.51-3.79zM14.74 5.72c.66-.8 1.1-1.91.98-3.02-.95.04-2.09.63-2.77 1.43-.61.71-1.14 1.84-1 2.94 1.06.08 2.13-.54 2.79-1.35z" />
    </svg>
  );
}

export function AppStoreButton({ light = false, outline = false, className = "" }) {
  return (
    <a
      className={"s-store" + (light ? " light" : "") + (outline ? " outline" : "") + (className ? " " + className : "")}
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener"
    >
      <AppleGlyph size={22} />
      <span className="s-store-t">
        <small>Download on the</small>
        <b>App Store</b>
      </span>
    </a>
  );
}

// A real app screenshot in a CSS phone frame. Screens live in /assets/app/ as
// 640px avif + webp (390x844 aspect). `eager` only for the hero (LCP on desktop).
export function Phone({ name, alt = "", eager = false, loading, className = "" }) {
  return (
    <div className={"s-phone" + (className ? " " + className : "")}>
      <picture>
        <source srcSet={`/assets/app/${name}.avif`} type="image/avif" />
        <img
          src={`/assets/app/${name}.webp`}
          alt={alt}
          width={390}
          height={844}
          loading={loading || (eager ? "eager" : "lazy")}
          decoding={eager ? "sync" : "async"}
          {...(eager ? { fetchpriority: "high" } : {})}
        />
      </picture>
    </div>
  );
}

function Brand() {
  return (
    <PageLink href="Trust Trade Landing.html" className="s-brand" aria-label="Trust Trade home">
      <picture>
        <source srcSet="/assets/mascot-toolbox-sm.avif" type="image/avif" />
        <img src="/assets/mascot-toolbox-sm.webp" alt="" width={160} height={112} decoding="async" />
      </picture>
      <span>Trust Trade</span>
    </PageLink>
  );
}

// Scroll to the top on route change, or to the #hash target when there is one.
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <header className={"s-head" + (scrolled ? " scrolled" : "") + (open ? " open" : "")}>
      <div className="s-head-bar">
        <Brand />
        <nav className="s-nav" aria-label="Main">
          {NAV.map((l) => (
            <PageLink key={l.label} href={l.href}>
              {l.label}
            </PageLink>
          ))}
        </nav>
        <a className="s-head-cta" href={APP_STORE_URL} target="_blank" rel="noopener">
          <AppleGlyph size={14} />
          Download app
        </a>
        <button
          type="button"
          className="s-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </>
            )}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="s-menu" aria-label="Menu">
          {NAV.map((l) => (
            <PageLink key={l.label} href={l.href}>
              {l.label}
            </PageLink>
          ))}
          <PageLink href="FAQ.html">FAQ</PageLink>
          <PageLink href="/apply">Apply as a tradie</PageLink>
          <AppStoreButton className="s-menu-store" />
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="s-foot">
      <div className="s-wrap">
        <div className="s-foot-top">
          <div className="s-foot-brand">
            <PageLink href="Trust Trade Landing.html" className="s-foot-logo" aria-label="Trust Trade home">
              <picture>
                <source srcSet="/assets/mascot-toolbox-sm.avif" type="image/avif" />
                <img src="/assets/mascot-toolbox-sm.webp" alt="" width={160} height={112} loading="lazy" decoding="async" />
              </picture>
              <span>Trust Trade<sup>®</sup></span>
            </PageLink>
            <p>Licence-checked. Fixed prices. Done proper. Built in Melbourne for Aussie homes and Aussie trades.</p>
            <AppStoreButton outline />
          </div>
          <nav className="s-foot-col" aria-label="Product">
            <h3>Product</h3>
            <PageLink href="/#how">How it works</PageLink>
            <PageLink href="How we verify.html">Trust &amp; safety</PageLink>
            <PageLink href="Trades we cover.html">Trades we cover</PageLink>
            <PageLink href="FAQ.html">FAQ</PageLink>
          </nav>
          <nav className="s-foot-col" aria-label="For tradies">
            <h3>For tradies</h3>
            <PageLink href="For Tradies.html">Why join</PageLink>
            <PageLink href="/apply">Apply</PageLink>
            <PageLink href="FAQ.html#tradies">Tradie FAQ</PageLink>
            <a href="/pro">Trust Trade Pro</a>
            <PageLink href="Tools.html">Free tools</PageLink>
          </nav>
          <nav className="s-foot-col" aria-label="Company">
            <h3>Company</h3>
            <PageLink href="About.html">About</PageLink>
            <a href="mailto:jake@trusttrade.au">Support</a>
            <a href="mailto:jake@trusttrade.au?subject=Privacy%20question">Privacy</a>
            <a href="mailto:jake@trusttrade.au?subject=Terms%20question">Terms</a>
          </nav>
        </div>
        <div className="s-foot-bot">
          <span>© {new Date().getFullYear()} Trust Trade®</span>
          <span>
            Made in Melbourne · Australia · <a href="/dashboard">Tradie login</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
